import React from 'react';
import { RESOURCE_ICONS } from '@/config/gameConfig';

// Resource pricing constants (gold per unit)
const RESOURCE_MERCHANT_PRICES = {
	wood: 0.75,
	stone: 0.75,
	coal: 1.25,
	food: 0.5,
	meat: 3.0,
};

// Resource display information
const RESOURCE_MERCHANT_INFO = {
	wood: {
		icon: RESOURCE_ICONS.wood,
		label: 'Wood',
		description: 'A basic construction material, widely available in forests.',
		priceDescription: 'Common but always in demand.',
	},
	stone: {
		icon: RESOURCE_ICONS.stone,
		label: 'Stone',
		description: 'Durable and versatile building material from quarries.',
		priceDescription: 'Premium quality building material.',
	},
	coal: {
		icon: RESOURCE_ICONS.coal,
		label: 'Coal',
		description: 'Valuable fuel source used for advanced applications.',
		priceDescription: 'Highly sought after for its energy properties.',
	},
	food: {
		icon: RESOURCE_ICONS.food,
		label: 'Food',
		description: 'Sustains population and enables growth.',
		priceDescription: 'Plentiful but essential for survival.',
	},
	meat: {
		icon: RESOURCE_ICONS.meat,
		label: 'Meat',
		description: 'A source of protein for a healthy diet.',
		priceDescription: 'High demand for a nutritious meal.',
	},
};

// Extracted component for merchant price list
export const MerchantPriceList: React.FC = () => {
	return (
		<div className='mt-auto w-full p-3 bg-gray-800 rounded-lg border border-amber-800'>
			<h4 className='text-amber-400 text-xs text-center mb-2'>
				Prices (per unit)
			</h4>
			{Object.entries(RESOURCE_MERCHANT_PRICES).map(([resource, price]) => (
				<div
					key={resource}
					className='flex justify-between items-center mb-1 text-xs'>
					<span className='text-gray-300 flex items-center'>
						<span className='mr-1'>
							{
								RESOURCE_MERCHANT_INFO[
									resource as keyof typeof RESOURCE_MERCHANT_INFO
								].icon
							}
						</span>
						{
							RESOURCE_MERCHANT_INFO[
								resource as keyof typeof RESOURCE_MERCHANT_INFO
							].label
						}
					</span>
					<span className='text-yellow-400'>{price} 💰</span>
				</div>
			))}
		</div>
	);
};
