// Stat audit, part 3: what the server does with cheating saves.
//
// Each case below pins what the server does TODAY. Where today's behaviour is a hole, the test says so ("EXPLOIT n"): when the hole is
// closed, that assertion fails on purpose and is changed to the new verdict ('rejected' or 'clamped').
import test from 'node:test';
import assert from 'node:assert/strict';
import { runCheats, type CheatRow } from './statAudit.cheats';
import { near, oracle } from './statAudit.helpers';
import { VERIFY } from '../src/lib/cloudSave/verify';

let rows: Record<string, CheatRow>;
test('setup: run every cheating save through acceptSave', async () => {
	rows = Object.fromEntries((await runCheats()).map((r) => [r.id, r]));
	assert.equal(Object.keys(rows).length, 15);
});

const get = (id: string) => {
	assert.ok(rows, 'setup must have run');
	return rows[id];
};

test('structural forgery is refused outright: unpaid Ember shop levels, extra attribute points, a click level beyond the ladder', () => {
	for (const id of ['ember-shop-unpaid', 'stat-points', 'click-level']) assert.equal(get(id).verdict, 'rejected', id);
	assert.match(get('ember-shop-unpaid').reason!, /embers do not add up/);
	assert.match(get('stat-points').reason!, /too many stat points/);
});

test('XP is the server\'s to bound: a save with more XP than the game could have paid is clamped and flagged', () => {
	const row = get('xp-inflated');
	assert.equal(row.verdict, 'clamped');
	assert.ok(row.flags.includes('xp_jump'));
});

test('FLAGGED ONLY: these are accepted and stored as claimed; the flag costs the account its ranking, not the income', () => {
	const expected: Record<string, string> = {
		'gold-huge': 'gold_jump',
		'gold-over-allowance': 'gold_jump',
		'resources-huge': 'networth_exceeds',
		'castle-skip': 'castle_jump',
		'playtime-fast': 'playtime_fast',
		'tiles-unpaid': 'networth_exceeds',
	};
	for (const [id, flag] of Object.entries(expected)) {
		assert.equal(get(id).verdict, 'flagged', id);
		assert.ok(get(id).flags.includes(flag), `${id} should raise ${flag}, raised ${get(id).flags}`);
	}
	// "accepted" has a consequence: the server derives its income rates (offline pay, kill rewards) from the save it stored
	assert.ok(get('castle-skip').rateFactor > 40, `a skipped castle pays ${get('castle-skip').rateFactor.toFixed(0)}x the income on the server`);
	assert.ok(get('tiles-unpaid').rateFactor > 5, `unpaid tiles pay ${get('tiles-unpaid').rateFactor.toFixed(1)}x`);
});

test('the gold check has a deliberate blind spot: 10,000 gold floor + 900 s of income + 1.5x the income played, per save', () => {
	assert.equal(get('gold-inside-allowance').verdict, 'silent', '+15,000 in 300 s is allowed');
	assert.equal(get('gold-over-allowance').verdict, 'flagged', '+20,000 in 300 s is not');
	// the floor alone lets a client add this much gold at every upload (uploads are at least 10 s apart)
	assert.equal(VERIFY.goldFloor, 10_000);
	const perDay = (VERIFY.goldFloor * 86_400) / 300; // one upload every 5 minutes (the heartbeat) stays under the floor each time
	assert.ok(perDay > 2_000_000, `up to ${perDay.toLocaleString()} gold a day without a flag at the 5-minute heartbeat`);
});

test('EXPLOIT 1: the Ember balance is never checked against what a rebirth could have paid. No flag, no clamp, any amount up to 1,000,000', () => {
	for (const id of ['embers-later-save', 'embers-first-save', 'rebirths-jump']) {
		const row = get(id);
		assert.equal(row.verdict, 'silent', `${id} is accepted without a single flag`);
		assert.deepEqual(row.flags, []);
		// ... and the server then pays out on it: its stored income rate includes the Ember multiplier
		assert.ok(row.rateFactor > 100, `${id}: the server's gold rate is ${row.rateFactor.toFixed(0)}x an honest player's`);
	}
	// the ceiling that sanitizeSave does enforce (1,000,000 Embers) is worth this much extra income on every resource but XP
	near(oracle.ember(1_000_000), 1 + 0.1 * 1_000_000 ** 0.6, 'multiplier at the Ember ceiling');
	assert.ok(oracle.ember(1_000_000) > 399 && oracle.ember(1_000_000) < 400);
	// what an honest first rebirth pays, for scale (castle 6, 400 tiles)
	assert.equal(oracle.emberGain(6, 400, 0, 0), 18);
});

test('EXPLOIT 2: merchant upgrades are not paid for on the server. Foreman, Haggler, Tithe and Bulk at the maximum raise no flag', () => {
	const row = get('merchant-unpaid');
	assert.equal(row.verdict, 'silent');
	assert.deepEqual(row.flags, []);
	assert.ok(row.rateFactor > 1.05, `Foreman 10 alone pays ${(row.rateFactor * 100 - 100).toFixed(0)}% more income`);
});
