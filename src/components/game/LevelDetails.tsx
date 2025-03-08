import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber, formatTime, formatRate } from '@/utils/formatters';

// Level Up Timer Component that updates every second
const LevelUpTimer: React.FC<{
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
			const xpForNextLevel = Math.floor(750 * Math.pow(2.0, level.level - 1));
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

const LevelDetails: React.FC = () => {
	const { resources, level, resourceRates } = useGameStore();

	// Calculate XP needed for next level using the exponential formula
	const xpForNextLevel = Math.floor(750 * Math.pow(2.0, level.level - 1));
	const currentXp = Math.floor(xpForNextLevel * level.progress);

	return (
		<div className='flex flex-col space-y-4'>
			<div className='flex flex-row gap-0 items-center justify-center'>
				<div className='relative w-48 h-48 mx-auto'>
					{/* Radial progress background */}
					<svg className='w-full h-full' viewBox='0 0 100 100'>
						<circle
							className='text-gray-900 stroke-current'
							strokeWidth='10'
							cx='50'
							cy='50'
							r='40'
							fill='transparent'></circle>
						{/* Radial progress indicator */}
						<circle
							className='text-green-500 stroke-current'
							strokeWidth='10'
							strokeLinecap='round'
							cx='50'
							cy='50'
							r='40'
							fill='transparent'
							strokeDasharray={`${level.progress * 251.2} 251.2`}
							strokeDashoffset='0'
							transform='rotate(-90 50 50)'></circle>
					</svg>

					{/* Percentage text */}
					<div className='absolute inset-0 flex flex-col items-center justify-center'>
						<div className='flex items-start gap-1'>
							<span className='text-gray-400 text-xs leading-0 mt-4'>LV</span>
							<span className='text-white text-xl font-bold'>
								{level.level}
							</span>
						</div>
						<div className='text-gray-300 text-3xl font-bold group relative cursor-pointer'>
							{Math.floor(level.progress * 100)}%
							<div className='absolute invisible shadow-md group-hover:visible bg-gray-800 p-2 rounded top-1/2 -translate-y-1/2 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-sm border border-gray-700 z-10'>
								<LevelUpTimer
									resourceRates={resourceRates}
									resources={resources}
									level={level}
								/>
							</div>
						</div>
						<div className='text-gray-600 text-xs scale-75'>
							{formatNumber(currentXp)} / {formatNumber(xpForNextLevel)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LevelDetails;
