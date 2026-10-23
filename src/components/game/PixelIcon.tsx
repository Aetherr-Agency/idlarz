import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PIXEL_ICON_SIZES, PixelIconName, pixelIconSrc } from '@/config/pixelIcons';

interface PixelIconProps {
	name: PixelIconName;
	alt?: string;
	/** Integer multiple of the native sprite size (0.5 is fine for tiny inline use). */
	scale?: number;
	className?: string;
}

const PixelIcon: React.FC<PixelIconProps> = ({ name, alt = '', scale = 1, className }) => {
	const [w, h] = PIXEL_ICON_SIZES[name];
	return (
		<Image
			src={pixelIconSrc(name)}
			alt={alt}
			width={w * scale}
			height={h * scale}
			unoptimized
			draggable={false}
			className={cn('pixelated shrink-0 select-none', className)}
		/>
	);
};

export default PixelIcon;
