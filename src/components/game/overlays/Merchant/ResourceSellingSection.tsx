import React from 'react';
import { formatNumber } from '@/utils/formatters';
import {
	MERCHANT_RESOURCE_INFO,
	MERCHANT_RESOURCE_PRICES,
} from '@/config/gameConfig';

// Extracted component for the resource selling section
interface ResourceSellingSectionProps {
	resource: keyof typeof MERCHANT_RESOURCE_PRICES;
	maxAmount: number;
	currentAmount: number;
	goldValue: number;
	onAmountChange: (
		resource: keyof typeof MERCHANT_RESOURCE_PRICES,
		amount: number
	) => void;
	onSell: (resource: keyof typeof MERCHANT_RESOURCE_PRICES) => void;
	onSellAll: (resource: keyof typeof MERCHANT_RESOURCE_PRICES) => void;
}

export const ResourceSellingSection: React.FC<ResourceSellingSectionProps> = ({
	resource,
	maxAmount,
	currentAmount,
	goldValue,
	onAmountChange,
	onSell,
	onSellAll,
}) => {
	const resourceInfo = MERCHANT_RESOURCE_INFO[resource];

	return (
		<div className='p-3 bg-gray-800 rounded-lg border border-gray-700'>
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center'>
					<span className='text-2xl mr-2'>{resourceInfo.icon}</span>
					<div>
						<h3 className='text-white font-bold text-sm'>
							{resourceInfo.label}
						</h3>
						<p className='text-xs text-gray-400'>
							{resourceInfo.priceDescription}
						</p>
					</div>
				</div>
				<div className='text-right'>
					<div className='text-yellow-400 font-medium text-sm'>
						{MERCHANT_RESOURCE_PRICES[resource]} 💰 each
					</div>
					<div className='text-xs text-gray-400'>
						Available: {formatNumber(maxAmount)}
					</div>
				</div>
			</div>

			<div className='flex items-center gap-4 mb-3'>
				<input
					type='range'
					min='0'
					max={maxAmount}
					value={currentAmount}
					onChange={(e) => onAmountChange(resource, parseInt(e.target.value))}
					disabled={maxAmount <= 0}
					className='flex-grow h-2 rounded-lg appearance-none bg-gray-700 disabled:opacity-50'
				/>
				<div className='w-20 text-center'>
					<span
						className={`transition-all font-bold text-red-400 duration-500 ${
							currentAmount <= 0 && 'opacity-0 select-none'
						}`}>
						{formatNumber(currentAmount)}
					</span>
				</div>
			</div>

			<div className='flex justify-between items-center'>
				<div className='text-yellow-400 text-sm'>
					<span className='font-medium'>{formatNumber(goldValue)}</span> 💰
				</div>
				<div className='flex gap-2 font-bold'>
					<button
						onClick={() => onSell(resource)}
						disabled={currentAmount <= 0}
						className='text-[10px] uppercase cursor-pointer px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed'>
						Sell
					</button>
					<button
						onClick={() => onSellAll(resource)}
						disabled={maxAmount <= 0}
						className='text-[10px] uppercase cursor-pointer px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed'>
						Sell All
					</button>
				</div>
			</div>
		</div>
	);
};
