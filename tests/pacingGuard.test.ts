import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePacing, formatViolations, type PacingBaseline } from '../scripts/pacingCompare';

const baseline = (hardcore: Record<string, number | null>): PacingBaseline => ({ profiles: { hardcore } });

test('identical baselines pass', () => {
	const b = baseline({ finished: 3, castle6: 2.3, castle10: 11.8, level80: 7.6, level90: null });
	assert.deepEqual(comparePacing(b, b), []);
});

test('a guarded milestone inside ±15 % passes, outside fails (both directions)', () => {
	const base = baseline({ finished: 4 });
	assert.deepEqual(comparePacing(base, baseline({ finished: 4.5 })), []); // +12.5 %
	assert.deepEqual(comparePacing(base, baseline({ finished: 3.5 })), []); // -12.5 %
	const slower = comparePacing(base, baseline({ finished: 4.7 })); // +17.5 %
	assert.equal(slower.length, 1);
	assert.equal(slower[0].milestone, 'finished');
	assert.equal(comparePacing(base, baseline({ finished: 3.2 })).length, 1); // -20 %
});

test('only the guarded milestones count, so a tiles25 shift does not fail the PR', () => {
	assert.deepEqual(comparePacing(baseline({ tiles25: 0.4, click1: 8 }), baseline({ tiles25: 0.9, click1: 2 })), []);
});

test('milestones that become reached or unreachable fail', () => {
	assert.equal(comparePacing(baseline({ level90: 12.4 }), baseline({ level90: null })).length, 1);
	assert.equal(comparePacing(baseline({ level90: null }), baseline({ level90: 12.4 })).length, 1);
	assert.deepEqual(comparePacing(baseline({ level90: null }), baseline({ level90: null })), []);
});

test('a missing profile fails, a new profile is fine, tiny values are noise', () => {
	assert.equal(comparePacing({ profiles: { hardcore: { finished: 3 }, casual: { finished: 4 } } }, baseline({ finished: 3 })).length, 1);
	assert.deepEqual(comparePacing(baseline({ finished: 3 }), { profiles: { hardcore: { finished: 3 }, extra: { finished: 9 } } }), []);
	assert.deepEqual(comparePacing(baseline({ tiles100: 0.01 }), baseline({ tiles100: 0.04 })), []);
});

test('the report names the profile, the milestone and the change', () => {
	const text = formatViolations(comparePacing(baseline({ castle10: 10 }), baseline({ castle10: 13 })));
	assert.match(text, /hardcore castle10: 10\.00 d -> 13\.00 d \(\+30\.0 %/);
});
