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
import { Resources } from '@/types/game';
import { cn } from '@/lib/utils';

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

// Component for resource buying with slider
interface ResourceBuyingSectionProps {
	resource: keyof typeof MERCHANT_RESOURCE_PRICES;
	maxAmount: number;
	currentAmount: number;
	goldPrice: number;
	onAmountChange: (
		resource: keyof typeof MERCHANT_RESOURCE_PRICES,
		amount: number
	) => void;
	onBuy: (resource: keyof typeof MERCHANT_RESOURCE_PRICES) => void;
}

const ResourceBuyingSection: React.FC<ResourceBuyingSectionProps> = ({
	resource,
	maxAmount,
	currentAmount,
	goldPrice,
	onAmountChange,
	onBuy,
}) => {
	const resourceInfo = MERCHANT_RESOURCE_INFO[resource];
	const canAfford = useGameStore((state) => state.resources.gold >= goldPrice);

	return (
		<div className='p-3 bg-gray-800 rounded-lg border border-gray-700'>
			<div className='flex items-center justify-between mb-3'>
				<div className='flex items-center'>
					<span className='text-2xl mr-2'>{resourceInfo.icon}</span>
					<div>
						<h3 className='text-white font-bold text-sm'>
							{resourceInfo.label}
						</h3>
						<p className='text-xs text-gray-400 mr-4'>{resourceInfo.description}</p>
					</div>
				</div>
				<div className='text-right'>
					<div className='text-yellow-400 font-medium text-xs'>
						{MERCHANT_RESOURCE_PRICES[resource] * 2} 💰 each
					</div>
					<div className='text-[10px] text-gray-400 whitespace-nowrap'>
						Max: {formatNumber(maxAmount)}
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
						className={`transition-all font-bold text-green-400 duration-500 ${
							currentAmount <= 0 && 'opacity-0 select-none'
						}`}>
						{formatNumber(currentAmount)}
					</span>
				</div>
			</div>

			<div className='flex justify-between items-center'>
				<div className='text-yellow-400 text-sm'>
					<span className='font-medium'>{formatNumber(goldPrice)}</span> 💰
				</div>
				<div className='flex gap-2 font-bold'>
					<button
						onClick={() => onBuy(resource)}
						disabled={currentAmount <= 0 || !canAfford}
						className='text-[10px] uppercase cursor-pointer px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs disabled:opacity-50 disabled:bg-gray-700 disabled:cursor-not-allowed'>
						Buy
					</button>
				</div>
			</div>
		</div>
	);
};

const MerchantOverlay: React.FC = () => {
	const {
		showMerchantWindow,
		toggleMerchantWindow,
		resources,
		sellResources,
		addResources,
		clickMultiplier,
	} = useGameStore();

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

	// Create state for buy amounts using sliders
	const [buyAmounts, setBuyAmounts] = useState<Record<string, number>>({
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

	// For showing purchase success message
	const [purchaseMessage, setPurchaseMessage] = useState<{
		item: string;
		price: number;
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

	// Handle changing the amount of a resource to buy
	const handleBuyAmountChange = (
		resource: keyof typeof MERCHANT_RESOURCE_PRICES,
		amount: number
	) => {
		setBuyAmounts({
			...buyAmounts,
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

	// Calculate price for resource packs (price is doubled)
	const calculateResourcePackPrice = (
		resource: keyof typeof MERCHANT_RESOURCE_PRICES,
		amount: number
	) => {
		return Math.floor(amount * MERCHANT_RESOURCE_PRICES[resource] * 2);
	};

	// Handle buying a resource with slider
	const handleBuyResource = (
		resource: keyof typeof MERCHANT_RESOURCE_PRICES
	) => {
		const amount = buyAmounts[resource];
		if (amount <= 0) return;

		const price = calculateResourcePackPrice(resource, amount);

		// Check if player can afford it
		if (resources.gold < price) return;

		// Subtract gold and add resources
		const resourcesUpdate: Partial<Resources> = {
			gold: -price,
			[resource]: amount,
		};

		addResources(resourcesUpdate);

		// Show purchase message
		setPurchaseMessage({
			item: `${MERCHANT_RESOURCE_INFO[resource].label} x${formatNumber(
				amount
			)}`,
			price: price,
		});

		// Reset the slider for this resource
		setBuyAmounts((prev) => ({
			...prev,
			[resource]: 0,
		}));

		// Clear message after 3 seconds
		setTimeout(() => {
			setPurchaseMessage(null);
		}, 3000);
	};

	// Handle buying the gold click multiplier
	const handleBuyClickMultiplier = () => {
		const price = 250000; // 250k gold

		// Check if player can afford it
		if (resources.gold < price) return;

		// Check if already purchased
		if (clickMultiplier >= 4) return; // Already purchased (>= 4 because initial is 2)

		// Update game state - double the current multiplier
		useGameStore.setState((state) => ({
			resources: {
				...state.resources,
				gold: state.resources.gold - price,
			},
			clickMultiplier: state.clickMultiplier * 2, // Double the current multiplier
		}));

		// Show purchase message
		setPurchaseMessage({
			item: 'Double Gold per Click',
			price: price,
		});

		// Clear message after 3 seconds
		setTimeout(() => {
			setPurchaseMessage(null);
		}, 3000);
	};

	// Calculate max buy amount based on player's gold
	const calculateMaxBuyAmount = (
		resource: keyof typeof MERCHANT_RESOURCE_PRICES
	) => {
		const unitPrice = MERCHANT_RESOURCE_PRICES[resource] * 2;
		return Math.floor(resources.gold / unitPrice);
	};

	// Render tab content based on active tab
	const renderTabContent = () => {
		switch (activeTab) {
			case 'exchange':
				return (
					<>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Sell resources
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
					<>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Buy Goods
						</h2>

						{/* Purchase success message */}
						{purchaseMessage && (
							<div className='mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg text-center'>
								<p className='text-green-400'>
									Purchased {purchaseMessage.item} for{' '}
									{formatNumber(purchaseMessage.price)} Gold!
								</p>
							</div>
						)}

						<div className='xxx'>
							{/* Gold click multiplier upgrade */}
							<div className="grid grid-cols-2 gap-4 mb-6">
								<div className={cn('bg-gray-700 bg-opacity-30 p-4 rounded-lg border border-gray-600 text-white', {
									'border-purple-500 bg-purple-900 text-white': clickMultiplier >= 4
								})}>
									<h3 className='font-semibold mb-2 flex items-center text-sm'>
										<span className='text-md mr-2'>💰✨</span> Gold Click
										Multiplier
										{clickMultiplier >= 4 && (
										<span className='ml-2 text-[10px] uppercase text-purple-500'>
										(Already owned)
									</span>
										)}

									</h3>
									<p className='text-sm text-gray-300 mb-4'>
									Double the amount of gold you earn per click (from 2x to 4x).
								</p>

									{clickMultiplier < 4 ? (
										<div className='flex justify-between items-center text-sm mt-2'>
											<p className='text-yellow-400 font-medium'>
												{formatNumber(250000)} 💰
											</p>
											<button
												onClick={handleBuyClickMultiplier}
												disabled={resources.gold < 250000}
												className={`px-4 py-2 rounded border cursor-pointer ${
													resources.gold >= 250000
														? 'border-green-700 bg-green-700 hover:bg-green-600 text-white'
														: 'border-gray-600 bg-gray-500 text-gray-200 cursor-not-allowed'
												}`}>
												{resources.gold >= 250000 ? 'Purchase' : 'Get more gold!'}
											</button>
										</div>
									) : (
										<div className='bg-purple-900 bg-opacity-50 p-2 rounded border border-purple-700 text-center'>
											<p className='text-purple-300 font-medium'>Already purchased! ✅</p>
										</div>
									)}
								</div>
							</div>

							{/* Resource packs */}
							<div className='bg-gray-700 bg-opacity-30 p-4 rounded-lg border border-gray-600'>
								<h3 className='text-white font-semibold mb-2'>
									Resource Packs
								</h3>
								<p className='text-sm text-gray-300 mb-4'>
									Purchase resources in bulk (prices are 2x sell value).
								</p>

								<div className='grid grid-cols-2 gap-4'>
									{/* Resource buying sections with sliders */}
									{Object.keys(MERCHANT_RESOURCE_PRICES)
										.filter((resource) => resource !== 'xp') // Exclude XP
										.map((resource) => {
											const typedResource =
												resource as keyof typeof MERCHANT_RESOURCE_PRICES;
											const maxAmount = calculateMaxBuyAmount(typedResource);
											const currentAmount = buyAmounts[typedResource];
											const goldPrice = calculateResourcePackPrice(
												typedResource,
												currentAmount
											);

											return (
												<ResourceBuyingSection
													key={resource}
													resource={typedResource}
													maxAmount={maxAmount}
													currentAmount={currentAmount}
													goldPrice={goldPrice}
													onAmountChange={handleBuyAmountChange}
													onBuy={handleBuyResource}
												/>
											);
										})}
								</div>
							</div>
						</div>
					</>
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
