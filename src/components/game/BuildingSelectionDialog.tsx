import React from 'react';
import type { FC } from 'react';
import audioManager from '@/utils/audioManager';
import { Resources } from '@/types/game';

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
  resourceGeneration: Partial<Resources>;
}

// Buildings configuration
const BUILDINGS: Record<BuildingType, BuildingInfo> = {
  farm: {
    name: 'farm',
    label: 'Farm',
    icon: '🌱',
    description: 'Increases food production',
    resourceGeneration: {
			food: 0.2,
		},
  },
  mine: {
    name: 'mine',
    label: 'Mine',
    icon: '⚫',
    description: 'Extracts stone and coal resources',
    resourceGeneration: {
			stone: 0.2,
			coal: 0.2,
		}
  },
  lumbermill: {
    name: 'lumbermill',
    label: 'Lumber Mill',
    icon: '🪓',
    description: 'Processes wood more efficiently',
    resourceGeneration: {
			wood: 0.2,
		}
  },
  market: {
    name: 'market',
    label: 'Market',
    icon: '🏪',
    description: 'Generates additional gold',
    resourceGeneration: {
			gold: 0.2,
		}
  },
  blacksmith: {
    name: 'blacksmith',
    label: 'Blacksmith',
    icon: '🔨',
    description: 'Crafts tools and weapons',
    resourceGeneration: {
			stone: 0.1,
			coal: 0.1,
			gold: 0.1,
      food: 0.1,
      wood: 0.1,
		}
  },
  workshop: {
    name: 'workshop',
    label: 'Workshop',
    icon: '🏭',
    description: 'Allows crafting of advanced items',
    resourceGeneration: {
      xp: 0.2,
		}
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
        {/* Buildings provide special bonuses to your resource generation. */}
        Proof of concept, modifiers are not added, simply cosmetic feature for now.
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
