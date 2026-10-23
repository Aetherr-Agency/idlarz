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
	merchant_portrait: [40, 56],
	equip_head: [40, 40],
	equip_neck: [40, 40],
	equip_chest: [40, 40],
	equip_mainHand: [40, 40],
	equip_offHand: [40, 40],
	equip_legs: [40, 40],
	equip_feet: [40, 40],
	equip_ring: [40, 40],
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

// Equipment slot -> its pixel icon (both ring slots share one sprite)
export const EQUIPMENT_PIXEL_ICONS: Record<string, PixelIconName> = {
	head: 'equip_head',
	neck: 'equip_neck',
	chest: 'equip_chest',
	mainHand: 'equip_mainHand',
	offHand: 'equip_offHand',
	legs: 'equip_legs',
	feet: 'equip_feet',
	ring1: 'equip_ring',
	ring2: 'equip_ring',
};
