import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/stores/gameStore';
import Tile from './Tile';
import { GRID_SIZE, GRID_HEIGHT, TILE_SIZE } from '@/config/gameConfig';

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

  const visibleTiles = useMemo(() => {
    if (!tiles) return [];

    const startX = Math.max(0, Math.floor(-position.x / TILE_SIZE) - VISIBLE_PADDING);
    const endX = Math.min(GRID_SIZE, Math.ceil((-position.x + windowSize.x) / TILE_SIZE) + VISIBLE_PADDING);
    const startY = Math.max(0, Math.floor(-position.y / TILE_SIZE) - VISIBLE_PADDING);
    const endY = Math.min(GRID_HEIGHT, Math.ceil((-position.y + windowSize.y) / TILE_SIZE) + VISIBLE_PADDING);

    const visible: JSX.Element[] = [];
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (!tiles[y] || !tiles[y][x]) continue;
        const tile = tiles[y][x];
        visible.push(
          <Tile
            key={`${x},${y}`}
            biome={tile.biome}
            isOwned={tile.isOwned}
            x={x}
            y={y}
            level={tile.level}
            style={{
              width: TILE_SIZE,
              height: TILE_SIZE,
              transform: `translate(${x * TILE_SIZE}px, ${y * TILE_SIZE}px)`
            }}
          />
        );
      }
    }
    return visible;
  }, [position.x, position.y, windowSize, tiles]);

  if (!tiles) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
        <div className="text-white text-lg">Loading world...</div>
      </div>
    );
  }

  return (
    <div 
      ref={gridRef}
      className="fixed inset-0 overflow-hidden bg-gray-950"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <div 
        className="absolute"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: GRID_SIZE * TILE_SIZE,
          height: GRID_HEIGHT * TILE_SIZE
        }}
      >
        {visibleTiles}
      </div>
    </div>
  );
};

export default Grid;
