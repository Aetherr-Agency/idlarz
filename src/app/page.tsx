'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import Grid from '@/components/game/Grid';
import ResourceDisplay from '@/components/game/ResourceDisplay';
import CharacterOverlay from '@/components/game/CharacterOverlay';
import StatisticsOverlay from '@/components/game/StatisticsOverlay';
import LevelUpNotification from '@/components/game/LevelUpNotification';
import LoadingScreen from '@/components/LoadingScreen';
import NamePrompt from '@/components/game/NamePrompt';
import GameDebug from '@/components/game/GameDebug';
import { TICK_RATE } from '@/config/gameConfig';
import MerchantOverlay from '@/components/game/MerchantOverlay';
import FarmOverlay from '@/components/game/FarmOverlay';

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
				<ResourceDisplay />
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
