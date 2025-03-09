import React from 'react';
import type { FC } from 'react';
import audioManager from '@/utils/audioManager';

// Define building types
export type BuildingType = 
  | 'farm'
  | 'mine'
  | 'lumbermill'
  | 'market'
  | 'blacksmith'
  | 'workshop';

interface BuildingInfo {
  name: BuildingType;
  label: string;
  icon: string;
  description: string;
  resourceBonus?: string;
}

// Buildings configuration
const BUILDINGS: Record<BuildingType, BuildingInfo> = {
  farm: {
    name: 'farm',
    label: 'Farm',
    icon: '🌱',
    description: 'Increases food production',
    resourceBonus: '+20% food generation'
  },
  mine: {
    name: 'mine',
    label: 'Mine',
    icon: '⛏️',
    description: 'Extracts stone and coal resources',
    resourceBonus: '+20% stone and coal generation'
  },
  lumbermill: {
    name: 'lumbermill',
    label: 'Lumber Mill',
    icon: '🪓',
    description: 'Processes wood more efficiently',
    resourceBonus: '+20% wood generation'
  },
  market: {
    name: 'market',
    label: 'Market',
    icon: '🏪',
    description: 'Generates additional gold',
    resourceBonus: '+20% gold generation'
  },
  blacksmith: {
    name: 'blacksmith',
    label: 'Blacksmith',
    icon: '🔨',
    description: 'Crafts tools and weapons',
    resourceBonus: '+10% to all resource generation'
  },
  workshop: {
    name: 'workshop',
    label: 'Workshop',
    icon: '🏭',
    description: 'Allows crafting of advanced items',
    resourceBonus: '+15% XP generation'
  }
};

interface BuildingSelectionDialogProps {
  onSelect: (building: BuildingType) => void;
  onCancel: () => void;
  position?: { x: number, y: number };
  tileX: number;
  tileY: number;
}

const BuildingSelectionDialog: FC<BuildingSelectionDialogProps> = ({
  onSelect,
  onCancel,
  position,
  tileX,
  tileY
}) => {
  return (
    <div 
      className="fixed z-50 rounded-lg border border-gray-700 shadow-xl bg-gray-900 p-3"
      style={{
        top: '50%',
        left: '50%',
        transform: position ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '560px'
      }}
    >
      <h3 className="text-sm font-semibold text-white mb-2">Choose a Building for Grounds (Level 2)</h3>
      <p className="text-xs text-gray-400 mb-3">
        Buildings provide special bonuses to your resource generation.
      </p>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        {Object.values(BUILDINGS).map((building) => (
          <button
            key={building.name}
            onClick={() => { onSelect(building.name); audioManager.playSound('purchase'); }}
            className="cursor-pointer flex items-center p-2 rounded border border-gray-700 hover:border-green-500 hover:bg-gray-800 transition-all"
          >
            <div 
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-3 text-lg"
            >
              {building.icon}
            </div>
            
            <div className="flex-grow text-left">
              <span className="text-xs font-bold block text-white">{building.label}</span>
              <div className="text-xs mt-1">
                <div className="text-gray-400">{building.description}</div>
                {building.resourceBonus && (
                  <div className="text-green-400 mt-1">{building.resourceBonus}</div>
                )}
              </div>
            </div>
          </button>
        ))}
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
  );
};

export default BuildingSelectionDialog;
