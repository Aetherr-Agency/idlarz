import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/stores/gameStore';
import { Resources } from '@/types/game';
import { formatNumber } from '@/utils/formatters';
import { RESOURCE_ICONS } from '@/config/gameConfig';

const RESOURCE_INFO = {
	gold: {
		icon: RESOURCE_ICONS.gold,
		label: 'Gold',
		description: 'Used to purchase new tiles',
	},
	wood: {
		icon: RESOURCE_ICONS.wood,
		label: 'Wood',
		description: 'Basic construction material',
	},
	stone: {
		icon: RESOURCE_ICONS.stone,
		label: 'Stone',
		description: 'Durable building material',
	},
	coal: {
		icon: RESOURCE_ICONS.coal,
		label: 'Coal',
		description: 'Advanced fuel source',
	},
	food: {
		icon: RESOURCE_ICONS.food,
		label: 'Food',
		description: 'Sustains population growth',
	},
	xp: {
		icon: RESOURCE_ICONS.xp,
		label: 'XP',
		description: 'Get bigger boi!',
	},
} as const;

const ResourceDisplay: React.FC = () => {
	const resources = useGameStore((state) => state.resources);
	const resourceRates = useGameStore((state) => state.resourceRates);
	const tiles = useGameStore((state) => state.tiles);
	const level = useGameStore((state) => state.level);
	const toggleCharacterWindow = useGameStore(
		(state) => state.toggleCharacterWindow
	);
	const toggleStatisticsWindow = useGameStore(
		(state) => state.toggleStatisticsWindow
	);
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

	// Find castle level
	const castleLevel = React.useMemo(() => {
		for (let y = 0; y < tiles.length; y++) {
			for (let x = 0; x < tiles[y].length; x++) {
				const tile = tiles[y][x];
				if (tile.isOwned && tile.biome === 'castle' && tile.level) {
					return tile.level;
				}
			}
		}
		return 1;
	}, [tiles]);

	const castleBonus = React.useMemo(() => {
		return castleLevel > 1
			? `Castle Level ${castleLevel} (+${(
					(Math.pow(1.5, castleLevel - 1) - 1) *
					100
			  ).toFixed(0)}%)`
			: null;
	}, [castleLevel]);

	return (
		<div className='fixed top-0 left-0 right-0 z-50 bg-gray-900 bg-opacity-90 border-b border-gray-800'>
			<div className='max-w-6xl mx-auto px-4 py-2'>
				<div className='grid grid-cols-9 gap-4 md:gap-8'>
					<div className='flex items-center gap-2 col-span-3'>
						<div
							className={`border-transparent hover:border-blue-800  hover:bg-blue-950 flex justify-start items-center gap-4 mr-2 cursor-pointer hover:opacity-80 transition-opacity duration-200 border-2 py-1.5 px-2 rounded-xl ${
								levelUpActive && 'wiggle-animation'
							}`}
							onClick={toggleStatisticsWindow}>
							<Image
								src='/fella.png'
								width={65}
								height={120}
								alt='Your character'
								className='w-fit h-9'
							/>
							<div className='flex flex-col text-white items-start justify-center h-full select-none'>
								<div className='flex items-center gap-2 mb-1'>
									<p className='font-bold text-sm'>Giorgio</p>
									<span
										className={`px-1.5 p-0.5 ${
											levelUpActive ? 'bg-green-800/50' : 'bg-blue-700'
										} rounded-sm text-[10px] font-semibold`}>
										{levelUpActive ? '⭐' : level.level}
									</span>
								</div>

								<div className='w-full h-1.5 bg-gray-700 rounded-full mt-1'>
									<div
										className='h-full bg-green-500 rounded-full transition-all duration-300 ease-out'
										style={{ width: `${level.progress * 100}%` }}
										title={`XP: ${formatNumber(resources.xp)} / ${formatNumber(
											level.level * 1000
										)}`}
									/>
								</div>
							</div>
						</div>

						<div
							onClick={toggleCharacterWindow}
							className='select-none flex items-center justify-center border-2 border-blue-900/20 p-1.5 rounded-xl hover:bg-blue-950 hover:border-blue-800 cursor-pointer hover:opacity-80 transition-opacity duration-200'>
							⚔️
						</div>
					</div>

					{(Object.keys(RESOURCE_INFO) as (keyof Resources)[]).map(
						(resource) => {
							const baseRate = resourceRates.base[resource];
							const totalRate = resourceRates.total[resource];

							// Calculate the additional income by comparing total to base
							const additionalIncome = +(totalRate - baseRate).toFixed(4);

							if (resource === 'xp') {
								return null;
							}

							return (
								<div
									key={resource}
									className='group relative flex items-center justify-center gap-2 text-sm'>
									<div
										className='text-xl md:text-2xl'
										role='img'
										aria-label={resource}>
										{RESOURCE_INFO[resource].icon}
									</div>
									<div className='flex flex-col'>
										<div className='font-medium text-sm md:text-base text-white'>
											{formatNumber(resources[resource])}
										</div>
										<div
											className={`text-xs ${
												totalRate > 0 ? 'text-green-400' : 'text-gray-400'
											}`}>
											{formatNumber(totalRate)}/s
										</div>
									</div>

									{/* Enhanced Tooltip */}
									<div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200'>
										<div className='bg-gray-800 rounded-lg shadow-xl p-3 whitespace-nowrap border border-gray-700'>
											<div className='font-medium mb-1 text-white'>
												{RESOURCE_INFO[resource].label}
											</div>
											<div className='text-sm text-gray-400 mb-2'>
												{RESOURCE_INFO[resource].description}
											</div>
											<div className='space-y-1 text-sm'>
												<div className='flex justify-between gap-4'>
													<span className='text-gray-400'>Base Rate:</span>
													<span className='text-white'>
														{formatNumber(baseRate)}/s
													</span>
												</div>
												{castleBonus && (
													<div className='flex justify-between gap-4'>
														<span className='text-purple-400'>
															Castle Bonus:
														</span>
														<span className='text-purple-400'>
															{castleBonus}
														</span>
													</div>
												)}
												{additionalIncome !== 0 && (
													<div className='flex justify-between gap-4'>
														<span className='text-gray-400'>
															Additional Income:
														</span>
														<span
															className={`${
																additionalIncome > 0
																	? 'text-green-400'
																	: 'text-red-400'
															}`}>
															{additionalIncome > 0 ? '+' : ''}
															{formatNumber(additionalIncome)}/s
														</span>
													</div>
												)}
												<div className='flex justify-between gap-4 border-t border-gray-700 mt-2 pt-2'>
													<span className='text-gray-400'>Total Rate:</span>
													<span
														className={`${
															totalRate > 0 ? 'text-green-400' : 'text-gray-400'
														}`}>
														{formatNumber(totalRate)}/s
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						}
					)}
				</div>
			</div>
		</div>
	);
};

export default ResourceDisplay;
