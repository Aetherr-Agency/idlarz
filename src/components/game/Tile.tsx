import React, { memo, useMemo, useState } from 'react';
import { TileProps } from '@/types/game';
import {
	GRID_SIZE,
	GRID_HEIGHT,
	SCALING_CONFIG,
	GRID_CENTER_X,
	GRID_CENTER_Y,
	BUILDINGS,
	BuildingType,
	TILE_TAP,
	CASTLE_UPGRADE,
} from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import { countOwnedTiles } from '@/utils/gameUtils';
import { cn } from '@/lib/utils';
import audioManager from '@/utils/audioManager';
import { queueTileTap } from '@/lib/floatText';
import ResourceIcon from './ResourceIcon';
import PixelIcon from './PixelIcon';
import ShiningStar from './ShiningStar';
import CastleSprite from './CastleSprite';
import { BIOME_PIXEL_ICONS } from '@/config/pixelIcons';
import { TileStatus } from './TileStatus';
import CastleUpgradeDialog from './CastleUpgradeDialog';
import BuildingSelectionDialog from './BuildingSelectionDialog';

const Tile: React.FC<TileProps> = ({
	biome,
	isOwned,
	x,
	y,
	style,
	level,
	building,
}) => {
	const tiles = useGameStore((state) => state.tiles);
	const buyTile = useGameStore((state) => state.buyTile);
	const resources = useGameStore((state) => state.resources);
	const characterStats = useGameStore((state) => state.characterStats);
	const upgradeGroundsTile = useGameStore((state) => state.upgradeGroundsTile);
	const collectChest = useGameStore((state) => state.collectChest);
	const tapTile = useGameStore((state) => state.tapTile);
	const isBiomeSelectionActive = useGameStore(
		(state) => state.biomeSelectionActive
	);
	const pendingTileCoords = useGameStore((state) => state.pendingTileCoords);
	const selectBiome = useGameStore((state) => state.selectBiome);
	const [isShaking, setIsShaking] = useState(false);
	const [showCastleDialog, setShowCastleDialog] = useState(false);
	const [showBuildingDialog, setShowBuildingDialog] = useState(false);
	const [showChestTooltip, setShowChestTooltip] = useState(false);
	const [tapped, setTapped] = useState(false);
	const [cooling, setCooling] = useState(false);

	// Check if this tile has a chest
	const hasChest = tiles?.[y]?.[x]?.hasChest || false;

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

	const castleLevel = tiles?.[GRID_CENTER_Y]?.[GRID_CENTER_X]?.level ?? 1;
	const isMaxCastle = biome === 'castle' && castleLevel >= CASTLE_UPGRADE.maxLevel;

	const ownedTilesCount = useMemo(() => countOwnedTiles(tiles), [tiles]);

	const cost = useMemo(() => {
		const baseCost = SCALING_CONFIG.costFormula(ownedTilesCount);
		const discountMultiplier = 1 - characterStats.tileCostDiscount / 100;
		return Math.floor(baseCost * discountMultiplier);
	}, [ownedTilesCount, characterStats.tileCostDiscount]);

	const canAfford = resources.gold >= cost;

	const handleClick = () => {
		// First priority: If in biome selection mode, handle selection
		if (isBiomeSelectionActive && pendingTileCoords) {
			selectBiome(biome);
			return;
		}

		// Check if this is a chest collection
		if (isOwned && hasChest) {
			const success = collectChest(x, y);
			if (success) {
				audioManager.playSound('click');
				// You could add a special chest collection sound here
			}
			return;
		}

		// Tapping an owned tile also yields a slice of that tile's own output (rate-limited per tile)
		if (isOwned) {
			const tap = tapTile(x, y);
			if (tap) {
				audioManager.playSound('click');
				queueTileTap(tap.items, tap.lucky);
				setTapped(true);
				setCooling(true);
				setTimeout(() => setTapped(false), 160);
				setTimeout(() => setCooling(false), TILE_TAP.cooldownMs);
			}
		}

		// Prioritize owned tiles for special interactions
		if (isOwned) {
			// Castle tile - show castle dialog
			if (biome === 'castle') {
				audioManager.playSound('click');
				setShowCastleDialog(true);
				return;
			}

			// Grounds tile - show building dialog ONLY if not already upgraded
			if (biome === 'grounds' && (!level || level < 2) && !building) {
				audioManager.playSound('click');
				setShowBuildingDialog(true);
				return;
			}

			// For any owned tile, show tooltip
			// toggleTooltip(); // This function is not defined in the provided code
			return;
		}

		if (isAdjacent && !isOwned) {
			if (canAfford) {
				const result = buyTile(x, y);
				// Only play the purchase sound if the tile was actually purchased
				// (not when biome selection was triggered)
				if (result && !useGameStore.getState().biomeSelectionActive) {
					audioManager.playSound('purchase');
				}
			} else if (cost > 0) {
				// Only play wrong sound and shake for adjacent unaffordable tiles
				setIsShaking(true);
				audioManager.playSound('wrong');
				setTimeout(() => setIsShaking(false), 300);
			}
		}
	};

	const handleBuildingSelect = (buildingType: string) => {
		// Upgrade the grounds tile with the selected building
		if (biome === 'grounds') {
			upgradeGroundsTile(x, y, buildingType);
			audioManager.playSound('purchase');
		}
		setShowBuildingDialog(false);
	};

	const farAwayTile = !isOwned && !isAdjacent;

	return (
		<>
			<div
				id={`tile-${x}-${y}`}
				className={cn(
					'absolute transition-all duration-200 ease-in-out select-none',
					{
						'opacity-100': isOwned,
						'tile-unknown': !isOwned && isAdjacent,
						[`tile-ground tile-ground-${biome} tile-owned`]: isOwned,
						'opacity-75': farAwayTile,
						'hover:z-10 cursor-pointer border border-gray-800':
							!isOwned && isAdjacent,
						'hover:border-green-800': !isOwned && isAdjacent && canAfford,
						'hover:border-red-800 cursor-not-allowed':
							!isOwned && isAdjacent && !canAfford,
						'border border-purple-400': biome === 'castle',
						'border-2 border-amber-300':
							(tiles[GRID_CENTER_Y]?.[GRID_CENTER_X]?.level ?? 0) === 10 &&
							biome === 'castle',
						'group hover:z-20': true,
						'opacity-75 border-2 border-red-500': isShaking,
						'cursor-pointer':
							isOwned && (biome === 'castle' || biome === 'grounds' || hasChest),
						'castle-tile': isOwned && biome === 'castle',
						'castle-max-tile': isOwned && isMaxCastle,
						'border-2 border-amber-400': isOwned && hasChest,
						'tile-cooldown': cooling,
					}
				)}
				style={{
					...style,
					...({ '--cd': `${TILE_TAP.cooldownMs}ms` } as React.CSSProperties),
				}}
				onClick={handleClick}
				onMouseEnter={() => hasChest && setShowChestTooltip(true)}
				onMouseLeave={() => setShowChestTooltip(false)}
				role='button'>
				<div
					className={cn(
						'w-full h-full flex items-center justify-center relative',
						{ 'tile-tapped': tapped }
					)}>
					{isOwned && biome === 'castle' && <CastleSprite level={castleLevel} />}
					{isOwned && BIOME_PIXEL_ICONS[biome] && (
						<PixelIcon name={BIOME_PIXEL_ICONS[biome]!} alt={biome} className='tile-icon' />
					)}
					{!isOwned && isAdjacent && (
						<PixelIcon name='unknown' alt='Unexplored' scale={2} className='unknown-mark' />
					)}
					{biome === 'castle' && (
						<span className='tile-badge'>{castleLevel}</span>
					)}

					{/* Bonus cash bag on the tile */}
					{isOwned && hasChest && (
						<PixelIcon name='cash_bag' alt='Bonus gold' className='tile-bag' />
					)}

					{/* Chest tooltip */}
					{isOwned && hasChest && showChestTooltip && (
						<div className='absolute -top-11 left-1/2 -translate-x-1/2 z-[60] px-tooltip whitespace-nowrap text-xs flex items-center gap-1 text-[#f0d27a]'>
							Click to collect bonus gold
							<ResourceIcon resource='gold' />
						</div>
					)}
					
					{biome === 'grounds' && level && level > 1 && (
						<>
							<span className='absolute top-0.5 right-0.5'>
								<ShiningStar />
							</span>
					
							{/* Building icon */}
							<span className='absolute bottom-0.5 right-0.5 text-[14px]'>
								{BUILDINGS[building as BuildingType]?.icon}
							</span>
						</>
					)}
				</div>

				{(isOwned || isAdjacent) && (
					<div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-[60] transition-opacity duration-150'>
						<div className='px-tooltip whitespace-nowrap'>
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

			{/* Castle Upgrade Dialog */}
			{showCastleDialog && (
				<CastleUpgradeDialog onClose={() => setShowCastleDialog(false)} />
			)}

			{/* Building Selection Dialog */}
			{showBuildingDialog && (
				<BuildingSelectionDialog
					isOpen={showBuildingDialog}
					onClose={() => setShowBuildingDialog(false)}
					onSelect={handleBuildingSelect}
				/>
			)}
		</>
	);
};

Tile.displayName = 'Tile';

export default memo(Tile);
