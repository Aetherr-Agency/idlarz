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
  costFormula: (ownedTiles: number) => Math.floor(100 * Math.pow(1.1, ownedTiles)),
  adjacencyBonus: 0.15, // 15% bonus for each adjacent same biome
};

export const INITIAL_RESOURCES = {
  gold: 150,  // Increased to allow first tile purchase
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
};

// Base resource generation (per second)
export const BASE_GENERATION_RATES = {
  gold: 0.02,  // Very low base rate
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
};

// Castle Configuration
export const CASTLE_BASE_RATES = {
  gold: 0.1,   // Moderate castle bonus
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
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
    resourceIcons: ['⬛'],
    description: 'An empty void'
  },
  castle: {
    name: 'castle',
    label: 'Castle',
    baseColor: '#9333ea',
    cost: 0,
    resourceGeneration: {
      gold: 1,
      wood: 1,
      stone: 1,
      coal: 1,
      food: 1
    },
    resourceIcons: ['🏰'],
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
      gold: 0.15,
      wood: 2
    },
    resourceIcons: ['🌲'],
    description: 'A dense forest teeming with valuable wood. Mysterious creatures lurk in the shadows.'
  },
  plains: {
    name: 'plains',
    label: 'Plains',
    baseColor: '#65a30d',
    cost: 100,
    resourceGeneration: {
      gold: 0.1,
      food: 2
    },
    resourceIcons: ['🌾'],
    description: 'Fertile grasslands perfect for farming. The wind whispers tales of distant lands.'
  },
  hills: {
    name: 'hills',
    label: 'Hills',
    baseColor: '#92400e',
    cost: 100,
    resourceGeneration: {
      gold: 0.05,
      stone: 1.5,
      coal: 1
    },
    resourceIcons: ['⛰️'],
    description: 'Rolling hills rich with minerals. Ancient tunnels hint at forgotten treasures.'
  },
  swamp: {
    name: 'swamp',
    label: 'Swamp',
    baseColor: '#365314',
    cost: 100,
    resourceGeneration: {
      gold: -0.1,
      food: 1,
      wood: 0.5
    },
    resourceIcons: ['🌿'],
    description: 'A treacherous swamp with unique resources. The mist conceals both danger and opportunity.'
  },
  tundra: {
    name: 'tundra',
    label: 'Tundra',
    baseColor: '#94a3b8',
    cost: 100,
    resourceGeneration: {
      gold: 0.2,
      food: -0.5,
      coal: 2
    },
    resourceIcons: ['❄️'],
    description: 'A harsh frozen wasteland. Only the bravest explorers venture here, but the rewards are great.'
  },
  lake: {
    name: 'lake',
    label: 'Lake',
    baseColor: '#0ea5e9',
    cost: 100,
    resourceGeneration: {
      gold: 0.25,
      food: 1.5
    },
    resourceIcons: ['💧'],
    description: 'A pristine lake full of fish. The clear waters reflect untold possibilities.'
  }
} as const;
