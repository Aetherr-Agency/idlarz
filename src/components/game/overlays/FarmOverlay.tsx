import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { RESOURCE_ICONS } from '@/config/gameConfig';
import { countOwnedBiomeTypes } from '@/utils/gameUtils';
import audioManager from '@/utils/audioManager';

// Animal types and configurations
interface Animal {
	id: string;
	name: string;
	icon: string;
	description: string;
	baseCost: number;
	costScaling: number;
	baseProduction: number;
	productionScaling: number;
}

const ANIMALS: Animal[] = [
	{
		id: 'chicken',
		name: 'Chicken',
		icon: '🐔',
		description: 'A simple farm animal that produces a small amount of meat.',
		baseCost: 10000, // Starting at 10k food as requested
		costScaling: 1.5, // Each level costs 1.5x more
		baseProduction: 0.05, // 0.05 meat per second (3 per minute)
		productionScaling: 1.2, // Each level increases production by 20%
	},
	{
		id: 'deer',
		name: 'Deer',
		icon: '🦌',
		description: 'A wild animal that produces more meat than a chicken.',
		baseCost: 50000,
		costScaling: 1.6,
		baseProduction: 0.2, // 0.2 meat per second (12 per minute)
		productionScaling: 1.25,
	},
	{
		id: 'pig',
		name: 'Pig',
		icon: '🐖',
		description: 'A domestic animal that produces a good amount of meat.',
		baseCost: 200000,
		costScaling: 1.7,
		baseProduction: 0.5, // 0.5 meat per second (30 per minute)
		productionScaling: 1.3,
	},
	{
		id: 'cow',
		name: 'Cow',
		icon: '🐄',
		description: 'A large animal that produces a significant amount of meat.',
		baseCost: 1000000,
		costScaling: 1.8,
		baseProduction: 1.5, // 1.5 meat per second (90 per minute)
		productionScaling: 1.4,
	},
];

// Helper to calculate cost at a specific level
const calculateCost = (animal: Animal, level: number) => {
	return Math.floor(animal.baseCost * Math.pow(animal.costScaling, level));
};

// Helper to calculate production at a specific level
const calculateProduction = (animal: Animal, level: number) => {
	return animal.baseProduction * Math.pow(animal.productionScaling, level - 1);
};

// Farm Animal Card component for each animal
const FarmAnimalCard: React.FC<{
	animal: Animal;
	level: number;
	canAfford: boolean;
	onPurchase: () => void;
}> = ({ animal, level, canAfford, onPurchase }) => {
	const nextLevelCost = calculateCost(animal, level);
	const currentProduction = level > 0 ? calculateProduction(animal, level) : 0;
	const nextLevelProduction = calculateProduction(animal, level + 1);
	const productionIncrease = nextLevelProduction - currentProduction;

	return (
		<div className='p-4 bg-gray-800 rounded-lg border border-gray-700 relative'>
			<div className='flex items-center gap-4 mb-3'>
				<div className='text-4xl'>{animal.icon}</div>
				<div>
					<h3 className='text-white font-bold'>{animal.name}</h3>
					<p className='text-gray-400 text-sm'>{animal.description}</p>
				</div>
			</div>

			<div className='mt-4 space-y-2'>
				{level > 0 && (
					<div className='flex justify-between text-sm'>
						<span className='text-gray-400'>Current Level:</span>
						<span className='text-white font-medium'>{level}</span>
					</div>
				)}

				<div className='flex justify-between text-sm'>
					<span className='text-gray-400'>
						{level > 0 ? 'Current Production:' : 'Base Production:'}
					</span>
					<span className='text-red-400 font-medium'>
						{formatNumber(currentProduction)}/s {RESOURCE_ICONS.meat}
					</span>
				</div>

				{level > 0 && (
					<div className='flex justify-between text-sm'>
						<span className='text-gray-400'>Next Level Production:</span>
						<span className='text-green-400 font-medium'>
							{formatNumber(nextLevelProduction)}/s {RESOURCE_ICONS.meat} (+
							{formatNumber(productionIncrease)}/s)
						</span>
					</div>
				)}

				<div className='flex justify-between text-sm'>
					<span className='text-gray-400'>
						{level > 0 ? 'Upgrade Cost:' : 'Purchase Cost:'}
					</span>
					<span
						className={`font-medium ${
							canAfford ? 'text-green-400' : 'text-red-400'
						}`}>
						{formatNumber(nextLevelCost)} {RESOURCE_ICONS.food}
					</span>
				</div>
			</div>

			<div className='mt-4'>
				<button
					onClick={() => {
						if (canAfford) {
							onPurchase();
							audioManager.playSound('click');
						} else {
							audioManager.playSound('error');
						}
					}}
					disabled={!canAfford}
					className={`w-full py-2 px-4 rounded font-bold text-sm uppercase ${
						canAfford
							? 'bg-green-600 hover:bg-green-500 text-white'
							: 'bg-gray-700 text-gray-500 cursor-not-allowed'
					}`}>
					{level > 0 ? 'Upgrade' : 'Purchase'}
				</button>
			</div>
		</div>
	);
};

// Stats Component
interface FarmStatsProps {
	totalProduction: number;
}

const FarmStats: React.FC<FarmStatsProps> = ({ totalProduction }) => {
	return (
		<div className='p-4 bg-gray-800 rounded-lg border border-gray-700'>
			<h3 className='text-white font-bold mb-2'>Farm Statistics</h3>
			<div className='flex justify-between text-sm'>
				<span className='text-gray-400'>Meat Production:</span>
				<span className='text-red-400 font-medium'>
					{formatNumber(totalProduction)}/s
				</span>
			</div>
			<div className='flex justify-between text-sm mt-2'>
				<span className='text-gray-400'>Per Minute:</span>
				<span className='text-red-400 font-medium'>
					{formatNumber(totalProduction * 60)}/min
				</span>
			</div>
			<div className='flex justify-between text-sm mt-2'>
				<span className='text-gray-400'>Per Hour:</span>
				<span className='text-red-400 font-medium'>
					{formatNumber(totalProduction * 60 * 60)}/hr
				</span>
			</div>
		</div>
	);
};

// Main Farm Overlay Component
const FarmOverlay: React.FC = () => {
	const resources = useGameStore((state) => state.resources);
	const farmLevels = useGameStore((state) => state.farmLevels);
	const tiles = useGameStore((state) => state.tiles);
	const purchaseAnimal = useGameStore((state) => state.purchaseAnimal);
	const showFarmWindow = useGameStore((state) => state.showFarmWindow);
	const setShowFarmWindow = useGameStore((state) => state.setShowFarmWindow);

	// Calculate total meat production
	const totalMeatProduction = ANIMALS.reduce((total: number, animal: Animal) => {
		const level = farmLevels[animal.id] || 0;
		if (level > 0) {
			return total + calculateProduction(animal, level);
		}
		return total;
	}, 0);

	// Calculate Plains bonus
	const plainsCount = countOwnedBiomeTypes(tiles, 'plains');
	const plainsBonusPercentage = plainsCount * 5; // 5% per Plains tile
	const hasPlainsBonus = plainsCount > 0;

	// Check if player can afford an animal
	const canAffordAnimal = (animal: Animal) => {
		const level = farmLevels[animal.id] || 0;
		const cost = calculateCost(animal, level);
		return resources.food >= cost;
	};

	// Handle purchase/upgrade of an animal
	const handlePurchase = (animalId: string) => {
		purchaseAnimal(animalId);
	};

	if (!showFarmWindow) return null;

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm'>
			<div className='bg-gray-900 rounded-lg shadow-xl w-[90%] max-w-4xl max-h-[90vh] overflow-auto p-6'>
				<div className='flex justify-between items-center mb-6'>
					<h2 className='text-2xl font-semibold text-white flex items-center'>
						<span className='mr-2'>🧑‍🌾</span> Farm
					</h2>
					<button
						onClick={() => setShowFarmWindow(false)}
						className='text-gray-400 hover:text-white focus:outline-none'>
						<svg
							className='w-6 h-6'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M6 18L18 6M6 6l12 12'></path>
						</svg>
					</button>
				</div>

				<div className='mb-6'>
					<p className='text-gray-400 text-sm'>
						Purchase and upgrade animals to increase your meat production. Each
						animal produces meat automatically.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<FarmStats totalProduction={totalMeatProduction} />
					<div className='p-4 bg-gray-800 rounded-lg border border-gray-700'>
						<h3 className='text-white font-bold mb-2'>Resources</h3>
						<div className='flex justify-between text-sm'>
							<span className='text-gray-400'>Available Food:</span>
							<span className='text-green-400 font-medium'>
								{formatNumber(resources.food)} {RESOURCE_ICONS.food}
							</span>
						</div>
						<div className='flex justify-between text-sm mt-2'>
							<span className='text-gray-400'>Current Meat:</span>
							<span className='text-red-400 font-medium'>
								{formatNumber(resources.meat)} {RESOURCE_ICONS.meat}
							</span>
						</div>
						{hasPlainsBonus && (
							<div className='flex justify-between text-sm mt-2'>
								<span className='text-gray-400'>Plains Bonus:</span>
								<span className='text-yellow-400 font-medium'>
									+{plainsBonusPercentage}% {RESOURCE_ICONS.meat}
								</span>
							</div>
						)}
						{hasPlainsBonus && (
							<div className='mt-2 text-xs text-gray-500'>
								Each Plains tile provides +5% meat production
							</div>
						)}
					</div>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{ANIMALS.map((animal) => (
						<FarmAnimalCard
							key={animal.id}
							animal={animal}
							level={farmLevels[animal.id] || 0}
							canAfford={canAffordAnimal(animal)}
							onPurchase={() => handlePurchase(animal.id)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};

export default FarmOverlay;
