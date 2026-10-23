# 01 · Architecture

## Stack

| Piece | Version (after this upgrade) | Notes |
| --- | --- | --- |
| Next.js | 15.5.28 | App Router, single page (`src/app/page.tsx`), `'use client'` |
| React | 19.3.x | |
| Tailwind CSS | 4.3.x via `@tailwindcss/postcss` | `@import 'tailwindcss'` in `globals.css`, no config file |
| Zustand | 5.0.x | `persist` middleware → `localStorage` |
| TypeScript | 5.9 | `strict` |
| ESLint | 9 (flat config, `next/core-web-vitals` + `next/typescript`) | `npm run lint` = `next lint` (deprecated in 15.5, removed in 16) |
| Helpers | `clsx`, `tailwind-merge` (`src/lib/utils.ts` → `cn()`) | |

No backend, no API routes, no tests. The whole game is client-side state.

## File map

```
src/
├── app/
│   ├── layout.tsx            html shell + metadata
│   ├── page.tsx              game loop (setInterval tick), chest-toast wiring, composes all overlays
│   └── globals.css           tailwind import + keyframes (shake, pulse-ring, gold-click …)
├── config/gameConfig.ts      ALL tunable constants: grid, costs, biomes, castle, animals, buildings, prices, stats
├── types/game.ts             Resources, Tile, CharacterStats, GameState (store interface), Animal, Item …
├── stores/gameStore.ts       the single Zustand store: all actions (buyTile, tick, upgradeCastle, …) + persist
├── utils/
│   ├── gameUtils.ts          pure game math: rates, level curve, costs, stat modifiers, grid helpers
│   ├── formatters.ts         formatNumber / formatRate / formatTime (K/M/B/T)
│   └── audioManager.ts       preloads 4 sounds: purchase, wrong, click, fanfare (public/*.mp3)
├── hooks/useHydration.ts     fake "hydrated" flag: a 2.5 s timeout (drives LoadingScreen / LevelUp toast)
├── lib/utils.ts              cn()
├── styles/                   LevelUpNotification.css, LoadingScreen.css
└── components/game/
    ├── GameHeader.tsx        top bar = HeaderMenu (left) + ResourceDisplay (right)
    ├── HeaderMenu.tsx        avatar/name/level bar, buttons: Character ⚔️, Merchant 💰, Farm 🌾
    ├── ResourceDisplay.tsx   resource counters + **global click-for-gold listener**
    ├── Grid.tsx              pan/drag viewport, culls to visible tiles, renders <Tile>
    ├── Tile.tsx              click handling (buy / chest / castle dialog / building dialog), tooltips
    ├── TileStatus.tsx, BiomeTooltip.tsx   hover info
    ├── BiomeSelectionDialog.tsx           pick-a-biome popup (every 4th owned count)
    ├── BuildingSelectionDialog.tsx        pick a building for a Grounds tile
    ├── CastleUpgradeDialog.tsx            castle upgrade popup
    ├── LevelDetails.tsx, LevelUpTimer.tsx level ring + ETA
    ├── GameDebug.tsx                      dev-only cheat panel (`NODE_ENV === 'development'`)
    └── overlays/
        ├── StatisticsOverlay.tsx   stats, stat-point allocation, rates per sec/min/hour
        ├── CharacterOverlay.tsx    equipment slots (all empty — unfinished)
        ├── FarmOverlay.tsx         animals
        ├── Merchant/…              sell / buy tabs (+ 3 placeholder tabs)
        ├── NamePrompt.tsx          name prompt at 2 owned tiles + long tutorial
        ├── LevelUpNotification.tsx, ChestNotification.tsx, LoadingScreen.tsx, ResetGameDialog.tsx
```

## State (`GameState`, `src/types/game.ts`)

| Field | Meaning |
| --- | --- |
| `tiles: Tile[50][50]` | `{ biome, isOwned, level?, upgradeCost?, building?, hasChest? }`; castle at `[25][25]` |
| `resources` | `gold, wood, stone, coal, food, meat, xp` (floats) |
| `resourceRates` | `{ base, modifiers, total }` — recomputed by `calculateResourceRates` after any change to tiles, stats, castle or animals |
| `resourceModifiers` | duplicate of `resourceRates.modifiers` (written, never read) |
| `level` | `{ level, progress(0‥1) }` derived from `resources.xp` by `calculateLevel` |
| `previousLevel` | level seen on the previous tick (used for level-up detection) |
| `characterStats` | 5 base stats, `availablePoints`, derived combat stats, `xpGainMultiplier`, `tileCostDiscount`, `reputation` |
| `equipment`, `inventory` | item data model; nothing mutates them (unfinished) |
| `farmLevels` | `{ chicken: n, deer: n, … }` — number of upgrades bought per animal |
| `clickMultiplier` | gold-per-click multiplier (2 → 4 → 8 → 16) |
| `chestSpawnTimer`, `activeChests`, `lastChest*` | chest system |
| `biomeSelectionActive`, `pendingTileCoords`, `selectableBiomes` | biome-picker state |
| `show*Window`, `isHydrated`, `playerName` | UI / identity |

All actions live in `createGameSlice` in `gameStore.ts`; pure maths lives in `gameUtils.ts`; constants in `gameConfig.ts`. Components read state via selectors and call actions directly.

## The loop

`page.tsx` runs `setInterval(…, TICK_RATE = 100 ms)`. Each interval computes `deltaTime = Date.now() − lastTickTime` and calls `store.tick(deltaTime)`:

1. For each resource except xp: `resources[r] += rates.total[r] × dt` (dt in seconds).
2. XP: `resources.xp += rates.total.xp × (1 + characterStats.xpGainMultiplier/100) × dt`.
3. Chest timer (see 02 §Chests).
4. `calculateLevel(xp)` → new `level`; if the level number rose versus the stored `level`, `availablePoints += Δlevel`.
5. One `set()` with everything.

Because delta is wall-clock based, a throttled background tab catches up on its next tick. **There is no offline progress**: closing the tab stops the game (the saved state has no timestamp).

## Persistence

`persist` with key **`idle-explorer-v11`**, `version: 11`, storage `localStorage`. The *entire* state is serialised on every `set` (≈10×/s) — including UI flags such as `show*Window`, `biomeSelectionActive`, `pendingTileCoords`. On load, a `merge` function (added in this upgrade) keeps the saved state only if `validateGrid(tiles)` passes (50×50, castle at centre, valid biomes), otherwise starts a new game. There is no migration: changing the state shape means either keeping new fields optional or bumping `version`/`name` (which resets players).

## Rendering notes

- `Grid` culls to the visible window (+2 tile padding) and drags with custom pointer handlers + a requestAnimationFrame inertia loop. Velocity lives in a ref and decays by `FRICTION` (0.9) per frame; it stops below `MIN_VELOCITY` and a release after a pause does not fling (before B8 the fling never decayed and the loop re-rendered the grid every frame — see 04).
- Every visible `Tile` subscribes to `tiles` **and** `resources`, so all visible tiles re-render each tick (10×/s). `countOwnedTiles` is also recomputed per tile. This is the first thing to optimise if the viewport grows (see 05).
- Audio: `audioManager.playSound('purchase' | 'wrong' | 'click' | 'fanfare')`.

## Build & run

```bash
npm install
npm run dev      # next dev --turbopack
npm run build
npm run lint
```
