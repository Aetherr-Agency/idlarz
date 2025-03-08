import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

const NAME_MAX_LENGTH = 9;

const NamePrompt = () => {
	const [name, setName] = useState('');
	const [showPrompt, setShowPrompt] = useState(false);
	const [showIntroduction, setShowIntroduction] = useState(false);
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
			setShowIntroduction(true);
		}
	};

	const handleCloseIntroduction = () => {
		setShowIntroduction(false);
	};

	if (!showPrompt && !showIntroduction) {
		return null;
	}

	if (showIntroduction) {
		return (
			<div className='fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center'>
				<div className='bg-gray-900 border-2 border-blue-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
					<h2 className='text-xl font-bold mb-4 text-center text-blue-400'>
						Welcome to Your Adventure, {playerName}!
					</h2>

					<div className='space-y-5 text-sm'>
						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Game Basics</h3>
							<p className='text-gray-300'>
								This is an idle territory expansion game where you&apos;ll grow your realm by purchasing tiles,
								upgrading your castle, and allocating character points to boost your production.
							</p>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Resource Generation</h3>
							<p className='text-gray-300 mb-2'>Each tile you own generates resources based on its biome type:</p>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-purple-400 font-medium mb-1'>Castle 🏰</h4>
									<p className='text-gray-300 text-xs'>Provides balanced +1.0 to all resources</p>
									<p className='text-gray-400 text-xs mt-1'>Also provides global 20% production bonus per level</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-green-400 font-medium mb-1'>Forest 🌲</h4>
									<p className='text-gray-300 text-xs'>+0.1 gold/s, +0.3 wood/s</p>
									<p className='text-gray-400 text-xs mt-1'>Great for early wood production</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-yellow-400 font-medium mb-1'>Plains 🌾</h4>
									<p className='text-gray-300 text-xs'>+0.1 gold/s, +0.3 food/s</p>
									<p className='text-gray-400 text-xs mt-1'>Balanced production for food and +5% meat bonus per tile</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-gray-400 font-medium mb-1'>Hills ⛰️</h4>
									<p className='text-gray-300 text-xs'>+0.05 gold/s, +0.3 stone/s, +0.2 coal/s</p>
									<p className='text-gray-400 text-xs mt-1'>Essential for stone and coal</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-green-700 font-medium mb-1'>Swamp 🦆</h4>
									<p className='text-gray-300 text-xs'>0 gold/s, +0.1 food/s, +0.2 wood/s</p>
									<p className='text-gray-400 text-xs mt-1'>Lower yields but diverse resources</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-blue-200 font-medium mb-1'>Tundra ❄️</h4>
									<p className='text-gray-300 text-xs'>+0.1 gold/s, 0 food/s, +0.35 coal/s</p>
									<p className='text-gray-400 text-xs mt-1'>Best for coal production</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-blue-500 font-medium mb-1'>Lake 💧</h4>
									<p className='text-gray-300 text-xs'>+0.25 gold/s, +0.25 food/s</p>
									<p className='text-gray-400 text-xs mt-1'>Strong gold and food production</p>
								</div>
							</div>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Biome Strategy</h3>
							<p className='text-gray-300 mb-2'>Every 4th tile purchase allows you to choose a biome instead of getting a random one.</p>
							<p className='text-gray-300'>Adjacent tiles of the same biome provide a +15% production bonus per adjacent tile, allowing for strategic placement.</p>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Farm System 🧑‍🌾</h3>
							<p className='text-gray-300 mb-2'>The Farm allows you to produce meat by purchasing and upgrading animals:</p>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-yellow-300 font-medium mb-1'>Chicken 🐔</h4>
									<p className='text-gray-300 text-xs'>Base Cost: 10,000 food</p>
									<p className='text-gray-300 text-xs'>Production: 0.05 meat/s (3/min)</p>
									<p className='text-gray-400 text-xs mt-1'>Each level: +20% production, 1.5× cost</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-yellow-300 font-medium mb-1'>Deer 🦌</h4>
									<p className='text-gray-300 text-xs'>Base Cost: 50,000 food</p>
									<p className='text-gray-300 text-xs'>Production: 0.2 meat/s (12/min)</p>
									<p className='text-gray-400 text-xs mt-1'>Each level: +25% production, 1.6× cost</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-yellow-300 font-medium mb-1'>Pig 🐖</h4>
									<p className='text-gray-300 text-xs'>Base Cost: 200,000 food</p>
									<p className='text-gray-300 text-xs'>Production: 0.5 meat/s (30/min)</p>
									<p className='text-gray-400 text-xs mt-1'>Each level: +30% production, 1.7× cost</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-yellow-300 font-medium mb-1'>Cow 🐄</h4>
									<p className='text-gray-300 text-xs'>Base Cost: 1,000,000 food</p>
									<p className='text-gray-300 text-xs'>Production: 1.5 meat/s (90/min)</p>
									<p className='text-gray-400 text-xs mt-1'>Each level: +40% production, 1.8× cost</p>
								</div>
							</div>
							<p className='text-gray-300 text-xs mt-2'>💡 Tip: Each Plains tile provides +5% bonus to all meat production. Focus on Plains tiles if raising animals!</p>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Merchant System 🛒</h3>
							<p className='text-gray-300 mb-2'>The Merchant allows you to convert resources to gold at the following rates:</p>
							<div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-green-400 font-medium mb-1'>Wood</h4>
									<p className='text-gray-300 text-xs'>0.75 gold per unit</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-gray-400 font-medium mb-1'>Stone</h4>
									<p className='text-gray-300 text-xs'>0.75 gold per unit</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-gray-600 font-medium mb-1'>Coal</h4>
									<p className='text-gray-300 text-xs'>1.25 gold per unit</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-yellow-500 font-medium mb-1'>Food</h4>
									<p className='text-gray-300 text-xs'>0.5 gold per unit</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-red-400 font-medium mb-1'>Meat</h4>
									<p className='text-gray-300 text-xs'>3.0 gold per unit</p>
									<p className='text-gray-400 text-xs mt-1'>Best gold value!</p>
								</div>
							</div>
							<p className='text-gray-300 text-xs mt-2'>💡 Tip: Meat has the highest gold conversion rate, making the Farm an excellent source of income!</p>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Tile Purchase Formula</h3>
							<p className='text-gray-300 mb-1'>Tile costs scale exponentially as you own more territory:</p>
							<p className='text-gray-300 text-xs bg-gray-800 p-2 rounded font-mono'>Cost = 25 × 1.1^(owned tiles)</p>
							<p className='text-gray-300 mb-1 mt-2'>Character stats can reduce this cost:</p>
							<p className='text-gray-300 text-xs bg-gray-800 p-2 rounded font-mono'>Final Cost = Base Cost × (1 - charisma discount)</p>
							<p className='text-gray-400 text-xs mt-1'>Each point of Charisma provides 0.5% discount (max 25%)</p>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Resource Generation System</h3>
							<p className='text-gray-300 mb-1'>Resources are generated using a formula with base rates and multipliers:</p>
							<p className='text-gray-300 text-xs bg-gray-800 p-2 rounded font-mono'>Total Rate = Base Rate × (1 + Sum of All Modifiers)</p>
							<div className='mt-2 space-y-1'>
								<p className='text-gray-300 text-xs'>🏰 Castle Level 1: +20% to all resource generation</p>
								<p className='text-gray-300 text-xs'>🏰 Each castle level: Additional +20% to all resources</p>
								<p className='text-gray-300 text-xs'>🌲 Adjacent same biomes: +15% per adjacent tile</p>
								<p className='text-gray-300 text-xs'>📊 Character stats: Various % bonuses per resource</p>
							</div>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Character Stats</h3>
							<p className='text-gray-300 mb-2'>As you level up, you&apos;ll earn stat points to allocate:</p>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-red-400 font-medium mb-1'>Strength</h4>
									<p className='text-gray-300 text-xs'>+2.5% Stone & Coal production per point</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-green-400 font-medium mb-1'>Dexterity</h4>
									<p className='text-gray-300 text-xs'>+2.5% Wood & Food production per point</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-blue-400 font-medium mb-1'>Intelligence</h4>
									<p className='text-gray-300 text-xs'>+2.5% Gold production, +0.2% XP gain per point</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3'>
									<h4 className='text-yellow-400 font-medium mb-1'>Vitality</h4>
									<p className='text-gray-300 text-xs'>+2.5% Food & Wood production per point</p>
								</div>
								<div className='bg-gray-800 bg-opacity-50 rounded p-3 col-span-1 md:col-span-2'>
									<h4 className='text-pink-400 font-medium mb-1'>Charisma</h4>
									<p className='text-gray-300 text-xs'>+2.5% Gold & Coal production, +0.25% XP gain, +0.5% tile cost discount per point</p>
								</div>
							</div>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Leveling System</h3>
							<p className='text-gray-300 mb-1'>XP requirements scale exponentially:</p>
							<p className='text-gray-300 text-xs bg-gray-800 p-2 rounded font-mono'>XP for level N = 750 × 2^(N-1)</p>
							<p className='text-gray-300 mb-1 mt-2'>XP gained from tile purchases:</p>
							<p className='text-gray-300 text-xs bg-gray-800 p-2 rounded font-mono'>XP Gain = BASE_XP_PER_TILE × (1 + owned tiles / 10)</p>
							<p className='text-gray-400 text-xs mt-1'>Intelligence and Charisma increase XP gain</p>
						</section>

						<section>
							<h3 className='text-lg font-semibold text-yellow-400 mb-2'>Progression Tips</h3>
							<ul className='list-disc pl-5 text-gray-300 text-xs space-y-1'>
								<li>Focus on gold production early to buy more tiles faster</li>
								<li>Place similar biomes adjacent to each other for +15% bonus per neighbor</li>
								<li>Upgrade your castle when possible for global +20% production per level</li>
								<li>Balance your character stats based on resource needs</li>
								<li>Use every 4th tile purchase strategically to optimize territory</li>
								<li>Intelligence and Charisma provide excellent long-term benefits</li>
								<li>Get Plains tiles for food, then invest in farm animals for meat production</li>
								<li>Sell meat to the Merchant for the best gold conversion rate (3.0 gold per meat)</li>
							</ul>
						</section>
					</div>

					<div className='flex justify-center mt-6'>
						<button
							onClick={handleCloseIntroduction}
							className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition'>
							Start Your Adventure
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center'>
			<div className='bg-gray-900 border-2 border-blue-700 rounded-lg p-6 w-full max-w-md'>
				<h2 className='text-md font-bold mb-4 text-center text-white'>
					Your Journey Begins!
				</h2>
				<p className='mb-4 text-xs text-center text-gray-400'>
					You have taken your first step into the vast unknown.
					<br/>
					Now, what shall history remember you as?
				</p>

				<form onSubmit={handleSubmit}>
					<div className='mb-4'>
						<input
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={NAME_MAX_LENGTH}
							className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
							placeholder={`Your name (${NAME_MAX_LENGTH} chars max)`}
							autoFocus
						/>
						<div className='text-xs text-gray-400 mt-1 text-right'>
							{NAME_MAX_LENGTH - name.length} characters remaining
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
							Begin Your Journey
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default NamePrompt;
