import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BIOMES, CASTLE_BASE_RATES, CASTLE_UPGRADE, GRID_SIZE, GRID_HEIGHT, INITIAL_RESOURCES, BASE_GENERATION_RATES, SCALING_CONFIG } from '@/config/gameConfig';
import type { BiomeType, GameState, Resources, ResourceRates, Tile } from '@/types/game';

const GRID_CENTER_X = Math.floor(GRID_SIZE / 2);
const GRID_CENTER_Y = Math.floor(GRID_HEIGHT / 2);

const createInitialGrid = (): Tile[][] => {
  const grid = Array(GRID_HEIGHT).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({
      biome: 'empty' as BiomeType,
      isOwned: false
    }))
  );

  // Place castle at center
  grid[GRID_CENTER_Y][GRID_CENTER_X] = {
    biome: 'castle',
    isOwned: true,
    level: 1,
    upgradeCost: CASTLE_UPGRADE.upgradeCosts[0]
  };

  return grid;
};

const countOwnedTiles = (tiles: GameState['tiles']): number => {
  let count = 0;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (tiles[y][x].isOwned) count++;
    }
  }
  return count;
};

const countAdjacentSameBiomes = (tiles: GameState['tiles'], x: number, y: number, biome: BiomeType): number => {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  return directions.reduce((count, [dx, dy]) => {
    const newX = x + dx;
    const newY = y + dy;
    if (newX >= 0 && newX < GRID_SIZE && 
        newY >= 0 && newY < GRID_HEIGHT && 
        tiles[newY][newX].isOwned &&
        tiles[newY][newX].biome === biome) {
      return count + 1;
    }
    return count;
  }, 0);
};

const calculateResourceRates = (tiles: GameState['tiles']): ResourceRates => {
  const base = { ...BASE_GENERATION_RATES };
  const total = { ...base };
  const modifiers = { gold: 1.0, wood: 1.0, stone: 1.0, coal: 1.0, food: 1.0 };

  // Find castle and apply its base rates and level multiplier
  for (let y = 0; y < GRID_HEIGHT; y++) {
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

  // Add flat generation rates from all owned tiles with adjacency bonuses
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = tiles[y][x];
      if (tile.isOwned) {
        const biome = BIOMES[tile.biome];
        const adjacentCount = countAdjacentSameBiomes(tiles, x, y, tile.biome);
        const adjacencyMultiplier = SCALING_CONFIG.adjacencyMultiplier(adjacentCount);
        
        Object.entries(biome.resourceGeneration).forEach(([resource, rate]) => {
          if (rate && rate > 0) {
            total[resource as keyof Resources] += rate * adjacencyMultiplier;
          } else {
            total[resource as keyof Resources] += rate || 0;
          }
        });
      }
    }
  }

  return { base, modifiers, total };
};

const isAdjacentToOwned = (tiles: GameState['tiles'], x: number, y: number): boolean => {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  return directions.some(([dx, dy]) => {
    const newX = x + dx;
    const newY = y + dy;
    return newX >= 0 && newX < GRID_SIZE && 
           newY >= 0 && newY < GRID_HEIGHT && 
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

const getRandomBiome = (): BiomeType => {
  const availableBiomes = Object.entries(BIOMES)
    .filter(([name]) => !['empty', 'castle', 'grounds'].includes(name))
    .map(([name]) => name as BiomeType);
  
  const randomIndex = Math.floor(Math.random() * availableBiomes.length);
  return availableBiomes[randomIndex];
};

export const useGameStore = create(
  persist<GameState>((set, get) => {
    const initialGrid = createInitialGrid();
    const initialRates = calculateResourceRates(initialGrid);
    
    return {
      tiles: initialGrid,
      resources: { ...INITIAL_RESOURCES },
      resourceRates: initialRates,
      resourceModifiers: initialRates.modifiers,

      buyTile: (x: number, y: number) => {
        const state = get();
        const ownedTilesCount = countOwnedTiles(state.tiles);
        const cost = SCALING_CONFIG.costFormula(ownedTilesCount);

        if (state.resources.gold < cost) {
          return false;
        }

        const isAdjacent = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1]
        ].some(([adjX, adjY]) => 
          adjX >= 0 && adjX < GRID_SIZE && 
          adjY >= 0 && adjY < GRID_HEIGHT && 
          state.tiles[adjY]?.[adjX]?.isOwned
        );

        if (!isAdjacent) {
          return false;
        }

        const newTiles = [...state.tiles];
        const randomBiome = getRandomBiome();
        newTiles[y][x] = {
          ...newTiles[y][x],
          biome: randomBiome,
          isOwned: true
        };

        // Recalculate resource rates with the new tile
        const newRates = calculateResourceRates(newTiles);

        set({
          tiles: newTiles,
          resources: {
            ...state.resources,
            gold: state.resources.gold - cost
          },
          resourceRates: newRates,
          resourceModifiers: newRates.modifiers
        });

        return true;
      },

      upgradeCastle: (): boolean => {
        const state = get();
        
        // Find castle
        let castle: Tile | null = null;
        let castleX = -1, castleY = -1;
        
        for (let y = 0; y < GRID_HEIGHT; y++) {
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

        const newRates = calculateResourceRates(newTiles);

        set({
          tiles: newTiles,
          resources: newResources,
          resourceRates: newRates,
          resourceModifiers: newRates.modifiers
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
    };
  }), {
    name: 'idle-game-storage-v101',
    version: 2
  }
);
