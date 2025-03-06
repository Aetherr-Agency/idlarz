import React, { useState, memo, useCallback, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { BiomeType } from '@/types/game';
import { BIOMES } from '@/config/gameConfig';

interface TileProps {
  biome: BiomeType;
  isOwned: boolean;
  x: number;
  y: number;
  style?: React.CSSProperties;
}

const formatModifier = (modifier: number) => {
  const percentage = ((modifier * 100) - 100).toFixed(0);
  const sign = percentage.startsWith('-') ? '' : '+';
  return `${sign}${percentage}%`;
};

const BiomeTooltip = memo(({ biomeInfo }: { biomeInfo: typeof BIOMES[BiomeType] }) => (
  <div className="space-y-1 text-sm">
    {Object.entries(biomeInfo.resourceModifiers).map(([resource, modifier]) => (
      <div key={resource} className="flex justify-between gap-4">
        <span className="text-gray-400">{resource}:</span>
        <span className={modifier >= 1 ? 'text-green-400' : 'text-red-400'}>
          {formatModifier(modifier)}
        </span>
      </div>
    ))}
  </div>
));

const BiomeButton = memo(({ 
  biome, 
  canPurchase, 
  onSelect 
}: { 
  biome: BiomeType; 
  canPurchase: boolean; 
  onSelect: (biome: BiomeType) => void;
}) => {
  const biomeInfo = BIOMES[biome];
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect(biome);
      }}
      className={`
        group/biome relative p-2 rounded flex flex-col items-center gap-1 
        transition-all duration-200 ease-in-out
        ${canPurchase ? 'hover:bg-gray-700 hover:scale-105 active:scale-95' : 'opacity-50 cursor-not-allowed'}
      `}
      disabled={!canPurchase}
      aria-label={`Select ${biomeInfo.label} biome${!canPurchase ? ' (Cannot afford)' : ''}`}
    >
      <div className="text-xl" role="img" aria-hidden="true">
        {biomeInfo.resourceIcons[0]}
      </div>
      <div className="text-xs font-medium">
        {biomeInfo.label}
      </div>
      <div className={`text-xs flex items-center gap-1 ${canPurchase ? 'text-gray-400' : 'text-red-400'}`}>
        <span role="img" aria-label="gold cost">💰</span>
        {biomeInfo.cost}
      </div>

      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover/biome:opacity-100 pointer-events-none z-50 transition-opacity duration-200">
        <div className="bg-gray-900 rounded-lg shadow-xl p-2 whitespace-nowrap border border-gray-700">
          <BiomeTooltip biomeInfo={biomeInfo} />
        </div>
      </div>
    </button>
  );
});

const TileStatus = memo(({ biome, isOwned, isAdjacent }: { biome: BiomeType; isOwned: boolean; isAdjacent: boolean }) => {
  if (isOwned) {
    const biomeInfo = BIOMES[biome];
    return (
      <div className="space-y-1">
        <div className="font-medium">{biomeInfo.label}</div>
        <div className="text-sm text-gray-400">Resource Modifiers:</div>
        <BiomeTooltip biomeInfo={biomeInfo} />
      </div>
    );
  }
  
  if (isAdjacent) {
    return (
      <div>
        <div className="font-medium text-gray-300">Available for Purchase</div>
        <div className="text-sm text-gray-400 mt-1">Click to select biome</div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="font-medium text-gray-400">Unavailable</div>
      <div className="text-sm text-gray-500 mt-1">Must be adjacent to owned tile</div>
    </div>
  );
});

const Tile: React.FC<TileProps> = ({ biome, isOwned, x, y, style }) => {
  const [showBiomeSelector, setShowBiomeSelector] = useState(false);
  const [canAfford, setCanAfford] = useState(true);
  const buyTile = useGameStore(state => state.buyTile);
  const resources = useGameStore(state => state.resources);
  const tiles = useGameStore(state => state.tiles);

  const isAdjacent = useMemo(() => {
    if (isOwned) return false;
    
    const adjacentPositions = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1]
    ];

    return adjacentPositions.some(([adjX, adjY]) => 
      adjX >= 0 && adjX < tiles[0].length && 
      adjY >= 0 && adjY < tiles.length && 
      tiles[adjY][adjX].isOwned
    );
  }, [x, y, tiles, isOwned]);

  const handleTileClick = useCallback(() => {
    if (!isOwned && isAdjacent) {
      setShowBiomeSelector(true);
    }
  }, [isOwned, isAdjacent]);

  const handleBiomeSelect = useCallback((selectedBiome: BiomeType) => {
    if (resources.gold >= BIOMES[selectedBiome].cost) {
      if (buyTile(selectedBiome, x, y)) {
        setShowBiomeSelector(false);
        setCanAfford(true);
      }
    } else {
      setCanAfford(false);
      setTimeout(() => setCanAfford(true), 200);
    }
  }, [resources.gold, buyTile, x, y]);

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
        ${showBiomeSelector && 'ring-2 ring-blue-500 animate-pulse-ring'}
        ${!canAfford && 'animate-shake'}
        border border-gray-800 hover:border-gray-600
        rounded-sm
      `}
      style={{ 
        ...style,
        backgroundColor,
      }}
      onClick={handleTileClick}
      role="button"
      aria-label={`${BIOMES[biome].label} tile${isOwned ? ' (owned)' : isAdjacent ? ' (available for purchase)' : ' (unavailable)'}`}
      tabIndex={isAdjacent ? 0 : -1}
    >
      <div className="absolute inset-0 flex items-center justify-center text-lg">
        {BIOMES[biome].resourceIcons.map((icon, i) => (
          <span key={i} role="img" aria-hidden="true">
            {icon}
          </span>
        ))}
      </div>

      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none z-40 transition-opacity duration-200">
        <div className="bg-gray-800 rounded-lg shadow-xl p-3 whitespace-nowrap border border-gray-700">
          <TileStatus biome={biome} isOwned={isOwned} isAdjacent={isAdjacent} />
        </div>
      </div>

      {showBiomeSelector && (
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          role="dialog"
          aria-label="Select biome type"
        >
          <div className="bg-gray-800 rounded-lg shadow-xl p-2 border border-gray-700">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(BIOMES) as BiomeType[])
                .filter(biomeName => biomeName !== 'empty')
                .map(biomeName => (
                  <BiomeButton
                    key={biomeName}
                    biome={biomeName}
                    canPurchase={resources.gold >= BIOMES[biomeName].cost}
                    onSelect={handleBiomeSelect}
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(Tile);
