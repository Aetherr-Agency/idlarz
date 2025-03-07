import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { Item, EquipmentSlot, Resources } from '@/types/game';

const EQUIPMENT_SLOTS: { id: EquipmentSlot; label: string }[] = [
	{ id: 'head', label: 'Head' },
	{ id: 'neck', label: 'Neck' },
	{ id: 'chest', label: 'Chest' },
	{ id: 'mainHand', label: 'Main Hand' },
	{ id: 'offHand', label: 'Off Hand' },
	{ id: 'legs', label: 'Legs' },
	{ id: 'feet', label: 'Feet' },
	{ id: 'ring1', label: 'Ring 1' },
	{ id: 'ring2', label: 'Ring 2' },
];

const formatStat = (value: number): string => {
	return value > 0 ? `+${value}` : value.toString();
};

const ItemTooltip: React.FC<{ item: Item }> = ({ item }) => {
	return (
		<div className='absolute z-50 w-48 p-2 bg-gray-900 border border-gray-600 rounded shadow-lg text-sm -mt-24 ml-4'>
			<div className='font-semibold mb-1'>{item.name}</div>
			<div className='text-gray-400'>Slot: {item.slot}</div>
			{Object.entries(item.stats).map(([resource, value]) => (
				<div
					key={resource}
					className={`${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
					{resource}: {formatStat(value)}/s
				</div>
			))}
		</div>
	);
};

export const CharacterWindow: React.FC = () => {
	const { equipment, inventory, showCharacterWindow, toggleCharacterWindow } =
		useGameStore();
	const [hoveredItem, setHoveredItem] = useState<Item | null>(null);

	if (!showCharacterWindow) return null;

	const totalEquipmentBonus: Partial<Resources> = {};
	Object.values(equipment).forEach((item) => {
		if (item) {
			Object.entries(item.stats).forEach(([resource, value]) => {
				totalEquipmentBonus[resource as keyof Resources] =
					(totalEquipmentBonus[resource as keyof Resources] || 0) + value;
			});
		}
	});

	return (
		<div className='fixed top-20 right-4 w-96 bg-gray-800 border border-gray-600 rounded-lg shadow-lg'>
			<div className='window-header flex justify-between items-center p-2 bg-gray-700 rounded-t-lg cursor-move'>
				<h2 className='text-lg font-semibold text-white'>Character</h2>
				<button
					onClick={toggleCharacterWindow}
					className='text-gray-300 hover:text-white'>
					✕
				</button>
			</div>

			<div className='p-4'>
				{/* Equipment Stats Summary */}
				<div className='mb-4 p-2 bg-gray-700 rounded'>
					<h3 className='text-sm font-semibold text-gray-300 mb-2'>
						Equipment Bonuses
					</h3>
					<div className='grid grid-cols-2 gap-2 text-sm'>
						{Object.entries(totalEquipmentBonus).map(([resource, value]) => (
							<div
								key={resource}
								className={`${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
								{resource}: {formatStat(value)}/s
							</div>
						))}
					</div>
				</div>

				{/* Equipment Slots */}
				<div className='grid grid-cols-3 gap-2 mb-4'>
					{EQUIPMENT_SLOTS.map(({ id, label }) => (
						<div
							key={id}
							data-slot={id}
							className={`relative p-2 bg-gray-700 rounded border border-gray-600 transition-colors duration-200`}>
							<div className='text-xs text-gray-400 mb-1'>{label}</div>
							{equipment[id] ? (
								<div
									onMouseEnter={() => setHoveredItem(equipment[id]!)}
									onMouseLeave={() => setHoveredItem(null)}
									className='flex items-center space-x-2 cursor-grab'>
									<span className='text-2xl'>{equipment[id]!.icon}</span>
									<div className='text-sm'>{equipment[id]!.name}</div>
									{hoveredItem === equipment[id] && (
										<ItemTooltip item={equipment[id]!} />
									)}
								</div>
							) : (
								<div className='h-8 flex items-center justify-center text-gray-500'>
									Empty
								</div>
							)}
						</div>
					))}
				</div>

				{/* Inventory */}
				<div className='mt-4'>
					<h3 className='text-white text-lg mb-2'>Inventory</h3>
					<div className='grid grid-cols-4 gap-2 max-h-48 overflow-y-auto'>
						{inventory.map((item) => (
							<div
								key={item.id}
								onMouseEnter={() => setHoveredItem(item)}
								onMouseLeave={() => setHoveredItem(null)}
								className='relative p-2 bg-gray-700 rounded border border-gray-600 cursor-grab'>
								<div className='text-2xl mb-1'>{item.icon}</div>
								<div className='text-sm text-gray-300'>{item.name}</div>
								{hoveredItem === item && <ItemTooltip item={item} />}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
