import { useState, useEffect } from 'react';

/**
 * Hook to handle initial loading state with a safety timeout
 */
export const useHydration = () => {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		// This effect only runs once on client-side
		// Set hydrated to true after a brief delay to allow React to render
		const timer = setTimeout(() => {
			setHydrated(true);
			console.log('Hydration completed via timeout');
		}, 2500); // 2.5 second timeout should be enough for most cases

		return () => clearTimeout(timer);
	}, []);

	return hydrated;
};
