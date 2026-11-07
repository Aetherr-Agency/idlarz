// Buildings and what they cost.
// Split out of gameConfig.ts (IDL-15); the values are unchanged.
import { Resources } from '@/types/game';

// Buildings (any explored tile)
export type BuildingType =
	| 'farm'
	| 'mine'
	| 'lumbermill'
	| 'market'
	| 'blacksmith'
	| 'workshop'
	| 'lumbercamp'
	| 'quarry'
	| 'fishinghut'
	| 'hunterslodge'
	| 'tavern'
	| 'tower'
	| 'well'
	| 'alchemylab'
	| 'stonecraft'
	| 'barracks';

interface Building {
	name: BuildingType;
	label: string;
	resourceGeneration: Partial<Resources>;
}

// Buildings configuration
export const BUILDINGS: Record<BuildingType, Building> = {
	farm: {
		name: 'farm',
		label: 'Farm',
		resourceGeneration: {
			food: 0.2,
		},
	},
	mine: {
		name: 'mine',
		label: 'Mine',
		resourceGeneration: {
			stone: 0.2,
			coal: 0.2,
		},
	},
	lumbermill: {
		name: 'lumbermill',
		label: 'Lumber Mill',
		resourceGeneration: {
			wood: 0.2,
		},
	},
	market: {
		name: 'market',
		label: 'Market',
		resourceGeneration: {
			gold: 0.2,
		},
	},
	blacksmith: {
		name: 'blacksmith',
		label: 'Blacksmith',
		resourceGeneration: {
			stone: 0.07,
			coal: 0.07,
			gold: 0.07,
			food: 0.07,
			wood: 0.07,
		},
	},
	workshop: {
		name: 'workshop',
		label: 'Workshop',
		resourceGeneration: {
			xp: 0.2,
		},
	},
	// Round 2 buildings: every output is an existing resource (tuning notes in docs/05)
	lumbercamp: { name: 'lumbercamp', label: 'Lumber Camp', resourceGeneration: { wood: 0.18 } },
	quarry: { name: 'quarry', label: 'Quarry', resourceGeneration: { stone: 0.25 } },
	fishinghut: { name: 'fishinghut', label: 'Fishing Hut', resourceGeneration: { food: 0.16, gold: 0.05 } },
	// Meat used to be farm-only; the Hunter's Lodge is the one other source (small, so farms stay the main supply)
	hunterslodge: { name: 'hunterslodge', label: "Hunter's Lodge", resourceGeneration: { meat: 0.15 } },
	tavern: { name: 'tavern', label: 'Tavern', resourceGeneration: { food: 0.12, xp: 0.08 } },
	tower: { name: 'tower', label: 'Tower', resourceGeneration: { stone: 0.08, xp: 0.12 } },
	well: { name: 'well', label: 'Well', resourceGeneration: { food: 0.15 } },
	alchemylab: { name: 'alchemylab', label: 'Alchemy Lab', resourceGeneration: { xp: 0.12, gold: 0.08 } },
	stonecraft: { name: 'stonecraft', label: 'Stone Craft', resourceGeneration: { stone: 0.15, gold: 0.08 } },
	barracks: { name: 'barracks', label: 'Barracks', resourceGeneration: { gold: 0.1, xp: 0.1 } },
};

// Buildings stand on any explored tile (not the castle or a lake) and cost resources; every building costs more than the last.
// The first few are cheap (`starter` = share of `base` for building 1, 2, 3 ...), then the price grows in three stages the way
// tile prices do: steeply for the next `earlyCount` buildings, gentler for `midCount` more, gentler again after that.
export const BUILDING_COST = {
	base: { gold: 500, wood: 250, stone: 150 } as Partial<Resources>,
	starter: [0.4, 0.6, 0.8, 1] as number[],
	growthEarly: 1.15,
	earlyCount: 12,
	growthMid: 1.09,
	midCount: 16,
	growthLate: 1.025,
	/** Biomes a building cannot stand on (water; the castle has its own upgrades) */
	blockedBiomes: ['lake', 'castle', 'empty'] as string[],
};
