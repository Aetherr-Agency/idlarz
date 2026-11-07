// The old views of catalog/resources.ts (icons and header tooltips) and the helper that builds them.
// Split out of gameConfig.ts (IDL-15); the values are unchanged.
import { RESOURCES, type ResourceKey } from '@/catalog/resources';

// Resource presentation (labels, glyphs, tooltips, merchant prices) lives in catalog/resources.ts; these are the old views of it
export const resourceKeys = Object.keys(RESOURCES) as ResourceKey[];
export const fromResources = <V>(keys: readonly string[], pick: (key: ResourceKey) => V) =>
	Object.fromEntries(keys.map((key) => [key, pick(key as ResourceKey)]));

export const RESOURCE_ICONS = fromResources(resourceKeys, (key) => RESOURCES[key].emoji) as { [K in ResourceKey]: string };

// What the header tooltips say about each currency: what it is, what it is for and where it comes from.
export const HEADER_DISPLAYED_RESOURCES_INFO = fromResources(
	resourceKeys.filter((key) => key !== 'gems' && key !== 'embers'),
	(key) => {
		const { emoji, label, description, usedFor, source } = RESOURCES[key];
		return { icon: emoji, label, description, usedFor, source };
	},
) as { [K in Exclude<ResourceKey, 'gems' | 'embers'>]: { icon: string; label: string; description: string; usedFor: string; source: string } };
