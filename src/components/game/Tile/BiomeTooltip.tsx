import React, { memo, useMemo } from 'react';
import { BiomeType } from '@/types/game';
import {
	BIOMES,
	GRID_SIZE,
	GRID_HEIGHT,
	SCALING_CONFIG,
	RESOURCE_ICONS,
	CASTLE_UPGRADE,
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

					// Get modifier percentage for castle tiles
					const castleModifier =
						biome === 'castle' && level
							? CASTLE_UPGRADE.baseResourceMultiplier * Math.pow(2, level - 1)
							: 0; // Exponential growth

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

								{biome === 'castle' && castleModifier > 0 && (
									<span className='text-green-400 text-xs text-[9px] mt-0.5 block ml-auto'>
										x {Math.round(castleModifier * 100)}% castle lv bonus
									</span>
								)}
							</div>
						</div>
					);
				})}

				{biome === 'castle' && level && level > 1 && (
					<div className='mt-2 text-purple-400 text-xs'>
						Castle Bonus:{' '}
						{Math.round(
							CASTLE_UPGRADE.baseResourceMultiplier *
								Math.pow(2, level - 1) *
								100
						)}
						% resource generation
					</div>
				)}
				{adjacentCount > 0 && (
					<div className='mt-2 text-yellow-500 text-xs'>
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
