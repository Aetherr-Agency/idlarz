import { SETS } from '../src/catalog';
import type { ItemStats } from '../src/catalog/stats';

/**
 * Runs `fn` with extra stats added to one set threshold, then puts the real bonus back. The shipped sets carry no percent damage or percent
 * Max HP, so the tests of those buckets (a set's multiplier on damage, on health, and what the server derives from it) add them here.
 */
export const withSetBonus = <T>(setId: string, threshold: number, extra: ItemStats, fn: () => T): T => {
	const bonuses = SETS[setId].bonuses;
	const original = bonuses[threshold];
	bonuses[threshold] = { ...original, ...extra };
	try {
		return fn();
	} finally {
		if (original) bonuses[threshold] = original;
		else delete bonuses[threshold];
	}
};
