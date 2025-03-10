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
	ANIMALS,
	SPECIAL_SINGLE_TYPE_BIOMES,
	EMPTY_BIOMES,
	BIOMES,
	MERCHANT_RESOURCE_PRICES,
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
	calculateTotalMeatProduction,
	calculateAnimalCost,
} from '@/utils/gameUtils';
import type {
	GameState,
	Resources,
	Tile,
	CharacterStats,
	BiomeType,
} from '@/types/game';

// Helper to calculate cost at a specific level

// Calculate total meat production from all animals

const createGameSlice = (
	set: (
		partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)
	) => void,
	get: () => GameState
) => {
	const initialGrid = createInitialGrid();
	const initialRates = calculateResourceRates(
		initialGrid,
		INITIAL_CHARACTER_STATS,
		{}
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
		farmLevels: {}, // Initialize farm levels (animal counts)
		showCharacterWindow: false,
		showStatisticsWindow: false,
		showMerchantWindow: false,
		showFarmWindow: false, // Initialize farm window visibility
		isHydrated: false,
		// Biome selection feature state
		biomeSelectionActive: false,
		pendingTileCoords: null,
		selectableBiomes: null,
		clickMultiplier: 1, // Initialize with default multiplier of 1

		// Add a new method to purchase or upgrade an animal
		purchaseAnimal: (animalId: string) => {
			const state = get();
			const animal = ANIMALS.find((animal) => animal.id === animalId);

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
			newRates.base = { ...newRates.base, meat: meatProductionRate };

			// Calculate the total with modifiers
			const meatModifier = newRates.modifiers.meat || 0;
			newRates.total = {
				...newRates.total,
				meat: meatProductionRate * (1 + meatModifier),
			};

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
			const newRates = calculateResourceRates(
				state.tiles,
				newStats,
				state.farmLevels
			);

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

			// Check if this is the 4th tile purchase (tiles are 0-indexed)
			// Every 4th tile (3, 7, 11, etc. - so we need to check if ownedTilesCount % 4 === 3)
			if (ownedTilesCount % 4 === 3) {
				// Get available biomes for selection
				const availableBiomes = Object.entries(BIOMES)
					.filter(
						([name]) =>
							!SPECIAL_SINGLE_TYPE_BIOMES.includes(name as BiomeType) &&
							!EMPTY_BIOMES.includes(name as BiomeType)
					)
					.map(([name]) => name as BiomeType);

				// Activate biome selection mode
				set({
					biomeSelectionActive: true,
					pendingTileCoords: { x, y },
					selectableBiomes: availableBiomes,
				});

				return true;
			}

			// Regular tile purchase - random biome
			const newTiles = state.tiles.map((row) => [...row]);
			const randomBiome = getRandomBiome();
			newTiles[y][x] = {
				...newTiles[y][x],
				biome: randomBiome,
				isOwned: true,
			};

			// Recalculate resource rates with the new tile and current stats
			const newRates = calculateResourceRates(
				newTiles,
				state.characterStats,
				state.farmLevels
			);

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

		// New methods for biome selection
		selectBiome: (biome: BiomeType) => {
			const state = get();

			if (
				!state.biomeSelectionActive ||
				!state.pendingTileCoords ||
				!state.selectableBiomes
			) {
				return false;
			}

			const { x, y } = state.pendingTileCoords;
			const ownedTilesCount = countOwnedTiles(state.tiles);
			const baseCost = SCALING_CONFIG.costFormula(ownedTilesCount);

			// Apply tile cost discount from character stats
			const discountMultiplier =
				1 - state.characterStats.tileCostDiscount / 100;
			const cost = Math.floor(baseCost * discountMultiplier);

			if (state.resources.gold < cost) {
				// Reset biome selection state
				set({
					biomeSelectionActive: false,
					pendingTileCoords: null,
					selectableBiomes: null,
				});
				return false;
			}

			// Create new tile with the selected biome
			const newTiles = state.tiles.map((row) => [...row]);
			newTiles[y][x] = {
				...newTiles[y][x],
				biome: biome,
				isOwned: true,
			};

			// Recalculate resource rates with the new tile and current stats
			const newRates = calculateResourceRates(
				newTiles,
				state.characterStats,
				state.farmLevels
			);

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
				biomeSelectionActive: false,
				pendingTileCoords: null,
				selectableBiomes: null,
			});

			return true;
		},

		cancelBiomeSelection: () => {
			set({
				biomeSelectionActive: false,
				pendingTileCoords: null,
				selectableBiomes: null,
			});
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

			// Recalculate resource rates with current stats and farm levels
			const newRates = calculateResourceRates(
				newTiles,
				state.characterStats,
				state.farmLevels
			);

			set({
				tiles: newTiles,
				resources: newResources,
				resourceRates: newRates,
				resourceModifiers: newRates.modifiers,
			});

			return true;
		},

		upgradeGroundsTile: (x: number, y: number, buildingType: string) => {
			set((state) => {
				// Make sure the tile exists and is a grounds tile
				const tile = state.tiles[y]?.[x];
				if (!tile || tile.biome !== 'grounds') {
					return state;
				}

				// Update the tile level to 2 and assign the building
				const updatedTiles = [...state.tiles];
				updatedTiles[y] = [...updatedTiles[y]];
				updatedTiles[y][x] = {
					...updatedTiles[y][x],
					level: 2,
					building: buildingType,
				};

				// Recalculate resource rates with the updated tiles and building
				const newResourceRates = calculateResourceRates(
					updatedTiles,
					state.characterStats,
					state.farmLevels
				);

				// Return updated state
				return {
					...state,
					tiles: updatedTiles,
					resourceRates: newResourceRates,
					resourceModifiers: newResourceRates.modifiers,
				};
			});
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
				wood: MERCHANT_RESOURCE_PRICES.wood,
				stone: MERCHANT_RESOURCE_PRICES.stone,
				coal: MERCHANT_RESOURCE_PRICES.coal,
				food: MERCHANT_RESOURCE_PRICES.food,
				meat: MERCHANT_RESOURCE_PRICES.meat,
			};

			const goldGained = Math.floor(
				amount * prices[resource as keyof typeof prices]
			);

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
		name: 'idle-explorer-v6',
		version: 6,
		storage: createJSONStorage(() => localStorage),
		onRehydrateStorage: () => (state) => {
			// Validate and fix state if needed
			if (!state || !validateGrid(state.tiles)) {
				const initialGrid = createInitialGrid();
				const initialRates = calculateResourceRates(
					initialGrid,
					INITIAL_CHARACTER_STATS,
					{}
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
					biomeSelectionActive: false,
					pendingTileCoords: null,
					selectableBiomes: null,
					clickMultiplier: 1, // Initialize with default multiplier of 1
				};
			}
			return state;
		},
	})
);
