import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/lib/utils';

export const NAME_MAX_LENGTH = 9;

interface EditableNameProps {
	className?: string;
}

/** The hero's name; double-click to rename (Enter saves, Esc cancels, clicking away saves). */
const EditableName: React.FC<EditableNameProps> = ({ className }) => {
	const playerName = useGameStore((state) => state.playerName);
	const setPlayerName = useGameStore((state) => state.setPlayerName);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(playerName);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editing) inputRef.current?.select();
	}, [editing]);

	const commit = () => {
		if (draft.trim()) setPlayerName(draft);
		setEditing(false);
	};

	if (editing) {
		return (
			<input
				ref={inputRef}
				className={cn('px-name-input', className)}
				value={draft}
				maxLength={NAME_MAX_LENGTH}
				autoFocus
				spellCheck={false}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onClick={(e) => e.stopPropagation()}
				onDoubleClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					e.stopPropagation();
					if (e.key === 'Enter') commit();
					if (e.key === 'Escape') {
						e.nativeEvent.stopImmediatePropagation();
						setEditing(false);
					}
				}}
				aria-label='Hero name'
			/>
		);
	}

	return (
		<span
			className={cn('px-name', className)}
			title='Double-click to rename'
			onDoubleClick={() => {
				setDraft(playerName);
				setEditing(true);
			}}>
			{playerName}
		</span>
	);
};

export default EditableName;
