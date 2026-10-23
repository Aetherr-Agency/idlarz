import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

const MIN_SPLASH_MS = 1800; // keep the loading animation visible long enough to read as intentional

/** True once the saved game has been loaded from the vault AND the splash has been shown for a moment. */
export const useHydration = () => {
	const storeReady = useGameStore((state) => state.isHydrated);
	const [splashDone, setSplashDone] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS);
		return () => clearTimeout(timer);
	}, []);

	return storeReady && splashDone;
};
