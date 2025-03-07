import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import LevelDetails from './LevelDetails';
import { CharacterStats } from '@/types/game';
import { countOwnedTiles, getStatDescription } from '@/utils/gameUtils';
import { formatNumber, formatRate } from '@/utils/formatters';
import audioManager from '@/utils/audioManager';

const StatisticsOverlay: React.FC = () => {
	const {
		showStatisticsWindow,
		toggleStatisticsWindow,
		addStatPoint,
		resourceRates,
		tiles,
		level,
		resources,
		characterStats,
	} = useGameStore();

	// Store previous level to detect level ups
	const prevLevelRef = useRef(level.level);

	// Check for level up and play sound
	useEffect(() => {
		if (level.level > prevLevelRef.current) {
			audioManager.playSound('fanfare');
		}
		prevLevelRef.current = level.level;
	}, [level.level]);

	// Custom stat point allocation with sound
	const handleAddStatPoint = (stat: keyof CharacterStats) => {
		if (characterStats.availablePoints > 0) {
			addStatPoint(stat);
			audioManager.playSound('click');
		}
	};

	if (!showStatisticsWindow) return null;

	const totalOwnedTiles = countOwnedTiles(tiles);

	// Calculate XP needed for next level using the exponential formula
	const calculateResourceStats = (rate: number) => {
		return {
			perSecond: rate,
			perMinute: rate * 60,
			perHour: rate * 3600,
		};
	};

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
				<div className='grid grid-cols-6 gap-6 h-full'>
					<div className='col-span-2 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 min-w-[200px]'>
						<LevelDetails />

						<div className='bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 mt-4'>
							<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
								Character Stats
							</h2>

							{/* Available Points */}
							{characterStats.availablePoints > 0 && (
								<div className='flex justify-between mb-4 bg-gray-700 bg-opacity-40 p-2 rounded-md'>
									<span className='text-yellow-300 font-semibold'>
										Available Points:
									</span>
									<span className='text-yellow-300 font-semibold'>
										{characterStats.availablePoints}
									</span>
								</div>
							)}

							{/* Stats with Add Buttons */}
							<div className='space-y-3'>
								{Object.entries(characterStats).map(([statKey, value]) => {
									if (statKey === 'availablePoints') return null;

									const stat = statKey as keyof Omit<
										CharacterStats,
										'availablePoints'
									>;

									return (
										<div key={stat} className='flex items-center text-sm'>
											<div
												className='flex-1 flex justify-between items-center cursor-help'
												title={getStatDescription(stat)}>
												<span className='text-gray-300 capitalize'>
													{stat}:
												</span>
												<span className='text-blue-400 font-medium'>
													{value}
												</span>
											</div>
											<button
												onClick={() => handleAddStatPoint(stat)}
												disabled={characterStats.availablePoints <= 0}
												className={`ml-2 w-5 h-5 rounded-full flex items-center justify-center text-xl 
                                    ${
																			characterStats.availablePoints > 0
																				? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
																				: 'bg-gray-600 text-gray-400 cursor-not-allowed'
																		}`}
												aria-label={`Add point to ${stat}`}>
												+
											</button>
										</div>
									);
								})}
							</div>

							<div className='mt-4 text-xs text-gray-400 italic'>
								Hover over a stat name to see its description.
								<br />
								You gain 3 stat points with each level up.
							</div>
						</div>
					</div>

					<div className='col-span-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col'>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Statistics
						</h2>

						<div className='bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 text-sm mb-4'>
							<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
								Resource Generation
							</h2>

							<div className='space-y-6 text-xs'>
								{Object.entries(resourceRates.total).map(([resource, rate]) => {
									if (resource === 'xp') return null;

									const timeStats = calculateResourceStats(rate);

									return (
										<div key={resource} className=''>
											<div className='flex justify-between items-center border-b border-gray-700 pb-1 mb-2'>
												<span className='text-gray-300 capitalize font-medium'>
													{resource}
												</span>
												<span
													className={
														rate > 0 ? 'text-green-400' : 'text-red-400'
													}>
													{formatRate(rate)}
												</span>
											</div>

											<div className='pl-4 space-y-1'>
												<div className='flex justify-between'>
													<span className='text-gray-400'>Per minute:</span>
													<span
														className={
															timeStats.perMinute > 0
																? 'text-green-300'
																: 'text-red-300'
														}>
														{formatNumber(timeStats.perMinute)}
													</span>
												</div>
												<div className='flex justify-between'>
													<span className='text-gray-400'>Per hour:</span>
													<span
														className={
															timeStats.perHour > 0
																? 'text-green-300'
																: 'text-red-300'
														}>
														{formatNumber(timeStats.perHour)}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						<div className='bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 text-xs'>
							<div className='grid grid-cols-3 gap-x-6 gap-y-2'>
								<div className='flex justify-between'>
									<span className='text-gray-300'>Level:</span>
									<span className='text-yellow-400'>{level.level}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-300'>XP:</span>
									<span className='text-green-400'>
										{formatNumber(resources.xp)}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-300'>XP Rate:</span>
									<span className='text-green-400'>
										{formatRate(resourceRates.total.xp)}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-300'>Gold:</span>
									<span className='text-yellow-400'>
										{formatNumber(resources.gold)}
									</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-300'>Total Tiles:</span>
									<span className='text-blue-400'>{totalOwnedTiles}</span>
								</div>
								<div className='flex justify-between'>
									<span className='text-gray-300'>Level Progress:</span>
									<span className='text-purple-400'>
										{(level.progress * 100).toFixed(1)}%
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StatisticsOverlay;
