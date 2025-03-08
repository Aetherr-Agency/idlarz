'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import Grid from '@/components/game/Grid';
import CharacterOverlay from '@/components/game/overlays/CharacterOverlay';
import StatisticsOverlay from '@/components/game/overlays/StatisticsOverlay';
import LevelUpNotification from '@/components/game/overlays/LevelUpNotification';
import LoadingScreen from '@/components/game/overlays/LoadingScreen';
import NamePrompt from '@/components/game/overlays/NamePrompt';
import GameDebug from '@/components/game/GameDebug';
import { TICK_RATE, SCALING_CONFIG } from '@/config/gameConfig';
import MerchantOverlay from '@/components/game/overlays/Merchant/MerchantOverlay';
import FarmOverlay from '@/components/game/overlays/FarmOverlay';
import GameHeader from '@/components/game/GameHeader';
import BiomeSelectionDialog from '@/components/game/BiomeSelectionDialog';

export default function Home() {
	const tick = useGameStore((state) => state.tick);
	const lastTickTime = useRef(Date.now());

	const biomeSelectionActive = useGameStore((state) => state.biomeSelectionActive);
	const selectableBiomes = useGameStore((state) => state.selectableBiomes);
	const selectBiome = useGameStore((state) => state.selectBiome);
	const cancelBiomeSelection = useGameStore((state) => state.cancelBiomeSelection);
	const pendingTileCoords = useGameStore((state) => state.pendingTileCoords);
	const characterStats = useGameStore((state) => state.characterStats);
	const tiles = useGameStore((state) => state.tiles);
	const [clickPosition, setClickPosition] = React.useState<{x: number, y: number} | undefined>(undefined);
	
	const tileCost = (() => {
		if (!pendingTileCoords) return 0;
		
		const ownedTilesCount = tiles.flat().filter(tile => tile.isOwned).length;
		const baseCost = SCALING_CONFIG.costFormula(ownedTilesCount);
		const discountMultiplier = 1 - characterStats.tileCostDiscount / 100;
		return Math.floor(baseCost * discountMultiplier);
	})();

	useEffect(() => {
		const gameLoop = () => {
			const currentTime = Date.now();
			const deltaTime = currentTime - lastTickTime.current;
			lastTickTime.current = currentTime;

			tick(deltaTime);
		};

		const interval = setInterval(gameLoop, TICK_RATE);
		return () => clearInterval(interval);
	}, [tick]);

	useEffect(() => {
		if (biomeSelectionActive && pendingTileCoords) {
			// Get the tile element by its coordinates
			const tileElement = document.getElementById(`tile-${pendingTileCoords.x}-${pendingTileCoords.y}`);
			if (tileElement) {
				const rect = tileElement.getBoundingClientRect();
				setClickPosition({
					x: rect.left + rect.width / 2,
					y: rect.top
				});
			}
		} else {
			setClickPosition(undefined);
		}
	}, [biomeSelectionActive, pendingTileCoords]);

	return (
		<main className='h-screen w-screen overflow-hidden relative'>
			<div className='fixed top-0 left-0 right-0 z-10 bg-gray-900/80 backdrop-blur-sm'>
				<GameHeader />
			</div>
			<Grid />
			<CharacterOverlay />
			<StatisticsOverlay />
			<MerchantOverlay />
			<FarmOverlay />
			<LevelUpNotification />
			<LoadingScreen />
			<NamePrompt />
			<GameDebug />
			
			{/* Biome Selection Dialog */}
			{biomeSelectionActive && selectableBiomes && (
				<BiomeSelectionDialog
					availableBiomes={selectableBiomes}
					onSelect={selectBiome}
					onCancel={cancelBiomeSelection}
					cost={tileCost}
					position={clickPosition}
				/>
			)}
		</main>
	);
}
