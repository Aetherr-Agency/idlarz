import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import Tile from './Tile';
import { GRID_SIZE, GRID_HEIGHT, TILE_SIZE, VIEWPORT_SIZE, TILE_PURCHASE_COST } from '@/config/gameConfig';

const MIN_VELOCITY = 1;
const VELOCITY_SCALE = 1;
const VISIBLE_PADDING = 2;

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

const Grid: React.FC = () => {
  const tiles = useGameStore(state => state.tiles);
  const buyTile = useGameStore(state => state.buyTile);
  const resources = useGameStore(state => state.resources);
  const gridRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState<Velocity>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Position | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [windowSize, setWindowSize] = useState<Position>({ x: 800, y: 600 });
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const updateWindowSize = () => {
      if (typeof window !== 'undefined') {
        setWindowSize({
          x: window.innerWidth,
          y: window.innerHeight
        });
      }
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);

    // Center the grid initially
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_HEIGHT / 2);
    
    // Adjust initial position to center the viewport
    const viewportWidth = VIEWPORT_SIZE * TILE_SIZE;
    const viewportHeight = VIEWPORT_SIZE * TILE_SIZE;
    
    setPosition({
      x: (window.innerWidth / 2) - (centerX * TILE_SIZE),
      y: (window.innerHeight / 2) - (centerY * TILE_SIZE)
    });

    return () => {
      window.removeEventListener('resize', updateWindowSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const getBoundedPosition = useCallback((pos: Position): Position => {
    const gridWidth = GRID_SIZE * TILE_SIZE;
    const gridHeight = GRID_HEIGHT * TILE_SIZE;
    
    // Calculate maximum allowed movement to keep grid visible
    const minX = -(gridWidth - windowSize.x);  // Don't allow dragging past right edge
    const minY = -(gridHeight - windowSize.y);  // Don't allow dragging past bottom edge
    const maxX = 0;  // Don't allow dragging past left edge
    const maxY = 0;  // Don't allow dragging past top edge
    
    return {
      x: Math.min(maxX, Math.max(minX, pos.x)),
      y: Math.min(maxY, Math.max(minY, pos.y))
    };
  }, [windowSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = 'touches' in e ? e.touches[0] : e;
    setIsDragging(true);
    setLastMousePos({ x: pos.clientX, y: pos.clientY });
    setVelocity({ x: 0, y: 0 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !lastMousePos) return;
    e.preventDefault();
    
    const pos = 'touches' in e ? e.touches[0] : e;
    const deltaX = pos.clientX - lastMousePos.x;
    const deltaY = pos.clientY - lastMousePos.y;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastUpdateTime;

    if (deltaTime > 0) {
      setVelocity({
        x: (deltaX / deltaTime) * VELOCITY_SCALE,
        y: (deltaY / deltaTime) * VELOCITY_SCALE
      });
    }

    setPosition(prev => getBoundedPosition({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setLastMousePos({ x: pos.clientX, y: pos.clientY });
    setLastUpdateTime(currentTime);
  }, [isDragging, lastMousePos, lastUpdateTime, getBoundedPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setLastMousePos(null);
  }, []);

  const animate = useCallback(() => {
    if (!isDragging) {
      setVelocity(prev => {
        const newVel = {
          x: prev.x,
          y: prev.y
        };

        if (Math.abs(newVel.x) < MIN_VELOCITY && Math.abs(newVel.y) < MIN_VELOCITY) {
          return { x: 0, y: 0 };
        }

        setPosition(prevPos => getBoundedPosition({
          x: prevPos.x + newVel.x,
          y: prevPos.y + newVel.y
        }));

        return newVel;
      });
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isDragging, getBoundedPosition]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  const getTileCoordinates = useCallback((clientX: number, clientY: number) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return { x: -1, y: -1 };

    const x = Math.floor((clientX - rect.left - position.x) / TILE_SIZE);
    const y = Math.floor((clientY - rect.top - position.y) / TILE_SIZE);

    return { x, y };
  }, [position.x, position.y]);

  const isAdjacentToOwned = useCallback((x: number, y: number, tiles: any[][]) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_HEIGHT) return false;

    // Check only orthogonal adjacency (not diagonal)
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    return directions.some(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return nx >= 0 && nx < GRID_SIZE && 
             ny >= 0 && ny < GRID_HEIGHT && 
             tiles[ny][nx]?.isOwned;
    });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging) return;

    const pos = 'touches' in e ? e.touches[0] : e;
    const { x, y } = getTileCoordinates(pos.clientX, pos.clientY);
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_HEIGHT && tiles?.[y]?.[x]) {
      const tile = tiles[y][x];
      if (!tile.isOwned && isAdjacentToOwned(x, y, tiles)) {
        if (resources.gold >= TILE_PURCHASE_COST) {
          buyTile(x, y);
        } else {
          // Add shake animation for can't afford
          const element = e.currentTarget;
          element.classList.add('shake');
          setTimeout(() => element.classList.remove('shake'), 500);
        }
      }
    }
  }, [isDragging, getTileCoordinates, tiles, isAdjacentToOwned, buyTile, resources.gold]);

  const visibleTiles = useMemo(() => {
    const startX = Math.floor(-position.x / TILE_SIZE);
    const startY = Math.floor(-position.y / TILE_SIZE);
    const tilesX = Math.ceil(windowSize.x / TILE_SIZE) + VISIBLE_PADDING * 2;
    const tilesY = Math.ceil(windowSize.y / TILE_SIZE) + VISIBLE_PADDING * 2;

    const visibleArea = {
      startX: Math.max(0, startX - VISIBLE_PADDING),
      startY: Math.max(0, startY - VISIBLE_PADDING),
      endX: Math.min(GRID_SIZE, startX + tilesX),
      endY: Math.min(GRID_HEIGHT, startY + tilesY)
    };

    const result = [];
    for (let y = visibleArea.startY; y < visibleArea.endY; y++) {
      for (let x = visibleArea.startX; x < visibleArea.endX; x++) {
        if (tiles[y] && tiles[y][x]) {
          result.push({
            tile: tiles[y][x],
            x,
            y
          });
        }
      }
    }
    return result;
  }, [position.x, position.y, windowSize, tiles]);

  return (
    <div 
      ref={gridRef}
      className="fixed inset-0 overflow-hidden bg-gray-900 select-none touch-none"
    >
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake {
          animation: shake 0.2s ease-in-out 0s 3;
        }
      `}</style>
      <div 
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          willChange: 'transform',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onTouchCancel={handleMouseUp}
      >
        {visibleTiles.map(({ tile, x, y }) => (
          <Tile
            key={`${x}-${y}`}
            biome={tile.biome}
            isOwned={tile.isOwned}
            x={x}
            y={y}
            level={tile.level}
            upgradeCost={tile.upgradeCost}
            style={{
              position: 'absolute',
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Grid;
