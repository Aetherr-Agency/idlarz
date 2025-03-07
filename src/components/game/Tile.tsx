import React, { memo, useMemo } from 'react';
import { BiomeType } from '@/types/game';
import { BIOMES, GRID_SIZE, GRID_HEIGHT } from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';

interface TileProps {
  biome: BiomeType;
  isOwned: boolean;
  x: number;
  y: number;
  style?: React.CSSProperties;
  level?: number;
}

const formatModifier = (modifier: number) => {
  const percentage = ((modifier * 100) - 100).toFixed(0);
  const sign = percentage.startsWith('-') ? '' : '+';
  return `${sign}${percentage}%`;
};

const BiomeTooltip = memo(({ biome, level }: { biome: BiomeType; level?: number }) => {
  const biomeInfo = BIOMES[biome];
  const multiplier = level ? Math.pow(1.5, level - 1) : 1;
  
  return (
    <div className="space-y-1 text-sm">
      {biome === 'castle' && level && (
        <div className="mb-2 text-purple-400">Level {level} Castle</div>
      )}
      {Object.entries(biomeInfo.resourceModifiers).map(([resource, modifier]) => {
        const effectiveModifier = biome === 'castle' ? modifier * multiplier : modifier;
        return (
          <div key={resource} className="flex justify-between gap-4">
            <span className="text-gray-400">{resource}:</span>
            <span className={effectiveModifier >= 1 ? 'text-green-400' : 'text-red-400'}>
              {formatModifier(effectiveModifier)}
            </span>
          </div>
        );
      })}
    </div>
  );
});

const TileStatus = memo(({ biome, isOwned, isAdjacent, level }: { biome: BiomeType; isOwned: boolean; isAdjacent: boolean; level?: number }) => {
  if (isOwned) {
    const biomeInfo = BIOMES[biome];
    return (
      <div className="space-y-1">
        <div className="font-medium flex items-center gap-2">
          {biomeInfo.label}
          {level && <span className="text-purple-400 text-sm">(Level {level})</span>}
        </div>
        <div className="text-sm text-gray-400">Resource Modifiers:</div>
        <BiomeTooltip biome={biome} level={level} />
      </div>
    );
  }
  
  if (isAdjacent) {
    return (
      <div>
        <div className="font-medium text-gray-300">Available to Explore</div>
        <div className="text-sm text-gray-400 mt-1">Cost: 100 Gold</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="font-medium text-gray-400">Unexplored</div>
      <div className="text-sm text-gray-500 mt-1">Must be adjacent to owned tile</div>
    </div>
  );
});

const Tile: React.FC<TileProps> = ({ biome, isOwned, x, y, style, level }) => {
  const tiles = useGameStore(state => state.tiles);
  
  const isAdjacent = useMemo(() => {
    if (isOwned || !tiles) return false;
    
    const directions = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1]
    ];

    return directions.some(([adjX, adjY]) => 
      adjX >= 0 && adjX < GRID_SIZE && 
      adjY >= 0 && adjY < GRID_HEIGHT && 
      tiles[adjY]?.[adjX]?.isOwned
    );
  }, [x, y, isOwned, tiles]);

  const backgroundColor = useMemo(() => {
    const baseColor = BIOMES[biome].baseColor;
    if (isOwned) {
      return baseColor;
    }
    return isAdjacent ? `${baseColor}BF` : `${baseColor}40`; // 75% opacity for available, 25% for unavailable
  }, [biome, isOwned, isAdjacent]);

  return (
    <div 
      className={`
        absolute transition-all duration-200 ease-in-out select-none
        ${isOwned ? 'opacity-100 ring-1 ring-gray-600' : isAdjacent ? 'opacity-75 hover:opacity-90' : 'opacity-25'}
        ${!isOwned && isAdjacent && 'hover:scale-[1.02] hover:z-10 cursor-pointer'}
        ${biome === 'castle' && 'ring-2 ring-purple-500'}
        border border-gray-800 hover:border-gray-600
        rounded-sm group
      `}
      style={{ 
        ...style,
        backgroundColor,
      }}
      role="button"
      aria-label={`${isOwned ? BIOMES[biome].label : isAdjacent ? 'Available to explore (100 gold)' : 'Unexplored'} tile`}
    >
      <div className="w-full h-full flex items-center justify-center">
        {BIOMES[biome].resourceIcons[0]}
      </div>
      
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200">
        <div className="bg-gray-900 rounded-lg shadow-xl p-2 whitespace-nowrap border border-gray-700">
          <TileStatus biome={biome} isOwned={isOwned} isAdjacent={isAdjacent} level={level} />
        </div>
      </div>
    </div>
  );
};

export default memo(Tile);
