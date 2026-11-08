import { useEffect, useState } from 'react';

/** "1 min 12 s" or "45 s" */
export const formatRest = (sec: number): string => (sec >= 60 ? `${Math.floor(sec / 60)} min ${sec % 60} s` : `${sec} s`);

/** Whole seconds left until `endsAt` (epoch ms), never below 0; `null` when no rest is going on. */
export const restSecondsLeft = (endsAt: number | null, nowMs: number): number | null =>
	endsAt === null ? null : Math.max(0, Math.ceil((endsAt - nowMs) / 1000));

/**
 * The seconds left of the hero's rest before the queue's next fight, counted down locally between the server's answers (the server only
 * says how long the rest takes; the next answer comes about when it is over). `null` while no rest is going on.
 */
export const useRestCountdown = (endsAt: number | null): number | null => {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (endsAt === null) return;
		setNow(Date.now());
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [endsAt]);
	return restSecondsLeft(endsAt, now);
};
