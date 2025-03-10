import React from 'react';
import type { FC } from 'react';
import { BiomeType } from '@/types/game';
import { BIOMES, BIOME_ICONS, RESOURCE_ICONS } from '@/config/gameConfig';
import audioManager from '@/utils/audioManager';

interface BiomeSelectionDialogProps {
  availableBiomes: BiomeType[];
  onSelect: (biome: BiomeType) => void;
  onCancel: () => void;
  cost: number;
  position?: { x: number, y: number };
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
  position
}) => {
  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 bg-opacity-50"
      onClick={onCancel} // Close dialog when clicking the backdrop
    >
      <div 
        className="fixed z-50 rounded-lg border border-gray-700 shadow-xl bg-gray-900 p-3"
        style={{
          top: '50%',
          left: '50%',
          transform: position ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '560px'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks on dialog from bubbling to backdrop
      >
        <h3 className="text-sm font-semibold text-white mb-2">Choose a Biome</h3>
        <p className="text-xs text-gray-400 mb-3">
          Every 4th tile allows biome selection. Cost: <span className="text-yellow-400">{cost} gold</span>
        </p>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          {availableBiomes.map((biome) => {
            const biomeInfo = BIOMES[biome];
            return (
              <button
                key={biome}
                onClick={() => { onSelect(biome); audioManager.playSound('purchase'); }}
                className="cursor-pointer flex items-center p-2 rounded border border-gray-700 hover:border-green-500 hover:bg-gray-800 transition-all"
                style={{
                  backgroundColor: BIOMES[biome].baseColor + '20',
                }}
              >
                <div 
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-3 text-lg"
                  style={{ color: biomeInfo.baseColor }}
                >
                  {BIOME_ICONS[biome as keyof typeof BIOME_ICONS]}
                </div>
                
                <div className="flex-grow text-left">
                  <span className="text-xs font-bold block text-white">{biomeInfo.label}</span>
                  <div className="text-xs grid grid-cols-3 gap-x-1 mt-1">
                    {Object.entries(biomeInfo.resourceGeneration || {}).map(([resource, rate], idx) => (
                      <div key={idx} className={`flex items-center ${Number(rate) > 0 ? 'text-green-400' : Number(rate) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        <span className="mr-0.5">{RESOURCE_ICONS[resource as keyof typeof RESOURCE_ICONS]}</span>
                        <span>{formatRate(Number(rate))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={onCancel}
            className="px-3 py-1 text-xs text-white bg-red-800 hover:bg-red-700 rounded cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BiomeSelectionDialog;
