import { json, unavailable } from '@/lib/authRoute';
import { requirePlayer } from '@/lib/playerRoute';
import { loadRebirthHistory } from '@/lib/cloudSave/supabaseRepo';

export const dynamic = 'force-dynamic';

/** The signed-in player's rebirth history, newest first. Read with the player's own session, so row level security limits it to their rows. */
export async function GET() {
	try {
		const player = await requirePlayer();
		if (!player.userId) return player.response;
		const entries = await loadRebirthHistory(player.supabase, player.userId);
		return json({ entries });
	} catch {
		return unavailable();
	}
}
