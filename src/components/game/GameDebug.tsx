import React from 'react';
import { useGameStore } from '@/stores/gameStore';

const GameDebug: React.FC = () => {
  const { playerName, setPlayerName, tiles } = useGameStore();
  
  // Count owned tiles for debugging
  const countOwnedTiles = () => {
    let count = 0;
    tiles.forEach(row => {
      row.forEach(tile => {
        if (tile && tile.isOwned) {
          count++;
        }
      });
    });
    return count;
  };
  
  const ownedTileCount = countOwnedTiles();
  
  const handleReset = () => {
    // Clear localStorage completely
    localStorage.clear();
    // Force a hard reload
    window.location.href = window.location.href;
  };

  const handleSimulateFirstTile = () => {
    // Set name back to Explorer to trigger the dialog
    setPlayerName('Explorer');
    // We would need access to buyTile, but this is just for debugging
    alert('Name reset to Explorer. Buy a tile to trigger the name prompt.');
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-gray-800 p-4 rounded-md text-white text-xs">
      <div className="mb-2">
        <strong>Debug Info:</strong>
        <div>Player Name: {playerName}</div>
        <div>Owned Tiles: {ownedTileCount}</div>
        <div>Name Prompt Conditions: {ownedTileCount === 2 && playerName === 'Explorer' ? 'Met' : 'Not Met'}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-xs"
        >
          Reset Game
        </button>
        <button
          onClick={handleSimulateFirstTile}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md text-xs"
        >
          Reset Name
        </button>
      </div>
    </div>
  );
};

export default GameDebug;
