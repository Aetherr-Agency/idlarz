import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FLOAT_EVENT, FloatDetail } from '@/lib/floatText';
import { formatNumber } from '@/utils/formatters';
import ResourceIcon from './ResourceIcon';

interface Popup extends FloatDetail {
	id: number;
	drift: number;
}

const POPUP_DURATION_MS = 1000;

// Resource colours for the popup lines
const RESOURCE_COLORS: Record<string, string> = {
	gold: '#ffe27a',
	wood: '#e0b078',
	stone: '#d4cdb8',
	coal: '#9fb4e8',
	food: '#f4d25a',
	meat: '#ff9a86',
};

/**
 * Renders "+N <icon>" popups where the player clicked. Mounted once; everything that earns
 * resources on click emits through lib/floatText. Portalled to <body> so layout never shifts it.
 */
const FloatingText: React.FC = () => {
	const [popups, setPopups] = useState<Popup[]>([]);
	const nextId = useRef(0);

	useEffect(() => {
		const onFloat = (e: Event) => {
			const detail = (e as CustomEvent<FloatDetail>).detail;
			if (!detail.items.length) return;
			const popup: Popup = {
				...detail,
				id: nextId.current++,
				drift: Math.round((Math.random() - 0.5) * 36), // rapid clicks fan out sideways
			};
			setPopups((prev) => [...prev.slice(-12), popup]);
			setTimeout(
				() => setPopups((prev) => prev.filter((p) => p.id !== popup.id)),
				POPUP_DURATION_MS
			);
		};
		window.addEventListener(FLOAT_EVENT, onFloat);
		return () => window.removeEventListener(FLOAT_EVENT, onFloat);
	}, []);

	if (popups.length === 0) return null;

	return createPortal(
		popups.map((p) => (
			<div
				key={p.id}
				className='gold-popup'
				style={
					{
						left: p.x,
						top: p.y,
						'--drift': `${p.drift}px`,
						animationDuration: `${POPUP_DURATION_MS}ms`,
					} as React.CSSProperties
				}>
				<span className='gold-popup-inner'>
					{p.lucky && <span className='float-lucky'>✦ Lucky tap! ✦</span>}
					{p.items.map((item) => (
						<span
							key={item.resource}
							className='float-line'
							style={{ color: RESOURCE_COLORS[item.resource] ?? '#fff' }}>
							<ResourceIcon resource={item.resource} />
							+{formatNumber(item.amount)}
						</span>
					))}
				</span>
			</div>
		)),
		document.body
	);
};

export default FloatingText;
