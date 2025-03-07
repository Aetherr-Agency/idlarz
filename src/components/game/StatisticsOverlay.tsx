import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import LevelDetails from './LevelDetails';

const StatisticsOverlay: React.FC = () => {
	const { showStatisticsWindow, toggleStatisticsWindow } = useGameStore();

	if (!showStatisticsWindow) return null;

	// Calculate XP needed for next level using the exponential formula

	return (
		<div className='fixed inset-[8vh] inset-x-[17vw] bg-black bg-opacity-90 rounded-3xl z-50 flex items-start justify-center overflow-y-auto'>
			<div className='absolute top-4 right-4'>
				<button
					onClick={toggleStatisticsWindow}
					className='text-white hover:text-gray-300 transition-colors p-2 text-md focus:outline-none cursor-pointer border border-red-500 bg-red-700 aspect-square leading-0 rounded-sm'
					aria-label='Close character window'>
					✕
				</button>
			</div>

			<div className='w-full h-full p-8 flex flex-col'>
				<div className='grid grid-cols-4 gap-6 h-full'>
					<div className='col-span-1 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 min-w-[200px]'>
						<LevelDetails />
					</div>

					<div className='col-span-3 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col'>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							XXX
						</h2>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StatisticsOverlay;
