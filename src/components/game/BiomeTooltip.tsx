import React, { memo, useMemo } from 'react';
import { BiomeType } from '@/types/game';
import {
	BIOMES,
	GRID_SIZE,
	GRID_HEIGHT,
	SCALING_CONFIG,
	RESOURCE_ICONS,
	CASTLE_UPGRADE,
	BUILDINGS,
	BuildingType,
} from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';

const formatRate = (rate: number) => {
	if (rate === 0) return '0/s';
	return `${rate.toFixed(2)}/s`;
};

export const BiomeTooltip = memo(
	({
		biome,
		level,
		x,
		y,
	}: {
		biome: BiomeType;
		level?: number;
		x?: number;
		y?: number;
	}) => {
		const biomeInfo = BIOMES[biome];
		const multiplier = level ? Math.pow(1.5, level - 1) : 1;
		const tiles = useGameStore((state) => state.tiles);
		const building = x !== undefined && y !== undefined ? tiles[y][x].building : undefined;
		
		// Get building info if we have one
		const buildingInfo = building ? BUILDINGS[building as BuildingType] : undefined;

		const adjacentCount = useMemo(() => {
			if (x === undefined || y === undefined) return 0;
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
		}, [x, y, biome, tiles]);

		const adjacencyMultiplier =
			1 + SCALING_CONFIG.adjacencyBonus * adjacentCount;

		return (
			<div className='space-y-1 text-sm'>
				{biome === 'castle' && level && (
					<div className='mb-2 text-purple-400 font-semibold text-[11px]'>
						Level {level} Castle
					</div>
				)}
				
				{/* Display building info for upgraded grounds */}
				{biome === 'grounds' && level === 2 && buildingInfo && (
					<div className='mb-2 text-purple-400 font-semibold text-[11px] flex items-center gap-1'>
						<span>{buildingInfo.icon}</span>
						<span>Grounds level 2 with {buildingInfo.label}</span>
					</div>
				)}
				
				{/* Display base resource generation */}
				{(
					Object.entries(biomeInfo.resourceGeneration) as [
						keyof typeof RESOURCE_ICONS,
						number
					][]
				).map(([resource, rate]) => {
					const baseRate = rate || 0;
					let effectiveRate =
						biome === 'castle' ? baseRate * multiplier : baseRate;

					// Only apply adjacency bonus to positive rates
					if (effectiveRate > 0 && x !== undefined) {
						effectiveRate *= adjacencyMultiplier;
					}

					if (baseRate === 0) return null;

					return (
						<div key={resource} className='flex flex-col gap-1'>
							<div className='flex items-center gap-1'>
								<span className='text-gray-400'>
									{RESOURCE_ICONS[resource]}
								</span>

								<span className='text-gray-400 font-semibold'>
									{formatRate(baseRate)}
								</span>

								<span className='text-[9px] text-gray-500 mt-0.5'>(base)</span>
							</div>
						</div>
					);
				})}
				
				{/* Display building resource bonuses */}
				{biome === 'grounds' && level === 2 && buildingInfo && buildingInfo.resourceGeneration && (
					<>
						<div className='mt-2 mb-1 text-green-400 text-[11px]'>
							Building Bonuses:
						</div>
						{Object.entries(buildingInfo.resourceGeneration).map(([resource, rate]) => {
							if (!rate) return null;
							
							// Apply adjacency bonus to building resources
							const effectiveRate = rate * adjacencyMultiplier;
							
							return (
								<div key={`building-${resource}`} className='flex items-center gap-1 text-[9px]'>
									<span className='text-green-400'>
										{RESOURCE_ICONS[resource as keyof typeof RESOURCE_ICONS]}
									</span>
									<span className='text-green-400 font-semibold'>
										+{formatRate(rate)}
									</span>
									{adjacentCount > 0 && (
										<span className='text-yellow-500 mt-0.5'>
											(with adjacency: +{formatRate(effectiveRate)})
										</span>
									)}
								</div>
							);
						})}
					</>
				)}

				{biome === 'castle' && level && level > 1 && (
					<div className='mt-2 text-purple-400 text-[9px]'>
						Castle Bonus:{' '}
						{Math.round(
							CASTLE_UPGRADE.baseResourceMultiplier *
								Math.pow(2, level - 1) *
								100
						)}
						% all resource generation
					</div>
				)}
				{biome === 'grounds' && (!level || level === 1) && (
										<div className='text-amber-400 text-[11px]'>
										This grounds can be expanded with a building
									</div>
				)}
				{adjacentCount > 0 && (
					<div className='mt-0.5 text-yellow-500 text-[11px]'>
						+{(adjacencyMultiplier - 1).toFixed(2)}x bonus from {adjacentCount}{' '}
						adjacent {biomeInfo.label}
					</div>
				)}
				{biomeInfo.description && (
					<div className='mt-2 text-gray-400 text-xs'>
						{biomeInfo.description}
					</div>
				)}
			</div>
		);
	}
);

BiomeTooltip.displayName = 'BiomeTooltip';
