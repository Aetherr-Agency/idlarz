// Pixel-art icon set (see scripts/pixel/reference/STYLE.md). Sprites are drawn at native size and must be
// displayed at 1x / integer scales with `image-rendering: pixelated`.
export const PIXEL_ICON_DIR = '/pixel/v3';

export const PIXEL_ICON_SIZES = {
	gold: [40, 40],
	wood: [40, 40],
	stone: [40, 40],
	coal: [40, 40],
	food: [40, 40],
	meat: [40, 40],
	menu_character: [40, 40],
	menu_merchant: [40, 40],
	menu_farm: [40, 40],
	level_star: [24, 24],
	hero: [40, 56],
} as const;

export type PixelIconName = keyof typeof PIXEL_ICON_SIZES;

export const pixelIconSrc = (name: PixelIconName) => `${PIXEL_ICON_DIR}/${name}.png`;

// Resource key -> sprite. Resources without an entry (e.g. xp) fall back to their emoji.
export const RESOURCE_PIXEL_ICONS: Partial<Record<string, PixelIconName>> = {
	gold: 'gold',
	wood: 'wood',
	stone: 'stone',
	coal: 'coal',
	food: 'food',
	meat: 'meat',
};
