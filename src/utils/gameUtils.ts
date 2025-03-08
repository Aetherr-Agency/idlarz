import {
	GRID_SIZE,
	GRID_HEIGHT,
	BASE_XP_PER_TILE,
	BASE_XP_PER_LEVEL,
	XP_GROWTH_FACTOR,
	BIOMES,
	SPECIAL_SINGLE_TYPE_BIOMES,
	BASE_GENERATION_RATES,
	CASTLE_BASE_RATES,
	CASTLE_UPGRADE,
	SCALING_CONFIG,
	GRID_CENTER_Y,
	GRID_CENTER_X,
	EMPTY_BIOMES,
	ANIMALS,
} from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import {
	Animal,
	BiomeType,
	CharacterStats,
	GameState,
	ResourceRates,
	Resources,
	Tile,
} from '@/types/game';

/**
 * Counts the total number of owned tiles in the grid
 * @param tiles Grid of tiles to count ownership from
 * @returns Number of owned tiles
 */
export const countOwnedTiles = (tiles: { isOwned: boolean }[][]): number => {
	let count = 0;
	for (let y = 0; y < GRID_HEIGHT; y++) {
		for (let x = 0; x < GRID_SIZE; x++) {
			if (tiles[y][x].isOwned) count++;
		}
	}
	return count;
};

/**
 * Counts the total number of owned tiles of a specific biome type
 * @param tiles Grid of tiles to count ownership from
 * @param biomeType The type of biome to count
 * @returns Number of owned tiles of the specified biome type
 */
export const countOwnedBiomeTypes = (
	tiles: Tile[][],
	biomeType: BiomeType
): number => {
	let count = 0;
	for (let y = 0; y < GRID_HEIGHT; y++) {
		for (let x = 0; x < GRID_SIZE; x++) {
			if (tiles[y][x].isOwned && tiles[y][x].biome === biomeType) count++;
		}
	}
	return count;
};

/**
 * Gets the description for a character stat
 * @param stat The character stat key
 * @returns Description of what the stat does
 */
export const getStatDescription = (
	stat: keyof Omit<CharacterStats, 'availablePoints'>
): string => {
	const descriptions: Record<
		keyof Omit<CharacterStats, 'availablePoints'>,
		string
	> = {
		strength:
			'+ 1 Physical ATK +1 per point / + 0.5 DEF per point / +1% Crit DMG per point / 2.5% Stone & Coal Modifier per point',
		dexterity:
			'+ 1 DEF +1 per point / +0.25 ATK Speed per point / +0.25% Crit Chance per point / +0.5% Crit DMG per point / 2.5% Wood & Food Modifier per point',
		intelligence:
			'+ 1 Magic ATK +1 per point / +1 Magic DEF per point / +2 MP per point / +0.2% XP Modifier per point / 2.5% Gold Modifier per point',
		vitality:
			'+ 3 HP per point / +0.5 DEF per point / +0.5 Magic DEF per point / 2.5% Food & Wood Modifier per point',
		charisma:
			'+ 1 HP & DEF & Magic DEF +0.25 per point / +1 Luck per point / +0.5% Crit Chance & Crit DMG per point /  +0.1% Tile  Discount per point [max 25%] / +0.25% XP Modifier per point / 2.5% Gold & Coal Modifier per point',
		// Combat stats
		physicalAtk:
			'Your physical attack power. Determines damage dealt with physical attacks.',
		magicAtk:
			'Your magical attack power. Determines damage dealt with magical attacks.',
		hp: 'Hit Points. Your health that determines how much damage you can take.',
		mp: 'Mana Points. Resource used for casting spells and special abilities.',
		def: 'Physical Defense. Reduces damage taken from physical attacks.',
		magicDef: 'Magical Defense. Reduces damage taken from magical attacks.',
		luck: 'Influences random events and rare item finds.',
		critChance:
			'Percentage chance to land a critical hit for increased damage.',
		critDmgMultiplier:
			'Percentage of additional damage dealt on critical hits.',
		atkSpeedIncrease:
			'Percentage increase to attack speed, allowing faster actions.',
		xpGainMultiplier:
			'Percentage increase to experience points gained from all sources.',
		tileCostDiscount: 'Percentage discount when purchasing new tiles.',
		reputation:
			'Your standing in the world. Affects interactions with NPCs and factions.',
	};

	return descriptions[stat];
};

/**
 * Calculate XP gain scaling based on owned tiles
 * The more tiles owned, the more XP gained
 */
export const calculateXpGain = (ownedTiles: number): number => {
	// Basic XP gain increases with the number of tiles owned
	// Each tile contributes XP that increases slightly with more tiles
	return BASE_XP_PER_TILE * Math.pow(1.02, ownedTiles - 1) * (ownedTiles / 4);
};

/**
 * Calculate level based on total XP using exponential scaling
 * Each level requires more XP than the previous one
 */
export const calculateLevel = (
	xp: number
): { level: number; progress: number } => {
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

// Selector to check if name needs to be set
export const useNeedsNameInput = () =>
	useGameStore((state) => state.isHydrated && state.playerName === 'Explorer');

export const countAdjacentSameBiomes = (
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

// Validate grid state to ensure it matches our expectations
export const validateGrid = (grid: unknown): grid is Tile[][] => {
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

export const createInitialGrid = (): Tile[][] => {
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

// Resource Management
export const canAffordCost = (
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

// Calculate stat-based resource modifiers
export const calculateStatResourceModifiers = (
	stats: CharacterStats
): Resources => {
	const modifiers = {
		gold: 0,
		wood: 0,
		stone: 0,
		coal: 0,
		food: 0,
		meat: 0,
		xp: 0,
	};

	// Strength: Stone & Coal +2.5% per point
	modifiers.stone += stats.strength * 0.025;
	modifiers.coal += stats.strength * 0.025;

	// Dexterity: Wood & Food +2.5% per point
	modifiers.wood += stats.dexterity * 0.025;
	modifiers.food += stats.dexterity * 0.025;

	// Intelligence: Gold +2.5% per point, XP +0.2% per point
	modifiers.gold += stats.intelligence * 0.025;
	modifiers.xp += stats.intelligence * 0.002;

	// Vitality: Food & Wood +2.5% per point
	modifiers.food += stats.vitality * 0.025;
	modifiers.wood += stats.vitality * 0.025;

	// Charisma: Gold & Coal +2.5% per point, XP +0.25% per point
	modifiers.gold += stats.charisma * 0.025;
	modifiers.coal += stats.charisma * 0.025;
	modifiers.xp += stats.charisma * 0.0025;

	return modifiers;
};

export const calculateAnimalCost = (animal: Animal, level: number): number => {
	return Math.floor(animal.baseCost * Math.pow(animal.costScaling, level));
};

// Helper to calculate production at a specific level
export const calculateAnimalProduction = (
	animal: Animal,
	level: number
): number => {
	if (level <= 0) return 0;
	return animal.baseProduction * Math.pow(animal.productionScaling, level - 1);
};

// Calculate combat stats from base stats
export const calculateCombatStats = (
	stats: CharacterStats
): Partial<CharacterStats> => {
	return {
		physicalAtk: stats.strength, // +1 per strength
		magicAtk: stats.intelligence, // +1 per intelligence
		hp: stats.vitality * 3 + stats.charisma * 0.25, // +3 per vitality, +0.25 per charisma
		mp: stats.intelligence * 2, // +2 per intelligence
		def:
			stats.dexterity +
			stats.strength * 0.5 +
			stats.vitality * 0.5 +
			stats.charisma * 0.25, // Base + dex + str/2 + vit/2 + cha/4
		magicDef: stats.intelligence + stats.vitality * 0.5 + stats.charisma * 0.25, // Base + int + vit/2 + cha/4
		luck: stats.charisma, // +1 per charisma
		critChance: stats.dexterity * 0.25 + stats.charisma * 0.5, // +0.25% per dex, +0.5% per cha
		critDmgMultiplier:
			100 + stats.strength + stats.dexterity * 0.5 + stats.charisma * 0.5, // Base 100% + str + dex/2 + cha/2
		atkSpeedIncrease: stats.dexterity * 0.25, // +0.25% per dex
		xpGainMultiplier: stats.intelligence * 0.2 + stats.charisma * 0.25, // +0.2% per int, +0.25% per cha
		tileCostDiscount: Math.min(stats.charisma * 0.001, 0.25) * 100, // +0.1% per cha, capped at 25%, convert to percentage
	};
};

export const calculateTotalMeatProduction = (
	farmLevels: Record<string, number>
): number => {
	let totalProduction = 0;

	Object.entries(ANIMALS).forEach(([animalId, animal]) => {
		const level = farmLevels[animalId] || 0;
		if (level > 0) {
			totalProduction += calculateAnimalProduction(animal, level);
		}
	});

	return totalProduction;
};

export const calculateResourceRates = (
	tiles: Tile[][],
	characterStats?: CharacterStats
): ResourceRates => {
	const base = { ...BASE_GENERATION_RATES };
	const modifiers = { ...BASE_GENERATION_RATES };
	const total = { ...BASE_GENERATION_RATES };

	// Calculate base rates from tiles
	for (let y = 0; y < tiles.length; y++) {
		for (let x = 0; x < tiles[y].length; x++) {
			const tile = tiles[y][x];
			if (tile.isOwned) {
				const biome = BIOMES[tile.biome];
				if (biome?.resourceGeneration) {
					Object.entries(biome.resourceGeneration).forEach(
						([resource, rate]) => {
							base[resource as keyof Resources] += rate;
						}
					);
				}
			}
		}
	}

	// Add castle base rates to base generation
	Object.entries(CASTLE_BASE_RATES).forEach(([resource, rate]) => {
		const key = resource as keyof Resources;
		base[key] += rate;
	});

	// Calculate castle modifier (exponential growth - doubles each level after level 1)
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

	// Add Plains biome bonus for meat production
	// Each owned Plains tile provides a 5% bonus to meat production
	const plainsCount = countOwnedBiomeTypes(tiles, 'plains');
	if (plainsCount > 0) {
		// 5% per plains tile
		modifiers.meat += plainsCount * 0.05;
	}

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

	// Apply stat-based resource modifiers if stats are provided
	if (characterStats) {
		const statModifiers = calculateStatResourceModifiers(characterStats);
		Object.entries(statModifiers).forEach(([resource, modifier]) => {
			modifiers[resource as keyof Resources] += modifier;
		});
	}

	// Calculate total rates
	Object.keys(total).forEach((resource) => {
		const key = resource as keyof Resources;
		total[key] = base[key] * (1 + modifiers[key]);
	});

	return { base, modifiers, total };
};

// Biome Generation
export const getRandomBiome = (): BiomeType => {
	const BIOMES_TO_EXCLUDE = [...SPECIAL_SINGLE_TYPE_BIOMES, ...EMPTY_BIOMES];
	const availableBiomes = Object.entries(BIOMES)
		.filter(([name]) => !BIOMES_TO_EXCLUDE.includes(name))
		.map(([name]) => name as BiomeType);

	const randomIndex = Math.floor(Math.random() * availableBiomes.length);
	return availableBiomes[randomIndex];
};
