import React from 'react';
import { MERCHANT_RESOURCE_INFO, MERCHANT_RESOURCE_PRICES } from '@/config/gameConfig';

// Extracted component for merchant price list
export const MerchantPriceList: React.FC = () => {
	return (
		<div className='mt-auto w-full p-3 bg-gray-800 rounded-lg border border-amber-800'>
			<h4 className='text-amber-400 text-xs text-center mb-2'>
				Prices (per unit)
			</h4>
			{Object.entries(MERCHANT_RESOURCE_PRICES).map(([resource, price]) => (
				<div
					key={resource}
					className='flex justify-between items-center mb-1 text-xs'>
					<span className='text-gray-300 flex items-center'>
						<span className='mr-1'>
							{
								MERCHANT_RESOURCE_INFO[
									resource as keyof typeof MERCHANT_RESOURCE_INFO
								].icon
							}
						</span>
						{
							MERCHANT_RESOURCE_INFO[
								resource as keyof typeof MERCHANT_RESOURCE_INFO
							].label
						}
					</span>
					<span className='text-yellow-400'>{price} 💰</span>
				</div>
			))}
		</div>
	);
};
