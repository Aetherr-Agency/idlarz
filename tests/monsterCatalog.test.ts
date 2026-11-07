import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MONSTER_CATALOG, monsterArtUrl, monstersInBiome } from '../src/catalog/monsters';
import { MONSTERS } from '../src/config/combatConfig';

// The roster (catalog/monsters.ts) lists every planned monster; only enabled ones may spawn, and those must have real stats in MONSTERS.

test('ids are unique and every biome has three monsters and one boss', () => {
	const ids = MONSTER_CATALOG.map((m) => m.id);
	assert.equal(new Set(ids).size, ids.length);
	const byBiome = new Map<string, typeof MONSTER_CATALOG>();
	for (const m of MONSTER_CATALOG) {
		byBiome.set(m.biomes[0], [...(byBiome.get(m.biomes[0]) ?? []), m]);
	}
	assert.equal(byBiome.size, 12);
	for (const [biome, list] of byBiome) {
		assert.equal(list.filter((m) => m.grade === 'normal').length, 3, `${biome}: 3 monsters`);
		assert.equal(list.filter((m) => m.grade === 'boss').length, 1, `${biome}: 1 boss`);
	}
});

test('the rats are gone: the four biomes with art are enabled, and exactly the enabled ones exist in MONSTERS', () => {
	assert.ok(!('rat' in MONSTERS) && !('ratKing' in MONSTERS));
	const enabledBiomes = new Set(MONSTER_CATALOG.filter((m) => m.enabled).map((m) => m.biomes[0]));
	assert.deepEqual([...enabledBiomes].sort(), ['forest', 'plains', 'swamp', 'tundra']);
	assert.equal(MONSTER_CATALOG.filter((m) => m.enabled).length, 16);
	assert.deepEqual(Object.keys(MONSTERS).sort(), MONSTER_CATALOG.filter((m) => m.enabled).map((m) => m.id).sort());
	for (const m of MONSTER_CATALOG.filter((m) => m.enabled)) {
		assert.equal(MONSTERS[m.id as keyof typeof MONSTERS].grade, m.grade);
		assert.deepEqual([...m.biomes], [...MONSTERS[m.id as keyof typeof MONSTERS].spawn.biomes]);
	}
});

test('an entry says it has art exactly when the picture file exists', () => {
	for (const m of MONSTER_CATALOG) {
		const file = path.join(__dirname, '..', 'public', monsterArtUrl(m));
		assert.equal(fs.existsSync(file), m.art, `${m.id}: ${monsterArtUrl(m)}`);
	}
});

test('monstersInBiome hides disabled monsters unless asked', () => {
	assert.deepEqual(monstersInBiome('swamp').map((m) => m.id).sort(), ['bossMireMatriarch', 'dumpback', 'garbageOgre', 'rotHeron']);
	assert.equal(monstersInBiome('lake').length, 0, 'no lake monster is enabled');
	assert.equal(monstersInBiome('lake', false).length, 4);
	assert.equal(monstersInBiome('hills').length, 0);
});
