import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PixelModalProps {
	title: React.ReactNode;
	icon?: React.ReactNode;
	onClose: () => void;
	/** sm 440px (confirmations), md 760px (pickers), lg 1080px x full height (windows) */
	size?: 'sm' | 'md' | 'lg';
	closeOnBackdrop?: boolean;
	hideClose?: boolean;
	className?: string;
	children: React.ReactNode;
}

/**
 * The one modal shell: bronze 9-slice frame over cracked stone, ornamented title bar, pixel close
 * button, Esc / backdrop to dismiss. Every window and dialog uses it so size and feel stay unified.
 */
const PixelModal: React.FC<PixelModalProps> = ({
	title,
	icon,
	onClose,
	size = 'md',
	closeOnBackdrop = true,
	hideClose = false,
	className,
	children,
}) => {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
		<div
			className='px-backdrop'
			onMouseDown={(e) => {
				if (closeOnBackdrop && e.target === e.currentTarget) onClose();
			}}>
			<div
				className={cn('px-modal', `px-modal-${size}`, className)}
				role='dialog'
				aria-modal='true'>
				{!hideClose && (
					<button className='px-close' onClick={onClose} aria-label='Close'>
						✕
					</button>
				)}
				<div className='px-modal-head'>
					<span className='px-title-line' />
					<h2 className='px-title'>
						{icon}
						{title}
					</h2>
					<span className='px-title-line rev' />
				</div>
				<div className='px-modal-body'>{children}</div>
			</div>
		</div>
	);
};

export default PixelModal;
