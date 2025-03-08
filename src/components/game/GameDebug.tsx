import React from 'react';
import { useGameStore } from '@/stores/gameStore';

const GameDebug: React.FC = () => {
	const { playerName, setPlayerName, tiles, addResources, resources } =
		useGameStore();

	// Count owned tiles for debugging
	const countOwnedTiles = () => {
		let count = 0;
		tiles.forEach((row) => {
			row.forEach((tile) => {
				if (tile && tile.isOwned) {
					count++;
				}
			});
		});
		return count;
	};

	const ownedTileCount = countOwnedTiles();

	const handleSimulateFirstTile = () => {
		// Set name back to Explorer to trigger the dialog
		setPlayerName('Explorer');
		// We would need access to buyTile, but this is just for debugging
		alert('Name reset to Explorer. Buy a tile to trigger the name prompt.');
	};

	const handleAddGold = () => {
		addResources({ gold: 100000 });
	};

	const handleAddWood = () => {
		addResources({ wood: 100000 });
	};

	const handleAddStone = () => {
		addResources({ stone: 100000 });
	};

	const handleAddCoal = () => {
		addResources({ coal: 100000 });
	};

	const handleAddFood = () => {
		addResources({ food: 100000 });
	};

	const handleAddMeat = () => {
		addResources({ meat: 100000 });
	};

	if (process.env.NODE_ENV !== 'development') return null;

	return (
		<div className='fixed bottom-4 left-4 z-50 bg-gray-800 p-4 rounded-md text-white text-xs'>
			<div className='mb-2'>
				<strong>Debug Info:</strong>
				<div>Player Name: {playerName}</div>
				<div>Owned Tiles: {ownedTileCount}</div>
				<div>Gold: {resources.gold.toFixed(0)}</div>
			</div>
			<div className='flex gap-2 flex-wrap'>
				<button
					onClick={handleSimulateFirstTile}
					className='bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md text-xs'>
					Reset Name
				</button>
				<button
					onClick={handleAddGold}
					className='bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded-md text-xs'>
					Add 100k Gold
				</button>
				<button
					onClick={handleAddWood}
					className='bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-xs'>
					Add 100k Wood
				</button>
				<button
					onClick={handleAddStone}
					className='bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded-md text-xs'>
					Add 100k Stone
				</button>
				<button
					onClick={handleAddCoal}
					className='bg-black hover:bg-gray-900 text-white px-2 py-1 rounded-md text-xs border border-gray-700'>
					Add 100k Coal
				</button>
				<button
					onClick={handleAddFood}
					className='bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded-md text-xs'>
					Add 100k Food
				</button>
				<button
					onClick={handleAddMeat}
					className='bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-xs'>
					Add 100k Meat
				</button>
			</div>
		</div>
	);
};

export default GameDebug;
