import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { Resources } from '@/types/game';
import { formatNumber } from '@/utils/formatters';
import { HEADER_DISPLAYED_RESOURCES_INFO, RESOURCE_ICONS } from '@/config/gameConfig';

const ResourceDisplay: React.FC = () => {
	const resources = useGameStore((state) => state.resources);
	const resourceRates = useGameStore((state) => state.resourceRates);

	// Define resources to display (including meat)
	const resourcesToDisplay = Object.keys(resources) as Array<keyof Resources>;

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
		</>
	);
};

export default ResourceDisplay;
