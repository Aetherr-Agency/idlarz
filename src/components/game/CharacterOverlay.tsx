import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { EQUIPMENT_SLOT_INFO } from '@/config/gameConfig';
import { EquipmentSlot, Item } from '@/types/game';

const RARITY_COLORS = {
	common: 'border-gray-500',
	uncommon: 'border-green-500',
	rare: 'border-blue-500',
	epic: 'border-purple-500',
	legendary: 'border-orange-500',
};

const ItemTooltip: React.FC<{ item: Item }> = ({ item }) => {
	return (
		<div className='absolute z-50 w-48 p-2 bg-gray-900 border border-gray-600 rounded shadow-lg text-sm -mt-24 ml-4'>
			<div className='font-semibold mb-1'>{item.name}</div>
			<div className='text-gray-400'>
				Slot: {EQUIPMENT_SLOT_INFO[item.slot].label}
			</div>
			{item.description && (
				<div className='text-gray-400 text-xs mb-1'>{item.description}</div>
			)}
			{Object.entries(item.stats).map(([resource, value]) => (
				<div
					key={resource}
					className={`${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
					{resource}: {value > 0 ? '+' : ''}
					{value}/s
				</div>
			))}
		</div>
	);
};

const LevelUpTimer: React.FC = () => {
	return (
		<div className='mt-2 text-center'>
			<div className='text-gray-400 text-xs'>Time until level up</div>
			<div className='text-yellow-400 text-sm font-medium'>xxx</div>
		</div>
	);
};

const CharacterOverlay: React.FC = () => {
	const {
		showCharacterWindow,
		toggleCharacterWindow,
		equipment,
		inventory,
		resources,
		level,
	} = useGameStore();

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

	const xpToNextLevel = level.level * 1000;
	const currentXp = Math.floor(resources.xp % 1000);

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
					{/* Character Stats Section */}
					<div className='col-span-1 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 min-w-[200px]'>
						<div className='flex flex-col space-y-4'>
							<div>
								<div className='relative w-44 h-44 mx-auto'>
									{/* Radial progress background */}
									<svg className='w-full h-full' viewBox='0 0 100 100'>
										<circle
											className='text-gray-900 stroke-current'
											strokeWidth='10'
											cx='50'
											cy='50'
											r='40'
											fill='transparent'></circle>
										{/* Radial progress indicator */}
										<circle
											className='text-green-500 stroke-current'
											strokeWidth='10'
											strokeLinecap='round'
											cx='50'
											cy='50'
											r='40'
											fill='transparent'
											strokeDasharray={`${level.progress * 251.2} 251.2`}
											strokeDashoffset='0'
											transform='rotate(-90 50 50)'></circle>
									</svg>
									{/* Percentage text */}
									<div className='absolute inset-0 flex flex-col items-center justify-center'>
										<div className='flex items-start gap-1'>
											<span className='text-gray-400 text-xs leading-0 mt-4'>
												LV
											</span>
											<span className='text-white text-xl font-bold'>
												{level.level}
											</span>
										</div>
										<div className='text-gray-300 text-3xl font-bold'>
											{Math.floor(level.progress * 100)}%
										</div>
										<div className='text-gray-600 text-xs scale-75'>
											{currentXp} / {xpToNextLevel}
										</div>
									</div>
								</div>

								{/* Time estimation until level up */}
								<LevelUpTimer />
							</div>

							<div className='border-t border-gray-700 pt-4'>
								<div className='text-gray-400 text-sm mb-2'>
									Equipment Bonuses
								</div>
								{Object.entries(totalEquipmentBonus).length > 0 ? (
									Object.entries(totalEquipmentBonus).map(
										([resource, value]) => (
											<div key={resource} className='flex justify-between'>
												<span className='text-gray-300 capitalize'>
													{resource}
												</span>
												<span
													className={
														value > 0 ? 'text-green-400' : 'text-red-400'
													}>
													{value > 0 ? '+' : ''}
													{value}/s
												</span>
											</div>
										)
									)
								) : (
									<div className='text-gray-500 text-sm'>No bonuses yet</div>
								)}
							</div>
						</div>
					</div>

					{/* Equipment Section */}
					<div className='col-span-3 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700 flex flex-col'>
						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Equipment
						</h2>

						<div className='grid grid-cols-3 gap-2 mb-6'>
							{Object.entries(EQUIPMENT_SLOT_INFO).map(([slotKey, info]) => {
								const slot = slotKey as EquipmentSlot;
								const item = equipment[slot];

								return (
									<div
										key={slot}
										className='bg-gray-700 p-2 rounded border border-gray-600 transition-colors duration-150'>
										<div className='text-xs text-gray-400 mb-1'>
											{info.label}
										</div>
										{item ? (
											<div
												onMouseEnter={() => setHoveredItem(item)}
												onMouseLeave={() => setHoveredItem(null)}
												className={`flex items-center p-1 rounded cursor-grab relative ${
													item.rarity
														? RARITY_COLORS[item.rarity]
														: 'border-gray-500'
												} border`}>
												<span className='text-2xl mr-2'>{item.icon}</span>
												<span className='text-sm text-white'>{item.name}</span>
												{hoveredItem === item && <ItemTooltip item={item} />}
											</div>
										) : (
											<div className='h-10 flex items-center justify-center text-gray-500 border border-dashed border-gray-500 rounded p-1'>
												<span className='text-lg opacity-50'>{info.icon}</span>
												<span className='text-xs ml-2'>Empty</span>
											</div>
										)}
									</div>
								);
							})}
						</div>

						<h2 className='text-white font-semibold mb-4 text-center border-b border-gray-700 pb-2'>
							Inventory
						</h2>

						<div className='grid grid-cols-5 gap-2 overflow-y-auto'>
							{inventory.map((item) => (
								<div
									key={item.id}
									onMouseEnter={() => setHoveredItem(item)}
									onMouseLeave={() => setHoveredItem(null)}
									className={`p-2 bg-gray-700 rounded border relative cursor-grab ${
										item.rarity ? RARITY_COLORS[item.rarity] : 'border-gray-500'
									}`}>
									<div className='text-2xl mb-1 text-center'>{item.icon}</div>
									<div className='text-xs text-center text-white'>
										{item.name}
									</div>
									{hoveredItem === item && <ItemTooltip item={item} />}
								</div>
							))}
							{inventory.length === 0 && (
								<div className='col-span-5 text-gray-500 text-center p-4'>
									Your inventory is empty
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CharacterOverlay;
