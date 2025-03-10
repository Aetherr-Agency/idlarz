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

// Resource pack sizes for purchasing
const RESOURCE_PACK_SIZES = [10, 100, 1000];

// Component for buying resources
interface ResourcePackProps {
	resource: keyof typeof MERCHANT_RESOURCE_PRICES;
	packSize: number;
	onBuy: () => void;
	price: number;
	canAfford: boolean;
}

const ResourcePack: React.FC<ResourcePackProps> = ({
	resource,
	packSize,
	onBuy,
	price,
	canAfford,
}) => {
	const resourceInfo = MERCHANT_RESOURCE_INFO[resource];

	return (
		<div className='bg-gray-700 bg-opacity-30 p-3 rounded-lg border border-gray-600 mb-2'>
			<div className='flex justify-between items-center'>
				<div className='flex items-center gap-2'>
					<span className='text-xl'>{resourceInfo.icon}</span>
					<div>
						<p className='text-white font-medium'>
							{resourceInfo.label} x{formatNumber(packSize)}
						</p>
						<p className='text-xs text-gray-400'>{resourceInfo.description}</p>
					</div>
				</div>
				<div className='flex flex-col items-end'>
					<p className='text-yellow-400 font-medium'>
						{formatNumber(price)} Gold
					</p>
					<button
						onClick={onBuy}
						disabled={!canAfford}
						className={`px-3 py-1 mt-1 rounded text-sm ${
							canAfford
								? 'bg-green-700 hover:bg-green-600 text-white'
								: 'bg-gray-700 text-gray-400 cursor-not-allowed'
						}`}>
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

	// Handle buying a resource pack
	const handleBuyResourcePack = (
		resource: keyof typeof MERCHANT_RESOURCE_PRICES,
		amount: number
	) => {
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
			item: `${MERCHANT_RESOURCE_INFO[resource].label} x${formatNumber(amount)}`,
			price: price,
		});

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
		if (clickMultiplier > 1) return;
		
		// Update game state
		useGameStore.setState((state) => ({
			resources: {
				...state.resources,
				gold: state.resources.gold - price,
			},
			clickMultiplier: 2,
		}));
		
		// Show purchase message
		setPurchaseMessage({
			item: "Double Gold per Click",
			price: price,
		});

		// Clear message after 3 seconds
		setTimeout(() => {
			setPurchaseMessage(null);
		}, 3000);
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
					<>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Buy Items
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

						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							{/* Gold click multiplier upgrade */}
							<div className='bg-gray-700 bg-opacity-30 p-4 rounded-lg border border-gray-600'>
								<h3 className='text-white font-semibold mb-2 flex items-center'>
									<span className='text-xl mr-2'>💰</span> Gold Click Multiplier
								</h3>
								<p className='text-sm text-gray-300 mb-4'>
									Double the amount of gold you earn per click.
								</p>
								
								{clickMultiplier > 1 ? (
									<div className='bg-purple-900 bg-opacity-50 p-2 rounded border border-purple-700 text-center'>
										<p className='text-purple-300 font-medium'>Already purchased!</p>
									</div>
								) : (
									<div className='flex justify-between items-center'>
										<p className='text-yellow-400 font-medium'>
											{formatNumber(250000)} Gold
										</p>
										<button
											onClick={handleBuyClickMultiplier}
											disabled={resources.gold < 250000}
											className={`px-4 py-2 rounded ${
												resources.gold >= 250000
													? 'bg-green-700 hover:bg-green-600 text-white'
													: 'bg-gray-700 text-gray-400 cursor-not-allowed'
											}`}>
											Purchase
										</button>
									</div>
								)}
							</div>

							{/* Resource packs */}
							<div className='bg-gray-700 bg-opacity-30 p-4 rounded-lg border border-gray-600'>
								<h3 className='text-white font-semibold mb-2'>Resource Packs</h3>
								<p className='text-sm text-gray-300 mb-4'>
									Purchase resources in bulk (prices are 2x sell value).
								</p>
								
								<div className='space-y-4'>
									{/* Resource packs by type */}
									{Object.keys(MERCHANT_RESOURCE_PRICES)
										.filter(resource => resource !== 'xp') // Exclude XP
										.map((resource) => {
											const typedResource = resource as keyof typeof MERCHANT_RESOURCE_PRICES;
											
											return (
												<div key={resource} className='mb-3'>
													<h4 className='text-white text-sm font-medium mb-1 flex items-center'>
														<span className='mr-1'>{MERCHANT_RESOURCE_INFO[typedResource].icon}</span>
														{MERCHANT_RESOURCE_INFO[typedResource].label}
													</h4>
													
													{RESOURCE_PACK_SIZES.map((packSize) => {
														const price = calculateResourcePackPrice(typedResource, packSize);
														const canAfford = resources.gold >= price;
														
														return (
															<ResourcePack
																key={`${resource}-${packSize}`}
																resource={typedResource}
																packSize={packSize}
																price={price}
																canAfford={canAfford}
																onBuy={() => handleBuyResourcePack(typedResource, packSize)}
															/>
														);
													})}
												</div>
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
