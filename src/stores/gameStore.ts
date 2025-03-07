import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BIOMES, CASTLE_BASE_RATES, CASTLE_UPGRADE, GRID_SIZE, INITIAL_RESOURCES, BASE_GENERATION_RATES } from '@/config/gameConfig';
import type { BiomeType, GameState, Resources, ResourceRates, Tile } from '@/types/game';

const GRID_CENTER = Math.floor(GRID_SIZE / 2);

const createInitialGrid = (): Tile[][] => {
  const grid = Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({
      biome: 'empty' as BiomeType,
      isOwned: false
    }))
  );

  // Place castle at center
  grid[GRID_CENTER][GRID_CENTER] = {
    biome: 'castle',
    isOwned: true,
    level: 1,
    upgradeCost: CASTLE_UPGRADE.upgradeCosts[0]
  };

  return grid;
};

const calculateResourceRates = (tiles: GameState['tiles']): ResourceRates => {
  const base = { ...BASE_GENERATION_RATES };
  const total = { ...base };
  const modifiers = { gold: 1, wood: 1, stone: 1, coal: 1, food: 1 };

  // Find castle and apply its base rates and level multiplier
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = tiles[y][x];
      if (tile.isOwned && tile.biome === 'castle') {
        const level = tile.level || 1;
        const multiplier = Math.pow(CASTLE_UPGRADE.levelMultiplier, level - 1);
        
        // Apply castle base rates with level multiplier
        Object.entries(CASTLE_BASE_RATES).forEach(([resource, rate]) => {
          base[resource as keyof Resources] += rate * multiplier;
        });
        break;
      }
    }
  }

  // Calculate modifiers from all owned tiles
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = tiles[y][x];
      if (tile.isOwned) {
        const biome = BIOMES[tile.biome];
        Object.entries(biome.resourceModifiers).forEach(([resource, modifier]) => {
          modifiers[resource as keyof Resources] *= modifier;
        });
      }
    }
  }

  // Apply modifiers to get total rates
  Object.keys(total).forEach(resource => {
    total[resource as keyof Resources] = base[resource as keyof Resources] * modifiers[resource as keyof Resources];
  });

  return { base, modifiers, total };
};

const isAdjacentToOwned = (tiles: GameState['tiles'], x: number, y: number): boolean => {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  return directions.some(([dx, dy]) => {
    const newX = x + dx;
    const newY = y + dy;
    return newX >= 0 && newX < GRID_SIZE && 
           newY >= 0 && newY < GRID_SIZE && 
           tiles[newY][newX].isOwned;
  });
};

const canAffordCost = (resources: Resources, cost: number | Resources): boolean => {
  if (typeof cost === 'number') {
    return resources.gold >= cost;
  }
  return Object.entries(cost).every(([resource, amount]) => 
    resources[resource as keyof Resources] >= amount
  );
};

export const useGameStore = create(
  persist<GameState>((set, get) => ({
    tiles: createInitialGrid(),
    resources: { ...INITIAL_RESOURCES },
    resourceRates: calculateResourceRates(createInitialGrid()),

    buyTile: (biome: BiomeType, x: number, y: number): boolean => {
      const state = get();
      const tile = state.tiles[y][x];
      const biomeInfo = BIOMES[biome];

      // Check if tile can be purchased
      if (tile.isOwned || 
          !isAdjacentToOwned(state.tiles, x, y) || 
          (biomeInfo.unique && state.tiles.some(row => 
            row.some(t => t.biome === biome && t.isOwned)
          ))) {
        return false;
      }

      // Check if can afford
      if (!canAffordCost(state.resources, biomeInfo.cost)) {
        return false;
      }

      // Update tile and resources
      const newTiles = [...state.tiles];
      newTiles[y] = [...newTiles[y]];
      newTiles[y][x] = {
        biome,
        isOwned: true
      };

      set({
        tiles: newTiles,
        resources: {
          ...state.resources,
          gold: state.resources.gold - biomeInfo.cost
        },
        resourceRates: calculateResourceRates(newTiles)
      });

      return true;
    },

    upgradeCastle: (): boolean => {
      const state = get();
      
      // Find castle
      let castle: Tile | null = null;
      let castleX = -1, castleY = -1;
      
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (state.tiles[y][x].biome === 'castle') {
            castle = state.tiles[y][x];
            castleX = x;
            castleY = y;
            break;
          }
        }
        if (castle) break;
      }

      if (!castle || !castle.upgradeCost || !castle.level) return false;

      // Check if max level reached
      if (castle.level >= CASTLE_UPGRADE.maxLevel) return false;

      // Check if can afford upgrade
      if (!canAffordCost(state.resources, castle.upgradeCost)) return false;

      // Update castle and resources
      const newTiles = [...state.tiles];
      newTiles[castleY] = [...newTiles[castleY]];
      newTiles[castleY][castleX] = {
        ...castle,
        level: castle.level + 1,
        upgradeCost: CASTLE_UPGRADE.upgradeCosts[castle.level] || null
      };

      // Deduct resources
      const newResources = { ...state.resources };
      Object.entries(castle.upgradeCost).forEach(([resource, amount]) => {
        newResources[resource as keyof Resources] -= amount;
      });

      set({
        tiles: newTiles,
        resources: newResources,
        resourceRates: calculateResourceRates(newTiles)
      });

      return true;
    },

    tick: (deltaTime: number): void => {
      const state = get();
      const secondsElapsed = deltaTime / 1000;

      // Update resources based on rates
      const newResources = { ...state.resources };
      Object.entries(state.resourceRates.total).forEach(([resource, rate]) => {
        newResources[resource as keyof Resources] += rate * secondsElapsed;
      });

      set({ resources: newResources });
    }
  }), {
    name: 'idle-game-storage',
    version: 1
  })
);
