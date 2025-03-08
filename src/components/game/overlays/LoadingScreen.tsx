import React, { useEffect } from 'react';
import { useHydration } from '@/hooks/useHydration';
import '@/styles/LoadingScreen.css';

const LoadingScreen: React.FC = () => {
	const isHydrated = useHydration();
	// Get some game state for debugging

	// Force show game after 5 seconds regardless of hydration status
	useEffect(() => {
		const forceTimer = setTimeout(() => {
			document.getElementById('force-show-button')?.click();
		}, 5000);

		return () => clearTimeout(forceTimer);
	}, []);

	if (isHydrated) return null;

	return (
		<div className='loading-screen'>
			<div className='loading-content'>
				<div className='loading-castle'>🏰</div>
				<div className='loading-text'>Building your kingdom...</div>
				<div className='loading-spinner'>
					<div className='spinner'></div>
				</div>
			</div>
		</div>
	);
};

export default LoadingScreen;
