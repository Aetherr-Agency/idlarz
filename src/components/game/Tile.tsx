import React, { memo, useMemo, useState } from 'react';
import { BiomeType } from '@/types/game';
import {
	BIOMES,
	GRID_SIZE,
	GRID_HEIGHT,
	SCALING_CONFIG,
	BIOME_ICONS,
	RESOURCE_ICONS,
} from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import { countOwnedTiles } from '@/utils/gameUtils';
import { cn } from '@/lib/utils';
import audioManager from '@/utils/audioManager';

// Utility functions

interface TileProps {
	biome: BiomeType;
	isOwned: boolean;
	x: number;
	y: number;
	style?: React.CSSProperties;
	level?: number;
}

const formatRate = (rate: number) => {
	if (rate === 0) return '0/s';
	return `${rate.toFixed(2)}/s`;
};

const BiomeTooltip = memo(
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
					<div className='mb-2 text-purple-400'>Level {level} Castle</div>
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
					const castleModifier = level ? level * 0.2 : 0; // 20% per level based on the new system

					return (
						<div key={resource} className='flex flex-col gap-1'>
							<div className='flex items-center gap-2'>
								<span className='text-gray-400'>
									{RESOURCE_ICONS[resource]}
								</span>
								<span className='text-gray-300'>
									{formatRate(baseRate)}
								</span>
								{biome === 'castle' && castleModifier > 0 && (
									<span className='text-green-400 text-xs'>
										+{Math.round(castleModifier * 100)}%
									</span>
								)}
							</div>
						</div>
					);
				})}
				{biome === 'castle' && level && level > 1 && (
					<div className='mt-2 text-purple-400 text-xs'>
						Castle Bonus: {((multiplier - 1) * 100).toFixed(0)}% increased
						resource generation
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

const TileStatus = memo(
	({
		biome,
		isOwned,
		isAdjacent,
		level,
		x,
		y,
	}: {
		biome: BiomeType;
		isOwned: boolean;
		isAdjacent: boolean;
		level?: number;
		x: number;
		y: number;
	}) => {
		const tiles = useGameStore((state) => state.tiles);
		const resources = useGameStore((state) => state.resources);

		const { cost, scalingInfo } = useMemo(() => {
			const ownedTilesCount = countOwnedTiles(tiles);
			const tier = Math.floor(
				ownedTilesCount / SCALING_CONFIG.scalingIncreasePer
			);
			const currentScalingFactor =
				SCALING_CONFIG.baseScalingFactor *
				(1 + SCALING_CONFIG.scalingIncreaseAmount * tier);
			const nextTileForTierIncrease =
				(tier + 1) * SCALING_CONFIG.scalingIncreasePer;
			const tilesUntilIncrease = nextTileForTierIncrease - ownedTilesCount;

			return {
				cost: SCALING_CONFIG.costFormula(ownedTilesCount),
				scalingInfo: {
					tier,
					currentScalingFactor,
					tilesUntilIncrease,
					nextTileForTierIncrease,
				},
			};
		}, [tiles]);

		if (isOwned) {
			const biomeInfo = BIOMES[biome];
			return (
				<div className='space-y-1'>
					<div className='font-bold flex items-center gap-2 text-white'>
						<p>{biomeInfo.label}</p>
					</div>
					<BiomeTooltip biome={biome} level={level} x={x} y={y} />
				</div>
			);
		}

		if (isAdjacent) {
			const canAfford = resources.gold >= cost;
			return (
				<div className='space-y-1'>
					<div className='font-medium text-gray-500'>Unexplored Land</div>
					<div className='text-sm'>
						<span className={canAfford ? 'text-green-400' : 'text-red-400'}>
							Cost: {cost} gold
						</span>
					</div>
					<div className='text-xs text-gray-500'>
						Scaling Tier: {scalingInfo.tier + 1}
						<br />
						Current Factor: {scalingInfo.currentScalingFactor.toFixed(2)}x
						{scalingInfo.tilesUntilIncrease > 0 && (
							<>
								<br />
								<span className='text-yellow-500'>
									{scalingInfo.tilesUntilIncrease} tiles until next scaling
									increase
								</span>
							</>
						)}
					</div>
					<div className='text-sm text-gray-400'>Click to explore</div>
				</div>
			);
		}

		return null;
	}
);

TileStatus.displayName = 'TileStatus';

const Tile: React.FC<TileProps> = ({ biome, isOwned, x, y, style, level }) => {
	const tiles = useGameStore((state) => state.tiles);
	const buyTile = useGameStore((state) => state.buyTile);
	const resources = useGameStore((state) => state.resources);
	const [isShaking, setIsShaking] = useState(false);

	const isAdjacent = useMemo(() => {
		if (isOwned || !tiles) return false;

		const directions = [
			[x - 1, y],
			[x + 1, y],
			[x, y - 1],
			[x, y + 1],
		];

		return directions.some(
			([adjX, adjY]) =>
				adjX >= 0 &&
				adjX < GRID_SIZE &&
				adjY >= 0 &&
				adjY < GRID_HEIGHT &&
				tiles[adjY]?.[adjX]?.isOwned
		);
	}, [x, y, isOwned, tiles]);

	const backgroundColor = useMemo(() => {
		const baseColor = BIOMES[biome].baseColor;
		if (isOwned) {
			return baseColor;
		}
		return isAdjacent ? `${baseColor}BF` : `${baseColor}40`; // 75% opacity for available, 25% for unavailable
	}, [biome, isOwned, isAdjacent]);

	const ownedTilesCount = useMemo(() => countOwnedTiles(tiles), [tiles]);

	const cost = useMemo(() => {
		return SCALING_CONFIG.costFormula(ownedTilesCount);
	}, [ownedTilesCount]);

	const canAfford = resources.gold >= cost;

	const handleClick = () => {
		if (isAdjacent && !isOwned) {
			if (canAfford) {
				buyTile(x, y);
				audioManager.playSound('purchase');
			} else if (cost > 0) {
				// Only play wrong sound and shake for adjacent unaffordable tiles
				setIsShaking(true);
				audioManager.playSound('wrong');
				setTimeout(() => setIsShaking(false), 300);
			}
		}
	};

	return (
		<div
			className={cn(
				'absolute transition-all duration-200 ease-in-out select-none',
				isOwned
					? 'opacity-100'
					: isAdjacent
					? 'opacity-75 hover:opacity-100'
					: 'opacity-25',
				!isOwned &&
					isAdjacent && [
						'hover:z-10 cursor-pointer',
						'border border-gray-900',
						canAfford ? 'hover:border-green-800' : 'hover:border-red-800',
						!canAfford && 'cursor-not-allowed',
					],
				biome === 'castle' && 'border border-purple-400',
				'group hover:z-20',
				isShaking && 'opacity-75 border-2 border-red-500'
			)}
			style={{
				...style,
				backgroundColor,
			}}
			onClick={handleClick}
			role='button'
			aria-label={`${
				isOwned
					? BIOMES[biome].label
					: isAdjacent
					? 'Unexplored land'
					: 'Unknown territory'
			} tile`}>
			<div className='w-full h-full flex items-center justify-center'>
				{isOwned
					? BIOME_ICONS[BIOMES[biome].name as keyof typeof BIOME_ICONS]
					: isAdjacent
					? '❔'
					: '☁️'}
			</div>

			{(isOwned || isAdjacent) && (
				<div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200'>
					<div className='bg-gray-900 rounded-lg shadow-xl p-2 whitespace-nowrap border border-gray-700'>
						<TileStatus
							biome={biome}
							isOwned={isOwned}
							isAdjacent={isAdjacent}
							level={level}
							x={x}
							y={y}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

Tile.displayName = 'Tile';

export default memo(Tile);
