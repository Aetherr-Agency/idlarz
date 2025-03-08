import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { RESOURCE_ICONS } from '@/config/gameConfig';

// Resource pricing constants (gold per unit)
const RESOURCE_PRICES = {
	wood: 0.75,
	stone: 0.75,
	coal: 1.25,
	food: 0.5,
};

// Resource display information
const RESOURCE_INFO = {
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
};

// Merchant tab options
type MerchantTab = 'exchange' | 'buy' | 'upgrade' | 'quests' | 'gambling';

interface MerchantTabInfo {
	id: MerchantTab;
	label: string;
	emoji: string;
	description: string;
}

const MERCHANT_TABS: MerchantTabInfo[] = [
	{
		id: 'exchange',
		label: 'Exchange',
		emoji: '💱',
		description: 'Sell your resources for gold',
	},
	{
		id: 'buy',
		label: 'Buy Items',
		emoji: '🛒',
		description: 'Purchase useful items and equipment',
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

// Extracted component for the resource selling section
interface ResourceSellingSectionProps {
	resource: keyof typeof RESOURCE_PRICES;
	maxAmount: number;
	currentAmount: number;
	goldValue: number;
	onAmountChange: (
		resource: keyof typeof RESOURCE_PRICES,
		amount: number
	) => void;
	onSell: (resource: keyof typeof RESOURCE_PRICES) => void;
	onSellAll: (resource: keyof typeof RESOURCE_PRICES) => void;
}

const ResourceSellingSection: React.FC<ResourceSellingSectionProps> = ({
	resource,
	maxAmount,
	currentAmount,
	goldValue,
	onAmountChange,
	onSell,
	onSellAll,
}) => {
	const resourceInfo = RESOURCE_INFO[resource];

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
						{RESOURCE_PRICES[resource]} 💰 each
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

// Extracted component for tab content placeholders
interface PlaceholderTabContentProps {
	title: string;
	emoji: string;
	description: string;
}

const PlaceholderTabContent: React.FC<PlaceholderTabContentProps> = ({
	title,
	emoji,
	description,
}) => {
	return (
		<>
			<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
				{title}
			</h2>
			<div className='flex flex-col items-center justify-center h-[60vh]'>
				<div className='text-6xl mb-6'>{emoji}</div>
				<p className='text-gray-400 text-center'>{description}</p>
			</div>
		</>
	);
};

// Extracted component for merchant price list
const MerchantPriceList: React.FC = () => {
	return (
		<div className='mt-auto w-full p-3 bg-gray-800 rounded-lg border border-amber-800'>
			<h4 className='text-amber-400 text-xs text-center mb-2'>
				Prices (per unit)
			</h4>
			{Object.entries(RESOURCE_PRICES).map(([resource, price]) => (
				<div
					key={resource}
					className='flex justify-between items-center mb-1 text-xs'>
					<span className='text-gray-300 flex items-center'>
						<span className='mr-1'>
							{RESOURCE_INFO[resource as keyof typeof RESOURCE_INFO].icon}
						</span>
						{RESOURCE_INFO[resource as keyof typeof RESOURCE_INFO].label}
					</span>
					<span className='text-yellow-400'>{price} 💰</span>
				</div>
			))}
		</div>
	);
};

// Extracted component for merchant tab buttons
interface MerchantTabButtonsProps {
	activeTab: MerchantTab;
	onTabChange: (tab: MerchantTab) => void;
}

const MerchantTabButtons: React.FC<MerchantTabButtonsProps> = ({
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

const MerchantOverlay: React.FC = () => {
	const { showMerchantWindow, toggleMerchantWindow, resources, sellResources } =
		useGameStore();

	// State for current merchant tab
	const [activeTab, setActiveTab] = useState<MerchantTab>('exchange');

	// State for the amount to sell for each resource
	const [sellAmounts, setSellAmounts] = useState<
		Record<keyof typeof RESOURCE_PRICES, number>
	>({
		wood: 0,
		stone: 0,
		coal: 0,
		food: 0,
	});

	// For showing success message after selling
	const [saleMessage, setSaleMessage] = useState<{
		resource: string;
		amount: number;
		gold: number;
	} | null>(null);

	if (!showMerchantWindow) return null;

	// Calculate the max for each resource (current owned amount)
	const maxAmounts = {
		wood: resources.wood,
		stone: resources.stone,
		coal: resources.coal,
		food: resources.food,
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
				gold: goldGained,
			});

			// Reset the slider for this resource
			setSellAmounts((prev) => ({
				...prev,
				[resource]: 0,
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
				gold: goldGained,
			});

			// Clear message after 3 seconds
			setTimeout(() => {
				setSaleMessage(null);
			}, 3000);
		}
	};

	// Handle changing the amount of a resource to sell
	const handleAmountChange = (
		resource: keyof typeof RESOURCE_PRICES,
		amount: number
	) => {
		setSellAmounts({
			...sellAmounts,
			[resource]: amount,
		});
	};

	// Calculate gold to be gained for the current selection
	const calculateGold = (
		resource: keyof typeof RESOURCE_PRICES,
		amount: number
	) => {
		return Math.floor(amount * RESOURCE_PRICES[resource]);
	};

	// Render tab content based on active tab
	const renderTabContent = () => {
		switch (activeTab) {
			case 'exchange':
				return (
					<>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Resource Exchange
						</h2>

						{/* Sale success message */}
						{saleMessage && (
							<div className='mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg text-center'>
								<p className='text-green-400'>
									Sold {formatNumber(saleMessage.amount)} {saleMessage.resource}{' '}
									for {formatNumber(saleMessage.gold)} Gold!
								</p>
							</div>
						)}

						<div className='grid grid-cols-2 gap-6'>
							{/* Resource selling section */}
							{Object.keys(RESOURCE_PRICES).map((resource) => {
								const typedResource = resource as keyof typeof RESOURCE_PRICES;
								const maxAmount = maxAmounts[typedResource];
								const currentAmount = sellAmounts[typedResource];
								const goldValue = calculateGold(typedResource, currentAmount);

								return (
									<ResourceSellingSection
										key={resource}
										resource={typedResource}
										maxAmount={maxAmount}
										currentAmount={currentAmount}
										goldValue={goldValue}
										onAmountChange={handleAmountChange}
										onSell={handleSell}
										onSellAll={handleSellAll}
									/>
								);
							})}
						</div>
					</>
				);
			case 'buy':
				return (
					<PlaceholderTabContent
						title='Buy Items'
						emoji='🛒'
						description='Coming soon! Here you&#39;ll be able to purchase various items and equipment for your adventures.'
					/>
				);
			case 'upgrade':
				return (
					<PlaceholderTabContent
						title='Upgrade Items'
						emoji='⚒️'
						description='Coming soon! Enhance your weapons, armor, and other equipment to make them more powerful.'
					/>
				);
			case 'quests':
				return (
					<PlaceholderTabContent
						title='Quests'
						emoji='📜'
						description='Coming soon! Take on special assignments from the merchant for valuable rewards and unique items.'
					/>
				);
			case 'gambling':
				return (
					<PlaceholderTabContent
						title='Gambling'
						emoji='🎲'
						description='Coming soon! Test your luck with various games of chance. Win big or lose it all!'
					/>
				);
			default:
				return null;
		}
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
					{/* Merchant Avatar and Navigation */}
					<div className='col-span-1 flex flex-col gap-4'>
						{/* Merchant Avatar */}
						<div className='bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col items-center'>
							<div className='text-6xl mb-4'>🧙‍♂️</div>
							<h3 className='text-white font-semibold text-center mb-2'>
								Merchant
							</h3>
							<p className='text-gray-400 text-xs text-center mb-4'>
								{`"I'll give you gold for your resources, traveler!"`}
							</p>

							<MerchantPriceList />
						</div>

						{/* Merchant Navigation Tabs */}
						<MerchantTabButtons
							activeTab={activeTab}
							onTabChange={setActiveTab}
						/>
					</div>

					{/* Content Area - Changes based on selected tab */}
					<div className='col-span-4 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col'>
						{renderTabContent()}
					</div>
				</div>
			</div>
		</div>
	);
};

export default MerchantOverlay;
