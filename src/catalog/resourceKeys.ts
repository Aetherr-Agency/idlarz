import { RESOURCES, type ResourceDef } from '@/catalog/resources';

/**
 * The one list of the resources a save and the ledger store (gold ... xp), derived from the catalog: a new resource is one catalog entry
 * with `stored: true`, nothing else needs a hand-kept list. Imports only the catalog (never the config), so every module can use it.
 * The order is the catalog's and must stay the order of saves written so far (tests/catalog/catalog.test.ts pins it).
 */
type Catalog = typeof RESOURCES;
export type StoredKey = { [K in keyof Catalog]: Catalog[K] extends { stored: true } ? K : never }[keyof Catalog];

export type FarmKey = { [K in keyof Catalog]: Catalog[K] extends { farm: true } ? K : never }[keyof Catalog];

const entries = Object.entries(RESOURCES) as [keyof Catalog, ResourceDef][];
const keysWhere = (test: (def: ResourceDef) => boolean): StoredKey[] => entries.filter(([, def]) => def.stored && test(def)).map(([key]) => key as StoredKey);

/** Every stored resource, in catalog order */
export const STORED_KEYS: readonly StoredKey[] = keysWhere(() => true);
/** The ones a save may leave out (added after the first saves) */
export const OPTIONAL_KEYS: readonly StoredKey[] = keysWhere((def) => !!def.optionalInSave);
/** The farm's products, including meat */
export const FARM_KEYS = keysWhere((def) => !!def.farm) as readonly FarmKey[];

export type StoredAmounts = Record<StoredKey, number>;

/** A full record with 0 for every stored key; `values` sets the ones that are not 0 (so a table lists only what it uses) */
export const amounts = (values: Partial<StoredAmounts> = {}): StoredAmounts => {
	const out = {} as StoredAmounts;
	for (const key of STORED_KEYS) out[key] = values[key] ?? 0;
	return out;
};

export const zeroResources = (): StoredAmounts => amounts();
