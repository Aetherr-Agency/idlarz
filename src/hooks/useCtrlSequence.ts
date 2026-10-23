import { useEffect } from 'react';

/** Calls `onTrigger` when the Control key is pressed `count` times within `windowMs` (hidden menu shortcut). */
export const useCtrlSequence = (count: number, windowMs: number, onTrigger: () => void) => {
	useEffect(() => {
		let stamps: number[] = [];
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Control' || e.repeat) return;
			const now = performance.now();
			stamps = [...stamps.filter((t) => now - t <= windowMs), now];
			if (stamps.length >= count) {
				stamps = [];
				onTrigger();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [count, windowMs, onTrigger]);
};
