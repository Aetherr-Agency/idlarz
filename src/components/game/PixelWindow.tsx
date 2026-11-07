import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWindowStore, type WinId } from '@/stores/windowStore';
import { hasOpenModal } from './PixelModal';

/** Windows narrower than this screen are laid out one at a time, centered (no room for dragging them side by side) */
const NARROW_PX = 900;
/** Keep at least this much of a dragged window on screen */
const KEEP_VISIBLE_PX = 80;
/** The smallest a window can be dragged to */
const MIN_W = 420;
const MIN_H = 260;
/** The z-index of the back-most window; the front one is this plus the number of open windows (modal backdrops are above, at 45) */
const BASE_Z = 40;

interface PixelWindowProps {
	id: WinId;
	title: React.ReactNode;
	icon?: React.ReactNode;
	/** Width in px (shrinks to fit a small screen) */
	width?: number;
	/** A fixed height in px (the farm scene needs one); without it the window is as tall as its content, up to the screen */
	height?: number;
	/** No body padding or scrolling: the content fills the whole window (the farm scene) */
	flush?: boolean;
	className?: string;
	children: React.ReactNode;
}

const useNarrow = (): boolean => {
	const [narrow, setNarrow] = useState(false);
	useEffect(() => {
		const update = () => setNarrow(window.innerWidth < NARROW_PX);
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	return narrow;
};

const headerHeight = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 76;

/**
 * A window of the game: the same bronze frame as PixelModal, but it does not dim or block the screen. Drag it by its title, resize it from the bottom right corner, click
 * anywhere on it to bring it to the front, close it with the X or Esc (the front one). Several can be open at once.
 */
const PixelWindow: React.FC<PixelWindowProps> = ({ id, title, icon, width = 820, height, flush = false, className, children }) => {
	const ref = useRef<HTMLDivElement>(null);
	const pos = useWindowStore((state) => state.positions[id]);
	const rank = useWindowStore((state) => state.order.indexOf(id));
	const isFront = useWindowStore((state) => state.order[state.order.length - 1] === id);
	const size = useWindowStore((state) => state.sizes[id]);
	const { focusWindow, closeWindow, moveWindow, savePositions, resizeWindow, saveSizes } = useWindowStore.getState();
	const narrow = useNarrow();
	const drag = useRef<{ dx: number; dy: number } | null>(null);
	const resize = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

	// Esc closes the front window (unless a real modal is open: that one gets the key first)
	useEffect(() => {
		if (!isFront) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !hasOpenModal()) closeWindow(id);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isFront, closeWindow, id]);

	// a window left near an edge of a bigger screen is pulled back in when the screen got smaller
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el || narrow) return;
		const x = clamp(pos.x, KEEP_VISIBLE_PX - el.offsetWidth, window.innerWidth - KEEP_VISIBLE_PX);
		const y = clamp(pos.y, headerHeight(), window.innerHeight - 40);
		if (x !== pos.x || y !== pos.y) moveWindow(id, x, y);
	}, [pos.x, pos.y, narrow, id, moveWindow]);

	const onDragStart = (e: React.PointerEvent) => {
		if (narrow || e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
		drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
		e.currentTarget.setPointerCapture(e.pointerId);
	};
	const onDragMove = (e: React.PointerEvent) => {
		const el = ref.current;
		if (!drag.current || !el) return;
		const x = clamp(e.clientX - drag.current.dx, KEEP_VISIBLE_PX - el.offsetWidth, window.innerWidth - KEEP_VISIBLE_PX);
		const y = clamp(e.clientY - drag.current.dy, headerHeight(), window.innerHeight - 40);
		moveWindow(id, x, y);
	};
	const onDragEnd = () => {
		if (!drag.current) return;
		drag.current = null;
		savePositions();
	};

	const onResizeStart = (e: React.PointerEvent) => {
		const el = ref.current;
		if (narrow || e.button !== 0 || !el) return;
		e.stopPropagation();
		resize.current = { x: e.clientX, y: e.clientY, w: el.offsetWidth, h: el.offsetHeight };
		e.currentTarget.setPointerCapture(e.pointerId);
	};
	const onResizeMove = (e: React.PointerEvent) => {
		const start = resize.current;
		if (!start) return;
		const maxW = window.innerWidth - pos.x - 8;
		const maxH = window.innerHeight - pos.y - 8;
		resizeWindow(id, clamp(start.w + e.clientX - start.x, MIN_W, maxW), clamp(start.h + e.clientY - start.y, MIN_H, maxH));
	};
	const onResizeEnd = () => {
		if (!resize.current) return;
		resize.current = null;
		saveSizes();
	};

	if (rank < 0) return null;

	const fixedHeight = size?.h ?? height;

	return (
		<div
			ref={ref}
			className={cn('px-modal px-window', narrow && 'px-window-narrow', className)}
			role='dialog'
			aria-label={typeof title === 'string' ? title : undefined}
			// capture phase: a click on anything inside (a button, a tab, an item) also brings the window forward
			onPointerDownCapture={() => focusWindow(id)}
			style={
				{
					'--win-w': `${size?.w ?? width}px`,
					...(fixedHeight ? { '--win-h': `${fixedHeight}px` } : {}),
					left: narrow ? undefined : pos.x,
					top: narrow ? undefined : pos.y,
					zIndex: BASE_Z + rank,
				} as React.CSSProperties
			}
			data-front={isFront}
			data-fixed-height={!!fixedHeight}
		>
			<button className='px-close' onClick={() => closeWindow(id)} aria-label='Close'>
				✕
			</button>
			<div
				className='px-modal-head px-window-handle'
				onPointerDown={onDragStart}
				onPointerMove={onDragMove}
				onPointerUp={onDragEnd}
				onPointerCancel={onDragEnd}
			>
				<span className='px-title-line' />
				<h2 className='px-title'>
					{icon}
					{title}
				</h2>
				<span className='px-title-line rev' />
			</div>
			<div className={cn('px-modal-body', flush && 'px-modal-body-flush')}>{children}</div>
			{!narrow && (
				<div
					className='px-resize'
					onPointerDown={onResizeStart}
					onPointerMove={onResizeMove}
					onPointerUp={onResizeEnd}
					onPointerCancel={onResizeEnd}
					aria-hidden='true'
				/>
			)}
		</div>
	);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

export default PixelWindow;
