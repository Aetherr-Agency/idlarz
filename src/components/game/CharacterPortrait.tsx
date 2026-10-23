import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useUiStore } from '@/stores/uiStore';
import { DEFAULT_PLAYER_CLASS, PLAYER_CLASSES } from '@/config/playerClasses';
import { cn } from '@/lib/utils';
import PixelIcon from './PixelIcon';

interface CharacterPortraitProps {
	/** 'full' = the whole figure (56x80), 'bust' = head and shoulders (40x40) */
	variant?: 'full' | 'bust';
	scale?: number;
	/** Double-click opens the class picker */
	interactive?: boolean;
	className?: string;
}

/** The player's character in their chosen class - used everywhere the hero appears. */
const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
	variant = 'full',
	scale = 1,
	interactive = true,
	className,
}) => {
	const playerClass = useGameStore((state) => state.playerClass);
	const openClassDialog = useUiStore((state) => state.openClassDialog);
	const info = PLAYER_CLASSES[playerClass] ?? PLAYER_CLASSES[DEFAULT_PLAYER_CLASS];

	return (
		<span
			className={cn('character-portrait', interactive && 'is-interactive', className)}
			title={interactive ? 'Double-click to change class' : undefined}
			onDoubleClick={interactive ? openClassDialog : undefined}>
			<PixelIcon
				name={variant === 'bust' ? info.bust : info.full}
				scale={scale}
				alt={`${info.race} ${info.label}`}
			/>
		</span>
	);
};

export default CharacterPortrait;
