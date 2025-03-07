import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
	BIOMES,
	CASTLE_BASE_RATES,
	CASTLE_UPGRADE,
	GRID_SIZE,
	GRID_HEIGHT,
	INITIAL_RESOURCES,
	BASE_GENERATION_RATES,
	SCALING_CONFIG,
} from '@/config/gameConfig';
import type {
	BiomeType,
	GameState,
	Resources,
	ResourceRates,
	Tile,
} from '@/types/game';
import { countOwnedTiles } from '@/utils/gameUtils';

const GRID_CENTER_X = Math.floor(GRID_SIZE / 2);
const GRID_CENTER_Y = Math.floor(GRID_HEIGHT / 2);

const createInitialGrid = (): Tile[][] => {
	const grid = Array(GRID_HEIGHT)
		.fill(null)
		.map(() =>
			Array(GRID_SIZE)
				.fill(null)
				.map(() => ({
					biome: 'empty' as BiomeType,
					isOwned: false,
				}))
		);

	// Place castle at center
	grid[GRID_CENTER_Y][GRID_CENTER_X] = {
		biome: 'castle',
		isOwned: true,
		level: 1,
		upgradeCost: CASTLE_UPGRADE.upgradeCosts[0],
	} as Tile;

	return grid;
};

// Validate grid state to ensure it matches our expectations
const validateGrid = (grid: unknown): grid is Tile[][] => {
	if (!Array.isArray(grid) || grid.length !== GRID_HEIGHT) return false;

	for (let y = 0; y < GRID_HEIGHT; y++) {
		if (!Array.isArray(grid[y]) || grid[y].length !== GRID_SIZE) return false;
		for (let x = 0; x < GRID_SIZE; x++) {
			const tile = grid[y][x];
			if (!tile || typeof tile !== 'object') return false;
			if (typeof tile.isOwned !== 'boolean') return false;
			if (!Object.keys(BIOMES).includes(tile.biome)) return false;
		}
	}

	// Ensure castle exists at center
	const centerTile = grid[GRID_CENTER_Y][GRID_CENTER_X];
	if (!centerTile.isOwned || centerTile.biome !== 'castle') return false;

	return true;
};

const countAdjacentSameBiomes = (
	tiles: GameState['tiles'],
	x: number,
	y: number,
	biome: BiomeType
): number => {
	const directions = [
		[-1, 0],
		[1, 0],
		[0, -1],
		[0, 1],
	];
	return directions.reduce((count, [dx, dy]) => {
		const newX = x + dx;
		const newY = y + dy;
		if (
			newX >= 0 &&
			newX < GRID_SIZE &&
			newY >= 0 &&
			newY < GRID_HEIGHT &&
			tiles[newY][newX].isOwned &&
			tiles[newY][newX].biome === biome
		) {
			return count + 1;
		}
		return count;
	}, 0);
};

const calculateResourceRates = (tiles: GameState['tiles']): ResourceRates => {
	const base = { ...BASE_GENERATION_RATES };
	const total = { ...base };
	const modifiers: Record<keyof Resources, number> = {
		gold: 1,
		wood: 1,
		stone: 1,
		coal: 1,
		food: 1,
	};

	// Find castle and its level
	let castleLevel = 1;
	for (let y = 0; y < GRID_HEIGHT; y++) {
		for (let x = 0; x < GRID_SIZE; x++) {
			const tile = tiles[y][x];
			if (tile.isOwned && tile.biome === 'castle' && tile.level) {
				castleLevel = tile.level;
				break;
			}
		}
	}

	// Calculate castle multiplier
	const castleMultiplier = Math.pow(1.5, castleLevel - 1);

	// First add castle base rates to base generation
	Object.entries(CASTLE_BASE_RATES).forEach(([resource, rate]) => {
		const key = resource as keyof Resources;
		base[key] += rate;
		total[key] += rate * castleMultiplier;
	});

	// Add flat generation rates from all owned tiles with adjacency bonuses
	for (let y = 0; y < GRID_HEIGHT; y++) {
		for (let x = 0; x < GRID_SIZE; x++) {
			const tile = tiles[y][x];
			if (tile.isOwned) {
				const biome = BIOMES[tile.biome];
				const adjacentCount = countAdjacentSameBiomes(tiles, x, y, tile.biome);
				const adjacencyMultiplier =
					1 + SCALING_CONFIG.adjacencyBonus * adjacentCount;

				Object.entries(biome.resourceGeneration).forEach(([resource, rate]) => {
					// Skip castle base rates since we already added them
					if (
						tile.biome === 'castle' &&
						CASTLE_BASE_RATES[resource as keyof Resources]
					) {
						return;
					}

					if (rate && rate > 0) {
						// Apply castle multiplier to castle tile
						const effectiveRate =
							tile.biome === 'castle' ? rate * castleMultiplier : rate;
						total[resource as keyof Resources] +=
							effectiveRate * adjacencyMultiplier;
					} else {
						total[resource as keyof Resources] += rate || 0;
					}
				});
			}
		}
	}

	// Calculate modifiers based on total vs base rates
	Object.keys(modifiers).forEach((resource) => {
		const key = resource as keyof Resources;
		modifiers[key] = base[key] === 0 ? 1 : total[key] / base[key];
	});

	return { base, modifiers, total };
};

const canAffordCost = (
	resources: Resources,
	cost: number | Resources
): boolean => {
	if (typeof cost === 'number') {
		return resources.gold >= cost;
	}
	return Object.entries(cost).every(
		([resource, amount]) => resources[resource as keyof Resources] >= amount
	);
};

const getRandomBiome = (): BiomeType => {
	const availableBiomes = Object.entries(BIOMES)
		.filter(([name]) => !['empty', 'castle', 'grounds'].includes(name))
		.map(([name]) => name as BiomeType);

	const randomIndex = Math.floor(Math.random() * availableBiomes.length);
	return availableBiomes[randomIndex];
};

// XP calculation constants
const BASE_XP_PER_TILE = 100;
const XP_PER_LEVEL = 1000; // Linear XP scaling

const calculateLevel = (xp: number): { level: number; progress: number } => {
	const level = Math.floor(xp / XP_PER_LEVEL) + 1;
	const progress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
	return { level, progress };
};

const calculateXpGain = (ownedTiles: number): number => {
	return BASE_XP_PER_TILE * ownedTiles;
};

const createGameSlice = (
	set: (
		partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)
	) => void,
	get: () => GameState
) => {
	const initialGrid = createInitialGrid();
	const initialRates = calculateResourceRates(initialGrid);

	const buyTile = (x: number, y: number) => {
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
			[x, y + 1],
		].some(
			([adjX, adjY]) =>
				adjX >= 0 &&
				adjX < GRID_SIZE &&
				adjY >= 0 &&
				adjY < GRID_HEIGHT &&
				state.tiles[adjY]?.[adjX]?.isOwned
		);

		if (!isAdjacent) {
			return false;
		}

		const newTiles = state.tiles.map((row) => [...row]);
		const randomBiome = getRandomBiome();
		newTiles[y][x] = {
			...newTiles[y][x],
			biome: randomBiome,
			isOwned: true,
		};

		// Recalculate resource rates with the new tile
		const newRates = calculateResourceRates(newTiles);

		const xpGain = calculateXpGain(ownedTilesCount + 1);

		set({
			tiles: newTiles,
			resources: {
				...state.resources,
				gold: state.resources.gold - cost,
			},
			resourceRates: newRates,
			resourceModifiers: newRates.modifiers,
			xp: state.xp + xpGain,
			level: calculateLevel(state.xp + xpGain),
		});

		return true;
	};

	const upgradeCastle = () => {
		const state = get();

		// Find castle
		let castle: Tile | null = null;
		let castleX = -1,
			castleY = -1;

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
		if (castle.level >= CASTLE_UPGRADE.maxLevel) return false;
		if (!canAffordCost(state.resources, castle.upgradeCost)) return false;

		const newTiles = state.tiles.map((row) => [...row]);
		newTiles[castleY][castleX] = {
			...castle,
			level: castle.level + 1,
			upgradeCost: CASTLE_UPGRADE.upgradeCosts[castle.level] || null,
		} as Tile;

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
			resourceModifiers: newRates.modifiers,
		});

		return true;
	};

	const tick = (deltaTime: number) => {
		const state = get();
		if (!state?.resourceRates?.total) return;

		const secondsElapsed = deltaTime / 1000;
		const newResources = { ...state.resources };

		Object.entries(state.resourceRates.total).forEach(([resource, rate]) => {
			if (typeof rate === 'number' && !isNaN(rate)) {
				newResources[resource as keyof Resources] += rate * secondsElapsed;
			}
		});

		set({ resources: newResources });
	};

	return {
		tiles: initialGrid,
		resources: { ...INITIAL_RESOURCES },
		resourceRates: initialRates,
		resourceModifiers: initialRates.modifiers,
		xp: 0,
		level: calculateLevel(0),
		buyTile,
		upgradeCastle,
		tick,
	};
};

export const useGameStore = create(
	persist<GameState>((set, get) => createGameSlice(set, get), {
		name: 'idle-explorer-storage-v002',
		version: 2,
		storage: createJSONStorage(() => localStorage),
		onRehydrateStorage: () => (state) => {
			// Validate and fix state if needed
			if (!state || !validateGrid(state.tiles)) {
				const initialGrid = createInitialGrid();
				const initialRates = calculateResourceRates(initialGrid);

				return {
					tiles: initialGrid,
					resources: { ...INITIAL_RESOURCES },
					resourceRates: initialRates,
					resourceModifiers: initialRates.modifiers,
					xp: 0,
					level: calculateLevel(0),
					buyTile: state?.buyTile,
					upgradeCastle: state?.upgradeCastle,
					tick: state?.tick,
				};
			}
			return state;
		},
	})
);
