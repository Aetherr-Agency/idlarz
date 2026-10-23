import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { BASE_XP_PER_LEVEL, XP_GROWTH_FACTOR } from '@/config/gameConfig';
import { LevelUpTimer } from './LevelUpTimer';

type FlaskKind = 'hp' | 'mp';

// Potion flask: liquid level is driven by value/max, with rippling surface and rising bubbles
const Flask: React.FC<{ kind: FlaskKind; value: number; max: number }> = ({
	kind,
	value,
	max,
}) => {
	const fill = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
	const label = kind === 'hp' ? 'HP' : 'MP';
	return (
		<div
			className='flex flex-col items-center gap-1 cursor-help'
			title={`${label}: ${formatNumber(value)} / ${formatNumber(max)}`}>
			<div className='flex items-center gap-2'>
				<span
					className={`text-sm font-bold ${
						kind === 'hp' ? 'text-red-400' : 'text-blue-400'
					}`}>
					{label}
				</span>
			</div>
			<div
				className={`px-flask px-flask-${kind}`}
				style={{ '--s': 2 } as React.CSSProperties}>
				<div className='px-flask-liquid-wrap'>
					<div
						className='px-flask-liquid'
						style={{ '--p': fill } as React.CSSProperties}
					/>
				</div>
				<div className='px-flask-glass' />
			</div>
			<span className='text-xs text-[#d8c8a0] tabular-nums'>
				{formatNumber(value)} / {formatNumber(max)}
			</span>
		</div>
	);
};

const LevelDetails: React.FC = () => {
	const { resources, level, resourceRates, characterStats } = useGameStore();

	// Calculate XP needed for next level using the exponential formula
	const xpForNextLevel = Math.floor(
		BASE_XP_PER_LEVEL * Math.pow(XP_GROWTH_FACTOR, level.level - 1)
	);
	const currentXp = Math.floor(xpForNextLevel * level.progress);

	return (
		<div className='flex flex-col items-center gap-4'>
			{/* XP medallion: bronze ring with a 40-segment band that lights up as XP fills */}
			<div className='group relative'>
				<div className='px-medal'>
					<div className='px-medal-base' />
					<div
						className='px-medal-fill'
						style={{ '--pct': level.progress * 100 } as React.CSSProperties}
					/>
					<div className='absolute inset-0 flex flex-col items-center justify-center select-none'>
						<div className='flex items-baseline gap-1 text-[#f0d27a]'>
							<span className='text-xs opacity-80'>LV</span>
							<span className='text-2xl font-bold leading-none'>{level.level}</span>
						</div>
						<div className='text-[1.65rem] leading-none font-bold text-[#f1e6c8] mt-1'>
							{Math.floor(level.progress * 100)}%
						</div>
						<div className='text-[0.7rem] text-[#a89878] mt-1'>
							{formatNumber(currentXp)} / {formatNumber(xpForNextLevel)}
						</div>
					</div>
				</div>
				<div className='absolute left-1/2 top-full -translate-x-1/2 mt-1 z-[60] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150'>
					<div className='px-tooltip whitespace-nowrap'>
						<LevelUpTimer
							resourceRates={resourceRates}
							resources={resources}
							level={level}
						/>
					</div>
				</div>
			</div>

			{/* HP / MP flasks */}
			<div className='flex items-end justify-center gap-8 pt-2'>
				<Flask kind='hp' value={characterStats.hp} max={characterStats.hp} />
				<Flask kind='mp' value={characterStats.mp} max={characterStats.mp} />
			</div>
		</div>
	);
};

export default LevelDetails;
