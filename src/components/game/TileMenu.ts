import type React from 'react';
import type { BiomeType, MonsterType } from '@/types/game';
import { BIOMES } from '@/config/biomes';
import { MONSTERS } from '@/config/combatConfig';
import { canBuildAt } from '@/utils/game/costs';
import { isLandmarkTile } from '@/utils/terrain';
import { useUiStore, type ContextMenuItem } from '@/stores/uiStore';
import { openMenuAt } from '@/lib/globalMenu';
import type { MapGameStore } from './mapSource';
import '@/styles/ContextMenu.css';

export interface TileMenuContext {
	x: number;
	y: number;
	biome: BiomeType;
	game: MapGameStore;
	/** The monster on the tile; undefined: none */
	monster?: { id: number; type: MonsterType };
	/** This monster's place in the battle queue (0: not queued) and whether clicks now join the line */
	queuePos: number;
	lineOpen: boolean;
	hasChest: boolean;
	hasBuilding: boolean;
}

/**
 * Right click on an explored tile: what can be done here (dismiss a monster, open a chest, build, highlight the area),
 * then the global entries. Called from the tile's event handler, so it reads the stores when the menu opens, not on render.
 */
export function openTileMenu(e: React.MouseEvent, { x, y, biome, game, monster, queuePos, lineOpen, hasChest, hasBuilding }: TileMenuContext) {
	e.preventDefault();
	const ui = useUiStore.getState();
	const { startFight, collectChest } = game.getState();
	const own: ContextMenuItem[] = [];
	if (monster) {
		const { id, type } = monster;
		own.push(
			{
				id: 'fight',
				label: lineOpen ? (queuePos > 0 ? 'Remove from the queue' : `Add ${MONSTERS[type].label} to the queue`) : `Fight ${MONSTERS[type].label}`,
				onSelect: () => void startFight(id),
			},
			{ id: 'dismiss', label: `Dismiss ${MONSTERS[type].label}...`, danger: true, onSelect: () => ui.askDismissMonster(id) },
		);
	} else if (hasChest) {
		own.push({ id: 'chest', label: 'Open chest', onSelect: () => void collectChest(x, y) });
	}
	if (biome !== 'castle') {
		if (!hasBuilding) {
			const blocked = !!monster || hasChest;
			own.push({
				id: 'build',
				label: 'Build here...',
				disabled: blocked || !canBuildAt(game.getState().tiles, x, y),
				hint: blocked ? 'tile in use' : isLandmarkTile(game.getState().tiles, x, y) ? 'landmark' : undefined,
				onSelect: () => ui.openBuildDialog(x, y),
			});
		}
		own.push({
			id: 'highlight',
			label: `Highlight this ${BIOMES[biome]?.label ?? biome} area`,
			onSelect: () => ui.flashCluster(game.getState().tiles, x, y),
		});
	}
	openMenuAt(e.clientX, e.clientY, biome === 'castle' ? 'Castle' : (BIOMES[biome]?.label ?? biome), own);
}
