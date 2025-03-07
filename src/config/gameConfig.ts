import { BiomeInfo } from '@/types/game';

// Grid Configuration
export const GRID_SIZE = 48; // Width of the grid
export const GRID_HEIGHT = 26; // Height of the grid (half of width)
export const TILE_SIZE = 48; // Balanced for visibility
export const VIEWPORT_SIZE = 25; // 12 tiles in each direction from center

// Game Constants
export const TICK_RATE = 100; // 10 times per second
export const TILE_PURCHASE_COST = 100; // Cost to reveal a new tile
export const INITIAL_RESOURCES = {
  gold: 500, // Starting currency
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
};

// Resource Generation (per second)
export const BASE_GENERATION_RATES = {
  gold: 0,
  wood: 0,
  stone: 0,
  coal: 0,
  food: 0
};

// Castle Configuration
export const CASTLE_BASE_RATES = {
  gold: 1,   // Base: 0.5/s
  wood: 0.25,  // Base: 0.25/s
  stone: 0.25, // Base: 0.25/s
  coal: 0.25,  // Base: 0.25/s
  food: 0.25   // Base: 0.25/s
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
    baseColor: '#4c1d95', // Royal purple
    cost: 0,
    resourceModifiers: {
      gold: 2,
      wood: 1.5,
      stone: 1.5,
      coal: 1.5,
      food: 1.5
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
    baseColor: '#064e3b', // Dark green
    cost: 0,
    resourceModifiers: {
      gold: 1.15,
      wood: 2.0,
      stone: 1.0,
      coal: 1.0,
      food: 1.2
    },
    resourceIcons: ['🌲'],
    unique: false,
    description: 'Rich in wood and minor food bonus'
  },
  plains: {
    name: 'plains',
    label: 'Plains',
    baseColor: '#3f6212', // Light green
    cost: 0,
    resourceModifiers: {
      gold: 1.1,
      wood: 1.0,
      stone: 1.0,
      coal: 1.0,
      food: 1.5
    },
    resourceIcons: ['🌾'],
    unique: false,
    description: 'Good food production'
  },
  hills: {
    name: 'hills',
    label: 'Hills',
    baseColor: '#854d0e', // Brown
    cost: 0,
    resourceModifiers: {
      gold: 1.05,
      wood: 1.0,
      stone: 1.5,
      coal: 1.5,
      food: 1.0
    },
    resourceIcons: ['⛰️'],
    unique: false,
    description: 'Rich in stone and coal'
  },
  swamp: {
    name: 'swamp',
    label: 'Swamp',
    baseColor: '#365314', // Dark green-brown
    cost: 0,
    resourceModifiers: {
      gold: 1.3,
      wood: 1.2,
      stone: 1.0,
      coal: 1.0,
      food: 1.3
    },
    resourceIcons: ['🌿'],
    unique: false,
    description: 'Balanced wood and food, but reduces gold'
  },
  tundra: {
    name: 'tundra',
    label: 'Tundra',
    baseColor: '#e5e7eb', // Light gray
    cost: 0,
    resourceModifiers: {
      gold: 1.2,
      wood: 1,
      stone: 1.2,
      coal: 1.2,
      food: 1
    },
    resourceIcons: ['❄️'],
    unique: false,
    description: 'High gold but low food and wood'
  },
  lake: {
    name: 'lake',
    label: 'Lake',
    baseColor: '#0369a1', // Blue
    cost: 0,
    resourceModifiers: {
      gold: 1.25,
      wood: 1.0,
      stone: 1.0,
      coal: 1.0,
      food: 1.4
    },
    resourceIcons: ['💧'],
    unique: false,
    description: 'Excellent gold and food production'
  }
} as const;
