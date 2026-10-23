import React from 'react';
import type { FC } from 'react';
import { BiomeType, TileCost } from '@/types/game';
import { BIOMES } from '@/config/gameConfig';
import { BIOME_PIXEL_ICONS } from '@/config/pixelIcons';
import PixelIcon from './PixelIcon';
import audioManager from '@/utils/audioManager';
import PixelModal from './PixelModal';
import ResourceIcon from './ResourceIcon';
import CostList from './CostList';
import { tileCostAsResources } from '@/utils/gameUtils';

interface BiomeSelectionDialogProps {
	availableBiomes: BiomeType[];
	onSelect: (biome: BiomeType) => void;
	onCancel: () => void;
	cost: TileCost;
	position?: { x: number; y: number };
}

const formatRate = (rate: number) => {
	if (rate === 0) return '0/s';
	return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}/s`;
};

const BiomeSelectionDialog: FC<BiomeSelectionDialogProps> = ({
	availableBiomes,
	onSelect,
	onCancel,
	cost,
}) => {
	return (
		<PixelModal title='Choose a Biome' size='md' onClose={onCancel}>
			<p className='text-[#a89878] mb-4 flex items-center gap-1 flex-wrap'>
				Every 4th tile allows biome selection. Cost:
				<CostList cost={tileCostAsResources(cost)} />
			</p>

			<div className='grid grid-cols-2 gap-3 mb-4'>
				{availableBiomes.map((biome) => {
					const biomeInfo = BIOMES[biome];
					return (
						<button
							key={biome}
							onClick={() => {
								onSelect(biome);
								audioManager.playSound('purchase');
							}}
							className='px-card flex items-center gap-3 text-left cursor-pointer hover:brightness-125 transition'> 
							<div
								className={`tile-ground tile-ground-${biome} flex-shrink-0 w-12 h-12 flex items-center justify-center`}>
								{BIOME_PIXEL_ICONS[biome] && (
									<PixelIcon name={BIOME_PIXEL_ICONS[biome]!} alt={biomeInfo.label} className='tile-icon' />
								)}
							</div>

							<div className='flex-grow'>
								<span className='px-tip-title block'>{biomeInfo.label}</span>
								<div className='text-sm grid grid-cols-3 gap-x-2 mt-1'>
									{Object.entries(biomeInfo.resourceGeneration || {}).map(
										([resource, rate]) => (
											<div
												key={resource}
												className={`flex items-center gap-0.5 ${
													Number(rate) > 0
														? 'text-green-400'
														: Number(rate) < 0
														? 'text-red-400'
														: 'text-[#a89878]'
												}`}>
												<ResourceIcon resource={resource} />
												<span>{formatRate(Number(rate))}</span>
											</div>
										)
									)}
								</div>
							</div>
						</button>
					);
				})}
			</div>

			<div className='flex justify-end'>
				<button onClick={onCancel} className='px-btn px-btn-red'>
					Cancel
				</button>
			</div>
		</PixelModal>
	);
};

export default BiomeSelectionDialog;
