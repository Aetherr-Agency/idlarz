import React, {
	useRef,
	useEffect,
	useState,
	useCallback,
	useMemo,
	JSX,
} from 'react';
import { useGameStore } from '@/stores/gameStore';
import { GRID_SIZE, GRID_HEIGHT, TILE_SIZE } from '@/config/gameConfig';
import Tile from './Tile';
import CastleRange from './CastleRange';

interface Position {
	x: number;
	y: number;
}

interface Velocity {
	x: number;
	y: number;
}

const MIN_VELOCITY = 0.02; // px/ms below which the fling stops
const VELOCITY_SCALE = 1;
const FRAME_MS = 8; // converts px/ms to px/frame (tuned so a flick travels ~80x its speed)
const FRICTION = 0.9; // per-frame velocity decay while flinging
const FLING_MAX_IDLE_MS = 100; // releasing after pausing longer than this does not fling
const VISIBLE_PADDING = 2;

const Grid: React.FC = () => {
	const tiles = useGameStore((state) => state.tiles);
	const gridRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
	const velocityRef = useRef<Velocity>({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [lastMousePos, setLastMousePos] = useState<Position | null>(null);
	const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
	const [windowSize, setWindowSize] = useState<Position>({ x: 800, y: 600 });
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		const updateWindowSize = () => {
			if (typeof window !== 'undefined') {
				setWindowSize({
					x: window.innerWidth,
					y: window.innerHeight,
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
			x: window.innerWidth / 2 - centerX * TILE_SIZE,
			y: window.innerHeight / 2 - centerY * TILE_SIZE,
		});

		return () => {
			window.removeEventListener('resize', updateWindowSize);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	const getBoundedPosition = useCallback(
		(pos: Position): Position => {
			const gridWidth = GRID_SIZE * TILE_SIZE;
			const gridHeight = GRID_HEIGHT * TILE_SIZE;

			// Calculate maximum allowed movement to keep grid visible
			const minX = -(gridWidth - windowSize.x); // Don't allow dragging past right edge
			const minY = -(gridHeight - windowSize.y); // Don't allow dragging past bottom edge
			const maxX = 0; // Don't allow dragging past left edge
			const maxY = 0; // Don't allow dragging past top edge

			return {
				x: Math.min(maxX, Math.max(minX, pos.x)),
				y: Math.min(maxY, Math.max(minY, pos.y)),
			};
		},
		[windowSize]
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			e.preventDefault();
			const pos = 'touches' in e ? e.touches[0] : e;
			setIsDragging(true);
			setLastMousePos({ x: pos.clientX, y: pos.clientY });
			velocityRef.current = { x: 0, y: 0 };
		},
		[]
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (!isDragging || !lastMousePos) return;
			e.preventDefault();

			const pos = 'touches' in e ? e.touches[0] : e;
			const deltaX = pos.clientX - lastMousePos.x;
			const deltaY = pos.clientY - lastMousePos.y;
			const currentTime = performance.now();
			const deltaTime = currentTime - lastUpdateTime;

			if (deltaTime > 0) {
				velocityRef.current = {
					x: (deltaX / deltaTime) * VELOCITY_SCALE,
					y: (deltaY / deltaTime) * VELOCITY_SCALE,
				};
			}

			setPosition((prev) =>
				getBoundedPosition({
					x: prev.x + deltaX,
					y: prev.y + deltaY,
				})
			);

			setLastMousePos({ x: pos.clientX, y: pos.clientY });
			setLastUpdateTime(currentTime);
		},
		[isDragging, lastMousePos, lastUpdateTime, getBoundedPosition]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
		setLastMousePos(null);
		if (performance.now() - lastUpdateTime > FLING_MAX_IDLE_MS) {
			velocityRef.current = { x: 0, y: 0 };
		}
	}, [lastUpdateTime]);

	const animate = useCallback(() => {
		const vel = velocityRef.current;
		if (!isDragging && (vel.x !== 0 || vel.y !== 0)) {
			if (Math.abs(vel.x) < MIN_VELOCITY && Math.abs(vel.y) < MIN_VELOCITY) {
				velocityRef.current = { x: 0, y: 0 };
			} else {
				setPosition((prevPos) =>
					getBoundedPosition({
						x: prevPos.x + vel.x * FRAME_MS,
						y: prevPos.y + vel.y * FRAME_MS,
					})
				);
				velocityRef.current = { x: vel.x * FRICTION, y: vel.y * FRICTION };
			}
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

		const startX = Math.max(
			0,
			Math.floor(-position.x / TILE_SIZE) - VISIBLE_PADDING
		);
		const endX = Math.min(
			GRID_SIZE,
			Math.ceil((-position.x + windowSize.x) / TILE_SIZE) + VISIBLE_PADDING
		);
		const startY = Math.max(
			0,
			Math.floor(-position.y / TILE_SIZE) - VISIBLE_PADDING
		);
		const endY = Math.min(
			GRID_HEIGHT,
			Math.ceil((-position.y + windowSize.y) / TILE_SIZE) + VISIBLE_PADDING
		);

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
							building={tile.building}
						style={{
							width: TILE_SIZE,
							height: TILE_SIZE,
							transform: `translate(${x * TILE_SIZE}px, ${y * TILE_SIZE}px)`,
						}}
					/>
				);
			}
		}
		return visible;
	}, [position.x, position.y, windowSize, tiles]);

	if (!tiles) {
		return (
			<div className='fixed inset-0 flex items-center justify-center bg-gray-950'>
				<div className='text-white text-lg'>Loading world...</div>
			</div>
		);
	}

	return (
		<div
			ref={gridRef}
			className='fixed inset-0 overflow-hidden bg-gray-950'
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
			onTouchStart={handleMouseDown}
			onTouchMove={handleMouseMove}
			onTouchEnd={handleMouseUp}>
			{/* Fog of war: drifting mist behind the map; far-away tiles are transparent so it shows through */}
			<div className='fog-layer fog-a' />
			<div
				className='fog-layer fog-b'
				style={{ backgroundPosition: `${position.x * 0.35}px ${position.y * 0.35}px` }}
			/>
			<div
				className='absolute'
				style={{
					transform: `translate(${position.x}px, ${position.y}px)`,
					width: GRID_SIZE * TILE_SIZE,
					height: GRID_HEIGHT * TILE_SIZE,
				}}>
				{visibleTiles}
				<CastleRange />
			</div>
		</div>
	);
};

export default Grid;
