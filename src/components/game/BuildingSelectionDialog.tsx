import React from 'react';
import type { FC } from 'react';
import audioManager from '@/utils/audioManager';
import { BUILDINGS } from '@/config/gameConfig';
import { BUILDING_PIXEL_ICONS } from '@/config/pixelIcons';
import PixelIcon from './PixelIcon';
import PixelModal from './PixelModal';

interface BuildingSelectionDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (buildingType: string) => void;
}

const BuildingSelectionDialog: FC<BuildingSelectionDialogProps> = ({
	isOpen,
	onClose,
	onSelect,
}) => {
	if (!isOpen) return null;

	const handleSelect = (buildingType: string) => {
		audioManager.playSound('click');
		onSelect(buildingType);
		onClose();
	};

	return (
		<PixelModal title='Select Building' size='md' onClose={onClose}>
			<p className='text-[#a89878] mb-4'>
				Select a building to construct on this grounds tile.
			</p>

			<div className='grid grid-cols-2 gap-3'>
				{Object.values(BUILDINGS).map((building) => (
					<button
						key={building.name}
						onClick={() => handleSelect(building.name)}
						className='px-card flex items-start gap-3 text-left cursor-pointer hover:brightness-125 transition'>
						<div className='tile-ground tile-ground-yard shrink-0 w-[48px] h-[48px] flex items-center justify-center'>
							<PixelIcon name={BUILDING_PIXEL_ICONS[building.name]} alt={building.label} className='tile-icon' />
						</div>
						<div className='flex-1'>
							<span className='px-tip-title block'>{building.label}</span>
							<div className='text-sm text-[#a89878] mt-1'>{building.description}</div>
						</div>
					</button>
				))}
			</div>
		</PixelModal>
	);
};

export default BuildingSelectionDialog;
