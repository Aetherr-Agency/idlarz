import { BiomeInfo } from '@/types/game';

// Grid Configuration
export const GRID_SIZE = 48; // 48x48 tile matrix
export const VIEWPORT_SIZE = 25; // 12 tiles in each direction from center
export const TILE_SIZE = 48; // Balanced for visibility

// Game Constants
export const TICK_RATE = 100; // 10 times per second
export const INITIAL_RESOURCES = {
  gold: 100, // Starting currency
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
};

// Resource Generation (per second)
export const BASE_GENERATION_RATES = {
  gold: 0.2,  // Base: 0.2/s
  wood: 0.1,  // Base: 0.1/s
  stone: 0.1, // Base: 0.1/s
  coal: 0.05, // Base: 0.05/s
  food: 0.1   // Base: 0.1/s
};

// Castle Configuration
export const CASTLE_BASE_RATES = {
  gold: 1.0,   // Base: 1.0/s
  wood: 0.25,  // Base: 0.25/s
  stone: 0.25, // Base: 0.25/s
  coal: 0.25,  // Base: 0.25/s
  food: 0.25   // Base: 0.25/s
};

export const CASTLE_UPGRADE = {
  maxLevel: 5,
  levelMultiplier: 1.5, // Each level increases base rates by 50%
  upgradeCosts: [
    {
      gold: 1000,
      wood: 100,
      stone: 100,
      coal: 50,
      food: 100
    },
    {
      gold: 2500,
      wood: 250,
      stone: 250,
      coal: 125,
      food: 250
    },
    {
      gold: 5000,
      wood: 500,
      stone: 500,
      coal: 250,
      food: 500
    },
    {
      gold: 10000,
      wood: 1000,
      stone: 1000,
      coal: 500,
      food: 1000
    }
  ]
};

// Biome Configuration
export const BIOMES: Record<string, BiomeInfo> = {
  empty: {
    name: 'empty',
    label: 'Empty',
    baseColor: '#1a1b26',
    cost: 0,
    resourceModifiers: {},
    resourceIcons: []
  },
  castle: {
    name: 'castle',
    label: 'Castle',
    baseColor: '#4c1d95', // Royal purple
    cost: 0,
    resourceModifiers: {
      gold: 2.0,    // +100% gold
      wood: 1.5,    // +50% wood
      stone: 1.5,   // +50% stone
      coal: 1.5,    // +50% coal
      food: 1.5     // +50% food
    },
    resourceIcons: ['🏰'],
    unique: true,
    upgradeable: true,
    maxLevel: CASTLE_UPGRADE.maxLevel
  },
  plains: {
    name: 'plains',
    label: 'Plains',
    baseColor: '#90a955',
    cost: 100,
    resourceModifiers: {
      gold: 1.1,   // +10% gold
      food: 1.2    // +20% food
    },
    resourceIcons: ['🌾']
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    baseColor: '#2d6a4f',
    cost: 150,
    resourceModifiers: {
      gold: 1.15,  // +15% gold
      wood: 1.5    // +50% wood
    },
    resourceIcons: ['🌲']
  },
  hills: {
    name: 'hills',
    label: 'Hills',
    baseColor: '#9c6644',
    cost: 200,
    resourceModifiers: {
      gold: 1.05,  // +5% gold
      stone: 1.4,  // +40% stone
      coal: 1.3    // +30% coal
    },
    resourceIcons: ['⛰️']
  },
  tundra: {
    name: 'tundra',
    label: 'Tundra',
    baseColor: '#cad2c5',
    cost: 300,
    resourceModifiers: {
      gold: 1.2,   // +20% gold
      wood: 0.8,   // -20% wood
      food: 0.7    // -30% food
    },
    resourceIcons: ['❄️']
  },
  lake: {
    name: 'lake',
    label: 'Lake',
    baseColor: '#219ebc',
    cost: 250,
    resourceModifiers: {
      gold: 1.25,  // +25% gold
      food: 1.3    // +30% food
    },
    resourceIcons: ['💧']
  },
  swamp: {
    name: 'swamp',
    label: 'Swamp',
    baseColor: '#4a4e69',
    cost: 350,
    resourceModifiers: {
      gold: 0.9,   // -10% gold
      wood: 1.2,   // +20% wood
      food: 1.1    // +10% food
    },
    resourceIcons: ['🌿']
  }
} as const;
