import React, { useEffect, useState } from 'react';
import ResourceDisplay from './ResourceDisplay';
import HeaderMenu from './HeaderMenu';
import { useGameStore } from '@/stores/gameStore';

const GameHeader: React.FC = () => {
	const characterStats = useGameStore((state) => state.characterStats);
	const [levelUpActive, setLevelUpActive] = useState(false);
	const [prevAvailablePoints, setPrevAvailablePoints] = useState(0);

	// Detect level up based on available points
	useEffect(() => {
		if (characterStats.availablePoints > prevAvailablePoints) {
			setLevelUpActive(true);
		} else if (characterStats.availablePoints === 0 && levelUpActive) {
			setLevelUpActive(false);
		}
		setPrevAvailablePoints(characterStats.availablePoints);
	}, [characterStats.availablePoints, prevAvailablePoints, levelUpActive]);

	return (
		<div className='fixed top-0 left-0 right-0 z-50 bg-gray-900 bg-opacity-90 border-b border-gray-800'>
			<div className='max-w-8/10 mx-auto px-4 py-2'>
				<div className='grid grid-cols-9 gap-2 md:gap-4'>
					<HeaderMenu />
					<ResourceDisplay />
				</div>
			</div>
		</div>
	);
};

export default GameHeader;
