import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { BASE_XP_PER_LEVEL, XP_GROWTH_FACTOR } from '@/config/gameConfig';
import PixelIcon from './PixelIcon';
import ShiningStar from './ShiningStar';

// Inner width of the XP frame sprite (72px wide, 3px border each side)
const XP_BAR_INNER_PX = 66;

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

	const menuButtons = [
		{
			icon: 'menu_character',
			title: 'Character',
			active: showCharacterWindow,
			onClick: toggleCharacterWindow,
		},
		{
			icon: 'menu_merchant',
			title: 'Merchant',
			active: showMerchantWindow,
			onClick: toggleMerchantWindow,
		},
		{
			icon: 'menu_farm',
			title: 'Farm',
			active: showFarmWindow,
			onClick: toggleFarmWindow,
		},
	] as const;

	return (
		<div className='pixel-divider-right flex items-center gap-3 shrink-0 pr-6'>
			<div
				className='pixel-profile max-w-64'
				data-active={showStatisticsWindow}
				onClick={toggleStatisticsWindow}>
				<PixelIcon name='hero' alt='Your character' />
				<div className='flex flex-col text-[#ecdcb4] items-start justify-center select-none'>
					<div className='flex items-center gap-2 mb-1.5'>
						<p className='font-bold text-sm overflow-hidden text-ellipsis max-w-24 truncate'>
							{playerName}
						</p>
						{levelUpActive ? (
							<ShiningStar className='animate-pulse-ring' />
						) : (
							<span className='pixel-level-badge'>{level.level}</span>
						)}
					</div>

					<div
						className='pixel-xp'
						title={`XP: ${formatNumber(resources.xp)} / ${formatNumber(
							Math.floor(
								BASE_XP_PER_LEVEL * Math.pow(XP_GROWTH_FACTOR, level.level - 1)
							)
						)}`}>
						<div
							className='pixel-xp-fill'
							style={{ width: `${Math.round(level.progress * XP_BAR_INNER_PX)}px` }}
						/>
					</div>
				</div>
			</div>

			{menuButtons.map((button) => (
				<div
					key={button.icon}
					className='pixel-slot'
					data-active={button.active}
					title={button.title}
					onClick={button.onClick}>
					<PixelIcon name={button.icon} alt={button.title} />
				</div>
			))}
		</div>
	);
};

export default HeaderMenu;
