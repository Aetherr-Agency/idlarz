import React, { memo, useMemo } from 'react';
import { BiomeType } from '@/types/game';
import { BIOMES, SCALING_CONFIG } from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import { countOwnedTiles } from '@/utils/gameUtils';
import { formatNumber } from '@/utils/formatters';
import { BiomeTooltip } from './BiomeTooltip';
import ResourceIcon from './ResourceIcon';
import { cn } from '@/lib/utils';

export const TileStatus = memo(
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
		const characterStats = useGameStore((state) => state.characterStats);

		const { cost, tilesUntilManualSelection, canManuallySelect } = useMemo(() => {
			const ownedTilesCount = countOwnedTiles(tiles);
			const baseCost = SCALING_CONFIG.costFormula(ownedTilesCount);
			const discountMultiplier = 1 - characterStats.tileCostDiscount / 100;
			const discountedCost = baseCost * discountMultiplier;
			const tilesUntilManualSelection = (3 - (ownedTilesCount % 4)) % 4;
			const canManuallySelect = tilesUntilManualSelection === 0;

			return {
				cost: discountedCost,
				tilesUntilManualSelection,
				canManuallySelect,
			};
		}, [tiles, characterStats.tileCostDiscount]);

		if (isOwned) {
			const biomeInfo = BIOMES[biome];
			return (
				<div className='space-y-1'>
					<div className='px-tip-title text-sm'>{biomeInfo.label}</div>
					<BiomeTooltip biome={biome} level={level} x={x} y={y} />
				</div>
			);
		}

		if (isAdjacent) {
			const canAfford = resources.gold >= cost;
			return (
				<div className='space-y-1 text-sm'>
					<div className='px-tip-title'>Unexplored Land</div>
					<div className='flex items-center gap-1 mb-2'>
						<ResourceIcon resource='gold' />
						<span className={canAfford ? 'text-green-400' : 'text-red-400'}>
							Cost: {formatNumber(cost)} gold
						</span>
						{characterStats.tileCostDiscount > 0 && (
							<span className='text-amber-400 text-xs ml-1'>
								(-{characterStats.tileCostDiscount.toFixed(2)}%)
							</span>
						)}
					</div>
					<div
						className={cn('text-xs mb-1', {
							'text-amber-300': canManuallySelect,
							'text-white': tilesUntilManualSelection === 1,
							'text-gray-500': tilesUntilManualSelection > 1,
						})}>
						{canManuallySelect && '◆ This tile can be selected upon purchase'}
						{tilesUntilManualSelection === 1 && '◇ Next tile will be selectable'}
						{tilesUntilManualSelection > 1 &&
							`◇ ${tilesUntilManualSelection} tiles until manual selection`}
					</div>
					<div className='px-tip-muted text-xs text-center'>Click to explore</div>
				</div>
			);
		}

		return null;
	}
);

TileStatus.displayName = 'TileStatus';
