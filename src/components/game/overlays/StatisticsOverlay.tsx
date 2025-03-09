import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { CharacterStats } from '@/types/game';
import LevelDetails from '../LevelDetails';
import { countOwnedTiles, getStatDescription } from '@/utils/gameUtils';
import { formatNumber, formatRate } from '@/utils/formatters';
import audioManager from '@/utils/audioManager';
import { CASTLE_BASE_RATES } from '@/config/gameConfig';

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

	// Format percentage values
	const formatPercentage = (value: number) => {
		return `${value.toFixed(2)}%`;
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
							{/* Available Points */}
							{characterStats.availablePoints > 0 && (
								<div className='flex justify-between mb-4 bg-gray-700 bg-opacity-40 p-2 rounded-md text-sm'>
									<span className='text-yellow-300 font-semibold'>
										Available points
									</span>
									<span className='text-yellow-300 font-semibold'>
										{characterStats.availablePoints}
									</span>
								</div>
							)}

							{/* Base Stats with Add Buttons */}
							<div className='space-y-3 mb-6'>
								<h3 className='text-white text-sm font-semibold mb-2 border-b border-gray-700 pb-1'>
									Base Stats
								</h3>
								{Object.entries(characterStats)
									.filter(([statKey]) =>
										[
											'strength',
											'dexterity',
											'intelligence',
											'vitality',
											'charisma',
											'availablePoints',
										].includes(statKey)
									)
									.map(([statKey, value]) => {
										if (statKey === 'availablePoints') return null;

										const stat = statKey as keyof Omit<
											CharacterStats,
											'availablePoints'
										>;

										return (
											<div
												key={stat}
												className='flex items-center text-xs mb-1.5'>
												<div className='group relative flex-1 flex justify-between items-center cursor-help'>
													<span className='text-gray-300 capitalize'>
														{stat}:
													</span>
													<span className='text-blue-400 font-medium'>
														{value}
													</span>
													<div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200'>
														<div className='bg-gray-900 bg-opacity-95 rounded-lg p-3 shadow-xl border border-gray-700 min-w-[240px]'>
															<div className='space-y-2'>
																<div className='text-blue-400 text-[12px] uppercase font-medium'>
																	{stat.charAt(0).toUpperCase() + stat.slice(1)}
																</div>
																<div className='space-y-0'>
																	{getStatDescription(stat)
																		.split('/')
																		.map((bonus, index) => (
																			<div
																				key={index}
																				className='text-[10px] text-gray-400'>
																				{bonus.trim()}
																			</div>
																		))}
																</div>
															</div>
														</div>
													</div>
												</div>
												<button
													onClick={() => handleAddStatPoint(stat)}
													disabled={characterStats.availablePoints <= 0}
													className={`ml-2 w-4 h-4 rounded-full flex items-center justify-center text-[14px] leading-0 font-bold 
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

							{/* Combat Stats */}
							<div className='space-y-3 mb-6'>
								<h3 className='text-white text-sm font-semibold mb-2 border-b border-gray-700 pb-1'>
									Combat Stats
								</h3>
								<div className='grid grid-cols-2 gap-x-4 gap-y-2 text-xs'>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>HP:</span>
										<span className='text-green-400 font-medium'>
											{characterStats.hp}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>MP:</span>
										<span className='text-blue-400 font-medium'>
											{characterStats.mp}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>Physical ATK:</span>
										<span className='text-amber-400 font-medium'>
											{characterStats.physicalAtk}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>Magic ATK:</span>
										<span className='text-purple-400 font-medium'>
											{characterStats.magicAtk}
										</span>
									</div>

									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>DEF:</span>
										<span className='text-amber-200 font-medium'>
											{characterStats.def}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>Magic DEF:</span>
										<span className='text-indigo-400 font-medium'>
											{characterStats.magicDef}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>Luck:</span>
										<span className='text-purple-500 font-medium'>
											{characterStats.luck}
										</span>
									</div>
								</div>
							</div>

							{/* Bonus Stats */}
							<div className='space-y-3'>
								<h3 className='text-white text-sm font-semibold mb-2 border-b border-gray-700 pb-1'>
									Bonus Stats
								</h3>
								<div className='grid grid-cols-2 gap-x-4 gap-y-2 text-xs'>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>Crit Chance:</span>
										<span className='text-yellow-300 font-medium'>
											{formatPercentage(characterStats.critChance)}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>Crit DMG:</span>
										<span className='text-orange-400 font-medium'>
											{formatPercentage(characterStats.critDmgMultiplier)}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>ATK Speed:</span>
										<span className='text-blue-300 font-medium'>
											{formatPercentage(characterStats.atkSpeedIncrease)}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>XP Gain:</span>
										<span className='text-green-400 font-medium'>
											{formatPercentage(characterStats.xpGainMultiplier)}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>Tile Discount:</span>
										<span className='text-blue-400 font-medium'>
											{formatPercentage(characterStats.tileCostDiscount)}
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-gray-300'>Reputation:</span>
										<span
											className={`font-medium ${
												characterStats.reputation >= 0
													? 'text-green-400'
													: 'text-red-400'
											}`}>
											{characterStats.reputation}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className='col-span-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col'>
						<div className='bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 text-xs mb-6'>
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

						<div className='bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 text-sm mb-8'>
							<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
								Resource Generation
							</h2>

							<div className='grid grid-cols-2 gap-6 text-xs'>
								{Object.entries(resourceRates.total).map(([resource, rate]) => {
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

											<div className='pl-4 space-y-1 text-[11px]'>
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
							<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
								Resource Modifiers
							</h2>

							<div className='space-y-4'>
								{Object.entries(resourceRates.modifiers).map(
									([resource, modifier]) => {
										const baseValue =
											resourceRates.base[
												resource as keyof typeof resourceRates.base
											];
										const totalValue =
											resourceRates.total[
												resource as keyof typeof resourceRates.total
											];
										const modifierPercent = modifier * 100;

										// Skip XP for modifiers section as it doesn't follow the same rules
										if (resource === 'xp') return null;

										return (
											<div key={`modifier-${resource}`} className=''>
												<div className='flex justify-between items-center border-b border-gray-700 pb-1 mb-2'>
													<span className='text-gray-300 capitalize font-medium'>
														{resource} Modifiers
													</span>
													<span
														className={
															modifierPercent > 0
																? 'text-green-400'
																: 'text-gray-400'
														}>
														+{modifierPercent.toFixed(0)}%
													</span>
												</div>

												<div className='pl-4 space-y-1'>
													<div className='flex justify-between'>
														<span className='text-gray-400'>Base value:</span>
														<span className='text-blue-300'>
															{formatRate(baseValue)}
														</span>
													</div>

													<div className='flex justify-between text-[10px]'>
														<span className='text-gray-500'>
															From castle base:
														</span>
														<span className='text-blue-200'>
															{formatRate(
																CASTLE_BASE_RATES[
																	resource as keyof typeof CASTLE_BASE_RATES
																] || 0
															)}
														</span>
													</div>

													<div className='flex justify-between text-[10px]'>
														<span className='text-gray-500'>
															From biome tiles:
														</span>
														<span className='text-blue-200'>
															{formatRate(
																baseValue -
																	(CASTLE_BASE_RATES[
																		resource as keyof typeof CASTLE_BASE_RATES
																	] || 0)
															)}
														</span>
													</div>

													<div className='mt-1 pt-1 border-t border-gray-700 text-[11px]'>
														<div className='flex justify-between'>
															<span className='text-gray-400'>
																Modifier value:
															</span>
															<span className='text-green-300'>
																{(baseValue * modifier).toFixed(2)}/s
															</span>
														</div>

														<div className='flex justify-between'>
															<span className='text-gray-400'>
																Total with modifiers:
															</span>
															<span className='text-yellow-300'>
																{formatRate(totalValue)}
															</span>
														</div>
													</div>

													<div className='flex justify-between text-[10px] text-gray-500 border-t border-gray-700 pt-1 mt-1'>
														<span>Formula:</span>
														<span>
															{baseValue.toFixed(2)} (base) +{' '}
															{modifier.toFixed(2)} (% mod) ={' '}
															{totalValue.toFixed(2)}{' '}
														</span>
													</div>
												</div>
											</div>
										);
									}
								)}

								<div className='mt-4 border-t border-gray-700 pt-3'>
									<h3 className='text-gray-300 font-medium mb-2'>
										Castle Modifier Details
									</h3>
									<div className='pl-2 space-y-1 text-[11px]'>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Level 1 base bonus:</span>
											<span className='text-green-300'>+20%</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>
												Current castle level:
											</span>
											<span className='text-yellow-300'>
												{(() => {
													// Find castle level
													for (let y = 0; y < tiles.length; y++) {
														for (let x = 0; x < tiles[y].length; x++) {
															const tile = tiles[y][x];
															if (
																tile.isOwned &&
																tile.biome === 'castle' &&
																tile.level
															) {
																return tile.level;
															}
														}
													}
													return 0;
												})()}
											</span>
										</div>
									</div>
								</div>

								<div className='mt-4 border-t border-gray-700 pt-3'>
									<h3 className='text-gray-300 font-medium mb-2'>
										Adjacency Bonuses
									</h3>
									<div className='pl-2 space-y-1 text-[11px]'>
										<div className='flex justify-between'>
											<span className='text-gray-400'>
												Bonus per adjacent same biome:
											</span>
											<span className='text-green-300'>+25%</span>
										</div>
										<div className='flex justify-between'>
											<span className='text-gray-400'>Applied to:</span>
											<span className='text-green-300'>
												Base resource value
											</span>
										</div>
										<div className='flex text-gray-500 text-[10px] italic mt-1'>
											<span>
												Adjacency bonuses apply directly to base generation
												before modifiers
											</span>
										</div>
									</div>
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
