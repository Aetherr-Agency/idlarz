// The castle's income bonus and upgrade time (part of the former utils/gameUtils.ts, split in IDL-15).
import { CASTLE_UPGRADE } from '@/config/castle';
import type { PrestigeState } from '@/types/game';
import { emberEffect } from '@/utils/game/rebirth';

/**
 * Bonus (as a fraction) the castle adds to the modifier of every resource: +20% at level 1, doubling each
 * level up to `doublingUntil`, then a fixed step per level (so levels 7-10 stay a long climb, not an explosion).
 */
export const castleModifier = (level: number): number => {
	const lvl = Math.max(1, Math.floor(level));
	const doubled = Math.min(lvl, CASTLE_UPGRADE.doublingUntil);
	let bonus = CASTLE_UPGRADE.baseResourceMultiplier * Math.pow(2, doubled - 1);
	if (lvl > CASTLE_UPGRADE.doublingUntil) {
		bonus += CASTLE_UPGRADE.lateLevelStep * (lvl - CASTLE_UPGRADE.doublingUntil);
	}
	return bonus;
};

/** Seconds the castle needs to go from `fromLevel` to `fromLevel + 1`. */
export const castleUpgradeDuration = (fromLevel: number, prestige?: PrestigeState): number =>
	Math.floor((CASTLE_UPGRADE.durationsSec[fromLevel - 1] ?? 0) * (1 - emberEffect(prestige, 'builders')));
