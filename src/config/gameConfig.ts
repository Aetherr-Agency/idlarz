import { BiomeInfo } from '@/types/game';

// Grid Configuration
export const GRID_SIZE = 50; // Width of the grid
export const GRID_HEIGHT = 50; // Height of the grid (half of width)
export const TILE_SIZE = 48; // Balanced for visibility
export const VIEWPORT_SIZE = 25; // 12 tiles in each direction from center

// Game Constants
export const TICK_RATE = 100; // 10 times per second
export const BASE_TILE_COST = 100; // Base cost for first tile purchase
export const COST_SCALING_FACTOR = 1.1; // Each tile increases cost by 10%
export const ADJACENCY_BONUS = 0.15; // 15% bonus for adjacent same biomes

// Resource scaling configuration
export const SCALING_CONFIG = {
  // Base scaling factor that increases by 20% every 20 tiles
  baseScalingFactor: 1.2,
  scalingIncreasePer: 20, // Increase scaling every X tiles
  scalingIncreaseAmount: 0.2, // 10% increase in scaling factor

  costFormula: (ownedTiles: number) => {
    const tier = Math.floor(ownedTiles / SCALING_CONFIG.scalingIncreasePer);
    const currentScalingFactor = SCALING_CONFIG.baseScalingFactor * (1 + (SCALING_CONFIG.scalingIncreaseAmount * tier));
    return Math.floor(100 * Math.pow(currentScalingFactor, ownedTiles));
  },
  adjacencyBonus: 0.15, // 15% bonus for each adjacent same biome
};

export const RESOURCE_ICONS = {
  gold: '💰',
  wood: '🪵',
  stone: '🪨',
  coal: '⛏️',
  food: '🌾'
}

export const BIOME_ICONS = {
  castle: '🏰',
  forest: '🌲',
  plains: '🌾',
  hills: '⛰️',
  swamp: '🌿',
  tundra: '❄️',
  lake: '💧' ,
  empty: '⬛'
}

export const INITIAL_RESOURCES = {
  gold: 125,
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
};

// Base resource generation (per second)
export const BASE_GENERATION_RATES = {
  gold: 0.02,
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
};

// Castle Configuration
export const CASTLE_BASE_RATES = {
  gold: 0.05,
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0.01
};

export const CASTLE_UPGRADE = {
  maxLevel: 5,
  levelMultiplier: 1.5,
  upgradeCosts: [
    { gold: 1000, wood: 100, stone: 100 },
    { gold: 2500, wood: 250, stone: 250 },
    { gold: 5000, wood: 500, stone: 500 },
    { gold: 10000, wood: 1000, stone: 1000 }
  ]
};

// Biome Configuration
export const BIOMES: Record<string, BiomeInfo> = {
  empty: {
    name: 'empty',
    label: 'Empty',
    baseColor: '#1a1a1a',
    cost: 0,
    resourceGeneration: {},
    resourceIcons: [RESOURCE_ICONS.coal],
    description: 'An empty void'
  },
  castle: {
    name: 'castle',
    label: 'Castle',
    baseColor: '#9333ea',
    cost: 0,
    resourceGeneration: {
      gold: 0.03,
      wood: 0,
      stone: 0,
      coal: 0,
      food: 0.01
    },
    resourceIcons: [BIOME_ICONS.castle],
    unique: true,
    upgradeable: true,
    maxLevel: 10,
    description: 'Your central castle, the heart of your empire'
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    baseColor: '#166534',
    cost: 100,
    resourceGeneration: {
      gold: 0,
      wood: 0.02
    },
    resourceIcons: [BIOME_ICONS.forest],
    description: 'A dense forest teeming with valuable wood. Mysterious creatures lurk in the shadows.'
  },
  plains: {
    name: 'plains',
    label: 'Plains',
    baseColor: '#65a30d',
    cost: 100,
    resourceGeneration: {
      gold: 0.01,
      food: 0.02
    },
    resourceIcons: [BIOME_ICONS.plains],
    description: 'Fertile grasslands perfect for farming. The wind whispers tales of distant lands.'
  },
  hills: {
    name: 'hills',
    label: 'Hills',
    baseColor: '#92400e',
    cost: 100,
    resourceGeneration: {
      gold: 0.01,
      stone: 0.04,
      coal: 0.02
    },
    resourceIcons: [BIOME_ICONS.hills],
    description: 'Rolling hills rich with minerals. Ancient tunnels hint at forgotten treasures.'
  },
  swamp: {
    name: 'swamp',
    label: 'Swamp',
    baseColor: '#365314',
    cost: 100,
    resourceGeneration: {
      gold: 0.01,
      food: 0.02,
      wood: 0.03
    },
    resourceIcons: [BIOME_ICONS.swamp],
    description: 'A treacherous swamp with unique resources. The mist conceals both danger and opportunity.'
  },
  tundra: {
    name: 'tundra',
    label: 'Tundra',
    baseColor: '#94a3b8',
    cost: 100,
    resourceGeneration: {
      gold: 0.02,
      food: 0.03,
      coal: 0.06
    },
    resourceIcons: [BIOME_ICONS.tundra],
    description: 'A harsh frozen wasteland. Only the bravest explorers venture here, but the rewards are great.'
  },
  lake: {
    name: 'lake',
    label: 'Lake',
    baseColor: '#0ea5e9',
    cost: 100,
    resourceGeneration: {
      gold: 0.01,
      food: 0.07
    },
    resourceIcons: [BIOME_ICONS.lake],
    description: 'A pristine lake full of fish. The clear waters reflect untold possibilities.'
  }
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
    slot: 'mainHand',
    stats: { gold: 0.05 },
    description: 'A simple training sword',
    rarity: 'common',
  },
  {
    id: 'leather-cap',
    name: 'Leather Cap',
    icon: '🪖',
    slot: 'head',
    stats: { wood: 0.1 },
    description: 'Basic head protection',
    rarity: 'common',
  },
  {
    id: 'steel-breastplate',
    name: 'Steel Breastplate',
    icon: '👕',
    slot: 'chest',
    stats: { gold: 0.1, stone: 0.2 },
    description: 'Solid protection for your torso',
    rarity: 'uncommon',
  },
  {
    id: 'gold-ring',
    name: 'Gold Ring',
    icon: '💍',
    slot: 'ring1',
    stats: { gold: 0.2 },
    description: 'Increases gold generation',
    rarity: 'rare',
  },
  {
    id: 'leather-boots',
    name: 'Leather Boots',
    icon: '👢',
    slot: 'feet',
    stats: { food: 0.1 },
    description: 'Comfortable footwear',
    rarity: 'common',
  },
  {
    id: 'wooden-shield',
    name: 'Wooden Shield',
    icon: '🛡️',
    slot: 'offHand',
    stats: { wood: 0.15 },
    description: 'Simple defensive gear',
    rarity: 'common',
  }
];
