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

// Farm animal configurations
interface Animal {
	id: string;
	baseCost: number;
	costScaling: number;
	baseProduction: number;
	productionScaling: number;
}

const ANIMALS: Record<string, Animal> = {
	chicken: {
		id: 'chicken',
		baseCost: 10000,
		costScaling: 1.5,
		baseProduction: 0.05,
		productionScaling: 1.2,
	},
	deer: {
		id: 'deer',
		baseCost: 50000,
		costScaling: 1.6,
		baseProduction: 0.2,
		productionScaling: 1.25,
	},
	pig: {
		id: 'pig',
		baseCost: 200000,
		costScaling: 1.7,
		baseProduction: 0.5,
		productionScaling: 1.3,
	},
	cow: {
		id: 'cow',
		baseCost: 1000000,
		costScaling: 1.8,
		baseProduction: 1.5,
		productionScaling: 1.4,
	},
};

// Helper to calculate cost at a specific level
const calculateAnimalCost = (animal: Animal, level: number): number => {
	return Math.floor(animal.baseCost * Math.pow(animal.costScaling, level));
};

// Helper to calculate production at a specific level
const calculateAnimalProduction = (animal: Animal, level: number): number => {
	if (level <= 0) return 0;
	return animal.baseProduction * Math.pow(animal.productionScaling, level - 1);
};

// Calculate total meat production from all animals
const calculateTotalMeatProduction = (farmLevels: Record<string, number>): number => {
	let totalProduction = 0;

	Object.entries(ANIMALS).forEach(([animalId, animal]) => {
		const level = farmLevels[animalId] || 0;
		if (level > 0) {
			totalProduction += calculateAnimalProduction(animal, level);
		}
	});

	return totalProduction;
};

const createGameSlice = (
	set: (
		partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)
	) => void,
	get: () => GameState
) => {
	const initialGrid = createInitialGrid();
	const initialRates = calculateResourceRates(initialGrid, INITIAL_CHARACTER_STATS);

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
		farmLevels: {}, // Initialize farm levels (animal counts)
		showCharacterWindow: false,
		showStatisticsWindow: false,
		showMerchantWindow: false,
		showFarmWindow: false, // Initialize farm window visibility
		isHydrated: false,

		// Add a new method to purchase or upgrade an animal
		purchaseAnimal: (animalId: string) => {
			const state = get();
			const animal = ANIMALS[animalId];

			if (!animal) return false;

			// Get current level of the animal (0 if not owned yet)
			const currentLevel = state.farmLevels[animalId] || 0;

			// Calculate cost to purchase/upgrade the animal
			const cost = calculateAnimalCost(animal, currentLevel);

			// Check if player can afford it
			if (state.resources.food < cost) return false;

			// Update farm levels and deduct cost
			const newFarmLevels = { ...state.farmLevels };
			newFarmLevels[animalId] = currentLevel + 1;

			// Deduct food cost
			const newResources = { ...state.resources };
			newResources.food -= cost;

			// Calculate new total meat production rate
			const meatProductionRate = calculateTotalMeatProduction(newFarmLevels);

			// Update resource rates with new meat production
			const newRates = { ...state.resourceRates };
			newRates.total = { ...newRates.total, meat: meatProductionRate };

			// Update state
			set({
				farmLevels: newFarmLevels,
				resources: newResources,
				resourceRates: newRates,
			});

			return true;
		},

		// Add methods to control farm overlay visibility
		toggleFarmWindow: () => {
			const state = get();
			set({ showFarmWindow: !state.showFarmWindow });
		},

		setShowFarmWindow: (show: boolean) => {
			set({ showFarmWindow: show });
		},

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

			// Add meat from farm animals
			const meatProductionRate = calculateTotalMeatProduction(state.farmLevels);
			if (meatProductionRate > 0) {
				newResources.meat += meatProductionRate * secondsElapsed;
			}

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
		toggleMerchantWindow: () => {
			// Close other windows if merchant window is being opened
			const isMerchantOpen = get().showMerchantWindow;
			if (!isMerchantOpen) {
				set({
					showCharacterWindow: false,
					showStatisticsWindow: false,
					showMerchantWindow: true,
				});
			} else {
				set({ showMerchantWindow: false });
			}
		},
		sellResources: (resource: keyof Resources, amount: number) => {
			if (resource === 'gold' || resource === 'xp') return; // Cannot sell gold or xp

			const state = get();
			if (state.resources[resource] < amount) return; // Not enough resources

			// Resource pricing (different for each resource)
			const prices = {
				wood: 0.75,
				stone: 1.25,
				coal: 2.0,
				food: 0.5,
			};

			const goldGained = Math.floor(amount * prices[resource as keyof typeof prices]);

			set({
				resources: {
					...state.resources,
					[resource]: state.resources[resource] - amount,
					gold: state.resources.gold + goldGained,
				},
			});

			return goldGained;
		},
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
					farmLevels: {}, // Initialize farm levels (animal counts)
					showCharacterWindow: false,
					showStatisticsWindow: false,
					showMerchantWindow: false,
					showFarmWindow: false, // Initialize farm window visibility
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
