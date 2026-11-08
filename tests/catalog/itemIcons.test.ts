import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { ITEM_CATALOG, ITEMS } from '../../src/catalog';
import { ITEM_ICON_FILES, ITEM_ICONS } from '../../src/config/itemIcons';
import { PIXEL_ICON_SIZES, pixelIconSrc } from '../../src/config/pixelIcons';

const PUBLIC = resolve(__dirname, '..', '..', 'public');
const ART_ROOT = resolve(PUBLIC, 'pixel', 'items');

/** Files under public/pixel/items that are deliberately not registered: spare art, named `_<name>.png` (same rule as public/pixel/resources) */
const isIgnored = (file: string) => file.split('/').pop()!.startsWith('_');

const artFiles = (dir = ART_ROOT, prefix = ''): string[] =>
	readdirSync(dir).flatMap((name) => {
		const full = resolve(dir, name);
		const rel = prefix + name;
		return statSync(full).isDirectory() ? artFiles(full, `${rel}/`) : rel.endsWith('.png') ? [rel.slice(0, -4)] : [];
	});

test('registry entries are well formed and the icon name is unique', () => {
	const seen = new Set<string>();
	for (const [fileName, entries] of Object.entries(ITEM_ICON_FILES)) {
		for (const e of entries) {
			assert.ok(!seen.has(e.icon), `duplicate icon ${e.icon}`);
			seen.add(e.icon);
			if (fileName !== 'placeholders') assert.equal(`${e.slot}${e.weapon ? `-${e.weapon}` : ''}`, fileName, `${e.icon} sits in the wrong registry file`);
			assert.match(e.icon, e.file ? /^art_/ : /^item_/, `${e.icon}: art_ for supplied files, item_ for built icons`);
			if (e.grade !== null) assert.match(e.grade, /^(G[1-9]|S[1-3])$/, `${e.icon} grade`);
			assert.ok(e.provenance.trim().length > 0, `${e.icon} needs a provenance`);
			if (e.item) assert.ok(ITEM_CATALOG[e.item], `${e.icon}: unknown item ${e.item}`);
			assert.ok(e.icon in PIXEL_ICON_SIZES, `${e.icon} is in the icon size table`);
		}
	}
});

test('every registry entry has its file', () => {
	for (const e of ITEM_ICONS) {
		const file = resolve(PUBLIC, pixelIconSrc(e.icon as never).slice(1));
		assert.ok(existsSync(file), `${e.icon}: ${file} is missing`);
	}
});

test('every file under public/pixel/items is registered or ignored (a "_" prefix)', () => {
	const registered = new Set(ITEM_ICONS.flatMap((e) => (e.file ? [e.file] : [])));
	for (const file of artFiles()) assert.ok(registered.has(file) || isIgnored(file), `${file}.png is not in src/config/itemIcons/`);
	assert.equal(registered.size, ITEM_ICONS.filter((e) => e.file).length, 'two icons share one file');
});

test('every catalog icon key resolves to a registry entry', () => {
	const byIcon = new Map(ITEM_ICONS.map((e) => [e.icon, e]));
	for (const def of ITEMS) {
		if (!def.icon || !/^(art|item)_/.test(def.icon)) continue;
		const entry = byIcon.get(def.icon);
		assert.ok(entry, `${def.id}: icon ${def.icon} is not in src/config/itemIcons/`);
		assert.equal(entry.item, def.id, `${def.icon} is registered for ${entry.item}, used by ${def.id}`);
	}
});
