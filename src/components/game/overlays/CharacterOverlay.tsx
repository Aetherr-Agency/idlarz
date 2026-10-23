import React, { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { EQUIPMENT_SLOT_INFO } from '@/config/gameConfig';
import { EQUIPMENT_PIXEL_ICONS } from '@/config/pixelIcons';
import { EquipmentSlot, Item } from '@/types/game';
import LevelDetails from '../LevelDetails';
import PixelModal from '../PixelModal';
import PixelIcon from '../PixelIcon';
import ResourceIcon from '../ResourceIcon';

// Rarity -> accent colour for the slot glow
const RARITY_GLOW: Record<string, string> = {
	common: '#9a9a9a',
	uncommon: '#4ade80',
	rare: '#60a5fa',
	epic: '#c084fc',
	legendary: '#fb923c',
};

const ItemTooltip: React.FC<{ item: Item }> = ({ item }) => (
	<div className='absolute left-full top-0 ml-2 z-[60] w-56 px-tooltip text-sm pointer-events-none'>
		<div className='px-tip-title mb-1'>{item.name}</div>
		<div className='px-tip-muted text-xs'>Slot: {EQUIPMENT_SLOT_INFO[item.slot].label}</div>
		{item.description && <div className='px-tip-muted text-xs mb-1'>{item.description}</div>}
		{Object.entries(item.stats).map(([resource, value]) => (
			<div
				key={resource}
				className={`flex items-center gap-1 text-xs ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
				<ResourceIcon resource={resource} />
				{value > 0 ? '+' : ''}
				{value}/s
			</div>
		))}
	</div>
);

const EquipmentCard: React.FC<{ slot: EquipmentSlot; label: string; item?: Item }> = ({
	slot,
	label,
	item,
}) => {
	const [hover, setHover] = useState(false);
	return (
		<div
			className='px-card px-equip relative'
			onMouseEnter={() => item && setHover(true)}
			onMouseLeave={() => setHover(false)}
			style={
				item?.rarity
					? { boxShadow: `0 0 10px ${RARITY_GLOW[item.rarity] ?? 'transparent'}55` }
					: undefined
			}>
			<div className='px-equip-slot' data-filled={!!item}>
				<PixelIcon
					name={EQUIPMENT_PIXEL_ICONS[slot]}
					alt={label}
					className={item ? '' : 'px-equip-empty'}
				/>
			</div>
			<div className='min-w-0'>
				<div className='text-xs uppercase tracking-wide text-[#a89878]'>{label}</div>
				{item ? (
					<div className='truncate text-[#f1e6c8]'>{item.name}</div>
				) : (
					<div className='text-[#6a5a48]'>Empty</div>
				)}
			</div>
			{hover && item && <ItemTooltip item={item} />}
		</div>
	);
};

const CharacterOverlay: React.FC = () => {
	const { showCharacterWindow, toggleCharacterWindow, equipment } = useGameStore();

	if (!showCharacterWindow) return null;

	// Sum the per-second bonuses granted by everything equipped
	const bonuses: Record<string, number> = {};
	Object.values(equipment).forEach((item) => {
		if (!item) return;
		Object.entries(item.stats).forEach(([resource, value]) => {
			bonuses[resource] = (bonuses[resource] || 0) + (value as number);
		});
	});

	return (
		<PixelModal
			title='Character'
			icon={<PixelIcon name='menu_character' alt='' />}
			size='lg'
			onClose={toggleCharacterWindow}>
			<div className='grid grid-cols-[300px_1fr] gap-5 h-full'>
				{/* Level medallion + HP/MP flasks + bonuses */}
				<div className='px-panel flex flex-col gap-4 overflow-y-auto'>
					<LevelDetails />
					<div className='border-t-2 px-rule pt-3'>
						<div className='px-h'>Equipment Bonuses</div>
						{Object.keys(bonuses).length === 0 ? (
							<div className='text-[#6a5a48] text-sm'>No bonuses yet</div>
						) : (
							Object.entries(bonuses).map(([resource, value]) => (
								<div
									key={resource}
									className={`flex items-center gap-1 text-sm ${
										value > 0 ? 'text-green-400' : 'text-red-400'
									}`}>
									<ResourceIcon resource={resource} />
									{value > 0 ? '+' : ''}
									{value.toFixed(2)}/s
								</div>
							))
						)}
					</div>
				</div>

				{/* Equipment slots */}
				<div className='px-panel'>
					<div className='px-h text-center'>Equipment</div>
					<div className='grid grid-cols-3 gap-3'>
						{Object.entries(EQUIPMENT_SLOT_INFO).map(([slotKey, info]) => (
							<EquipmentCard
								key={slotKey}
								slot={slotKey as EquipmentSlot}
								label={info.label}
								item={equipment[slotKey as EquipmentSlot] as Item | undefined}
							/>
						))}
					</div>
				</div>
			</div>
		</PixelModal>
	);
};

export default CharacterOverlay;
