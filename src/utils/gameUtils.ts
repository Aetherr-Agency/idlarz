import { GRID_SIZE, GRID_HEIGHT } from '@/config/gameConfig';
import { CharacterStats } from '@/types/game';

/**
 * Counts the total number of owned tiles in the grid
 * @param tiles Grid of tiles to count ownership from
 * @returns Number of owned tiles
 */
export const countOwnedTiles = (tiles: { isOwned: boolean }[][]): number => {
  let count = 0;
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (tiles[y][x].isOwned) count++;
    }
  }
  return count;
};

/**
 * Gets the description for a character stat
 * @param stat The character stat key
 * @returns Description of what the stat does
 */
export const getStatDescription = (stat: keyof Omit<CharacterStats, 'availablePoints'>): string => {
  const descriptions: Record<keyof Omit<CharacterStats, 'availablePoints'>, string> = {
    strength: 'Flex your muscles. Increases physical damage and carrying capacity.',
    dexterity: 'Swift and agile movements. Improves attack speed and dodge chance.',
    intelligence: 'Expand your mind. Enhances magic power and learning speed.',
    vitality: 'Health and endurance. Boosts hit points and stamina recovery.',
    charisma: 'Personal magnetism. Better prices from merchants and persuasion options.'
  };
  
  return descriptions[stat];
};
