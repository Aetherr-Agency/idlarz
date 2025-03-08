import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
	CASTLE_UPGRADE,
	GRID_SIZE,
	GRID_HEIGHT,
	INITIAL_RESOURCES,
	SCALING_CONFIG,
	INITIAL_INVENTORY_ITEMS,
	DEFAULT_PLAYER_NAME,
	INITIAL_CHARACTER_STATS,
} from '@/config/gameConfig';
import {
	calculateLevel,
	calculateResourceRates,
	calculateXpGain,
	canAffordCost,
	countOwnedTiles,
	createInitialGrid,
	getRandomBiome,
	validateGrid,
	calculateCombatStats,
} from '@/utils/gameUtils';
import type { GameState, Resources, Tile, CharacterStats } from '@/types/game';

const createGameSlice = (
	set: (
		partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)
	) => void,
	get: () => GameState
) => {
	const initialGrid = createInitialGrid();
	const initialRates = calculateResourceRates(
		initialGrid,
		INITIAL_CHARACTER_STATS
	);

	return {
		tiles: initialGrid,
		resources: { ...INITIAL_RESOURCES },
		resourceRates: initialRates,
		resourceModifiers: initialRates.modifiers,
		level: calculateLevel(0),
		previousLevel: 0,
		playerName: DEFAULT_PLAYER_NAME,
		characterStats: INITIAL_CHARACTER_STATS,
		equipment: {},
		inventory: INITIAL_INVENTORY_ITEMS,
		showCharacterWindow: false,
		showStatisticsWindow: false,
		isHydrated: false,

		addStatPoint: (stat: keyof CharacterStats) => {
			const state = get();
			if (state.characterStats.availablePoints <= 0) return;

			// Create new stats object with incremented stat
			const newStats = { ...state.characterStats };
			newStats[stat]++;
			newStats.availablePoints--;

			// Recalculate combat stats
			const combatStats = calculateCombatStats(newStats);
			Object.assign(newStats, combatStats);

			// Recalculate resource rates with new stats
			const newRates = calculateResourceRates(state.tiles, newStats);

			set({
				characterStats: newStats,
				resourceRates: newRates,
				resourceModifiers: newRates.modifiers,
			});
		},

		buyTile: (x: number, y: number) => {
			const state = get();
			const ownedTilesCount = countOwnedTiles(state.tiles);
			const baseCost = SCALING_CONFIG.costFormula(ownedTilesCount);

			// Apply tile cost discount from character stats
			const discountMultiplier =
				1 - state.characterStats.tileCostDiscount / 100;
			const cost = Math.floor(baseCost * discountMultiplier);

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

			// Recalculate resource rates with the new tile and current stats
			const newRates = calculateResourceRates(newTiles, state.characterStats);

			// Calculate XP gain based on new owned tiles count
			const newOwnedTilesCount = ownedTilesCount + 1;
			const xpGain = calculateXpGain(newOwnedTilesCount);

			// Apply XP gain multiplier from stats
			const xpMultiplier = 1 + state.characterStats.xpGainMultiplier / 100;
			const totalXpGain = xpGain * xpMultiplier;

			// Update character stats with new reputation
			const newStats = { ...state.characterStats };
			newStats.reputation += 100; // +100 reputation for each tile purchased

			set({
				tiles: newTiles,
				resources: {
					...state.resources,
					gold: state.resources.gold - cost,
					xp: state.resources.xp + totalXpGain,
				},
				resourceRates: newRates,
				resourceModifiers: newRates.modifiers,
				level: calculateLevel(state.resources.xp + totalXpGain),
				characterStats: newStats,
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

			// Recalculate resource rates with current stats
			const newRates = calculateResourceRates(newTiles, state.characterStats);

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

			// Apply resource generation with stat modifiers
			Object.entries(state.resourceRates.total).forEach(([resource, rate]) => {
				if (typeof rate === 'number' && !isNaN(rate)) {
					// Apply XP gain multiplier for XP resource
					if (resource === 'xp') {
						const xpMultiplier =
							1 + state.characterStats.xpGainMultiplier / 100;
						newResources[resource as keyof Resources] +=
							rate * secondsElapsed * xpMultiplier;
					} else {
						newResources[resource as keyof Resources] += rate * secondsElapsed;
					}
				}
			});

			// Calculate new level based on XP
			const newLevel = calculateLevel(newResources.xp);

			// Create new state update object
			const stateUpdate: Partial<GameState> = {
				resources: newResources,
				level: newLevel,
			};

			// Check for level up and add stat points if needed
			if (newLevel.level > state.previousLevel) {
				const levelsGained = newLevel.level - state.previousLevel;
				const newPoints = levelsGained * 3; // 3 stat points per level

				// Create a new stats object and add the points
				const newCharacterStats = { ...state.characterStats };
				newCharacterStats.availablePoints += newPoints;

				// Recalculate combat stats
				const combatStats = calculateCombatStats(newCharacterStats);
				Object.assign(newCharacterStats, combatStats);

				stateUpdate.characterStats = newCharacterStats;
				stateUpdate.previousLevel = newLevel.level;
			}

			// Update the state with all changes
			set(stateUpdate);
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
							[key]:
								state.resources[key as keyof Resources] +
								(resourceToAdd[key as keyof Resources] || 0),
						}),
						{} as Partial<Resources>
					),
				},
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
		name: 'idle-explorer-v2',
		version: 2,
		storage: createJSONStorage(() => localStorage),
		onRehydrateStorage: () => (state) => {
			// Validate and fix state if needed
			if (!state || !validateGrid(state.tiles)) {
				const initialGrid = createInitialGrid();
				const initialRates = calculateResourceRates(
					initialGrid,
					INITIAL_CHARACTER_STATS
				);

				return {
					tiles: initialGrid,
					resources: { ...INITIAL_RESOURCES },
					resourceRates: initialRates,
					resourceModifiers: initialRates.modifiers,
					xp: 0,
					level: calculateLevel(0),
					previousLevel: 0,
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
