import {
	Animal,
	BiomeInfo,
	BiomeType,
	CharacterStats,
	EquipmentRarity,
	EquipmentSlot,
} from '@/types/game';

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
	// Combat stats - calculated from base stats
	physicalAtk: 5, // Base + Strength (5)
	magicAtk: 5, // Base + Intelligence (5)
	hp: 15.25, // Base + (Vitality * 3) + (Charisma * 0.25) = 0 + 15 + 0.25
	mp: 10, // Base + (Intelligence * 2) = 0 + 10
	def: 8.75, // Base + Dexterity + (Strength * 0.5) + (Vitality * 0.5) + (Charisma * 0.25) = 0 + 5 + 2.5 + 2.5 + 1.25
	magicDef: 8.25, // Base + Intelligence + (Vitality * 0.5) + (Charisma * 0.25) = 0 + 5 + 2.5 + 1.25
	luck: 5, // Base + Charisma (5)
	critChance: 3.75, // Base + (Dexterity * 0.25) + (Charisma * 0.5) = 0 + 1.25 + 2.5
	critDmgMultiplier: 103, // Base 100% + Strength + (Dexterity * 0.5) + (Charisma * 0.5) = 100 + 5 + 2.5 + 2.5
	atkSpeedIncrease: 1.25, // Base + (Dexterity * 0.25) = 0 + 1.25
	xpGainMultiplier: 2.25, // Base + (Intelligence * 0.2) + (Charisma * 0.25) = 0 + 1 + 1.25
	tileCostDiscount: Math.min(5 * 0.001, 0.25) * 100, // +0.1% per charisma point, capped at 25%
	reputation: 1000, // Base reputation value
};

// Grid Configuration
export const GRID_SIZE = 50; // Width of the grid
export const GRID_HEIGHT = 50; // Height of the grid (half of width)
export const GRID_CENTER_X = Math.floor(GRID_SIZE / 2);
export const GRID_CENTER_Y = Math.floor(GRID_HEIGHT / 2);

export const TILE_SIZE = 48; // Balanced for visibility
export const VIEWPORT_SIZE = 25; // 12 tiles in each direction from center

// Game Constants
export const TICK_RATE = 100; // 10 times per second
export const BASE_TILE_COST = 70; // Base cost for first tile purchase
export const ADJACENCY_BONUS = 0.25; // 25% bonus for adjacent same biomes

// XP calculation constants - Exponential XP system
export const BASE_XP_PER_TILE = 125;
export const XP_GROWTH_FACTOR = 1.4; // Exponential growth factor for XP needed per level (2x)
export const BASE_XP_PER_LEVEL = 500; // Starting XP needed for level 1 to 2

export const SPECIAL_SINGLE_TYPE_BIOMES: BiomeType[] = ['castle'];
export const EMPTY_BIOMES: BiomeType[] = ['empty'];

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

// Biome Configuration
export const RESOURCE_ICONS = {
	gold: '💰',
	wood: '🪵',
	stone: '🪨',
	coal: '⛏️',
	food: '🌾',
	meat: '🥩',
	xp: '✨',
};

export const HEADER_DISPLAYED_RESOURCES_INFO = {
	gold: {
		icon: RESOURCE_ICONS.gold,
		label: 'Gold',
		description: 'Used to purchase new tiles',
	},
	wood: {
		icon: RESOURCE_ICONS.wood,
		label: 'Wood',
		description: 'Basic construction material',
	},
	stone: {
		icon: RESOURCE_ICONS.stone,
		label: 'Stone',
		description: 'Durable building material',
	},
	coal: {
		icon: RESOURCE_ICONS.coal,
		label: 'Coal',
		description: 'Advanced fuel source',
	},
	food: {
		icon: RESOURCE_ICONS.food,
		label: 'Food',
		description: 'Sustains population growth',
	},
	meat: {
		icon: RESOURCE_ICONS.meat,
		label: 'Meat',
		description: 'Produced by farm animals',
	},
	xp: {
		icon: RESOURCE_ICONS.xp,
		label: 'XP',
		description: 'Get bigger boi!',
	},
} as const;

export const BIOMES: Record<string, BiomeInfo> = {
	empty: {
		name: 'empty',
		label: 'Empty',
		baseColor: '#1a1a1a',
		unique: true,
		upgradeable: false,
		resourceGeneration: {},
		resourceIcons: [RESOURCE_ICONS.coal],
		description: 'Empty land, waiting to be claimed',
	},
	castle: {
		name: 'castle',
		label: 'Castle',
		baseColor: '#6d28d9',
		unique: true,
		upgradeable: true,
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
		unique: false,
		upgradeable: false,
		resourceGeneration: {
			xp: 0.15,
		},
		resourceIcons: [RESOURCE_ICONS.xp],
		description: 'Allow you to build structures',
	},
	forest: {
		name: 'forest',
		label: 'Forest',
		baseColor: '#166534',
		unique: false,
		upgradeable: false,
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
		unique: false,
		upgradeable: false,
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
		unique: false,
		upgradeable: false,
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
		unique: false,
		upgradeable: false,
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
		unique: false,
		upgradeable: false,
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
		unique: false,
		upgradeable: false,
		resourceGeneration: {
			gold: 0.05,
			food: 0.25,
		},
		resourceIcons: [RESOURCE_ICONS.gold, RESOURCE_ICONS.food],
		description: 'Lakes provide gold and food',
	},
} as const;

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
	meat: 0,
	xp: 0,
};

// Base resource generation (per second) - slightly increased for better early game
export const BASE_GENERATION_RATES = {
	gold: 0.1, // Increased base gold generation
	wood: 0,
	stone: 0,
	coal: 0,
	food: 0,
	meat: 0, // Meat can only be generated through the farm
	xp: 0.5, // Base XP generation rate increased
};

// Castle Configuration - improved to make upgrades more impactful
export const CASTLE_BASE_RATES = {
	gold: 0.1, // Increased from 0.05
	wood: 0.05, // Added some base wood generation
	stone: 0.05, // Added some base stone generation
	coal: 0,
	food: 0.05, // Increased from 0.01
	meat: 0,
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

// Merchant
// Resource pricing constants (gold per unit)
export const MERCHANT_RESOURCE_PRICES = {
	wood: 0.75,
	stone: 0.75,
	coal: 1.25,
	food: 0.5,
	meat: 3.0,
};

// Farm animal configurations
export const ANIMALS: Animal[] = [
	{
		id: 'chicken',
		name: 'Chicken',
		icon: '🐔',
		description: 'A simple farm animal that produces a small amount of meat.',
		baseCost: 10000, // Starting at 10k food as requested
		costScaling: 1.5, // Each level costs 1.5x more
		baseProduction: 0.05, // 0.05 meat per second (3 per minute)
		productionScaling: 1.2, // Each level increases production by 20%
	},
	{
		id: 'deer',
		name: 'Deer',
		icon: '🦌',
		description: 'A wild animal that produces more meat than a chicken.',
		baseCost: 50000,
		costScaling: 1.6,
		baseProduction: 0.2, // 0.2 meat per second (12 per minute)
		productionScaling: 1.25,
	},
	{
		id: 'pig',
		name: 'Pig',
		icon: '🐖',
		description: 'A domestic animal that produces a good amount of meat.',
		baseCost: 200000,
		costScaling: 1.7,
		baseProduction: 0.5, // 0.5 meat per second (30 per minute)
		productionScaling: 1.3,
	},
	{
		id: 'cow',
		name: 'Cow',
		icon: '🐄',
		description: 'A large animal that produces a significant amount of meat.',
		baseCost: 1000000,
		costScaling: 1.8,
		baseProduction: 1.5, // 1.5 meat per second (90 per minute)
		productionScaling: 1.4,
	},
];

// Resource display information
export const MERCHANT_RESOURCE_INFO = {
	wood: {
		icon: RESOURCE_ICONS.wood,
		label: 'Wood',
		description: 'A basic construction material, widely available in forests.',
		priceDescription: 'Common but always in demand.',
	},
	stone: {
		icon: RESOURCE_ICONS.stone,
		label: 'Stone',
		description: 'Durable and versatile building material from quarries.',
		priceDescription: 'Premium quality building material.',
	},
	coal: {
		icon: RESOURCE_ICONS.coal,
		label: 'Coal',
		description: 'Valuable fuel source used for advanced applications.',
		priceDescription: 'Highly sought after for its energy properties.',
	},
	food: {
		icon: RESOURCE_ICONS.food,
		label: 'Food',
		description: 'Sustains population and enables growth.',
		priceDescription: 'Plentiful but essential for survival.',
	},
	meat: {
		icon: RESOURCE_ICONS.meat,
		label: 'Meat',
		description: 'A source of protein for a healthy diet.',
		priceDescription: 'High demand for a nutritious meal.',
	},
};

// Equipment and items configuration
export const EQUIPMENT_RARITY_COLORS = {
	common: 'border-gray-500',
	uncommon: 'border-green-500',
	rare: 'border-blue-500',
	epic: 'border-purple-500',
	legendary: 'border-orange-500',
};

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
