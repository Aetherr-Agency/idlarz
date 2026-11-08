// Chests, monster spawn limits and Luck.
// Part of the former gameConfig.ts (split in IDL-15); the values are unchanged.

// Monsters and chests together never take more than `maxFraction` of the free tiles (see src/lib/spawnLimits.ts); the spawn
// timers pause at that limit. `minAllowed` keeps a tiny early map playable: one rat and one chest can always coexist.
export const SPAWN_LIMIT = {
	maxFraction: 0.3,
	minAllowed: 2,
};

// Chests: one spawns every `intervalSec` (timer pauses while SPAWN_LIMIT is reached) on a random owned tile.
// Reward = passive gold/s x a random time between minMinutes and maxMinutes, plus a small bonus per Luck.
export const CHEST = {
	intervalSec: 600,
	minMinutes: 10,
	maxMinutes: 60,
	luckBonusPerPoint: 0.005,

	// Where chests appear: every eligible tile weighs 1, plus these bonuses (see src/lib/chests.ts)
	placement: {
		frontierBonus: 3, // a tile touching land you have not bought yet
		distanceStep: 4, // +1 per this many tiles (Chebyshev) from the castle, so far land is worth visiting
		nearbyRadius: 2, // another chest this close makes a tile much less likely ...
		nearbyFactor: 0.3, // ... times this
	},

	// What a chest holds: relative chances (they need not sum to 100)
	rewards: { gold: 50, bundle: 25, xp: 12, boost: 10, item: 8 } as Record<'gold' | 'bundle' | 'xp' | 'boost' | 'item', number>,
	boostMultiplier: 1.5, // the "lucky chest": gold x this
	bundle: {
		resources: ['wood', 'stone', 'coal', 'food'] as ('wood' | 'stone' | 'coal' | 'food')[],
		count: [1, 2] as [number, number], // how many of them
		minutes: [10, 30] as [number, number], // of that resource's income each
		floor: 25, // at least this much, so a slow resource still pays something
	},
	xp: { minutes: [10, 30] as [number, number], floor: 60 },
	luckRewardBonusPerPoint: 0.01, // each Luck point shifts this share of the gold weight into boost and item chances
};

// What Luck (the Charisma attribute + the merchant's Lucky Charm + gear) does besides the gold bonuses above. Read through the
// functions of src/lib/luck.ts, which are also what the Character window shows.
export const LUCK = {
	/** Chests come this much faster per Luck point (interval / (1 + n x Luck)), never faster than `chestIntervalFloor` x the base interval */
	chestSpeedPerPoint: 0.004,
	chestIntervalFloor: 0.6,
	/** Weights of rare-and-better gear grow by this much per point, capped at x`rarityCap` (the other weights stay, the roll is normalised) */
	rarityPerPoint: 0.004,
	rarityCap: 1.6,
	/** Rarities from this rank up (`RarityDef.order`: 2 = Rare) count as "rare and better" */
	rarityFromOrder: 2,
	/** Monster gear drop chance grows by this much per point */
	dropChancePerPoint: 0.002,
	/** A bonus roll on every chest (it never replaces the normal reward): chance, and how many gems (skewed to the low end) */
	gem: { base: 0.03, perPoint: 0.0006, cap: 0.15, min: 5, max: 50 },
	/** A newly arrived rat is a golden "lucky" one with this chance: same stats, bigger reward */
	luckyRat: { base: 0.02, perPoint: 0.0005, cap: 0.1, rewardMultiplier: 3, extraGearRolls: 1 },
};
