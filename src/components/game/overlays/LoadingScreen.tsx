import React from 'react';
import { useHydration } from '@/hooks/useHydration';
import '@/styles/LoadingScreen.css';

const LoadingScreen: React.FC = () => {
	const isHydrated = useHydration();
	// Get some game state for debugging

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
