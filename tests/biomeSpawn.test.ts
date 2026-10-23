import test from 'node:test';
import assert from 'node:assert/strict';
import { getRandomBiome } from '../src/utils/gameUtils';
import { SCALING_CONFIG, BIOMES } from '../src/config/gameConfig';
import type { BiomeType, Tile } from '../src/types/game';

const tile = (biome: BiomeType, isOwned = true): Tile => ({ biome, isOwned });
const empty = (): Tile[][] => Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => tile('empty', false)));

/** How often each biome comes up over a sweep of the random range at (2,2). */
const spread = (tiles?: Tile[][]) => {
	const n = 2000;
	const seen: Record<string, number> = {};
	for (let i = 0; i < n; i++) {
		const b = getRandomBiome(tiles, 2, 2, () => (i + 0.5) / n);
		seen[b] = (seen[b] ?? 0) + 1;
	}
	return seen;
};

test('random biomes never include the castle or empty land, and water can turn up anywhere', () => {
	const seen = spread();
	assert.equal(seen.castle, undefined);
	assert.equal(seen.empty, undefined);
	assert.ok(seen.lake > 0 && seen.coast > 0);
	assert.ok(seen.coast < seen.forest, 'coast is rarer than a plain biome');
});

test('water clusters: next to a lake, lakes and coasts both get likelier', () => {
	const base = spread();
	const g = empty();
	g[2][1] = tile('lake');
	const near = spread(g);
	assert.ok(near.lake > base.lake * 2);
	assert.ok(near.coast > base.coast * 2);
	assert.ok(near.forest < base.forest);
});

test('an unowned lake next door does not count', () => {
	const g = empty();
	g[2][1] = tile('lake', false);
	assert.deepEqual(spread(g), spread());
});

test('every biome a purchase can produce exists in BIOMES', () => {
	for (const b of Object.keys(spread())) assert.ok(b in BIOMES);
});

test('tile cost: three phases, endgame growth is gentler than the mid game', () => {
	const c = SCALING_CONFIG.costFormula;
	const { earlyTiles, lateTiles, growthLate, growthEndgame } = SCALING_CONFIG;
	assert.ok(Math.abs(c(earlyTiles + 1) / c(earlyTiles) - growthLate) < 0.01);
	assert.ok(Math.abs(c(lateTiles + 1) / c(lateTiles) - growthEndgame) < 0.01);
	assert.ok(growthEndgame < growthLate);
	assert.ok(c(lateTiles + 10) < 1e9, 'tile 50 stays in reach');
});
