import React from 'react';
import type { FC } from 'react';
import { CASTLE_UPGRADE, RESOURCE_ICONS } from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import { formatNumber } from '@/utils/formatters';
import audioManager from '@/utils/audioManager';

interface CastleUpgradeDialogProps {
  onClose: () => void;
}

const CastleUpgradeDialog: FC<CastleUpgradeDialogProps> = ({ onClose }) => {
  // Get the castle tile level (which should be the first tile in the grid, at center)
  const tiles = useGameStore(state => state.tiles);
  const resources = useGameStore(state => state.resources);
  const upgradeCastle = useGameStore(state => state.upgradeCastle);
  
  // Safely get castle level from the center tile
  const centerX = Math.floor(tiles[0].length / 2);
  const centerY = Math.floor(tiles.length / 2);
  const castleLevel = tiles[centerY]?.[centerX]?.level || 1;
  
  const isMaxLevel = castleLevel >= CASTLE_UPGRADE.maxLevel;
  const isNextToMaxLevel = castleLevel >= CASTLE_UPGRADE.maxLevel - 1;
  
  // Get the required resources for the next level
  const nextLevelIndex = castleLevel - 1;
  const nextLevelCosts = !isMaxLevel && nextLevelIndex < CASTLE_UPGRADE.upgradeCosts.length 
    ? CASTLE_UPGRADE.upgradeCosts[nextLevelIndex] 
    : null;
    
  // Get the costs for the level after next (for preview)
  const afterNextLevelIndex = castleLevel;
  const afterNextLevelCosts = !isNextToMaxLevel && afterNextLevelIndex < CASTLE_UPGRADE.upgradeCosts.length 
    ? CASTLE_UPGRADE.upgradeCosts[afterNextLevelIndex] 
    : null;
  
  // Check if player has enough resources
  const canAfford = nextLevelCosts ? Object.entries(nextLevelCosts).every(([resource, amount]) => 
    resources[resource as keyof typeof resources] >= amount
  ) : false;

  const handleUpgrade = () => {
    if (canAfford && !isMaxLevel && upgradeCastle) {
      const success = upgradeCastle();
      if (success) {
        audioManager.playSound('purchase');
        onClose();
      }
    }
  };

  // Calculate resource generation multiplier based on current level
  const currentMultiplier = CASTLE_UPGRADE.doublePerLevel 
    ? CASTLE_UPGRADE.baseResourceMultiplier * Math.pow(2, castleLevel - 1)
    : CASTLE_UPGRADE.baseResourceMultiplier * castleLevel;
  
  // Next level multiplier if applicable
  const nextMultiplier = !isMaxLevel && CASTLE_UPGRADE.doublePerLevel
    ? CASTLE_UPGRADE.baseResourceMultiplier * Math.pow(2, castleLevel)
    : CASTLE_UPGRADE.baseResourceMultiplier * (castleLevel + 1);
    
  // After next level multiplier if applicable
  const afterNextMultiplier = !isNextToMaxLevel && CASTLE_UPGRADE.doublePerLevel
    ? CASTLE_UPGRADE.baseResourceMultiplier * Math.pow(2, castleLevel + 1)
    : CASTLE_UPGRADE.baseResourceMultiplier * (castleLevel + 2);

  // Calculate XP gain based on level
  const currentXpBonus = CASTLE_UPGRADE.xpBonus * castleLevel;
  const nextXpBonus = CASTLE_UPGRADE.xpBonus * (castleLevel + 1);
  const afterNextXpBonus = CASTLE_UPGRADE.xpBonus * (castleLevel + 2);

  return (
    <div 
      className="fixed z-50 rounded-lg border border-gray-700 shadow-xl bg-gray-900 p-3"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '400px'
      }}
    >
      <h3 className="text-sm font-semibold text-white mb-2">
        Castle (Level {castleLevel}/{CASTLE_UPGRADE.maxLevel})
      </h3>
      
      <div className="text-xs text-gray-400 mb-1">
        Current bonus: <span className="text-green-400">+{(currentMultiplier * 100).toFixed(0)}%</span> to all resources
      </div>
      <div className="text-xs text-gray-400 mb-3">
        XP generation: <span className="text-amber-400">+{currentXpBonus.toFixed(1)} XP/s</span> flat rate
      </div>
      
      {!isMaxLevel && nextLevelCosts ? (
        <>
          <div className="text-xs text-gray-400 mb-1">
            Next level: <span className="text-green-400">+{(nextMultiplier * 100).toFixed(0)}%</span> to all resources
          </div>
          <div className="text-xs text-gray-400 mb-3">
            XP generation: <span className="text-amber-400">+{nextXpBonus.toFixed(1)} XP/s</span> flat rate
          </div>

          {!isNextToMaxLevel && afterNextLevelCosts && (
            <div className="text-gray-500 text-[10px] mb-3">
              Level {castleLevel + 2}: +{(afterNextMultiplier * 100).toFixed(0)}% to all resources, +{afterNextXpBonus.toFixed(1)} XP/s
            </div>
          )}
          
          <div className="mb-4 border border-gray-700 rounded p-2 bg-gray-800">
            <h4 className="text-xs font-semibold text-white mb-1">Upgrade Cost:</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(nextLevelCosts).map(([resource, amount]) => (
                <div 
                  key={resource}
                  className={`text-xs ${resources[resource as keyof typeof resources] >= amount ? 'text-green-400' : 'text-red-400'}`}
                >
                  {RESOURCE_ICONS[resource as keyof typeof RESOURCE_ICONS] || resource} {formatNumber(amount)}
                </div>
              ))}
            </div>
          </div>

          {!isNextToMaxLevel && afterNextLevelCosts && (
            <>
              <h4 className="text-[11px] font-semibold text-gray-400 mt-3 mb-1">Next Upgrade Cost:</h4>
              <div className="grid grid-cols-3 gap-2 text-gray-500">
                {Object.entries(afterNextLevelCosts).map(([resource, amount]) => (
                  <div key={resource} className="text-[10px]">
                    {RESOURCE_ICONS[resource as keyof typeof RESOURCE_ICONS] || resource} {formatNumber(amount)}
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="flex justify-between mt-4">
            <button 
              onClick={onClose}
              className="px-3 py-1 text-xs text-white bg-red-800 hover:bg-red-700 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpgrade}
              disabled={!canAfford}
              className={`px-4 py-1 text-xs text-white ${canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'} rounded`}
            >
              Upgrade Castle
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-xs text-amber-400 mb-4">
            Your castle has reached its maximum level!
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={onClose}
              className="px-3 py-1 text-xs text-white bg-blue-800 hover:bg-blue-700 rounded cursor-pointer"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CastleUpgradeDialog;
