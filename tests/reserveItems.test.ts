import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { ITEM_ART } from '../src/config/itemArt';
import { ITEM_ART_SIZE, PIXEL_ICON_SIZES, isItemArt, pixelIconSrc, type PixelIconName } from '../src/config/pixelIcons';
import { ITEM_CATALOG } from '../src/catalog';
import { RESERVE_ITEMS } from '../src/catalog/items/reuse';
import { shopItems } from '../src/catalog/loot';
import { generateLoot } from '../src/lib/loot/generate';
import { mulberry32 } from '../src/lib/rng';

const PUBLIC = resolve(__dirname, '..', 'public');
const reserveIds = new Set(RESERVE_ITEMS.map((d) => d.id));

test('reserve items are all in the catalog, all disabled, and each has its 64 px art registered', () => {
	assert.ok(RESERVE_ITEMS.length >= 90, 'the reuse art pass is in the catalog');
	for (const def of RESERVE_ITEMS) {
		assert.equal(ITEM_CATALOG[def.id], def, `${def.id} resolves`);
		assert.equal(def.enabled, false, `${def.id} is disabled`);
		assert.equal(def.icon, `art_${def.id}`, `${def.id} uses its own art`);
		assert.ok(isItemArt(def.icon!), `${def.id} icon is item art`);
		assert.ok(def.icon! in PIXEL_ICON_SIZES, `${def.id} icon is registered`);
	}
});

test('item art files sit under public/pixel/items at exactly 64x64', () => {
	for (const id of Object.keys(ITEM_ART)) {
		const name = `art_${id}` as PixelIconName;
		const src = pixelIconSrc(name);
		assert.ok(src.startsWith('/pixel/items/'), `${id}: ${src}`);
		const file = resolve(PUBLIC, src.slice(1));
		assert.ok(existsSync(file), `${id}.png missing`);
		const buf = readFileSync(file);
		assert.deepEqual([buf.readUInt32BE(16), buf.readUInt32BE(20)], [...ITEM_ART_SIZE], `${id}.png size`);
	}
});

test('legacy 40 px icons still resolve to /pixel/icons', () => {
	assert.equal(pixelIconSrc('item_emberbrand'), '/pixel/icons/item_emberbrand.png');
	assert.equal(isItemArt('item_emberbrand'), false);
});

test('a disabled reserve item is never sold by the merchant', () => {
	for (const s of shopItems()) assert.ok(!reserveIds.has(s.id), `${s.id} is for sale`);
});

test('a disabled reserve item never drops, from any source at any level', () => {
	const rng = mulberry32(2026);
	for (const sourceId of ['monster', 'boss', 'chest']) {
		for (let level = 1; level <= 100; level += 3) {
			for (let i = 0; i < 8; i++) {
				for (const drop of generateLoot({ sourceId, level }, rng).drops) {
					if (drop.kind === 'gear') assert.ok(!reserveIds.has(drop.item.base), `${drop.item.base} dropped from ${sourceId} L${level}`);
				}
			}
		}
	}
});
