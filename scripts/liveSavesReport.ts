/**
 * The pure part of `scripts/check-live-saves.ts` (IDL-12): judges one stored save (and its ledger) with the CURRENT code, counts the verdicts and
 * formats a report that holds counts and fixed reason texts only, never a name, an id or a number out of a player's game. No database in here:
 * the script feeds it rows, the tests feed it fixtures.
 */
import { acceptSave, storedToText, type SaveRepo, type StoredSave } from '../src/lib/cloudSave/pipeline';
import { ENFORCEMENT, FLAG_POLICY, rejectedFlags, verifyTransition, type SaveFlag, type Snapshot } from '../src/lib/cloudSave/verify';
import type { Ledger, LedgerRepo } from '../src/lib/offline/ledger';

export interface SaveVerdict {
	/** `invalid`: sanitizeSave / decodeSave refuses the stored save under today's rules. `unreadable`: the row could not be turned back into a save. */
	outcome: 'accepted' | 'invalid' | 'unreadable';
	/** Why it is invalid or unreadable (a fixed text of the code, never player data) */
	reason?: string;
	flags: SaveFlag[];
	/** The server would have replaced the claimed XP / Embers / economy with what it can explain */
	xpClamped: boolean;
	embersClamped: boolean;
	economyTrusted: boolean;
	/** A castle upgrade is running in this save */
	midCastleUpgrade: boolean;
	hasLedger: boolean;
	testAccount: boolean;
}

/** An in-memory stand-in for the save store: the account has no save, nothing is ever written anywhere. */
const emptyRepo = (): SaveRepo => ({
	load: async () => null,
	commit: async () => true,
	archive: async () => undefined,
	pin: async () => undefined,
});

/** A ledger store that hands out a copy of the real ledger and swallows every write. */
const readOnlyLedgers = (ledger: Ledger | null): LedgerRepo => ({
	load: async () => (ledger ? structuredClone(ledger) : null),
	commit: async () => true,
});

const clean = (reason: string): string => reason.replace(/\s+/g, ' ').slice(0, 80);

/**
 * Runs the stored save through today's `acceptSave` as the account's first save (nothing to compare with), at the moment it was stored, with the
 * account's real ledger (gem balance, what the server granted). Everything goes to in-memory stores, so nothing is written. Needs `stored.world`.
 */
export const judgeSave = async (stored: StoredSave, ledger: Ledger | null): Promise<SaveVerdict> => {
	const base = {
		flags: [] as SaveFlag[],
		xpClamped: false,
		embersClamped: false,
		economyTrusted: false,
		midCastleUpgrade: stored.summary.derived.castleUpgrade !== null,
		hasLedger: ledger !== null,
		testAccount: stored.testAccount,
	};
	let text: string;
	try {
		text = storedToText(stored);
	} catch {
		return { ...base, outcome: 'unreadable', reason: 'the stored save cannot be put back together (no map)' };
	}
	try {
		const outcome = await acceptSave(emptyRepo(), 'dry-run', 'dry-run', text, 0, stored.serverSavedAt, false, readOnlyLedgers(ledger));
		if (outcome.kind === 'invalid') return { ...base, outcome: 'invalid', reason: clean(outcome.reason) };
		if (outcome.kind !== 'ok') return { ...base, outcome: 'unreadable', reason: `unexpected result: ${outcome.kind}` };
		return {
			...base,
			outcome: 'accepted',
			flags: outcome.flags,
			xpClamped: outcome.xp !== undefined,
			embersClamped: outcome.prestige !== undefined,
			economyTrusted: outcome.economy === 'trusted',
		};
	} catch (error) {
		return { ...base, outcome: 'unreadable', reason: clean(error instanceof Error ? error.constructor.name : 'error') };
	}
};

/** The flags the transition check raises between two consecutive saves of one account (the newer one is judged at the time it was stored). */
export const judgeTransition = (older: Snapshot, newer: Snapshot): SaveFlag[] => verifyTransition(older, newer.summary, newer.serverSavedAt);

export interface LiveReport {
	saves: number;
	accepted: number;
	invalid: Record<string, number>;
	unreadable: Record<string, number>;
	/** Saves that raise this flag (each flag once per save) */
	flagged: Partial<Record<SaveFlag, number>>;
	/** Saves that enforcement would refuse (invalid saves are counted apart) given the flags in `ENFORCEMENT.reject` */
	wouldReject: number;
	xpClamped: number;
	embersClamped: number;
	economyTrusted: number;
	midCastleUpgrade: number;
	withoutLedger: number;
	testAccounts: number;
	transitions: number;
	transitionFlagged: Partial<Record<SaveFlag, number>>;
	transitionWouldReject: number;
	ledgers: number;
	ledgersWithoutSave: number;
	ledgersWithoutInventory: number;
}

export const newReport = (): LiveReport => ({
	saves: 0,
	accepted: 0,
	invalid: {},
	unreadable: {},
	flagged: {},
	wouldReject: 0,
	xpClamped: 0,
	embersClamped: 0,
	economyTrusted: 0,
	midCastleUpgrade: 0,
	withoutLedger: 0,
	testAccounts: 0,
	transitions: 0,
	transitionFlagged: {},
	transitionWouldReject: 0,
	ledgers: 0,
	ledgersWithoutSave: 0,
	ledgersWithoutInventory: 0,
});

const bump = <K extends string>(counts: Partial<Record<K, number>>, key: K) => {
	counts[key] = (counts[key] ?? 0) + 1;
};

/** What the enforcement would refuse if it were switched on today with its current allowlist. */
const enforced = { enabled: true, reject: ENFORCEMENT.reject } as const;

export const addSave = (report: LiveReport, verdict: SaveVerdict): void => {
	report.saves++;
	if (verdict.midCastleUpgrade) report.midCastleUpgrade++;
	if (!verdict.hasLedger) report.withoutLedger++;
	if (verdict.testAccount) report.testAccounts++;
	if (verdict.outcome === 'invalid') return bump(report.invalid, verdict.reason ?? 'no reason given');
	if (verdict.outcome === 'unreadable') return bump(report.unreadable, verdict.reason ?? 'no reason given');
	report.accepted++;
	for (const flag of new Set(verdict.flags)) bump(report.flagged, flag);
	if (rejectedFlags(verdict.flags, enforced).length) report.wouldReject++;
	if (verdict.xpClamped) report.xpClamped++;
	if (verdict.embersClamped) report.embersClamped++;
	if (verdict.economyTrusted) report.economyTrusted++;
};

export const addTransition = (report: LiveReport, flags: readonly SaveFlag[]): void => {
	report.transitions++;
	for (const flag of new Set(flags)) bump(report.transitionFlagged, flag);
	if (rejectedFlags(flags, enforced).length) report.transitionWouldReject++;
};

/** One ledger row: `hasSave` says whether the same account has a save, `hasInventory` whether the ledger already holds the bag and gear. */
export const addLedger = (report: LiveReport, hasSave: boolean, hasInventory: boolean): void => {
	report.ledgers++;
	if (!hasSave) report.ledgersWithoutSave++;
	if (!hasInventory) report.ledgersWithoutInventory++;
};

const flagLines = (counts: Partial<Record<SaveFlag, number>>): string[] => {
	const entries = Object.entries(counts) as [SaveFlag, number][];
	if (!entries.length) return ['    none'];
	return entries
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([flag, n]) => `    ${flag}: ${n}  (policy: ${FLAG_POLICY[flag]}${ENFORCEMENT.reject.has(flag) ? ', on the enforcement allowlist' : ''})`);
};

const reasonLines = (counts: Record<string, number>): string[] =>
	Object.entries(counts)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([reason, n]) => `    ${n} x ${reason}`);

/** The text the script prints: counts and reasons only. */
export const formatReport = (report: LiveReport): string => {
	const invalid = Object.values(report.invalid).reduce((a, b) => a + b, 0);
	const unreadable = Object.values(report.unreadable).reduce((a, b) => a + b, 0);
	const lines = [
		`Saves checked: ${report.saves} (${report.testAccounts} from test accounts)`,
		`  accepted by today's rules: ${report.accepted}`,
		`  REJECTED (sanitizeSave / decode refuses them): ${invalid}`,
		...reasonLines(report.invalid),
		`  unreadable rows: ${unreadable}`,
		...reasonLines(report.unreadable),
		`  would be refused if enforcement were on (flags ${[...ENFORCEMENT.reject].join(', ')}): ${report.wouldReject}`,
		`  clamped by the server: XP ${report.xpClamped}, Embers ${report.embersClamped}, economy paid from the last trusted save ${report.economyTrusted}`,
		`  flagged (first-save check, one count per save):`,
		...flagLines(report.flagged),
		`  mid castle upgrade right now: ${report.midCastleUpgrade}`,
		`  without a ledger row: ${report.withoutLedger}`,
		``,
		`Consecutive history copies compared: ${report.transitions}`,
		`  would be refused if enforcement were on: ${report.transitionWouldReject}`,
		`  flagged:`,
		...flagLines(report.transitionFlagged),
		``,
		`Ledgers: ${report.ledgers} (${report.ledgersWithoutSave} without a save, ${report.ledgersWithoutInventory} without the inventory yet)`,
	];
	return lines.join('\n');
};
