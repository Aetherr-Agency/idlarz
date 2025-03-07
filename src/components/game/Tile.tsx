import React, { memo, useMemo, useState } from 'react';
import { BiomeType } from '@/types/game';
import { BIOMES, GRID_SIZE, GRID_HEIGHT, SCALING_CONFIG } from '@/config/gameConfig';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/lib/utils';

interface TileProps {
  biome: BiomeType;
  isOwned: boolean;
  x: number;
  y: number;
  style?: React.CSSProperties;
  level?: number;
}

const formatRate = (rate: number) => {
  if (rate === 0) return '0/s';
  return `${rate.toFixed(2)}/s`;
};

const BiomeTooltip = memo(({ biome, level }: { biome: BiomeType; level?: number }) => {
  const biomeInfo = BIOMES[biome];
  const multiplier = level ? Math.pow(1.5, level - 1) : 1;
  
  return (
    <div className="space-y-1 text-sm">
      {biome === 'castle' && level && (
        <div className="mb-2 text-purple-400">Level {level} Castle</div>
      )}
      {Object.entries(biomeInfo.resourceGeneration).map(([resource, rate]) => {
        const effectiveRate = biome === 'castle' ? (rate || 0) * multiplier : (rate || 0);
        if (effectiveRate === 0) return null;
        return (
          <div key={resource} className="flex justify-between gap-4">
            <span className="text-gray-400">{resource}:</span>
            <span className="text-green-400">
              {formatRate(effectiveRate)}
            </span>
          </div>
        );
      })}
      {biomeInfo.description && (
        <div className="mt-2 text-gray-400 text-xs">{biomeInfo.description}</div>
      )}
    </div>
  );
});

const TileStatus = memo(({ biome, isOwned, isAdjacent, level }: { biome: BiomeType; isOwned: boolean; isAdjacent: boolean; level?: number }) => {
  const tiles = useGameStore(state => state.tiles);
  const resources = useGameStore(state => state.resources);

  const ownedTilesCount = useMemo(() => {
    let count = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (tiles[y][x].isOwned) count++;
      }
    }
    return count;
  }, [tiles]);

  const cost = useMemo(() => {
    return SCALING_CONFIG.costFormula(ownedTilesCount);
  }, [ownedTilesCount]);

  if (isOwned) {
    const biomeInfo = BIOMES[biome];
    return (
      <div className="space-y-1">
        <div className="font-medium flex items-center gap-2">
          {biomeInfo.label}
          {biomeInfo.resourceIcons.map((icon, i) => (
            <span key={i} className="text-lg">{icon}</span>
          ))}
        </div>
        <BiomeTooltip biome={biome} level={level} />
      </div>
    );
  }

  if (isAdjacent) {
    const canAfford = resources.gold >= cost;
    return (
      <div className="space-y-1">
        <div className="font-medium">Unexplored Land</div>
        <div className="text-sm">
          <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
            Cost: {cost} gold
          </span>
        </div>
        <div className="text-sm text-gray-400">Click to explore</div>
      </div>
    );
  }

  return null;
});

const Tile: React.FC<TileProps> = ({ biome, isOwned, x, y, style, level }) => {
  const [isShaking, setIsShaking] = useState(false);
  const tiles = useGameStore(state => state.tiles);
  const buyTile = useGameStore(state => state.buyTile);
  const resources = useGameStore(state => state.resources);
  
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

  const ownedTilesCount = useMemo(() => {
    let count = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (tiles[y][x].isOwned) count++;
      }
    }
    return count;
  }, [tiles]);

  const cost = useMemo(() => {
    return SCALING_CONFIG.costFormula(ownedTilesCount);
  }, [ownedTilesCount]);

  const handleClick = () => {
    if (isAdjacent && !isOwned) {
      if (resources.gold >= cost) {
        buyTile(x, y);
      } else {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 200);
      }
    }
  };

  return (
    <div 
      className={cn(
        'absolute transition-all duration-200 ease-in-out select-none',
        isOwned ? 'opacity-100' : isAdjacent ? 'opacity-75 hover:opacity-100' : 'opacity-25',
        !isOwned && isAdjacent && 'hover:z-10 cursor-pointer border border-gray-900 hover:border-gray-800',
        biome === 'castle' && 'ring-1 ring-purple-500',
        isShaking && 'animate-shake',
        'group'
      )}
      style={{ 
        ...style,
        backgroundColor,
      }}
      onClick={handleClick}
      role="button"
      aria-label={`${isOwned ? BIOMES[biome].label : isAdjacent ? 'Unexplored land' : 'Unknown territory'} tile`}
    >
      <div className="w-full h-full flex items-center justify-center">
        {isOwned ? BIOMES[biome].resourceIcons[0] : isAdjacent ? '❔' : '☁️'}
      </div>
      
      {(isOwned || isAdjacent) && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity duration-200">
          <div className="bg-gray-900 rounded-lg shadow-xl p-2 whitespace-nowrap border border-gray-700">
            <TileStatus biome={biome} isOwned={isOwned} isAdjacent={isAdjacent} level={level} />
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(Tile);
