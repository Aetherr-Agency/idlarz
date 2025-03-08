import React, { memo, useMemo, useState } from 'react';
import { TileProps } from '@/types/game';
import {
	BIOMES,
	GRID_SIZE,
	GRID_HEIGHT,
	SCALING_CONFIG,
	BIOME_ICONS,
} from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import { countOwnedTiles } from '@/utils/gameUtils';
import { cn } from '@/lib/utils';
import audioManager from '@/utils/audioManager';
import { TileStatus } from './TileStatus';

const Tile: React.FC<TileProps> = ({ biome, isOwned, x, y, style, level }) => {
	const tiles = useGameStore((state) => state.tiles);
	const buyTile = useGameStore((state) => state.buyTile);
	const resources = useGameStore((state) => state.resources);
	const characterStats = useGameStore((state) => state.characterStats);
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
		return isAdjacent ? `${baseColor}BF` : `${baseColor}40`;
	}, [biome, isOwned, isAdjacent]);

	const ownedTilesCount = useMemo(() => countOwnedTiles(tiles), [tiles]);

	const cost = useMemo(() => {
		const baseCost = SCALING_CONFIG.costFormula(ownedTilesCount);
		const discountMultiplier = 1 - characterStats.tileCostDiscount / 100;
		return Math.floor(baseCost * discountMultiplier);
	}, [ownedTilesCount, characterStats.tileCostDiscount]);

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

	const farAwayTile = !isOwned && !isAdjacent;

	return (
		<div
			className={cn(
				'absolute transition-all duration-200 ease-in-out select-none',
				{
					'opacity-100': isOwned,
					'opacity-50 hover:opacity-100': !isOwned && isAdjacent,
					'opacity-75': farAwayTile,
					'hover:z-10 cursor-pointer border border-gray-800':
						!isOwned && isAdjacent,
					'hover:border-green-800': !isOwned && isAdjacent && canAfford,
					'hover:border-red-800 cursor-not-allowed':
						!isOwned && isAdjacent && !canAfford,
					'border border-purple-400': biome === 'castle',
					'group hover:z-20': true,
					'opacity-75 border-2 border-red-500': isShaking,
				}
			)}
			style={{
				...style,
				backgroundColor,
				...(farAwayTile && {
					backgroundColor: '#090c13',
					backgroundImage:
						'linear-gradient(45deg, #0b0d14 25%, transparent 25%, transparent 75%, #0b0d14 75%, #0b0d14), linear-gradient(-45deg, #0b0d14 25%, transparent 25%, transparent 75%, #0b0d14 75%, #0b0d14)',
					backgroundSize: '48px 48px',
				}),
			}}
			onClick={handleClick}
			role='button'>
			<div className='w-full h-full flex items-center justify-center'>
				{isOwned && BIOME_ICONS[BIOMES[biome].name as keyof typeof BIOME_ICONS]}
				{!isOwned && isAdjacent && '❔'}
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
