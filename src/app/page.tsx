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
import { TICK_RATE } from '@/config/gameConfig';
import MerchantOverlay from '@/components/game/overlays/Merchant/MerchantOverlay';
import FarmOverlay from '@/components/game/overlays/FarmOverlay';
import GameHeader from '@/components/game/GameHeader';

export default function Home() {
	const tick = useGameStore((state) => state.tick);
	const lastTickTime = useRef(Date.now());

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
		</main>
	);
}
