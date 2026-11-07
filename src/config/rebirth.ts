// Rebirth and the Ember shop.
// Split out of gameConfig.ts (IDL-15); the values are unchanged.
import { Resources } from '@/types/game';

// Rebirth: restart with a permanent bonus paid in Embers. Available once the castle reaches `minCastleLevel`.
export const REBIRTH = {
	minCastleLevel: 6,
	minTiles: 400, // the first rebirth also needs this much territory (300+ tiles come before castle level 6, so it has to be more than that)
	tilesPerRebirth: 25, // every rebirth done so far raises the territory the next one needs by this much
	surplusPerTile: 0.02, // every tile above the requirement adds this to the tile term of the Embers (times the castle term)
	gainScale: 3, // Embers = gainScale x (castle level - 5) x (sqrt(tiles / 10) + surplusPerTile x tiles over the requirement), rounded down
	/** Tiles the next rebirth needs, after `rebirths` of them */
	tilesNeeded: (rebirths: number) => REBIRTH.minTiles + REBIRTH.tilesPerRebirth * Math.max(0, rebirths),
	// income bonus = incomePerPoint x (Embers ever earned) ^ incomeExponent (spending points never lowers it). It was linear, +6 % per Ember,
	// which made the first rebirth worth about +130-200 % and every later one snowball. Now about +64 % after 22 Embers, +100 % after 47,
	// +134 % after 76, +220 % after 170 (balancing pass, measured with the sim; tests/rebirth.test.ts pins the curve)
	incomePerPoint: 0.1,
	incomeExponent: 0.6,
	discountCapPercent: 45, // Charisma + Thrift together can never take more than this off a tile
	// Embers granted for a rebirth with this castle level and territory
	gain: (castleLevel: number, tiles: number, rebirths = 0) => {
		const surplus = Math.max(0, tiles - REBIRTH.tilesNeeded(rebirths));
		return Math.floor(REBIRTH.gainScale * Math.max(0, castleLevel - 5) * (Math.sqrt(Math.max(0, tiles) / 10) + REBIRTH.surplusPerTile * surplus));
	},
};

// The Ember shop: permanent upgrades bought with unspent Embers. The N+1-th level costs
// ceil(baseCost x costGrowth^N) points.
export const EMBER_UPGRADES = {
	thrift: {
		label: 'Thrift',
		maxLevel: 10,
		baseCost: 2,
		costGrowth: 1.4,
		effectPerLevel: 0.02, // -2% tile and building cost per level
	},
	builders: {
		label: 'Master Builders',
		maxLevel: 10,
		baseCost: 3,
		costGrowth: 1.4,
		effectPerLevel: 0.05, // -5% castle build time per level
	},
	mastery: {
		label: 'Click Mastery',
		maxLevel: 10,
		baseCost: 2,
		costGrowth: 1.4,
		effectPerLevel: 0.25, // +25% gold per click per level
	},
	provisions: {
		label: 'Provisions',
		maxLevel: 10,
		baseCost: 2,
		costGrowth: 1.4,
		effectPerLevel: 1, // levels of the starting bundle below
		bundle: { gold: 1500, wood: 400, stone: 400 } as Partial<Resources>, // per level, given at the start of every run
	},
	nightwatch: {
		label: 'Night Watch',
		maxLevel: 10,
		baseCost: 2,
		costGrowth: 1.4,
		effectPerLevel: 1, // +1 hour of away time the kingdom works for you, per level (base: LIMITS.offlineCapHours)
	},
	steward: {
		label: 'Steward',
		maxLevel: 10,
		baseCost: 3,
		costGrowth: 1.4,
		effectPerLevel: 0.05, // +5% of the normal income while you are away, per level (base: LIMITS.offlineEfficiency)
	},
} as const;

export type EmberUpgradeId = keyof typeof EMBER_UPGRADES;
