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
		<div className='pixel-header fixed top-0 left-0 right-0 z-50'>
			<div className='max-w-[96%] mx-auto px-4 py-2'>
				{/* Menu block keeps its natural width; resources fill the rest (2 rows of 3 on narrow screens) */}
				<div className='flex items-center gap-4'>
					<HeaderMenu />
					<div className='grid grid-cols-3 min-[1200px]:grid-cols-6 gap-x-2 gap-y-1 flex-1 min-w-0'>
						<ResourceDisplay />
					</div>
				</div>
			</div>
		</div>
	);
};

export default GameHeader;
