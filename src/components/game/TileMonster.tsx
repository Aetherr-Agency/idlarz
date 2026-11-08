import React from 'react';
import { type MonsterType } from '@/types/game';
import { useMapSource } from './mapSource';
import MonsterSprite from './MonsterSprite';
import { growthInfo } from '@/lib/monsters';
import { limitOf } from '@/lib/limits';

/** The monster on the map with its growth shown: a blue badge at full size, otherwise a thin bar that fills towards the next level (a CSS animation, so no timer runs). */
const TileMonster: React.FC<{ id: number; type: MonsterType; level: number; max: number; lucky: boolean; art?: string; queued: number }> = ({
	id,
	type,
	level,
	max,
	lucky,
	art,
	queued,
}) => {
	const state = useMapSource().game.getState();
	const monster = art ? undefined : state.monsters.find((m) => m.id === id);
	const ctx = { merchantUpgrades: state.merchantUpgrades, prestige: state.prestige };
	const growth = monster ? growthInfo(monster, ctx) : null;
	return (
		<MonsterSprite
			type={type}
			level={level}
			lucky={lucky}
			art={art}
			maxed={level >= max}
			queued={queued}
			growth={growth && !growth.maxed && growth.leftSec !== null ? { leftSec: growth.leftSec, fraction: growth.fraction } : undefined}
			intervalSec={limitOf('monsterGrowthIntervalSec', ctx)}
		/>
	);
};

export default TileMonster;
