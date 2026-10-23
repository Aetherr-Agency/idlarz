import React from 'react';
import { MERCHANT_RESOURCE_INFO, MERCHANT_RESOURCE_PRICES } from '@/config/gameConfig';
import ResourceIcon from '../../ResourceIcon';

// Extracted component for merchant price list
export const MerchantPriceList: React.FC = () => {
	return (
		<div className='mt-auto w-full px-card'>
			<h4 className='px-h text-center'>
				Prices (per unit)
			</h4>
			{Object.entries(MERCHANT_RESOURCE_PRICES).map(([resource, price]) => (
				<div
					key={resource}
					className='flex justify-between items-center mb-1 text-xs'>
					<span className='text-[#d8c8a0] flex items-center'>
						<span className='mr-1'><ResourceIcon resource={resource} /></span>
						{
							MERCHANT_RESOURCE_INFO[
								resource as keyof typeof MERCHANT_RESOURCE_INFO
							].label
						}
					</span>
					<span className='text-yellow-400 inline-flex items-center gap-1'>{price} <ResourceIcon resource='gold' /></span>
				</div>
			))}
		</div>
	);
};
