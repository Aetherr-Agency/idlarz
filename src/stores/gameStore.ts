import { create } from 'zustand';
import { GRID_SIZE, BIOMES, BASE_GENERATION_RATES, INITIAL_RESOURCES } from '@/config/gameConfig';
import { GameState, BiomeType, Resources, ResourceRates } from '@/types/game';

const createInitialGrid = () => {
  const grid = Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({
      biome: 'empty' as BiomeType,
      isOwned: false
    }))
  );

  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);
  grid[centerY][centerX] = {
    biome: 'plains',
    isOwned: true
  };

  return grid;
};

const calculateResourceRates = (tiles: GameState['tiles']): ResourceRates => {
  // Initialize with base rates
  const base = { ...BASE_GENERATION_RATES };
  
  // Initialize total rates with base values
  const total = { ...base };

  // Initialize modifiers at 1.0 (no modification)
  const modifiers: Resources = {
    gold: 1,
    wood: 1,
    stone: 1,
    coal: 1,
    food: 1
  };

  // Count owned tiles and accumulate modifiers
  tiles.forEach(row => {
    row.forEach(tile => {
      if (tile.isOwned && tile.biome !== 'empty') {
        const biomeModifiers = BIOMES[tile.biome].resourceModifiers;
        Object.entries(biomeModifiers).forEach(([resource, modifier]) => {
          modifiers[resource as keyof Resources] *= modifier;
        });
      }
    });
  });

  // Calculate final rates with modifiers
  Object.keys(total).forEach(resource => {
    const key = resource as keyof Resources;
    total[key] = base[key] * modifiers[key];
  });

  return { base, modifiers, total };
};

export const useGameStore = create<GameState>((set, get) => ({
  tiles: createInitialGrid(),
  resources: { ...INITIAL_RESOURCES },
  resourceRates: calculateResourceRates(createInitialGrid()),

  buyTile: (biome: BiomeType, x: number, y: number) => {
    const state = get();
    const tileCost = BIOMES[biome].cost;

    if (state.resources.gold < tileCost) {
      return false;
    }

    const isAdjacent = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1]
    ].some(([adjX, adjY]) => 
      adjX >= 0 && adjX < GRID_SIZE && 
      adjY >= 0 && adjY < GRID_SIZE && 
      state.tiles[adjY][adjX].isOwned
    );

    if (!isAdjacent || state.tiles[y][x].isOwned) {
      return false;
    }

    const newTiles = state.tiles.map(row => [...row]);
    newTiles[y][x] = {
      biome,
      isOwned: true
    };

    const newResourceRates = calculateResourceRates(newTiles);

    set({
      tiles: newTiles,
      resources: {
        ...state.resources,
        gold: Math.max(0, state.resources.gold - tileCost)
      },
      resourceRates: newResourceRates
    });

    return true;
  },

  tick: (deltaTime: number) => {
    set(state => {
      const multiplier = deltaTime / 1000; // Convert ms to seconds
      const newResources = { ...state.resources };

      Object.entries(state.resourceRates.total).forEach(([resource, rate]) => {
        const key = resource as keyof Resources;
        const currentValue = newResources[key] || 0;
        const increment = rate * multiplier;
        newResources[key] = Math.max(0, currentValue + increment);
      });

      return { resources: newResources };
    });
  }
}));
