import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { EQUIPMENT_SLOT_INFO } from '@/config/gameConfig';
import { EquipmentSlot, Item } from '@/types/game';
import LevelDetails from './LevelDetails';

const MerchantOverlay: React.FC = () => {
	const { showCharacterWindow, toggleCharacterWindow, equipment, inventory } =
		useGameStore();

	const [hoveredItem, setHoveredItem] = useState<Item | null>(null);

	if (!showCharacterWindow) return null;

	// Calculate total equipment bonuses
	const totalEquipmentBonus: Record<string, number> = {};
	Object.values(equipment).forEach((item) => {
		if (item) {
			Object.entries(item.stats).forEach(([resource, value]) => {
				totalEquipmentBonus[resource] =
					(totalEquipmentBonus[resource] || 0) + value;
			});
		}
	});

	return (
		<div className='fixed inset-[8vh] inset-x-[17vw] bg-black bg-opacity-90 rounded-3xl z-50 flex items-start justify-center overflow-y-auto'>
			<div className='absolute top-4 right-4'>
				<button
					onClick={toggleCharacterWindow}
					className='text-white hover:text-gray-300 transition-colors p-2 text-md focus:outline-none cursor-pointer border border-red-500 bg-red-700 aspect-square leading-0 rounded-sm'
					aria-label='Close character window'>
					✕
				</button>
			</div>

			<div className='w-full h-full p-8 flex flex-col'>
				<div className='grid grid-cols-4 gap-6 h-full'>
					{/* Merchant Avatar */}
					<div className='col-span-1 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 min-w-[200px]'>
						Merchant Avatar
					</div>

					{/* Merchant Section */}
					<div className='col-span-3 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col'>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Merchant
						</h2>

						<div className=''>
							Merchant Content, Resources selling by slider, can sell every resource except gold
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MerchantOverlay;
