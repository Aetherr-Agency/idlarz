import { GRID_SIZE, GRID_HEIGHT } from '@/config/gameConfig';

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
