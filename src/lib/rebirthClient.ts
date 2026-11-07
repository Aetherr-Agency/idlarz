import type { RebirthEntry } from '@/lib/cloudSave/rebirthHistory';

/** The player's rebirth history from the server, newest first; null when it could not be read (offline, signed out). */
export const fetchRebirths = async (): Promise<RebirthEntry[] | null> => {
	try {
		const response = await fetch('/api/rebirths', { credentials: 'same-origin', cache: 'no-store' });
		if (!response.ok) return null;
		const body = (await response.json()) as { entries?: RebirthEntry[] };
		return Array.isArray(body.entries) ? body.entries : null;
	} catch {
		return null;
	}
};
