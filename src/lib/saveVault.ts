import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { sanitizeSave, type PersistedGame } from '@/lib/sanitizeSave';

/**
 * Save vault: where the game is persisted.
 *
 * - IndexedDB instead of localStorage (plain JSON in localStorage is trivially editable from the console).
 * - Every save is gzip-compressed and AES-GCM encrypted; GCM authenticates it, so a hand-edited blob fails to
 *   decrypt. The key is derived from a constant that ships with the game, so this stops casual editing and
 *   accidental corruption, NOT a determined reverse engineer (see docs/07-security-and-exploits.md).
 * - On load the decrypted state is validated by sanitizeSave(); an invalid "current" slot falls back to the
 *   "previous" slot (rotated every few minutes), then to a new game.
 * - The same envelope is used for the hidden Export / Import menu (Control x5).
 */

export const SAVE_VERSION = 12;
export const SAVE_NAME = 'idle-explorer-v12';

const DB_NAME = 'idlarz';
const STORE = 'saves';
const SLOT_CURRENT = 'current';
const SLOT_PREVIOUS = 'previous';
const ENVELOPE_PREFIX = 'IDLZ1.';
const FLUSH_DELAY_MS = 2000;
const ROTATE_EVERY_MS = 10 * 60 * 1000;

// Old plain-text saves are removed, never migrated (they could have been edited freely)
const LEGACY_LOCAL_STORAGE_KEYS = ['idle-explorer-v11', 'idle-explorer-v12'];

// ---- crypto ---------------------------------------------------------------------------------------

const APP_SECRET = 'idlarz/save/v1/b7d1c4e9-5f0a-4f8e-9a52-3c61d0e7a1f4';
const APP_SALT = new TextEncoder().encode('idlarz-vault-salt-2025');
const AAD = new TextEncoder().encode('idlarz-save-v1');

let keyPromise: Promise<CryptoKey> | null = null;
const getKey = (): Promise<CryptoKey> => {
	if (!keyPromise) {
		keyPromise = crypto.subtle
			.importKey('raw', new TextEncoder().encode(APP_SECRET), 'PBKDF2', false, ['deriveKey'])
			.then((base) =>
				crypto.subtle.deriveKey(
					{ name: 'PBKDF2', salt: APP_SALT, iterations: 100_000, hash: 'SHA-256' },
					base,
					{ name: 'AES-GCM', length: 256 },
					false,
					['encrypt', 'decrypt']
				)
			);
	}
	return keyPromise;
};

const toBase64 = (bytes: Uint8Array): string => {
	let binary = '';
	for (let i = 0; i < bytes.length; i += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(binary);
};

const fromBase64 = (text: string): Uint8Array => {
	const binary = atob(text);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
};

const pipe = async (data: Uint8Array, stream: { writable: WritableStream; readable: ReadableStream }) => {
	const writer = stream.writable.getWriter();
	void writer.write(data as unknown as BufferSource);
	void writer.close();
	return new Uint8Array(await new Response(stream.readable).arrayBuffer());
};

/** text -> gzip -> AES-GCM -> "IDLZ1.<base64(iv + ciphertext)>" */
export const encryptText = async (text: string): Promise<string> => {
	const packed = await pipe(new TextEncoder().encode(text), new CompressionStream('gzip'));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const cipher = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: iv as unknown as BufferSource, additionalData: AAD },
			await getKey(),
			packed as unknown as BufferSource
		)
	);
	const out = new Uint8Array(iv.length + cipher.length);
	out.set(iv, 0);
	out.set(cipher, iv.length);
	return ENVELOPE_PREFIX + toBase64(out);
};

/** Reverse of encryptText. Throws if the text was edited, truncated or is not a save. */
export const decryptText = async (envelope: string): Promise<string> => {
	const trimmed = envelope.trim();
	if (!trimmed.startsWith(ENVELOPE_PREFIX)) throw new Error('not a save file');
	const bytes = fromBase64(trimmed.slice(ENVELOPE_PREFIX.length));
	if (bytes.length < 13 + 16) throw new Error('save is truncated');
	const iv = bytes.subarray(0, 12);
	const packed = new Uint8Array(
		await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: iv as unknown as BufferSource, additionalData: AAD },
			await getKey(),
			bytes.subarray(12) as unknown as BufferSource
		)
	);
	const text = await pipe(packed, new DecompressionStream('gzip'));
	return new TextDecoder().decode(text);
};

// ---- IndexedDB (with an in-memory fallback when it is unavailable, e.g. some private modes) -----------------

const memory = new Map<string, string>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

const openDb = (): Promise<IDBDatabase | null> => {
	if (typeof indexedDB === 'undefined') return Promise.resolve(null);
	if (!dbPromise) {
		dbPromise = new Promise((resolve) => {
			try {
				const request = indexedDB.open(DB_NAME, 1);
				request.onupgradeneeded = () => request.result.createObjectStore(STORE);
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => resolve(null);
				request.onblocked = () => resolve(null);
			} catch {
				resolve(null);
			}
		});
	}
	return dbPromise;
};

const run = async <T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> => {
	const db = await openDb();
	if (!db) return undefined;
	return new Promise((resolve) => {
		try {
			const request = op(db.transaction(STORE, mode).objectStore(STORE));
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => resolve(undefined);
		} catch {
			resolve(undefined);
		}
	});
};

const idbGet = async (key: string): Promise<string | null> => {
	const value = await run<string | undefined>('readonly', (s) => s.get(key));
	if (typeof value === 'string') return value;
	return memory.get(key) ?? null;
};

const idbSet = async (key: string, value: string): Promise<void> => {
	memory.set(key, value);
	await run('readwrite', (s) => s.put(value, key));
};

const idbDelete = async (key: string): Promise<void> => {
	memory.delete(key);
	await run('readwrite', (s) => s.delete(key));
};

// ---- the storage adapter used by the zustand persist middleware ---------------------------------------------

interface Envelope {
	v: number;
	savedAt: string;
	state: PersistedGame;
}

let ready = false; // nothing is written before the first load finished (a fresh state must not overwrite a save)
let frozen = false; // set while importing/resetting so the running game cannot overwrite the new save
let paused = false; // set while another tab owns the game: this tab must not write
let pending: StorageValue<PersistedGame> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastRotation = 0;

const readSlot = async (slot: string): Promise<PersistedGame | null> => {
	const stored = await idbGet(slot);
	if (!stored) return null;
	try {
		const envelope = JSON.parse(await decryptText(stored)) as Envelope;
		const result = sanitizeSave(envelope?.state);
		return result.ok ? result.state : null;
	} catch {
		return null;
	}
};

const writeNow = async (value: StorageValue<PersistedGame>) => {
	if (frozen) return;
	const stored = await encryptText(
		JSON.stringify({ v: SAVE_VERSION, savedAt: new Date().toISOString(), state: value.state })
	);
	const now = Date.now();
	if (now - lastRotation > ROTATE_EVERY_MS) {
		const previous = await idbGet(SLOT_CURRENT);
		if (previous) await idbSet(SLOT_PREVIOUS, previous);
		lastRotation = now;
	}
	if (!frozen) await idbSet(SLOT_CURRENT, stored);
};

const flush = () => {
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
	const value = pending;
	pending = null;
	if (value && ready && !frozen && !paused) void writeNow(value);
};

if (typeof window !== 'undefined') {
	window.addEventListener('pagehide', flush);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') flush();
	});
}

/** Storage for the zustand persist middleware: state objects in, encrypted + debounced writes out. */
export const vaultStorage: PersistStorage<PersistedGame> = {
	getItem: async () => {
		if (typeof window === 'undefined') return null;
		try {
			LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
		} catch {
			/* storage blocked: nothing to clean */
		}
		const state = (await readSlot(SLOT_CURRENT)) ?? (await readSlot(SLOT_PREVIOUS));
		return state ? { state, version: SAVE_VERSION } : null;
	},
	setItem: (_name, value) => {
		if (!ready || frozen || paused) return;
		pending = value;
		if (!timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
	},
	removeItem: async () => {
		await idbDelete(SLOT_CURRENT);
		await idbDelete(SLOT_PREVIOUS);
	},
};

/** Call once the store has finished hydrating: from now on state changes are saved. */
export const markVaultReady = () => {
	ready = true;
};

/** Pause/resume writing (a tab that does not own the game must never overwrite the owner's save). */
export const setVaultPaused = (value: boolean) => {
	paused = value;
	if (value) {
		pending = null;
		if (timer) clearTimeout(timer);
		timer = null;
	}
};

/** Stop all further writes (used right before a reload that replaces the save). */
export const freezeVault = () => {
	frozen = true;
	pending = null;
	if (timer) clearTimeout(timer);
	timer = null;
};

// ---- export / import / reset (hidden menu) --------------------------------------------------------------------

export const exportSave = (state: PersistedGame): Promise<string> =>
	encryptText(JSON.stringify({ v: SAVE_VERSION, savedAt: new Date().toISOString(), state }));

export type ImportResult = { ok: true; state: PersistedGame } | { ok: false; reason: string };

export const parseSave = async (text: string): Promise<ImportResult> => {
	let envelope: Envelope;
	try {
		envelope = JSON.parse(await decryptText(text)) as Envelope;
	} catch {
		return { ok: false, reason: 'This file is not a valid save (it was edited, truncated or is from another game).' };
	}
	if (envelope?.v !== SAVE_VERSION) {
		return { ok: false, reason: 'This save belongs to a different game version.' };
	}
	const result = sanitizeSave(envelope.state);
	return result.ok
		? { ok: true, state: result.state }
		: { ok: false, reason: `The save contains impossible data (${result.reason}).` };
};

/** Replace the stored save with an imported one. The caller reloads the page afterwards. */
export const commitImport = async (state: PersistedGame): Promise<void> => {
	freezeVault();
	const previous = await idbGet(SLOT_CURRENT);
	if (previous) await idbSet(SLOT_PREVIOUS, previous);
	await idbSet(SLOT_CURRENT, await exportSave(state));
};

export const resetSave = async (): Promise<void> => {
	freezeVault();
	await idbDelete(SLOT_CURRENT);
	await idbDelete(SLOT_PREVIOUS);
};
