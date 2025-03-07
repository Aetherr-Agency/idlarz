import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

const NamePrompt = () => {
	const [name, setName] = useState('');
	const [showPrompt, setShowPrompt] = useState(false);
	const { playerName, setPlayerName, tiles } = useGameStore();

	// Count owned tiles to determine if we should show the name prompt
	useEffect(() => {
		// Count all owned tiles
		let ownedTileCount = 0;
		tiles.forEach((row) => {
			row.forEach((tile) => {
				if (tile && tile.isOwned) {
					ownedTileCount++;
				}
			});
		});

		// Show the prompt if:
		// 1. Player has exactly 2 owned tiles (castle + first purchase)
		// 2. Their name is still the default "Explorer"
		const shouldShowPrompt = ownedTileCount === 2 && playerName === 'Explorer';

		setShowPrompt(shouldShowPrompt);
	}, [tiles, playerName]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (name.trim()) {
			setPlayerName(name);
			setShowPrompt(false);
		}
	};

	if (!showPrompt) {
		return null;
	}

	return (
		<div className='fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center'>
			<div className='bg-gray-900 border-2 border-blue-700 rounded-lg p-6 w-full max-w-md'>
				<h2 className='text-xl font-bold mb-4 text-center'>
					Your Journey Begins!
				</h2>
				<p className='mb-4 text-gray-300'>
					You have taken your first step into the vast unknown. Now, what shall
					history remember you as?
				</p>

				<form onSubmit={handleSubmit}>
					<div className='mb-4'>
						<input
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={9}
							className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
							placeholder='Your name (9 chars max)'
							autoFocus
						/>
						<div className='text-xs text-gray-400 mt-1'>
							{9 - name.length} characters remaining
						</div>
					</div>

					<div className='flex justify-center'>
						<button
							type='submit'
							disabled={!name.trim()}
							className={`px-4 py-2 rounded font-medium transition ${
								name.trim()
									? 'bg-blue-600 hover:bg-blue-700 text-white'
									: 'bg-gray-700 text-gray-400 cursor-not-allowed'
							}`}>
							Claim Your Legacy
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default NamePrompt;
