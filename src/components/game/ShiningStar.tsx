import React from 'react';
import { cn } from '@/lib/utils';

interface ShiningStarProps {
	/** Integer multiple of the 24px sprite */
	scale?: number;
	className?: string;
}

/** The level star: a 6-frame sprite strip (sweep + glint) stepped through with CSS. */
const ShiningStar: React.FC<ShiningStarProps> = ({ scale = 1, className }) => (
	<span
		className={cn('shine-star', className)}
		style={{ '--s': scale } as React.CSSProperties}
		role='img'
		aria-label='Level'
	/>
);

export default ShiningStar;
