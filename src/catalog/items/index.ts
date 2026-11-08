import type { ItemDef } from '@/types/game';
import { CLOTH_ITEMS } from './cloth';
import { CONSUMABLES } from './consumables';
import { LADDER_ITEMS } from './ladder';
import { LEGENDARY_ITEMS } from './legendary';
import { OBSIDIAN_ITEMS } from './obsidian';
import { RESERVE_ITEMS } from './reuse';
import { WOODEN_ITEMS } from './starter';
import { STEEL_ITEMS } from './steel';

/** Every item in the game, in display order. Add a family by adding its file here. */
export const ITEMS: ItemDef[] = [
	...WOODEN_ITEMS,
	...CONSUMABLES,
	...CLOTH_ITEMS,
	...STEEL_ITEMS,
	...OBSIDIAN_ITEMS,
	...LEGENDARY_ITEMS,
	// disabled: art and stats are ready, nothing drops them yet (catalog/items/reuse.ts)
	...RESERVE_ITEMS,
	// disabled: the grade ladder G1-G9 and the special sets S1-S3, placeholder numbers (catalog/items/ladder.ts)
	...LADDER_ITEMS,
];
