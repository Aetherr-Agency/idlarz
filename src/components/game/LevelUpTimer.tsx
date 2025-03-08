import React, { useState, useEffect } from 'react';
import { formatTime, formatRate } from '@/utils/formatters';
import { BASE_XP_PER_LEVEL } from '@/config/gameConfig';

// Level Up Timer Component that updates every second
export const LevelUpTimer: React.FC<{
	resourceRates: {
		total: {
			xp: number;
		};
	};
	resources: { xp: number };
	level: { level: number; progress: number };
}> = ({ resourceRates, resources, level }) => {
	const [timeRemaining, setTimeRemaining] = useState('Calculating...');

	useEffect(() => {
		const updateTimer = () => {
			// Get current XP rate
			const xpRate = resourceRates?.total?.xp || 0;
			if (xpRate <= 0) {
				setTimeRemaining('∞');
				return;
			}

			// Calculate remaining XP to level up
			const xpForNextLevel = Math.floor(
				BASE_XP_PER_LEVEL * Math.pow(2.0, level.level - 1)
			);
			const remainingXp = xpForNextLevel * (1 - level.progress);

			// Calculate time in seconds
			const timeInSeconds = remainingXp / xpRate;

			// Format the time
			setTimeRemaining(formatTime(timeInSeconds));
		};

		// Update immediately and set interval
		updateTimer();
		const timer = setInterval(updateTimer, 1000);
		return () => clearInterval(timer);
	}, [resourceRates, resources.xp, level.level, level.progress]);

	return (
		<div className='mt-0 text-center text-xs'>
			<span className='text-green-400 mb-3 block'>
				{formatRate(resourceRates?.total?.xp || 0)} (XP)
			</span>
			<div className='text-gray-400 mb-0.5 block'>Time until level up</div>
			<div className='text-yellow-400 text-sm font-medium'>{timeRemaining}</div>
		</div>
	);
};
