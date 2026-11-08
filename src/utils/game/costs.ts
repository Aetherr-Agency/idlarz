// What buying a tile or a building costs, and paying for it (part of the former utils/gameUtils.ts, split in IDL-15).
import { BUILDING_COST } from '@/config/buildings';
import { RESOURCE_CAP, SCALING_CONFIG, TILE_RESOURCE_COST } from '@/config/economy';
import type { PrestigeState, Resources, Tile, TileCost } from '@/types/game';
import { buildingCount, getTile, type World } from '@/utils/world';
import { isLandmarkTile } from '@/utils/terrain';
import { emberEffect } from '@/utils/game/rebirth';

/** Everything buying the next tile costs, given how many tiles are owned and the Charisma discount (percent). */
export const calculateTileCost = (ownedTiles: number, discountPercent = 0): TileCost => {
	const keep = 1 - discountPercent / 100;
	const base = SCALING_CONFIG.costFormula(ownedTiles);
	const resources: Partial<Resources> = {};
	TILE_RESOURCE_COST.forEach(({ from, resource, share }) => {
		if (ownedTiles >= from) resources[resource] = Math.floor(base * share * keep);
	});
	return { gold: Math.floor(base * keep), resources };
};

/** Cost of a bundle of resources (gold included) as a flat partial-resources object. */
export const tileCostAsResources = (cost: TileCost): Partial<Resources> => ({
	...cost.resources,
	gold: cost.gold,
});

export const canAffordBundle = (resources: Resources, cost: Partial<Resources>): boolean =>
	Object.entries(cost).every(([resource, amount]) => resources[resource as keyof Resources] >= (amount || 0));

/** Returns a copy of `resources` with `cost` subtracted (callers check affordability first). */
export const subtractBundle = (resources: Resources, cost: Partial<Resources>): Resources => {
	const next = { ...resources };
	Object.entries(cost).forEach(([resource, amount]) => {
		next[resource as keyof Resources] -= amount || 0;
	});
	return next;
};

export const countBuildings = (tiles: World): number => buildingCount(tiles);

/** Price factor of the next building when `built` buildings stand: the cheap starter steps, then three stages of growth. */
export const buildingCostFactor = (built: number): number => {
	const C = BUILDING_COST;
	if (built < C.starter.length) return C.starter[built];
	const k = built - C.starter.length + 1; // 1 for the first building after the starter ones
	return (
		Math.pow(C.growthEarly, Math.min(k, C.earlyCount)) *
		Math.pow(C.growthMid, Math.min(Math.max(k - C.earlyCount, 0), C.midCount)) *
		Math.pow(C.growthLate, Math.max(k - C.earlyCount - C.midCount, 0))
	);
};

/** Cost of the next building: base cost x the factor for the number of buildings already built. */
export const calculateBuildingCost = (tiles: World, prestige?: PrestigeState): Partial<Resources> => {
	const factor = buildingCostFactor(countBuildings(tiles)) * (1 - emberEffect(prestige, 'thrift'));
	const cost: Partial<Resources> = {};
	Object.entries(BUILDING_COST.base).forEach(([resource, amount]) => {
		// finite whatever the building count (1.15^n overflows past ~4,900 buildings)
		cost[resource as keyof Resources] = Math.floor(Math.min((amount || 0) * factor, RESOURCE_CAP / 100));
	});
	return cost;
};

/** An explored tile that can take a building: not water or the castle, and nothing built on it yet. */
export const canBuildOn = (tile: Tile | undefined): boolean => !!tile && tile.isOwned && !BUILDING_COST.blockedBiomes.includes(tile.biome) && !tile.building;

/** canBuildOn plus the map: a landmark's 6x6 area (a big cosmetic scene on a block of one biome) is kept free of buildings. */
export const canBuildAt = (world: World, x: number, y: number): boolean => canBuildOn(getTile(world, x, y)) && !isLandmarkTile(world, x, y);
