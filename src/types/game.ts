import { BIOMES } from '@/config/gameConfig';

export type BiomeType = keyof typeof BIOMES;

export interface Resources {
  gold: number;
  wood: number;
  stone: number;
  coal: number;
  food: number;
}

export interface ResourceRates {
  base: Resources;
  modifiers: Resources;
  total: Resources;
}

export interface BiomeInfo {
  name: BiomeType;
  label: string;
  baseColor: string;
  cost: number;
  resourceGeneration: Partial<Resources>;
  resourceIcons: string[];
  unique?: boolean;
  upgradeable?: boolean;
  maxLevel?: number;
  description?: string;
}

export interface Tile {
  biome: BiomeType;
  isOwned: boolean;
  level?: number;
  upgradeCost?: Resources;
}

export type EquipmentSlot = 'head' | 'neck' | 'chest' | 'mainHand' | 'offHand' | 'legs' | 'feet' | 'ring1' | 'ring2';

export type Equipment = {
  [key in EquipmentSlot]?: Item;
};

export interface Item {
  id: string;
  name: string;
  icon: string;
  slot: EquipmentSlot;
  stats: Partial<Resources>;
  description?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface GameState {
  tiles: Tile[][];
  resources: Resources;
  resourceRates: ResourceRates;
  resourceModifiers: Resources;
  xp: number;
  level: {
    level: number;
    progress: number;
  };
  equipment: Equipment;
  inventory: Item[];
  showCharacterWindow: boolean;
  buyTile: (x: number, y: number) => boolean;
  upgradeCastle: () => boolean;
  tick: (deltaTime: number) => void;
  toggleCharacterWindow: () => void;
  equipItem: (item: Item, fromSlot?: EquipmentSlot) => void;
  unequipItem: (slot: EquipmentSlot) => void;
}
