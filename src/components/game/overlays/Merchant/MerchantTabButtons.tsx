import { MerchantTab, MerchantTabInfo } from '@/types/game';
import React from 'react';

const MERCHANT_TABS: MerchantTabInfo[] = [
	{
		id: 'exchange',
		label: 'Sell Resources',
		emoji: '💱',
		description: 'Sell your resources for gold',
	},
	{
		id: 'buy',
		label: 'Buy Goods',
		emoji: '🛒',
		description: 'Purchase useful items and resources',
	},
	{
		id: 'upgrade',
		label: 'Upgrade Items',
		emoji: '⚒️',
		description: 'Enhance your existing items',
	},
	{
		id: 'quests',
		label: 'Quests',
		emoji: '📜',
		description: 'Take on special assignments for rewards',
	},
	{
		id: 'gambling',
		label: 'Gambling',
		emoji: '🎲',
		description: 'Test your luck for a chance at riches',
	},
];

// Extracted component for merchant tab buttons
interface MerchantTabButtonsProps {
	activeTab: MerchantTab;
	onTabChange: (tab: MerchantTab) => void;
}

export const MerchantTabButtons: React.FC<MerchantTabButtonsProps> = ({
	activeTab,
	onTabChange,
}) => {
	return (
		<div className='bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700'>
			<div className='flex flex-col gap-2'>
				{MERCHANT_TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`flex items-center p-2 rounded text-left ${
							activeTab === tab.id
								? 'bg-amber-800 text-white'
								: 'hover:bg-gray-700 text-gray-300'
						}`}
						title={tab.description}>
						<span className='mr-2'>{tab.emoji}</span>
						<span className='text-sm'>{tab.label}</span>
					</button>
				))}
			</div>
		</div>
	);
};
