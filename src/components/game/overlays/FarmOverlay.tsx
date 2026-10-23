import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import { ANIMALS } from '@/config/gameConfig';
import {
	calculateAnimalCost,
	calculateAnimalProduction,
	countOwnedBiomeTypes,
} from '@/utils/gameUtils';
import audioManager from '@/utils/audioManager';
import PixelModal from '../PixelModal';
import PixelIcon from '../PixelIcon';
import ResourceIcon from '../ResourceIcon';
import { Animal } from '@/types/game';

// Farm Animal Card component for each animal
const FarmAnimalCard: React.FC<{
	animal: Animal;
	level: number;
	canAfford: boolean;
	onPurchase: () => void;
}> = ({ animal, level, canAfford, onPurchase }) => {
	const nextLevelCost = calculateAnimalCost(animal, level);
	const currentProduction =
		level > 0 ? calculateAnimalProduction(animal, level) : 0;
	const nextLevelProduction = calculateAnimalProduction(animal, level + 1);
	const productionIncrease = nextLevelProduction - currentProduction;

	return (
		<div className='px-card relative'>
			<div className='flex items-center gap-4 mb-3'>
				<div className='text-4xl'>{animal.icon}</div>
				<div>
					<h3 className='px-tip-title text-base'>{animal.name}</h3>
					<p className='text-[#a89878] text-sm'>{animal.description}</p>
				</div>
			</div>

			<div className='mt-4 space-y-2'>
				{level > 0 && (
					<div className='flex justify-between text-sm'>
						<span className='text-[#a89878]'>Current Level:</span>
						<span className='text-white font-medium'>{level}</span>
					</div>
				)}

				<div className='flex justify-between text-sm'>
					<span className='text-[#a89878]'>
						{level > 0 ? 'Current Production:' : 'Base Production:'}
					</span>
					<span className='text-red-400 font-medium'>
						<span className='inline-flex items-center gap-1'>{formatNumber(currentProduction)}/s <ResourceIcon resource='meat' /></span>
					</span>
				</div>

				{level > 0 && (
					<div className='flex justify-between text-sm'>
						<span className='text-[#a89878]'>Next Level Production:</span>
						<span className='text-green-400 font-medium'>
							<span className='inline-flex items-center gap-1'>{formatNumber(nextLevelProduction)}/s <ResourceIcon resource='meat' /> (+{formatNumber(productionIncrease)}/s)</span>
						</span>
					</div>
				)}

				<div className='flex justify-between text-sm'>
					<span className='text-[#a89878]'>
						{level > 0 ? 'Upgrade Cost:' : 'Purchase Cost:'}
					</span>
					<span
						className={`font-medium ${
							canAfford ? 'text-green-400' : 'text-red-400'
						}`}>
						<span className='inline-flex items-center gap-1'>{formatNumber(nextLevelCost)} <ResourceIcon resource='food' /></span>
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
					className='px-btn w-full py-2'>
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
		<div className='px-panel'>
			<h3 className='px-h'>Farm Statistics</h3>
			<div className='flex justify-between text-sm'>
				<span className='text-[#a89878]'>Meat Production:</span>
				<span className='text-red-400 font-medium'>
					{formatNumber(totalProduction)}/s
				</span>
			</div>
			<div className='flex justify-between text-sm mt-2'>
				<span className='text-[#a89878]'>Per Minute:</span>
				<span className='text-red-400 font-medium'>
					{formatNumber(totalProduction * 60)}/min
				</span>
			</div>
			<div className='flex justify-between text-sm mt-2'>
				<span className='text-[#a89878]'>Per Hour:</span>
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
	const totalMeatProduction = ANIMALS.reduce(
		(total: number, animal: Animal) => {
			const level = farmLevels[animal.id] || 0;
			if (level > 0) {
				return total + calculateAnimalProduction(animal, level);
			}
			return total;
		},
		0
	);

	// Calculate Plains bonus
	const plainsCount = countOwnedBiomeTypes(tiles, 'plains');
	const plainsBonusPercentage = plainsCount * 5; // 5% per Plains tile
	const hasPlainsBonus = plainsCount > 0;

	// Check if player can afford an animal
	const canAffordAnimal = (animal: Animal) => {
		const level = farmLevels[animal.id] || 0;
		const cost = calculateAnimalCost(animal, level);
		return resources.food >= cost;
	};

	// Handle purchase/upgrade of an animal
	const handlePurchase = (animalId: string) => {
		purchaseAnimal(animalId);
	};

	if (!showFarmWindow) return null;

	return (
		<PixelModal
			title='Farm'
			icon={<PixelIcon name='menu_farm' alt='' />}
			size='lg'
			onClose={() => setShowFarmWindow(false)}>
				<div className='mb-6'>
					<p className='text-[#a89878] text-sm'>
						Purchase and upgrade animals to increase your meat production. Each
						animal produces meat automatically.
					</p>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
					<FarmStats totalProduction={totalMeatProduction} />
					<div className='px-panel'>
						<h3 className='px-h'>Resources</h3>
						<div className='flex justify-between text-sm'>
							<span className='text-[#a89878]'>Available Food:</span>
							<span className='text-green-400 font-medium'>
								<span className='inline-flex items-center gap-1'>{formatNumber(resources.food)} <ResourceIcon resource='food' /></span>
							</span>
						</div>
						<div className='flex justify-between text-sm mt-2'>
							<span className='text-[#a89878]'>Current Meat:</span>
							<span className='text-red-400 font-medium'>
								<span className='inline-flex items-center gap-1'>{formatNumber(resources.meat)} <ResourceIcon resource='meat' /></span>
							</span>
						</div>
						{hasPlainsBonus && (
							<div className='flex justify-between text-sm mt-2'>
								<span className='text-[#a89878]'>Plains Bonus:</span>
								<span className='text-yellow-400 font-medium'>
									<span className='inline-flex items-center gap-1'>+{plainsBonusPercentage}% <ResourceIcon resource='meat' /></span>
								</span>
							</div>
						)}
						{hasPlainsBonus && (
							<div className='mt-2 text-xs text-[#7a6a52]'>
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
		</PixelModal>
	);
};

export default FarmOverlay;
