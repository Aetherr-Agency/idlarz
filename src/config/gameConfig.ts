import { BiomeInfo, EquipmentRarity, EquipmentSlot } from '@/types/game';

// Grid Configuration
export const GRID_SIZE = 50; // Width of the grid
export const GRID_HEIGHT = 50; // Height of the grid (half of width)
export const TILE_SIZE = 48; // Balanced for visibility
export const VIEWPORT_SIZE = 25; // 12 tiles in each direction from center

// Game Constants
export const TICK_RATE = 100; // 10 times per second
export const BASE_TILE_COST = 70; // Base cost for first tile purchase
export const ADJACENCY_BONUS = 0.25; // 25% bonus for adjacent same biomes

// Resource scaling configuration
export const SCALING_CONFIG = {
	// Base scaling factor that increases exponentially
	baseScalingFactor: 1.34,
	scalingIncreasePer: 13, // Increase scaling every X tiles
	scalingIncreaseAmount: 0.04, // 4% increase in scaling factor

	// Exponential cost scaling formula
	costFormula: (ownedTiles: number) => {
		const tier = Math.floor(ownedTiles / SCALING_CONFIG.scalingIncreasePer);
		const currentScalingFactor =
			SCALING_CONFIG.baseScalingFactor *
			(1 +
				SCALING_CONFIG.scalingIncreaseAmount * (tier > 20 ? tier : tier / 2));
		return Math.floor(
			BASE_TILE_COST * Math.pow(currentScalingFactor, ownedTiles)
		);
	},
	adjacencyBonus: ADJACENCY_BONUS,
};

export const RESOURCE_ICONS = {
	gold: '💰',
	wood: '🪵',
	stone: '🪨',
	coal: '⛏️',
	food: '🌾',
	xp: '✨',
};

export const BIOME_ICONS = {
	castle: '🏰',
	forest: '🌲',
	plains: '🌾',
	hills: '⛰️',
	swamp: '🌿',
	tundra: '❄️',
	lake: '💧',
	empty: '⬛',
	grounds: '🛠️',
};

export const INITIAL_RESOURCES = {
	gold: 150, // Increased starter gold to make early game smoother
	wood: 0,
	stone: 0,
	coal: 0,
	food: 0,
	xp: 0,
};

// Base resource generation (per second) - slightly increased for better early game
export const BASE_GENERATION_RATES = {
	gold: 0.1, // Increased base gold generation
	wood: 0,
	stone: 0,
	coal: 0,
	food: 0,
	xp: 0.5, // Base XP generation rate increased
};

// Castle Configuration - improved to make upgrades more impactful
export const CASTLE_BASE_RATES = {
	gold: 0.1, // Increased from 0.05
	wood: 0.05, // Added some base wood generation
	stone: 0.05, // Added some base stone generation
	coal: 0,
	food: 0.05, // Increased from 0.01
	xp: 0.5, // Castle provides more base XP
};

// Exponential castle upgrade system
export const CASTLE_UPGRADE = {
	maxLevel: 10, // Increased from 5
	baseResourceMultiplier: 0.2, // 20% base modifier at level 1
	doublePerLevel: true, // Multiply by 2 for each level
	xpBonus: 0.5, // Additional flat XP per castle level
	upgradeCosts: [
		{ gold: 5000, wood: 500, stone: 500 },
		{ gold: 25000, wood: 2500, stone: 2500 },
		{ gold: 100000, wood: 10000, stone: 10000 },
		{ gold: 500000, wood: 50000, stone: 50000 },
		{ gold: 2500000, wood: 250000, stone: 250000 },
		{ gold: 10000000, wood: 1000000, stone: 1000000 },
		{ gold: 50000000, wood: 5000000, stone: 5000000 },
		{ gold: 250000000, wood: 25000000, stone: 25000000 },
		{ gold: 1000000000, wood: 100000000, stone: 100000000 },
	],
};

// Biome Configuration - rebalanced for longer gameplay
export const BIOMES: Record<string, BiomeInfo> = {
	empty: {
		name: 'empty',
		label: 'Empty',
		baseColor: '#1a1a1a',
		cost: 0,
		resourceGeneration: {},
		resourceIcons: [RESOURCE_ICONS.coal],
		description: 'Empty land, waiting to be claimed',
	},
	castle: {
		name: 'castle',
		label: 'Castle',
		baseColor: '#6d28d9',
		cost: 0,
		resourceGeneration: {
			gold: 0.2,
			wood: 0.1,
			stone: 0.1,
			food: 0.1,
			xp: 1.0,
		},
		resourceIcons: [RESOURCE_ICONS.gold, RESOURCE_ICONS.xp],
		description: 'Your castle generates resources over time',
	},
	grounds: {
		name: 'grounds',
		label: 'Grounds',
		baseColor: '#371c00',
		cost: 100,
		resourceGeneration: {
			gold: 0,
			wood: 0,
			stone: 0,
			food: 0,
			xp: 0.15,
		},
		resourceIcons: [RESOURCE_ICONS.xp],
		description: 'Allow you to build structures',
	},
	forest: {
		name: 'forest',
		label: 'Forest',
		baseColor: '#166534',
		cost: 100,
		resourceGeneration: {
			gold: 0.1,
			wood: 0.3,
		},
		resourceIcons: [RESOURCE_ICONS.wood],
		description: 'Forests provide wood and gold',
	},
	plains: {
		name: 'plains',
		label: 'Plains',
		baseColor: '#2f8123',
		cost: 100,
		resourceGeneration: {
			gold: 0.1,
			food: 0.3,
		},
		resourceIcons: [RESOURCE_ICONS.food],
		description: 'Plains provide food and gold',
	},
	hills: {
		name: 'hills',
		label: 'Hills',
		baseColor: '#3d3d3d',
		cost: 100,
		resourceGeneration: {
			gold: 0.05,
			stone: 0.3,
			coal: 0.2,
		},
		resourceIcons: [RESOURCE_ICONS.stone, RESOURCE_ICONS.coal],
		description: 'Hills provide stone and coal',
	},
	swamp: {
		name: 'swamp',
		label: 'Swamp',
		baseColor: '#929706',
		cost: 100,
		resourceGeneration: {
			food: 0.1,
			wood: 0.2,
		},
		resourceIcons: [RESOURCE_ICONS.food, RESOURCE_ICONS.wood],
		description: 'Swamps provide food and wood',
	},
	tundra: {
		name: 'tundra',
		label: 'Tundra',
		baseColor: '#0f53b9',
		cost: 100,
		resourceGeneration: {
			gold: 0.1,
			coal: 0.35,
		},
		resourceIcons: [RESOURCE_ICONS.gold, RESOURCE_ICONS.coal],
		description: 'Tundras provide gold and coal',
	},
	lake: {
		name: 'lake',
		label: 'Lake',
		baseColor: '#0ea5e9',
		cost: 100,
		resourceGeneration: {
			gold: 0.05,
			food: 0.25,
		},
		resourceIcons: [RESOURCE_ICONS.gold, RESOURCE_ICONS.food],
		description: 'Lakes provide gold and food',
	},
} as const;

// Equipment and items configuration
export const EQUIPMENT_SLOT_INFO = {
	head: { label: 'Head', icon: '🪖' },
	neck: { label: 'Neck', icon: '📿' },
	chest: { label: 'Chest', icon: '👕' },
	mainHand: { label: 'Main Hand', icon: '🗡️' },
	offHand: { label: 'Off Hand', icon: '🛡️' },
	legs: { label: 'Legs', icon: '👖' },
	feet: { label: 'Feet', icon: '👢' },
	ring1: { label: 'Ring 1', icon: '💍' },
	ring2: { label: 'Ring 2', icon: '💍' },
};

export const INITIAL_INVENTORY_ITEMS = [
	{
		id: 'wooden-sword',
		name: 'Wooden Sword',
		icon: '🗡️',
		slot: 'mainHand' as EquipmentSlot,
		stats: { gold: 0.05 },
		description: 'A simple training sword',
		rarity: 'common' as EquipmentRarity,
	},
	{
		id: 'leather-cap',
		name: 'Leather Cap',
		icon: '🪖',
		slot: 'head' as EquipmentSlot,
		stats: { wood: 0.1 },
		description: 'Basic head protection',
		rarity: 'common' as EquipmentRarity,
	},
	{
		id: 'steel-breastplate',
		name: 'Steel Breastplate',
		icon: '👕',
		slot: 'chest' as EquipmentSlot,
		stats: { gold: 0.1, stone: 0.2 },
		description: 'Solid protection for your torso',
		rarity: 'uncommon' as EquipmentRarity,
	},
	{
		id: 'gold-ring',
		name: 'Gold Ring',
		icon: '💍',
		slot: 'ring1' as EquipmentSlot,
		stats: { gold: 0.2 },
		description: 'Increases gold generation',
		rarity: 'rare' as EquipmentRarity,
	},
	{
		id: 'leather-boots',
		name: 'Leather Boots',
		icon: '👢',
		slot: 'feet' as EquipmentSlot,
		stats: { food: 0.1 },
		description: 'Comfortable footwear',
		rarity: 'common' as EquipmentRarity,
	},
	{
		id: 'wooden-shield',
		name: 'Wooden Shield',
		icon: '🛡️',
		slot: 'offHand' as EquipmentSlot,
		stats: { wood: 0.15 },
		description: 'Simple defensive gear',
		rarity: 'common' as EquipmentRarity,
	},
];
