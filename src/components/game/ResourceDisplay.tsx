import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '@/stores/gameStore';
import { Resources } from '@/types/game';
import { formatNumber } from '@/utils/formatters';
import { HEADER_DISPLAYED_RESOURCES_INFO, RESOURCE_ICONS } from '@/config/gameConfig';
import { RESOURCE_PIXEL_ICONS } from '@/config/pixelIcons';
import PixelIcon from './PixelIcon';
import StableNumber from './StableNumber';

// Income popup spawned where the player clicked
interface AnimationItem {
	id: number;
	amount: number;
	position: { x: number; y: number };
	drift: number;
}

const POPUP_DURATION_MS = 900;

const ResourceDisplay: React.FC = () => {
	const resources = useGameStore((state) => state.resources);
	const resourceRates = useGameStore((state) => state.resourceRates);
	const addResources = useGameStore((state) => state.addResources);
	const clickMultiplier = useGameStore((state) => state.clickMultiplier);

	const [animations, setAnimations] = useState<AnimationItem[]>([]);
	const nextAnimationId = useRef(0);

	// Define resources to display (including meat)
	const resourcesToDisplay = Object.keys(resources) as Array<keyof Resources>;

	// Award gold on every click and show the income right under the cursor
	const handleGameClick = useCallback(
		(e: MouseEvent) => {
			const goldRate = resourceRates.total.gold;
			if (goldRate <= 0) return;

			const goldToAdd = goldRate * clickMultiplier;
			addResources({ gold: goldToAdd });

			const newAnimation: AnimationItem = {
				id: nextAnimationId.current++,
				amount: goldToAdd,
				position: { x: e.clientX, y: e.clientY },
				drift: Math.round((Math.random() - 0.5) * 36), // sideways wander so rapid clicks fan out
			};

			setAnimations((prev) => [...prev, newAnimation]);
			setTimeout(() => {
				setAnimations((prev) => prev.filter((anim) => anim.id !== newAnimation.id));
			}, POPUP_DURATION_MS);
		},
		[resourceRates.total.gold, addResources, clickMultiplier]
	);

	// Add global click listener
	useEffect(() => {
		window.addEventListener('click', handleGameClick);

		return () => {
			window.removeEventListener('click', handleGameClick);
		};
	}, [handleGameClick]);

	return (
		<>
			{resourcesToDisplay.map((resource) => {
				const baseRate = resourceRates.base[resource];
				const totalRate = resourceRates.total[resource];
				const modifier = resourceRates.modifiers[resource];

				// Format modifier as percentage
				const modifierPercent = Math.round(modifier * 100);

				if (resource === 'xp') {
					return null;
				}

				// Get resource info or use fallback for meat if not in header info
				const resourceInfo = HEADER_DISPLAYED_RESOURCES_INFO[resource] || {
					icon: RESOURCE_ICONS[resource] || '🥩',
					label: resource.charAt(0).toUpperCase() + resource.slice(1),
					description: `${resource.charAt(0).toUpperCase() + resource.slice(1)} resource generated from farm animals`,
				};

				return (
					<div
						key={resource}
						className='group relative flex items-center justify-center gap-2 text-sm'>
						{RESOURCE_PIXEL_ICONS[resource] ? (
							resource === 'gold' ? (
								<div
									className='pixel-gold-shine'
									role='img'
									aria-label={resource}
								/>
							) : (
								<PixelIcon
									name={RESOURCE_PIXEL_ICONS[resource]!}
									alt={resource}
								/>
							)
						) : (
							<div
								className='text-xl md:text-2xl'
								role='img'
								aria-label={resource}>
								{resourceInfo.icon}
							</div>
						)}
						{/* Fixed-width text block: digits sit in equal cells and the block reserves room for
						    the widest value, so growing numbers never shift the icon or the next resource */}
						<div className='flex flex-col'>
							<StableNumber
								value={formatNumber(resources[resource])}
								className='font-semibold text-sm md:text-base text-[#f1e6c8] min-w-[4.6em]'
							/>
							<StableNumber
								value={`${formatNumber(totalRate)}/s`}
								className={`text-xs min-w-[5.6em] ${
									totalRate > 0 ? 'text-green-400' : 'text-gray-400'
								}`}
							/>
						</div>

						{/* Enhanced Tooltip */}
						<div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200 text-xs'>
							<div className='bg-gray-800 rounded-lg shadow-xl p-3 whitespace-nowrap border border-gray-700'>
								<div className='font-medium mb-1 text-white'>
									{resourceInfo.label}
								</div>
								<div className='text-xs text-gray-400 mb-1 text-[11px]'>
									{resourceInfo.description}
								</div>
								<div className='space-y-1 text-[11px]'>
									<div className='flex justify-between gap-4'>
										<span className='text-gray-400'>Base Rate:</span>
										<span className='text-gray-400'>
											{formatNumber(baseRate)}/s
										</span>
									</div>
									<div className='flex justify-between gap-4 mt-1'>
										<span className='text-gray-400'>Modifier:</span>
										<span className='text-green-400'>{modifierPercent}%</span>
									</div>
									<div className='flex justify-between gap-4 mt-1'>
										<span className='text-white'>Total Rate:</span>
										<span className='text-white'>
											{formatNumber(totalRate)}/s
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				);
			})}

			{/* Income popups: portalled to <body> so they are positioned against the viewport,
			    exactly where the player clicked, whatever the header layout does */}
			{animations.length > 0 &&
				createPortal(
					animations.map((anim) => (
						<div
							key={anim.id}
							className='gold-popup'
							style={
								{
									left: anim.position.x,
									top: anim.position.y,
									'--drift': `${anim.drift}px`,
									animationDuration: `${POPUP_DURATION_MS}ms`,
								} as React.CSSProperties
							}>
							<span className='gold-popup-inner'>
								<PixelIcon name='gold' alt='' scale={0.5} />
								+{formatNumber(anim.amount)}
							</span>
						</div>
					)),
					document.body
				)}
		</>
	);
};

export default ResourceDisplay;
