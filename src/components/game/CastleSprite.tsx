import React from 'react';
import { cn } from '@/lib/utils';
import { CASTLE_UPGRADE } from '@/config/gameConfig';
import { castleIconName } from '@/config/pixelIcons';
import PixelIcon from './PixelIcon';

interface CastleSpriteProps {
	level: number;
	/** `tile`: absolutely centred on its map tile and free to overflow onto neighbours.
	 *  `inline`: normal flow (dialogs). */
	variant?: 'tile' | 'inline';
	className?: string;
}

// Sparkles that drift up around the max-level castle
const SPARKS = [
	{ x: '18%', d: '0s' },
	{ x: '46%', d: '0.9s' },
	{ x: '74%', d: '1.7s' },
	{ x: '32%', d: '2.3s' },
];

/**
 * The castle for a given upgrade level. Each level is a bigger, grander sprite; the max level is a
 * 72px animated sheet (waving flags, pulsing crystal) with a golden glow that overflows the tile.
 */
const CastleSprite: React.FC<CastleSpriteProps> = ({ level, variant = 'tile', className }) => {
	const isMax = level >= CASTLE_UPGRADE.maxLevel;
	const inline = variant === 'inline';

	if (isMax) {
		return (
			<span className={cn('castle-sprite castle-max', inline && 'castle-inline', className)}>
				{!inline && SPARKS.map((s) => (
					<i
						key={s.x}
						className='castle-spark'
						style={{ '--x': s.x, '--d': s.d } as React.CSSProperties}
					/>
				))}
			</span>
		);
	}

	return (
		<PixelIcon
			name={castleIconName(level)}
			alt={`Castle level ${level}`}
			className={cn('castle-sprite', inline && 'castle-inline', className)}
		/>
	);
};

export default CastleSprite;
