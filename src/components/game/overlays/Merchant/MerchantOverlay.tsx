import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { ResourceSellingSection } from './ResourceSellingSection';
import { MerchantPriceList } from './MerchantPriceList';
import { MerchantTabButtons } from './MerchantTabButtons';
import {
	MERCHANT_RESOURCE_INFO,
	MERCHANT_RESOURCE_PRICES,
} from '@/config/gameConfig';

// Merchant tab options
type MerchantTab = 'exchange' | 'buy' | 'upgrade' | 'quests' | 'gambling';

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

const MerchantOverlay: React.FC = () => {
	const { showMerchantWindow, toggleMerchantWindow, resources, sellResources } =
		useGameStore();

	// State for current merchant tab
	const [activeTab, setActiveTab] = useState<MerchantTab>('exchange');

	// State for the amount to sell for each resource
	const [sellAmounts, setSellAmounts] = useState<
		Record<keyof typeof MERCHANT_RESOURCE_PRICES, number>
	>({
		wood: 0,
		stone: 0,
		coal: 0,
		food: 0,
		meat: 0,
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
		meat: resources.meat,
	};

	// Handle selling the specified amount of a resource
	const handleSell = (resource: keyof typeof MERCHANT_RESOURCE_PRICES) => {
		if (sellAmounts[resource] <= 0) return;

		const goldGained = sellResources(resource, sellAmounts[resource]);
		if (goldGained) {
			// Set success message
			setSaleMessage({
				resource: MERCHANT_RESOURCE_INFO[resource].label,
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
	const handleSellAll = (resource: keyof typeof MERCHANT_RESOURCE_PRICES) => {
		if (resources[resource] <= 0) return;

		const goldGained = sellResources(resource, resources[resource]);
		if (goldGained) {
			// Set success message
			setSaleMessage({
				resource: MERCHANT_RESOURCE_INFO[resource].label,
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
		resource: keyof typeof MERCHANT_RESOURCE_PRICES,
		amount: number
	) => {
		setSellAmounts({
			...sellAmounts,
			[resource]: amount,
		});
	};

	// Calculate gold to be gained for the current selection
	const calculateGold = (
		resource: keyof typeof MERCHANT_RESOURCE_PRICES,
		amount: number
	) => {
		return Math.floor(amount * MERCHANT_RESOURCE_PRICES[resource]);
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
							{Object.keys(MERCHANT_RESOURCE_PRICES).map((resource) => {
								const typedResource =
									resource as keyof typeof MERCHANT_RESOURCE_PRICES;
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
