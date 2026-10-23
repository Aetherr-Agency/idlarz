# 04 · Unfinished mechanics, dead config & known issues

Legend: ✅ fixed in this change · ⚠️ open, needs a decision (changes balance) · 🔧 open, safe to fix · 🚧 unfinished feature.

## A. Unfinished features (the live game ships these half-built)

| # | Feature | State today | Where | To finish |
| --- | --- | --- | --- | --- |
| U1 | **Equipment & inventory** | 9 slots rendered, always "Empty"; 6 starter items in `INITIAL_INVENTORY_ITEMS` (stats are *resource rates*, e.g. Gold Ring +0.2 gold/s) but there is no inventory UI, no equip action, no drops; panel text "No bonuses yet" | `CharacterOverlay.tsx`, `gameConfig.ts:534-610`, `types/game.ts` (`Item`, `Equipment`) | inventory grid + equip/unequip actions; sum equipped `stats` into `calculateResourceRates`; decide additive vs multiplicative |
| U2 | **Merchant → Upgrade Items** | "Coming soon" placeholder | `MerchantOverlay.tsx` (`PlaceholderTabContent`) | needs U1 first (upgrade levels per item, gold/resource sink) |
| U3 | **Merchant → Quests** | placeholder | same | quest model, rewards (items!), tracking in store |
| U4 | **Merchant → Gambling** | placeholder; `luck` stat exists to feed it | same | RNG games, gold sink, use `luck` |
| U5 | **Combat stats** | `physicalAtk, magicAtk, hp, mp, def, magicDef, luck, critChance, critDmg, atkSpeed` are computed & displayed; **no combat, enemies or damage exist**. `LevelDetails` shows HP/MP as `value / value` (current always = max) | `gameUtils.ts:292-314`, `LevelDetails.tsx`, `StatisticsOverlay.tsx` | either build a combat/expedition system or fold these into economy bonuses |
| U6 | **Reputation** | +100 per tile; starts at 1000; shown; tooltip promises "affects NPCs and factions" — nothing reads it | `gameStore.ts`, `StatisticsOverlay.tsx` | tie to quests/merchant discounts or remove |
| U7 | **Castle XP bonus** | `CASTLE_UPGRADE.xpBonus` (0.5 XP/s per level) is **never applied** to rates; the misleading line was removed from the castle dialog in the quick-win pass, the config value is kept for a future decision | `CastleUpgradeDialog.tsx:68-71`, `gameUtils.ts` | add `xpBonus × C` to `base.xp` — or delete the text. Changes balance → ⚠️ D2 |
| U8 | **Castle levels 7–10** | `upgradeCosts` has 9 entries but `maxLevel` is 6; Tile has a gold border for castle level 10 | `gameConfig.ts:299-364`, `Tile.tsx` | raise `maxLevel` after rebalancing, or drop the extra rows |
| U9 | **Offline progress** | none; no timestamp saved | `gameStore.ts` | store `lastSeen`, on load grant `min(Δt, cap) × rates` |
| U10 | **Prestige / long-term loop** | none; with the tile-cost wall (03 §1) the game ends in a plateau around 30–45 tiles | — | prestige/rebirth or soft-reset using reputation |
| U11 | **In-game reset** | `ResetGameDialog.tsx` is not mounted; players must clear site data | `overlays/ResetGameDialog.tsx` | add to a settings menu with confirmation |
| U12 | **Settings / save export / mute** | none (no volume, no import/export) | `audioManager.ts` | settings dialog |
| U13 | **Building management** | buildings are free, permanent, one per Grounds tile, no upgrade path beyond "level 2"; `BiomeInfo.maxLevel` unused; `Tile.upgradeCost` only used by the castle | `Tile.tsx`, `BuildingSelectionDialog.tsx` | building costs/levels/destroy |
| U14 | **Mobile / small screens** | overlays use `inset-x-[17vw]`, header grid is `max-w-8/10`; touch panning is wired but untested | `Grid.tsx`, overlays | responsive pass |
| U15 | **Intro/tutorial accuracy** | see D6 | `NamePrompt.tsx` | rewrite from these docs |

## B. Bugs found & fixed in this change ✅

| # | Symptom | Cause | Fix |
| --- | --- | --- | --- |
| B1 | Buildings on Grounds never showed their icon/resource icons on the map (only ⭐) | `Grid.tsx` did not pass `building` to `<Tile>` | pass `building={tile.building}` |
| B2 | Failing to afford a farm animal played no sound (and `audioManager` logged a missing key) | `FarmOverlay` called `playSound('error')`; only `purchase/wrong/click/fanfare` are loaded | use `'wrong'` |
| B3 | Merchant sell toast always said "Sold N X for **0** Gold" | gold-gained was computed from the stale `resources` closure | compute with the same `floor(amount × price)` the store uses |
| B4 | During the biome picker, clicking *any* tile on the map selected that tile's biome — including `empty`/`castle` — claiming a tile with an invalid biome | `selectBiome` did not check `selectableBiomes` | reject biomes not in `selectableBiomes` |
| B5 | **Lost stat points**: if buying a tile caused a level-up, no point was awarded | `buyTile`/`selectBiome` overwrote `state.level`, so `tick()`'s "level increased" check never saw the change | stop overwriting `level` there; `tick` recomputes within 100 ms |
| B6 | Corrupt/old saves were never reset | `onRehydrateStorage` returned an object (Zustand ignores the return value) | replaced by a `merge` that validates the grid and falls back to a fresh game |
| B7 | Browser tab title "Create Next App" | default metadata | set to the game title/description |
| B8 | Map kept sliding after a drag until it hit the edge (and the idle animation loop re-rendered the whole grid every frame) | inertia had no friction and used React state updated inside `requestAnimationFrame` | velocity kept in a ref, per-frame friction 0.9, stops below 0.02 px/ms, releasing after a pause does not fling (`Grid.tsx`) |
| B9 | If the system clock moves backwards, `tick` subtracted resources (seen as negative stockpiles during the playtest) | negative `deltaTime` was not clamped | `Math.max(0, deltaTime)` in `gameStore.ts` |
| B10 | Castle dialog promised "+N XP/s flat" per level that the game never grants | `xpBonus` unused (U7) | removed the XP lines from the dialog |
| B11 | Castle hover card showed the biome table × `1.5^(level−1)` instead of what the castle really produces | dead biome values + wrong level scaling (D3, D8) | shows the effective `CASTLE_BASE_RATES` values; level bonus is the global modifier |
| B12 | Tutorial text, Charisma tooltip and several config comments contradicted the code | stale text (D5, D6, D9) | rewritten with the real numbers (tile cost, adjacency +25 %, XP curve ×1.3, merchant prices, animals, castle doubling, Lake gold 0.05) |
| B13 | Merchant window reopened on whichever tab was last used | tab state lives in the always-mounted overlay | resets to the Sell tab whenever the window opens |
| — | Dependencies | `next 15.2.1` (several published security advisories fixed in later 15.x patch releases) | bumped within the major: `next/eslint-config-next 15.5.28`, React 19.3, Tailwind 4.3.3, Zustand 5.0.16, TS 5.9, ESLint 9.39 |

Residual `npm audit`: two advisories remain on PostCSS bundled *inside* Next 15 (build-time CSS tooling, not shipped to players); the fix is the Next 16 major (see 05).

## C. Discrepancies left unchanged ⚠️ (need a product decision)

| # | What | Evidence | Impact if "fixed" |
| --- | --- | --- | --- |
| **D1** | `calculateResourceRates` initialises `modifiers = { ...BASE_GENERATION_RATES }`, so **gold starts with +10 % and XP with +25 % modifier** before castle/stats | `gameUtils.ts:338` (`const modifiers = { ...BASE_GENERATION_RATES }`); generated table §7 | −10 % gold and −25 % XP across the whole game if zeroed. Almost certainly accidental, but players' tuning is based on it |
| **D2** | Castle `xpBonus` text vs. code (U7) | `CastleUpgradeDialog.tsx` | +0.5…3 xp/s if implemented |
| **D3** | `BIOMES.castle.resourceGeneration` (gold 0.2, wood 0.1, food 0.1, xp 1.0) is dead for those resources because `CASTLE_BASE_RATES` shadows them via a truthiness check; stone 0.1 leaks through because `CASTLE_BASE_RATES.stone = 0` | `gameUtils.ts:355-362` | decide which table is the truth; doubling castle output is a buff |
| **D4** | `INITIAL_CHARACTER_STATS` disagree with `calculateCombatStats` for the same 5/5/5/5/5 stats (hp 15.25 vs 16.25, def 8.75 vs 11.25, magicDef 8.25 vs 8.75, critDmg 103 vs 110) | generated table §6 | display only |
| ✅ **D5** (fixed, B12) | Charisma tooltip says "+0.1 % tile discount per point" but code is 0.5 %/pt; its cap (25 %) is reached at CHA 50 | `getStatDescription` vs `calculateCombatStats` | text-only fix recommended (🔧) |
| ✅ **D6** (fixed, B12) | In-game tutorial is out of date: tile cost "25 × 1.1ⁿ" (real: 55 × 1.42ⁿ…), adjacency "+15 %" (real 25 %), XP "750 × 2^(N−1)" (real ×1.3), merchant prices (0.75/0.75/1.25/0.5/3.0 vs real 0.5/0.5/1/0.75/15), chicken 0.05 meat/s (real 0.2), castle "+1.0 to all resources", "+20 % per castle level" (real doubling) | `NamePrompt.tsx` | rewrite text (🔧) |
| **D7** | Chest timer is not reset while 5 chests are active → a chest spawns on the tick after you collect one; chest value scales with income rather than progress | `gameStore.ts` `tick` | design choice |
| ✅ **D8** (fixed, B11) | `BiomeTooltip` multiplies a castle tile's displayed rates by `1.5^(level−1)`, which is *not* how the castle works (it adds `0.2·2^(L−1)` to modifiers) | `BiomeTooltip.tsx` | text-only (🔧) |
| ✅ **D9** (fixed, B12) | Comments in `gameConfig.ts` disagree with values (deer "0.6/s" → 0.5, pig "0.5/s" → 1, "XP growth 2x" → 1.3, `VIEWPORT_SIZE` "12 tiles each direction" while 25, GRID_HEIGHT "half of width" while equal) | `gameConfig.ts` | comments only (🔧) |
| **D10** | Click gold is awarded for **any** click on the page, including UI buttons and the click that buys a tile | `ResourceDisplay.tsx` | maybe intentional ("click anywhere"); decide |

## D. Dead / unused code & config 🔧

- `VIEWPORT_SIZE`, `ADJACENCY_BONUS` (duplicated by `SCALING_CONFIG.adjacencyBonus`), `BASE_TILE_COST` (only used inside the formula), `BiomeInfo.maxLevel`, `isDefaultPlayerName`.
- `resourceModifiers` in state is written but never read (duplicate of `resourceRates.modifiers`).
- `MerchantTab` type is declared twice (`types/game.ts` and `MerchantOverlay.tsx`).
- ~~`Grid` inertia has no friction~~ — confirmed in the browser and fixed (B8).
- ~~Merchant window remembered its last tab~~ (reopened on *Buy Goods* after buying the click multiplier; found while playtesting) — now always reopens on *Sell* (B13).
- **Chests never expire and the spawn timer keeps counting at the cap**: a playtest left 5 chests uncollected and the timer at 500 K+ seconds (D7).
- `GameHeader` and `HeaderMenu` both implement the same level-up-points detection; only `HeaderMenu`'s result is displayed.
- `README.md` previously described a different game (Next 14); rewritten.

## E. Technical risks

- **Performance**: whole-state persistence on every tick (≈10 writes/s) and every `Tile` re-rendering on each tick (subscribes to `tiles` + `resources`). Fine for ~50 tiles in view; will bite if the viewport/animation count grows. Fix: subscribe per-tile with selectors, throttle persist (`partialize` + debounce).
- **Persisted UI state**: open windows and a pending biome selection survive reloads because everything is persisted.
- **Float drift**: resources are plain doubles accumulated per tick; numbers reach 10¹⁴+ in the late game (formatter handles up to T). Consider big-number handling only if prestige is added.
- **No tests**: pure functions in `gameUtils.ts` are ideal first test targets (rate pipeline, level curve, costs).
- **Save compatibility**: no migrations; any shape change either must stay backward-compatible with `idle-explorer-v11` or reset players.
