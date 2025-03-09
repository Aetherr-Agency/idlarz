import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { BASE_XP_PER_LEVEL, XP_GROWTH_FACTOR } from '@/config/gameConfig';
import { cn } from '@/lib/utils';

const HeaderMenu: React.FC = () => {
	const {
		resources,
		level,
		playerName,
		toggleCharacterWindow,
		toggleStatisticsWindow,
		toggleMerchantWindow,
		showMerchantWindow,
		showStatisticsWindow,
		showCharacterWindow,
		showFarmWindow,
		toggleFarmWindow,
		characterStats,
	} = useGameStore((state) => state);

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
		<div className='flex items-center gap-2 col-span-3 border-r border-gray-700 border-dotted'>
			<div
				className={cn(
					'max-w-56 border-transparent hover:border-blue-800  hover:bg-blue-950 flex justify-start items-center gap-4 mr-2 cursor-pointer hover:opacity-80 transition-opacity duration-200 border-2 py-1.5 px-2 rounded-xl',
					{
						'border-blue-800 bg-blue-950': showStatisticsWindow,
					}
				)}
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
						<p className='font-bold text-sm overflow-hidden text-ellipsis max-w-30 truncate'>
							{playerName}
						</p>
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
								Math.floor(
									BASE_XP_PER_LEVEL *
										Math.pow(XP_GROWTH_FACTOR, level.level - 1)
								)
							)}`}
						/>
					</div>
				</div>
			</div>

			<div
				onClick={toggleCharacterWindow}
				className={cn(
					'select-none flex items-center justify-center border-2 border-blue-900/20 p-1.5 rounded-xl hover:bg-blue-950 hover:border-blue-800 cursor-pointer hover:opacity-80 transition-opacity duration-200',
					{
						'bg-blue-950 border-blue-800': showCharacterWindow,
					}
				)}>
				⚔️
			</div>

			<div
				onClick={toggleMerchantWindow}
				className={cn(
					'select-none flex items-center justify-center border-2 border-amber-900/20 p-1.5 rounded-xl hover:bg-amber-950 hover:border-amber-800 cursor-pointer hover:opacity-80 transition-opacity duration-200',
					{
						'bg-amber-950 border-amber-800': showMerchantWindow,
					}
				)}
				title='Merchant'>
				💰
			</div>
			<div
				onClick={toggleFarmWindow}
				className={cn(
					'select-none flex items-center justify-center border-2 border-green-900/20 p-1.5 rounded-xl hover:bg-green-950 hover:border-green-800 cursor-pointer hover:opacity-80 transition-opacity duration-200',
					{
						'bg-green-950 border-green-800': showFarmWindow,
					}
				)}
				title='Farm'>
				🌾
			</div>
		</div>
	);
};

export default HeaderMenu;
