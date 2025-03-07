import { BiomeInfo } from '@/types/game';

// Grid Configuration
export const GRID_SIZE = 48; // Width of the grid
export const GRID_HEIGHT = 26; // Height of the grid (half of width)
export const TILE_SIZE = 48; // Balanced for visibility
export const VIEWPORT_SIZE = 25; // 12 tiles in each direction from center

// Game Constants
export const TICK_RATE = 100; // 10 times per second
export const TILE_PURCHASE_COST = 100; // Increased to make early expansion more meaningful
export const INITIAL_RESOURCES = {
  gold: 500, // Starting currency - reduced to make early game more challenging
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
};

// Base resource generation (per second)
export const BASE_GENERATION_RATES = {
  gold: 0.03,  // Reduced for slower early game
  wood: 0.02,
  stone: 0.015,
  coal: 0.01,
  food: 0.02
};

// Castle Configuration
export const CASTLE_BASE_RATES = {
  gold: 0.08,   // Reduced but still meaningful
  wood: 0.04,
  stone: 0.04,
  coal: 0.03,
  food: 0.05
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
    baseColor: '#1f2937',
    cost: 0,
    resourceModifiers: {
      gold: 1.0,
      wood: 1.0,
      stone: 1.0,
      coal: 1.0,
      food: 1.0
    },
    resourceIcons: ['❔'],
    unique: false
  },
  castle: {
    name: 'castle',
    label: 'Castle',
    baseColor: '#7209b7',
    cost: 0,
    resourceModifiers: {
      gold: 1.5,
      wood: 1.1,
      stone: 1.1,
      coal: 1.1,
      food: 1.1
    },
    resourceIcons: ['🏰'],
    unique: true,
    upgradeable: true,
    maxLevel: CASTLE_UPGRADE.maxLevel
  },
  grounds: {
    name: 'grounds',
    label: 'Grounds',
    baseColor: '#78350f', // Brown
    cost: 0,
    resourceModifiers: {
      gold: 1.0,
      wood: 1.0,
      stone: 1.0,
      coal: 1.0,
      food: 1.0
    },
    resourceIcons: ['🏗️'],
    unique: false,
    description: 'Buildable grounds for future structures'
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    baseColor: '#386641',
    cost: 0,
    resourceModifiers: {
      gold: 1.15,
      wood: 1.5,    // Significant wood bonus
      stone: 1.0,
      coal: 1.0,
      food: 1.1     // Small food bonus from berries
    },
    resourceIcons: ['🌲'],
    unique: false,
    description: 'Rich in wood, with some food from wild berries'
  },
  plains: {
    name: 'plains',
    label: 'Plains',
    baseColor: '#90a955',
    cost: 0,
    resourceModifiers: {
      gold: 1.1,
      wood: 1.0,
      stone: 1.0,
      coal: 1.0,
      food: 1.2     // Strong food production
    },
    resourceIcons: ['🌾'],
    unique: false,
    description: 'Excellent for food production'
  },
  hills: {
    name: 'hills',
    label: 'Hills',
    baseColor: '#6d6875',
    cost: 0,
    resourceModifiers: {
      gold: 1.05,
      wood: 1.0,
      stone: 1.4,   // Strong stone bonus
      coal: 1.3,    // Good coal bonus
      food: 1     // Slight food penalty
    },
    resourceIcons: ['⛰️'],
    unique: false,
    description: 'Rich in stone and coal, but poor for farming'
  },
  swamp: {
    name: 'swamp',
    label: 'Swamp',
    baseColor: '#4a4e69',
    cost: 0,
    resourceModifiers: {
      gold: 1,    // Gold penalty
      wood: 1.2,    // Good wood bonus
      stone: 1.0,
      coal: 1.0,
      food: 1.1     // Small food bonus
    },
    resourceIcons: ['🌿'],
    unique: false,
    description: 'Good for wood, but poor for gold mining'
  },
  tundra: {
    name: 'tundra',
    label: 'Tundra',
    baseColor: '#a4c3d2',
    cost: 0,
    resourceModifiers: {
      gold: 1.2,    // Strong gold bonus
      wood: 1,    // Wood penalty
      stone: 1.1,   // Small stone bonus
      coal: 1.1,    // Small coal bonus
      food: 1     // Significant food penalty
    },
    resourceIcons: ['❄️'],
    unique: false,
    description: 'Rich in gold and minerals, but harsh for farming'
  },
  lake: {
    name: 'lake',
    label: 'Lake',
    baseColor: '#184e77',
    cost: 0,
    resourceModifiers: {
      gold: 1.25,   // Best gold bonus
      wood: 1,    // Small wood penalty
      stone: 1,   // Small stone penalty
      coal: 1,    // Coal penalty
      food: 1.3     // Strong food bonus
    },
    resourceIcons: ['💧'],
    unique: false,
    description: 'Excellent for gold and food, poor for mining'
  }
} as const;
