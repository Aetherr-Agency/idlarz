import React from 'react';
import type { FC } from 'react';
import audioManager from '@/utils/audioManager';
import { BUILDINGS } from '@/config/gameConfig';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select Building</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700"
          >
            <span className="text-white text-xl">×</span>
          </button>
        </div>
        
        <p className="text-gray-400 mb-4">
          Select a building to construct on this grounds tile.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.values(BUILDINGS).map((building) => (
            <button
              key={building.name}
              onClick={() => handleSelect(building.name)}
              className="flex items-start p-3 rounded bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div className="text-2xl mr-3 mt-1">{building.icon}</div>
              <div className="flex-1 text-left">
                <span className="text-xs font-bold block text-white">{building.label}</span>
                <div className="text-xs mt-1">
                  <div className="text-gray-400">{building.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuildingSelectionDialog;
