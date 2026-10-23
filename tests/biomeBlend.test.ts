import test from 'node:test';
import assert from 'node:assert/strict';
import { blendKey, getBlendPieces, groundOf, parseBlendKey } from '../src/utils/biomeBlend';
import type { BiomeType, Tile } from '../src/types/game';

/** Builds a tile grid from rows of letters: F forest, P plains, L lake, C castle, . = not owned. */
const NAMES: Record<string, BiomeType> = { F: 'forest', P: 'plains', L: 'lake', C: 'castle', G: 'grounds' };
const grid = (rows: string[]): Tile[][] =>
	rows.map((row) =>
		[...row].map((c) => ({ biome: NAMES[c] ?? 'forest', isOwned: c in NAMES }))
	);

test('same-biome neighbours need no blend', () => {
	assert.deepEqual(getBlendPieces(grid(['FFF', 'FFF', 'FFF']), 1, 1), []);
});

test('a differing side neighbour blends that neighbour in', () => {
	const pieces = getBlendPieces(grid(['FFF', 'FFP', 'FFF']), 1, 1);
	assert.deepEqual(pieces.map((p) => [p.piece, p.ground]), [['e', 'plains']]);
});

test('a differing diagonal only yields an inner corner', () => {
	const pieces = getBlendPieces(grid(['FFF', 'FFF', 'FFP']), 1, 1);
	assert.deepEqual(pieces.map((p) => [p.piece, p.ground]), [['se', 'plains']]);
});

test('no corner piece when an adjoining side already differs', () => {
	const pieces = getBlendPieces(grid(['FFF', 'FFP', 'FFP']), 1, 1);
	assert.deepEqual(pieces.map((p) => p.piece), ['e']);
});

test('unexplored neighbours blend in clouds, off-map edges do not', () => {
	const pieces = getBlendPieces(grid(['F.', 'FF']), 0, 0);
	assert.deepEqual(pieces.map((p) => [p.piece, p.ground]), [['e', 'mystery']]);
});

test('the castle gets a kerb on every differing side, its neighbours stay crisp', () => {
	const g = grid(['FFF', 'FCF', 'FFF']);
	assert.deepEqual(
		getBlendPieces(g, 1, 1).map((p) => [p.piece, p.ground]),
		[['n', 'curb-castle'], ['e', 'curb-castle'], ['s', 'curb-castle'], ['w', 'curb-castle']]
	);
	assert.deepEqual(getBlendPieces(g, 0, 1), []);
	assert.deepEqual(getBlendPieces(g, 0, 0), []);
});

test('a yard gets corner notches only toward owned differing diagonals, not toward fog', () => {
	const g = grid(['FFF', 'FFF', 'FF.']);
	g[1][1] = { biome: 'grounds', isOwned: true, building: 'farm', level: 2 };
	g[1][0] = g[0][1] = g[1][2] = g[2][1] = g[1][1];
	const pieces = getBlendPieces(g, 1, 1);
	assert.deepEqual(pieces.filter((p) => p.ground === 'curb-yard').map((p) => p.piece).sort(), ['ne', 'nw', 'sw']);
});

test('water meets land with a shoreline on both sides', () => {
	const g = grid(['FL', 'FL']);
	assert.deepEqual(getBlendPieces(g, 0, 0).map((p) => [p.piece, p.ground]), [['e', 'shore-land']]);
	assert.deepEqual(getBlendPieces(g, 1, 0).map((p) => [p.piece, p.ground]), [['w', 'shore-water']]);
});

test('water toward unexplored clouds still uses the plain blend', () => {
	const g = grid(['L.']);
	assert.deepEqual(getBlendPieces(g, 0, 0).map((p) => [p.piece, p.ground]), [['e', 'mystery']]);
});

test('a built-up grounds tile is drawn as yard', () => {
	assert.equal(groundOf({ biome: 'grounds', isOwned: true, building: 'farm', level: 2 }), 'yard');
	assert.equal(groundOf({ biome: 'grounds', isOwned: true }), 'grounds');
	assert.equal(groundOf({ biome: 'grounds', isOwned: false }), null);
});

test('both tiles sharing a seam pick the same jitter variant', () => {
	for (let x = 0; x < 6; x++) {
		for (let y = 0; y < 6; y++) {
			const g = grid(['FFFFFFF', 'FFFFFFF', 'FFFFFFF', 'FFFFFFF', 'FFFFFFF', 'FFFFFFF', 'FFFFFFF']);
			g[y][x] = { biome: 'lake', isOwned: true };
			g[y + 1][x] = { biome: 'plains', isOwned: true }; // seam between (x,y) and (x,y+1)
			const top = getBlendPieces(g, x, y).find((p) => p.piece === 's');
			const bottom = getBlendPieces(g, x, y + 1).find((p) => p.piece === 'n');
			assert.equal(top?.variant, bottom?.variant);
		}
	}
});

test('blendKey round-trips', () => {
	const g = grid(['FFF', 'FFP', 'FLF']);
	assert.deepEqual(parseBlendKey(blendKey(g, 1, 1)), getBlendPieces(g, 1, 1));
	assert.equal(blendKey(grid(['FFF', 'FFF', 'FFF']), 1, 1), '');
});
