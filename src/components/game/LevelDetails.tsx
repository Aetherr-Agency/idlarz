import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { BASE_XP_PER_LEVEL, XP_GROWTH_FACTOR } from '@/config/gameConfig';
import { LevelUpTimer } from './LevelUpTimer';

// Level Up Timer Component that updates every second

const LevelDetails: React.FC = () => {
	const { resources, level, resourceRates } = useGameStore();

	// Calculate XP needed for next level using the exponential formula
	const xpForNextLevel = Math.floor(
		BASE_XP_PER_LEVEL * Math.pow(XP_GROWTH_FACTOR, level.level - 1)
	);
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
