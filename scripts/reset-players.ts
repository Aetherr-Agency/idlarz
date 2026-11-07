/**
 * Season restart: wipes every player's game progress but keeps their account, character name/class and gem balance.
 *
 *   npm run reset-players                      DRY RUN: lists what would happen, changes nothing
 *   npm run reset-players -- --yes             really do it (a JSON backup is written first)
 *   npm run reset-players -- --yes --user <uuid> [--user <uuid> ...]   only these players
 *   npm run reset-players -- --yes --purge-history   also delete save_history (the rollback copies); default keeps them
 *   npm run reset-players -- --yes --no-backup       skip the JSON backup (not recommended)
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (read from the environment or from .env.local).
 *
 * KEPT:  auth account, profiles (character_name, player_class), player_ledger.gems.
 * RESET: player_saves (and, by cascade, player_worlds + player_stats = the leaderboard row, back after the first new save),
 *        player_ledger except gems (spawn timers, tickets, granted totals, combat, inventory/bag/gear, rebirths; run_id is bumped
 *        so sealed rolls never repeat), save_history only with --purge-history.
 * A player with the game open must reload: their old save no longer matches and is rejected, then they start a new game.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { newLedger } from '../src/lib/offline/ledger';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const users: string[] = [];
args.forEach((a, i) => {
	if (a === '--user' && args[i + 1]) users.push(args[i + 1]);
});
const execute = flag('--yes');
const purgeHistory = flag('--purge-history');
const backup = !flag('--no-backup');

for (const file of ['.env.local', '.env']) {
	try {
		process.loadEnvFile(resolve(process.cwd(), file));
	} catch {
		/* file missing: fine, the environment may already have the variables */
	}
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
	console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (environment or .env.local).');
	process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const fail = (what: string, error: { message: string } | null) => {
	if (error) {
		console.error(`${what}: ${error.message}`);
		process.exit(1);
	}
};

/** Pages through a table (PostgREST caps a response at 1000 rows). */
const fetchAll = async <T>(table: string, columns: string): Promise<T[]> => {
	const out: T[] = [];
	for (let from = 0; ; from += 1000) {
		let query = db.from(table).select(columns).range(from, from + 999);
		if (users.length) query = query.in(table === 'profiles' ? 'id' : 'user_id', users);
		const { data, error } = await query;
		fail(`read ${table}`, error);
		out.push(...((data ?? []) as T[]));
		if (!data || data.length < 1000) break;
	}
	return out;
};

const main = async () => {
	const saves = await fetchAll<{ user_id: string; gems: number; level: number; rebirths: number }>('player_saves', 'user_id, gems, level, rebirths');
	const ledgers = await fetchAll<{ user_id: string; gems: number; run_id: number; ver: number }>('player_ledger', 'user_id, gems, run_id, ver');
	const profiles = await fetchAll<{ id: string; character_name: string }>('profiles', 'id, character_name');

	const names = new Map(profiles.map((p) => [p.id, p.character_name]));
	const ledgerOf = new Map(ledgers.map((l) => [l.user_id, l]));
	const ids = [...new Set([...saves.map((s) => s.user_id), ...ledgers.map((l) => l.user_id)])];

	console.log(`${execute ? 'RESET' : 'DRY RUN'} against ${url}`);
	console.log(`${ids.length} player(s) with game data${users.length ? ` (filtered to ${users.length} id(s))` : ''}:\n`);
	for (const id of ids) {
		const save = saves.find((s) => s.user_id === id);
		const gems = ledgerOf.get(id)?.gems ?? save?.gems ?? 0;
		console.log(`  ${(names.get(id) ?? '?').padEnd(10)} ${id}  level ${save?.level ?? '-'}  rebirths ${save?.rebirths ?? '-'}  gems kept: ${gems}`);
	}
	if (!execute) {
		console.log('\nNothing changed. Re-run with --yes to apply.');
		return;
	}
	if (ids.length === 0) return;

	if (backup) {
		const tables = ['player_saves', 'player_worlds', 'player_stats', 'player_ledger'];
		const dump: Record<string, unknown[]> = {};
		for (const t of tables) dump[t] = await fetchAll<unknown>(t, '*');
		mkdirSync(resolve(process.cwd(), 'backups'), { recursive: true });
		const file = resolve(process.cwd(), 'backups', `reset-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
		writeFileSync(file, JSON.stringify(dump));
		console.log(`\nBackup written: ${file}`);
	}

	const now = Date.now();
	let done = 0;
	for (const id of ids) {
		const old = ledgerOf.get(id);
		const gems = old?.gems ?? saves.find((s) => s.user_id === id)?.gems ?? 0;

		// 1. the ledger: everything back to a new game's values, except the gems (and a bumped run_id / ver)
		const fresh = newLedger(now, 0);
		const row = {
			ver: (old?.ver ?? 0) + 1,
			run_id: (old?.run_id ?? 0) + 1,
			rebirths: 0,
			anchor_at: new Date(now).toISOString(),
			bank: fresh.bank,
			ord_chest: 0,
			ord_kill: 0,
			granted: fresh.granted,
			granted_seen: fresh.grantedSeen,
			gems,
			last_key: null,
			last_result: null,
			combat: null,
			inv: null,
			updated_at: new Date(now).toISOString(),
		};
		const ledgerWrite = old
			? await db.from('player_ledger').update(row).eq('user_id', id)
			: await db.from('player_ledger').insert({ user_id: id, ...row });
		fail(`ledger ${id}`, ledgerWrite.error);

		// 2. the save: deleting it cascades to player_worlds and player_stats; the next login starts a new game
		const saveDelete = await db.from('player_saves').delete().eq('user_id', id);
		fail(`save ${id}`, saveDelete.error);

		if (purgeHistory) {
			const historyDelete = await db.from('save_history').delete().eq('user_id', id);
			fail(`history ${id}`, historyDelete.error);
		}
		done++;
	}
	console.log(`Reset ${done} player(s). Names, classes and gems kept.${purgeHistory ? ' save_history purged.' : ' save_history kept (rollback copies).'}`);
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
