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
  resourceModifiers: Partial<Resources>;
  resourceIcons: string[];
  unique?: boolean;
  upgradeable?: boolean;
  maxLevel?: number;
}

export interface Tile {
  biome: BiomeType;
  isOwned: boolean;
  level?: number;
  upgradeCost?: Resources;
}

export interface GameState {
  tiles: Tile[][];
  resources: Resources;
  resourceRates: ResourceRates;
  buyTile: (biome: BiomeType, x: number, y: number) => boolean;
  tick: (deltaTime: number) => void;
}
