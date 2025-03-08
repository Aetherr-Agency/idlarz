import React, { memo, useMemo } from 'react';
import { BiomeType } from '@/types/game';
import { BIOMES, SCALING_CONFIG, RESOURCE_ICONS } from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import { countOwnedTiles } from '@/utils/gameUtils';
import { formatNumber } from '@/utils/formatters';
import { BiomeTooltip } from './BiomeTooltip';

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

		const { cost } = useMemo(() => {
			const ownedTilesCount = countOwnedTiles(tiles);
			const baseCost = SCALING_CONFIG.costFormula(ownedTilesCount);
			const discountMultiplier = 1 - characterStats.tileCostDiscount / 100;
			const discountedCost = baseCost * discountMultiplier;

			return {
				cost: discountedCost,
			};
		}, [tiles, characterStats.tileCostDiscount]);

		if (isOwned) {
			const biomeInfo = BIOMES[biome];
			return (
				<div className='space-y-1'>
					<div className='font-bold flex items-center gap-2 text-white text-[13px] uppercase'>
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
					<div className='text-blue-300 text-[12px] uppercase leading-4'>
						🔎 Unexplored Land
					</div>
					<div className='text-sm font-bold text-[12px] mb-3'>
						<span className={canAfford ? 'text-green-400' : 'text-red-400'}>
							{RESOURCE_ICONS.gold} Cost: {formatNumber(cost)} gold
						</span>
						{characterStats.tileCostDiscount > 0 && (
							<span className='text-amber-400 text-[10px] ml-1'>
								(-{characterStats.tileCostDiscount.toFixed(2)}%)
							</span>
						)}
					</div>
					<div className='text-sm text-gray-400 text-[12px] text-center'>
						Click to explore
					</div>
				</div>
			);
		}

		return null;
	}
);

TileStatus.displayName = 'TileStatus';
