import React from 'react';
import { cn } from '@/lib/utils';

interface StableNumberProps {
	value: string;
	className?: string;
}

/**
 * Renders a pre-formatted number with every digit in a fixed-width cell, so counters that tick
 * (1.99K -> 2.00K, 9.9 -> 10.1) never change width or nudge their neighbours.
 */
const StableNumber: React.FC<StableNumberProps> = ({ value, className }) => (
	<span className={cn('inline-flex whitespace-pre', className)} aria-label={value}>
		{value.split('').map((char, i) =>
			/\d/.test(char) ? (
				<span key={i} className='inline-block text-center w-[0.62em]' aria-hidden>
					{char}
				</span>
			) : (
				<span key={i} aria-hidden>
					{char}
				</span>
			)
		)}
	</span>
);

export default StableNumber;
