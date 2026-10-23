# 04 · Unfinished mechanics & open issues

Only what is **still open** is listed here; items that were fixed are removed (see the PR / git history). Legend: 🚧 unfinished feature · 🔧 small fix · ⚠️ needs a decision.

## A. Unfinished features (shipped half-built; left as they are for the 2nd pass)

| # | Feature | State today | Where | To finish |
| --- | --- | --- | --- | --- |
| U1 | **Equipment & inventory** | 9 slots, always "Empty"; 6 starter items in `INITIAL_INVENTORY_ITEMS` whose stats are resource rates; no inventory UI, no equip action, no drops; equipment/inventory are not saved | `CharacterOverlay.tsx`, `gameConfig.ts`, `types/game.ts` | inventory grid + equip/unequip, sum equipped stats into `calculateResourceRates`, add to `PERSISTED_KEYS` + `sanitizeSave` |
| U2 | **Merchant → Upgrade Items** | "Coming soon" | `MerchantOverlay.tsx` | needs U1; gold/resource sink |
| U3 | **Merchant → Quests** | placeholder | same | quest model, rewards (items), tracking in store |
| U4 | **Merchant → Gambling** | placeholder | same | RNG games using `luck`; must stay inside the exploit rules ([07](07-security-and-exploits.md)) |
| U5 | **Combat stats** | `physicalAtk, magicAtk, hp, mp, def, magicDef, critChance, critDmg, atkSpeed` computed and shown; no combat exists; HP/MP bars always full | `calculateCombatStats`, `LevelDetails.tsx` | build combat/expeditions or fold into economy bonuses. (`luck` → chests and crit → lucky tile taps already have an effect.) |
| U6 | **Reputation** | +100 per tile (derived on load); shown; nothing reads it | `StatisticsOverlay.tsx` | tie to quests/merchant discounts or remove |
| U8 | **Castle levels 7–10** | 4 extra rows in `CASTLE_UPGRADE.upgradeCosts` (and `durationsSec` has none); Tile has a level-10 border | `gameConfig.ts`, `Tile.tsx` | raise `maxLevel` after the content exists, or delete the rows |
| U9 | **Offline progress** | none (a closed tab does not progress; a throttled tab catches up in 5-min steps) | `tick`, `saveVault.ts` | needs trusted time (see [07 §6](07-security-and-exploits.md)) to avoid a clock exploit; cap e.g. 8 h at 50 % |
| U10 | **Prestige / long-term loop** | none; after the finish line (castle 6, ~40 tiles) only more tiles remain | — | prestige/rebirth, or more castle levels (U8) |
| U12 | **Settings** | no volume/mute, no visible save menu (the hidden Control×5 menu has export/import/reset) | `audioManager.ts` | settings dialog |
| U13 | **Building management** | buildings are permanent (no demolish/swap/upgrade); `BiomeInfo.maxLevel` unused | `Tile.tsx`, `BuildingSelectionDialog.tsx` | demolish with refund, building levels |
| U14 | **Mobile / small screens** | pixel UI is desktop-first; touch pan exists, rest untested | `Grid.tsx`, modals | responsive pass |

## B. Open issues

| # | Issue | Notes |
| --- | --- | --- |
| 🔧 B3 | Dead code/config: `VIEWPORT_SIZE`, `ADJACENCY_BONUS` (duplicates `SCALING_CONFIG.adjacencyBonus`), `BiomeInfo.maxLevel`, `isDefaultPlayerName`, `resourceModifiers` state (duplicate of `resourceRates.modifiers`), duplicated `MerchantTab` type, `GameHeader`'s unused level-up detection | cleanup |
| 🔧 B4 | The castle upgrade is only visible inside the castle dialog and tooltip | add a small timer badge on the castle tile / header |
| 🔧 B5 | `next lint` is deprecated in Next 15.5 and removed in 16 | migrate with `npx @next/codemod@canary next-lint-to-eslint-cli .` when upgrading |
| ⚠️ B6 | Chests and tile taps are small next to the rest of the economy | decide whether they should scale with progress ([05](05-balance-backlog-and-roadmap.md)) |
| ⚠️ B7 | `sim.ts` bots do not play critters, tile taps or the class picker; their play style (reserve resources for the castle, top up with the merchant) is one reasonable strategy, not the optimum | extend the bot before using the sim for fine tuning |

## C. Technical risks

- **Performance**: every visible `Tile` re-renders on each tick (subscribes to `tiles` + `resources`). Save writes are already debounced, so only rendering remains; use per-tile selectors if the viewport grows.
- **No UI tests**: logic is covered by `npm test` (limiter, economy/exploit, save validation/crypto); components are verified manually. Add Playwright if the UI starts changing a lot.
- **Save compatibility**: the loader refuses invalid saves silently (falls back to the previous slot, then a new game). Any change to persisted fields needs `sanitizeSave` + a `SAVE_VERSION` decision ([07 §7](07-security-and-exploits.md)).
- **Float drift**: resources are doubles capped at 10¹⁵; revisit if prestige/long-term loops are added.
