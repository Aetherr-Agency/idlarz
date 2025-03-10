import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { Resources } from '@/types/game';
import { formatNumber } from '@/utils/formatters';
import { HEADER_DISPLAYED_RESOURCES_INFO, RESOURCE_ICONS } from '@/config/gameConfig';

// Animation item type to track multiple animations
interface AnimationItem {
	id: number;
	amount: number;
	position: { x: number; y: number };
}

const ResourceDisplay: React.FC = () => {
	const resources = useGameStore((state) => state.resources);
	const resourceRates = useGameStore((state) => state.resourceRates);
	const addResources = useGameStore((state) => state.addResources);

	// State for click animations (now an array to support multiple)
	const [animations, setAnimations] = useState<AnimationItem[]>([]);
	const nextAnimationId = useRef(0);
	const goldElementRef = useRef<HTMLDivElement>(null);

	// Define resources to display (including meat)
	const resourcesToDisplay = Object.keys(resources) as Array<keyof Resources>;

	// Function to handle click and award gold (now supports multiple animations)
	const handleGameClick = useCallback(() => {
		// Get the total gold rate per second
		const goldRate = resourceRates.total.gold;
		if (goldRate <= 0) return;

		// Double the gold and add to player's resources
		const goldToAdd = goldRate * 2;
		addResources({ gold: goldToAdd });
		
		// Calculate position for animation relative to gold element
		// Add slight randomness to position for visual variety when overlapping
		if (goldElementRef.current) {
			const rect = goldElementRef.current.getBoundingClientRect();
			const xOffset = Math.random() * 20 - 10; // Random offset between -10 and 10
			const yOffset = Math.random() * 10 - 5;  // Random offset between -5 and 5
			
			const newAnimation: AnimationItem = {
				id: nextAnimationId.current++,
				amount: goldToAdd,
				position: {
					x: rect.right + 10 + xOffset,
					y: rect.top + (rect.height / 2) - 10 + yOffset
				}
			};
			
			// Add the new animation to the array
			setAnimations(prevAnimations => [...prevAnimations, newAnimation]);
			
			// Remove this specific animation after 700ms
			setTimeout(() => {
				setAnimations(prevAnimations => 
					prevAnimations.filter(anim => anim.id !== newAnimation.id)
				);
			}, 700);
		}
	}, [resourceRates.total.gold, addResources]);

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
						ref={resource === 'gold' ? goldElementRef : undefined}
						className='group relative flex items-center justify-center gap-2 text-sm'>
						<div
							className='text-xl md:text-2xl'
							role='img'
							aria-label={resource}>
							{resourceInfo.icon}
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

			{/* Multiple Click Animations */}
			{animations.map(anim => (
				<div 
					key={anim.id}
					className="absolute animate-gold-click font-medium text-yellow-400 z-50"
					style={{ 
						left: `${anim.position.x}px`, 
						top: `${anim.position.y}px` 
					}}>
					+{formatNumber(anim.amount)} 💰
				</div>
			))}
		</>
	);
};

export default ResourceDisplay;
