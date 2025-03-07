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
	INITIAL_INVENTORY_ITEMS,
} from '@/config/gameConfig';
import type {
	BiomeType,
	GameState,
	Resources,
	ResourceRates,
	Tile,
	CharacterStats,
} from '@/types/game';
import { countOwnedTiles } from '@/utils/gameUtils';

const GRID_CENTER_X = Math.floor(GRID_SIZE / 2);
const GRID_CENTER_Y = Math.floor(GRID_HEIGHT / 2);

// Character stats initial values
const INITIAL_CHARACTER_STATS: CharacterStats = {
	strength: 5,
	dexterity: 5,
	intelligence: 5,
	vitality: 5,
	charisma: 5,
	availablePoints: 0,
};

// Default player name
const DEFAULT_PLAYER_NAME = 'Explorer';

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
	const modifiers: Record<keyof Resources, number> = {
		gold: 0,
		wood: 0,
		stone: 0,
		coal: 0,
		food: 0,
		xp: 0,
	};
	const total = { ...base };

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

	// Add castle base rates to base generation
	Object.entries(CASTLE_BASE_RATES).forEach(([resource, rate]) => {
		const key = resource as keyof Resources;
		base[key] += rate;
	});

	// Calculate castle modifier (exponential growth - doubles each level after level 1)
	let castleModifier = 0;
	if (castleLevel > 0) {
		if (CASTLE_UPGRADE.doublePerLevel) {
			// Base is 20% at level 1, doubles with each level
			// Level 1 = 0.2, Level 2 = 0.4, Level 3 = 0.8, Level 4 = 1.6, etc.
			castleModifier =
				CASTLE_UPGRADE.baseResourceMultiplier * Math.pow(2, castleLevel - 1);
		} else {
			// Fallback to linear growth (20% per level)
			castleModifier = castleLevel * CASTLE_UPGRADE.baseResourceMultiplier;
		}
	}

	// Add the castle modifier to all resources
	Object.keys(modifiers).forEach((resource) => {
		const key = resource as keyof Resources;
		modifiers[key] += castleModifier;
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

					if (rate) {
						// Add to base rate with adjacency bonus
						base[resource as keyof Resources] += rate * adjacencyMultiplier;
					}
				});
			}
		}
	}

	// Apply all modifiers to calculate total rates
	Object.keys(total).forEach((resource) => {
		const key = resource as keyof Resources;
		total[key] = base[key] * (1 + modifiers[key]);
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
		.filter(([name]) => !['empty', 'castle'].includes(name))
		.map(([name]) => name as BiomeType);

	const randomIndex = Math.floor(Math.random() * availableBiomes.length);
	return availableBiomes[randomIndex];
};

// XP calculation constants - Exponential XP system
const BASE_XP_PER_TILE = 125;
const XP_GROWTH_FACTOR = 2.0; // Exponential growth factor for XP needed per level (2x)
const BASE_XP_PER_LEVEL = 750; // Starting XP needed for level 1 to 2

/**
 * Calculate level based on total XP using exponential scaling
 * Each level requires more XP than the previous one
 */
const calculateLevel = (xp: number): { level: number; progress: number } => {
	// Start at level 1, no XP needed for first level
	let level = 1;
	let xpForNextLevel = BASE_XP_PER_LEVEL;
	let remainingXp = xp;

	// Keep leveling up until we don't have enough XP
	while (remainingXp >= xpForNextLevel) {
		remainingXp -= xpForNextLevel;
		level++;
		xpForNextLevel = Math.floor(
			BASE_XP_PER_LEVEL * Math.pow(XP_GROWTH_FACTOR, level - 1)
		);
	}

	// Calculate progress to next level
	const progress = xpForNextLevel > 0 ? remainingXp / xpForNextLevel : 0;

	return { level, progress };
};

/**
 * Calculate XP gain scaling based on owned tiles
 * The more tiles owned, the more XP gained
 */
const calculateXpGain = (ownedTiles: number): number => {
	// Basic XP gain increases with the number of tiles owned
	// Each tile contributes XP that increases slightly with more tiles
	return BASE_XP_PER_TILE * Math.pow(1.02, ownedTiles - 1) * ownedTiles;
};

const createGameSlice = (
	set: (
		partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)
	) => void,
	get: () => GameState
) => {
	const initialGrid = createInitialGrid();
	const initialRates = calculateResourceRates(initialGrid);

	return {
		tiles: initialGrid,
		resources: { ...INITIAL_RESOURCES },
		resourceRates: initialRates,
		resourceModifiers: initialRates.modifiers,
		level: calculateLevel(0),
		playerName: DEFAULT_PLAYER_NAME,
		characterStats: INITIAL_CHARACTER_STATS,
		equipment: {},
		inventory: INITIAL_INVENTORY_ITEMS,
		showCharacterWindow: false,
		showStatisticsWindow: false,
		isHydrated: false, // Start with false, set to true on rehydration
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

			// Calculate XP gain based on new owned tiles count
			const newOwnedTilesCount = ownedTilesCount + 1;
			const xpGain = calculateXpGain(newOwnedTilesCount);

			set({
				tiles: newTiles,
				resources: {
					...state.resources,
					gold: state.resources.gold - cost,
					xp: state.resources.xp + xpGain,
				},
				resourceRates: newRates,
				resourceModifiers: newRates.modifiers,
				level: calculateLevel(state.resources.xp + xpGain),
			});

			return true;
		},
		upgradeCastle: () => {
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
		},
		tick: (deltaTime: number) => {
			const state = get();
			if (!state?.resourceRates?.total) return;

			const secondsElapsed = deltaTime / 1000;
			const newResources = { ...state.resources };

			Object.entries(state.resourceRates.total).forEach(([resource, rate]) => {
				if (typeof rate === 'number' && !isNaN(rate)) {
					newResources[resource as keyof Resources] += rate * secondsElapsed;
				}
			});

			// Calculate new level based on XP
			const newLevel = calculateLevel(newResources.xp);

			// Add stat points if level increased
			const currentLevel = state.level.level;
			const newCharacterStats = { ...state.characterStats };

			if (newLevel.level > currentLevel) {
				// Add 3 stat points per level gained
				const levelsGained = newLevel.level - currentLevel;
				newCharacterStats.availablePoints += levelsGained * 3;
			}

			set({
				resources: newResources,
				level: newLevel,
				characterStats: newCharacterStats,
			});
		},
		addStatPoint: (stat: keyof CharacterStats) => {
			const state = get();
			if (
				stat === 'availablePoints' ||
				state.characterStats.availablePoints <= 0
			)
				return;

			const newStats = { ...state.characterStats };
			newStats[stat]++;
			newStats.availablePoints--;

			set({ characterStats: newStats });
		},
		setPlayerName: (name: string) => {
			// Ensure name is not empty and within length limits
			if (name && name.trim().length > 0) {
				const trimmedName = name.trim().substring(0, 9); // Max 9 characters
				set({ playerName: trimmedName });
			}
		},
		addResources: (resourceToAdd: Partial<Resources>) => {
			set((state) => ({
				resources: {
					...state.resources,
					...Object.keys(resourceToAdd).reduce(
						(acc, key) => ({
							...acc,
							[key]: state.resources[key as keyof Resources] + (resourceToAdd[key as keyof Resources] || 0)
						}),
						{} as Partial<Resources>
					)
				}
			}));
		},
		toggleCharacterWindow: () =>
			set((state) => ({ showCharacterWindow: !state.showCharacterWindow })),
		toggleStatisticsWindow: () =>
			set((state) => ({ showStatisticsWindow: !state.showStatisticsWindow })),
	};
};

export const useGameStore = create(
	persist<GameState>((set, get) => createGameSlice(set, get), {
		name: 'giorgio-explorer-game-v6',
		version: 6,
		storage: createJSONStorage(() => localStorage),
		onRehydrateStorage: () => (state) => {
			// Set hydration state to true
			set({ isHydrated: true });

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
					playerName: DEFAULT_PLAYER_NAME,
					characterStats: INITIAL_CHARACTER_STATS,
					equipment: {},
					inventory: INITIAL_INVENTORY_ITEMS,
					showCharacterWindow: false,
					showStatisticsWindow: false,
					isHydrated: true,
					buyTile: state?.buyTile,
					upgradeCastle: state?.upgradeCastle,
					tick: state?.tick,
				};
			}
			return state;
		},
	})
);

// Selector to check if name needs to be set
export const useNeedsNameInput = () => 
	useGameStore((state) => state.isHydrated && state.playerName === 'Explorer');

// Selector for game resources
export const useGameResources = () => useGameStore((state) => state.resources);
