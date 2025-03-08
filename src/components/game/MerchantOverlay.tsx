import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { RESOURCE_ICONS } from '@/config/gameConfig';

// Resource pricing constants (gold per unit)
const RESOURCE_PRICES = {
	wood: 0.75,
	stone: 1.25,
	coal: 2.0,
	food: 0.5
};

// Resource display information
const RESOURCE_INFO = {
	wood: {
		icon: RESOURCE_ICONS.wood,
		label: 'Wood',
		description: 'A basic construction material, widely available in forests.',
		priceDescription: 'Common but always in demand.'
	},
	stone: {
		icon: RESOURCE_ICONS.stone,
		label: 'Stone',
		description: 'Durable and versatile building material from quarries.',
		priceDescription: 'Premium quality building material.'
	},
	coal: {
		icon: RESOURCE_ICONS.coal,
		label: 'Coal',
		description: 'Valuable fuel source used for advanced applications.',
		priceDescription: 'Highly sought after for its energy properties.'
	},
	food: {
		icon: RESOURCE_ICONS.food,
		label: 'Food',
		description: 'Sustains population and enables growth.',
		priceDescription: 'Plentiful but essential for survival.'
	},
};

const MerchantOverlay: React.FC = () => {
	const { showMerchantWindow, toggleMerchantWindow, resources, sellResources } = useGameStore();

	// State for the amount to sell for each resource
	const [sellAmounts, setSellAmounts] = useState<Record<keyof typeof RESOURCE_PRICES, number>>({
		wood: 0,
		stone: 0,
		coal: 0,
		food: 0
	});

	// For showing success message after selling
	const [saleMessage, setSaleMessage] = useState<{resource: string, amount: number, gold: number} | null>(null);

	if (!showMerchantWindow) return null;

	// Calculate the max for each resource (current owned amount)
	const maxAmounts = {
		wood: resources.wood,
		stone: resources.stone,
		coal: resources.coal,
		food: resources.food
	};

	// Handle selling the specified amount of a resource
	const handleSell = (resource: keyof typeof RESOURCE_PRICES) => {
		if (sellAmounts[resource] <= 0) return;
		
		const goldGained = sellResources(resource, sellAmounts[resource]);
		if (goldGained) {
			// Set success message
			setSaleMessage({
				resource: RESOURCE_INFO[resource].label,
				amount: sellAmounts[resource],
				gold: goldGained
			});
			
			// Reset the slider for this resource
			setSellAmounts(prev => ({
				...prev,
				[resource]: 0
			}));
			
			// Clear message after 3 seconds
			setTimeout(() => {
				setSaleMessage(null);
			}, 3000);
		}
	};

	// Handle selling all of a resource
	const handleSellAll = (resource: keyof typeof RESOURCE_PRICES) => {
		if (resources[resource] <= 0) return;
		
		const goldGained = sellResources(resource, resources[resource]);
		if (goldGained) {
			// Set success message
			setSaleMessage({
				resource: RESOURCE_INFO[resource].label,
				amount: resources[resource],
				gold: goldGained
			});
			
			// Clear message after 3 seconds
			setTimeout(() => {
				setSaleMessage(null);
			}, 3000);
		}
	};

	// Calculate gold to be gained for the current selection
	const calculateGold = (resource: keyof typeof RESOURCE_PRICES, amount: number) => {
		return Math.floor(amount * RESOURCE_PRICES[resource]);
	};

	return (
		<div className='fixed inset-[8vh] inset-x-[17vw] bg-gray-900 bg-opacity-95 rounded-3xl z-50 flex items-start justify-center overflow-y-auto'>
			<div className='absolute top-4 right-4'>
				<button
					onClick={toggleMerchantWindow}
					className='text-white hover:text-gray-300 transition-colors p-2 text-md focus:outline-none cursor-pointer border border-red-500 bg-red-700 aspect-square leading-0 rounded-sm'
					aria-label='Close merchant window'>
					✕
				</button>
			</div>

			<div className='w-full h-full p-8 flex flex-col'>
				<div className='grid grid-cols-5 gap-6 h-full'>
					{/* Merchant Avatar */}
					<div className='col-span-1 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col items-center'>
						<div className='text-6xl mb-4'>🧙‍♂️</div>
						<h3 className='text-white font-semibold text-center mb-2'>Merchant</h3>
						<p className='text-gray-400 text-xs text-center mb-4'>
							{`"I'll give you gold for your resources, traveler!"`}
						</p>
						
						<div className='mt-auto w-full p-3 bg-gray-800 rounded-lg border border-amber-800'>
							<h4 className='text-amber-400 text-xs text-center mb-2'>Prices (per unit)</h4>
							{Object.entries(RESOURCE_PRICES).map(([resource, price]) => (
								<div key={resource} className='flex justify-between items-center mb-1 text-xs'>
									<span className='text-gray-300 flex items-center'>
										<span className='mr-1'>{RESOURCE_INFO[resource as keyof typeof RESOURCE_INFO].icon}</span>
										{RESOURCE_INFO[resource as keyof typeof RESOURCE_INFO].label}
									</span>
									<span className='text-yellow-400'>{price} 💰</span>
								</div>
							))}
						</div>
					</div>

					{/* Trading Section */}
					<div className='col-span-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col'>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Resource Exchange
						</h2>

						{/* Sale success message */}
						{saleMessage && (
							<div className='mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg text-center'>
								<p className='text-green-400'>
									Sold {formatNumber(saleMessage.amount)} {saleMessage.resource} for {formatNumber(saleMessage.gold)} Gold!
								</p>
							</div>
						)}

						<div className='space-y-6'>
							{/* Resource selling section */}
							{Object.keys(RESOURCE_PRICES).map((resource) => {
								const typedResource = resource as keyof typeof RESOURCE_PRICES;
								const maxAmount = maxAmounts[typedResource];
								const currentAmount = sellAmounts[typedResource];
								const goldValue = calculateGold(typedResource, currentAmount);
								
								return (
									<div key={resource} className='p-3 bg-gray-800 rounded-lg border border-gray-700'>
										<div className='flex items-center justify-between mb-3'>
											<div className='flex items-center'>
												<span className='text-2xl mr-2'>{RESOURCE_INFO[typedResource].icon}</span>
												<div>
													<h3 className='text-white font-medium'>{RESOURCE_INFO[typedResource].label}</h3>
													<p className='text-xs text-gray-400'>{RESOURCE_INFO[typedResource].priceDescription}</p>
												</div>
											</div>
											<div className='text-right'>
												<div className='text-yellow-400 font-medium'>{RESOURCE_PRICES[typedResource]} 💰 each</div>
												<div className='text-xs text-gray-400'>Available: {formatNumber(maxAmount)}</div>
											</div>
										</div>
										
										<div className='flex items-center gap-4 mb-3'>
											<input
												type='range'
												min='0'
												max={maxAmount}
												value={currentAmount}
												onChange={(e) => setSellAmounts({
													...sellAmounts,
													[typedResource]: parseInt(e.target.value)
												})}
												disabled={maxAmount <= 0}
												className='flex-grow h-2 rounded-lg appearance-none bg-gray-700 disabled:opacity-50'
											/>
											<div className='w-20 text-center'>
												<span className='text-white font-medium'>{formatNumber(currentAmount)}</span>
											</div>
										</div>
										
										<div className='flex justify-between items-center'>
											<div className='text-yellow-400'>
												<span className='font-medium'>{formatNumber(goldValue)}</span> 💰
											</div>
											<div className='flex gap-2'>
												<button
													onClick={() => handleSell(typedResource)}
													disabled={currentAmount <= 0}
													className='px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed'>
													Sell
												</button>
												<button
													onClick={() => handleSellAll(typedResource)}
													disabled={maxAmount <= 0}
													className='px-3 py-1 bg-amber-800 hover:bg-amber-700 text-white rounded text-sm disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed'>
													Sell All
												</button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MerchantOverlay;
