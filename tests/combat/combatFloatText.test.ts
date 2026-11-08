import test from 'node:test';
import assert from 'node:assert/strict';
import { hitNumberText } from '../../src/lib/combatFx';

test('a plain hit shows the damage with a minus and no mark', () => {
	assert.equal(hitNumberText(120, 'none'), '-120');
});

test('a critical hit ends with one !, a super crit with two', () => {
	assert.equal(hitNumberText(120, 'crit'), '-120!');
	assert.equal(hitNumberText(600, 'super'), '-600!!');
});

test('big hits use the same short number format as the rest of the game', () => {
	assert.equal(hitNumberText(1_250_000, 'crit'), '-1.25M!');
});
