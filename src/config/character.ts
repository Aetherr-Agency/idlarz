// The player: default name, starting attributes, the level curve and what an attribute point gives.
// Split out of gameConfig.ts (IDL-15); the values are unchanged.
import { CharacterStats } from '@/types/game';

// Default player name
export const DEFAULT_PLAYER_NAME = 'Explorer';

// Character stats initial values
export const INITIAL_CHARACTER_STATS: CharacterStats = {
	// Base Stats
	strength: 5,
	dexterity: 5,
	intelligence: 5,
	vitality: 5,
	charisma: 5,
	// Points to spent
	availablePoints: 0,
	// Derived stats (HP, attack, crit, XP gain, tile discount ...) start at 0 here and are always filled in by
	// calculateCombatStats() (createInitialData, addStatPoint, sanitizeSave), so there is one formula only.
	physicalAtk: 0,
	magicAtk: 0,
	hp: 0,
	mp: 0,
	def: 0,
	luck: 0,
	critChance: 0,
	atkSpeedIncrease: 0,
	xpGainMultiplier: 0,
	tileCostDiscount: 0,
};

// The character level curve (xpToNextLevel / calculateLevel in utils/gameUtils.ts). Level and XP carry over a rebirth, so the curve is
// paced over rebirths, not days, and is written down as ANCHORS: the total XP at which a level is reached, measured with the sim bot
// (npm run sim hardcore-rebirth6-x10 logs lifetime XP and level; with the cheaper castle the hardcore bot rebirths at ~day 4, 7, 10, 12.5, 15 ... 25):
//   level 10 after ~4-5 h (XP 1.4e5), level ~30 around day 2 (1e8), the soft cap (80) around the 3rd rebirth (3e9),
//   level 90 around the 5th (6.5e9) and the maximum (100) around the 10th (1.85e10).
// Between two anchors the step to the next level grows by a constant factor, chosen so the total hits the anchor and the steps never
// shrink at a join; the first step is `firstStepXp`. Retune the anchors (not the code) when the sim's XP supply changes.
export const LEVELING = {
	maxLevel: 100,
	softCapLevel: 80,
	firstStepXp: 5000,
	// A level gives 1 attribute point; the levels up to `earlyBonusUntil` give `earlyBonusPoints` more. Levels are slower than they were, and
	// the points (Charisma, Intelligence ...) are what speeds the first days up, so the early levels pay extra to keep the pace of the first days.
	earlyBonusUntil: 30,
	earlyBonusPoints: 2,
	/** [level, total XP needed to reach it], increasing, ending at maxLevel */
	anchors: [
		[10, 1.4e5],
		[30, 1.0e8],
		[80, 3.0e9],
		[90, 6.5e9],
		[100, 1.85e10],
	] as readonly (readonly [number, number])[],
};
export const MAX_LEVEL = LEVELING.maxLevel;

// What each base stat does per point. Used by the maths (gameUtils) AND by every tooltip/tutorial text.
export const CHARACTER_STAT_CONFIG = {
	// Fraction added to the modifier of each listed resource, per point
	resourceModifierPerPoint: 0.025,
	resourceTargets: {
		strength: ['stone', 'coal'],
		dexterity: ['wood', 'food'],
		intelligence: ['gold'],
		vitality: ['food', 'wood'],
		charisma: ['gold', 'coal'],
	} as Record<'strength' | 'dexterity' | 'intelligence' | 'vitality' | 'charisma', ('gold' | 'wood' | 'stone' | 'coal' | 'food')[]>,
	// Fraction added to the XP modifier, per point
	xpModifierPerPoint: { intelligence: 0.002, charisma: 0.0025 },
	// Percent added to xpGainMultiplier (applies to passive XP and tile XP), per point
	xpGainPercentPerPoint: { intelligence: 0.2, charisma: 0.25 },
	// Percent of tile cost removed per Charisma point, and the cap
	tileDiscountPercentPerCharisma: 0.5,
	tileDiscountCapPercent: 25,
	// Plains: meat modifier per owned Plains tile (fraction)
	plainsMeatModifier: 0.05,
};
