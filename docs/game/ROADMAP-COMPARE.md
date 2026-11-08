# Roadmap against the code

Each section of [ROADMAP.md](../ROADMAP.md), [RELEASE-PLAN.md](../RELEASE-PLAN.md) and [26-next-updates-plan.md](../26-next-updates-plan.md) with a status checked against the code:

- **Done**: the code does it. **Partial**: some of it is built. **Open**: nothing in code (or a placeholder only). **Superseded**: a later decision or a built result replaced the section, so the text can go once the owner agrees. **Info**: no work item.
- "Checked" names the file or the absence that decides it. UI-only items were checked by looking for the component or route, not by running the app. Another set of sessions is wiring item art right now (the "Item art in three passes" lanes), so item-art lines are a snapshot of this branch.
- Nothing is deleted by this change. Statements of the plans that are wrong about the present are in [DISAGREEMENTS.md](DISAGREEMENTS.md).

## ROADMAP.md

| Section | Status | Checked |
| --- | --- | --- |
| Where things stand | Done (accurate) | matches the code: accounts only, server fights, queue, auto-battle after the first rebirth, four monster biomes, rebirth wipes gear. One stale phrase lives in the building-rework section ("castle 6 plus 100 tiles") |
| Where each decision lives (table) | Open, except rows noted | The rows are decisions, not code. Built from them: tile price tail and 400 + 50 gate (IDL-79/181), Rattatui removed (IDL-55), distance bands as config (IDL-53, bands only). Not built: perk families, relics, monster chests, per-band spawn tables, five rebirth biomes, set bonuses S1-S3, achievements, crafting, Ember price book, rankings, paragon |
| Item art in three passes | Partial | icon registry `src/config/itemIcons/*.json` exists (pass 1 infrastructure); wiring and the Python placeholders (pass 2) are being done by other sessions; pass 3 (Sprite Fusion) Open |
| The next update: the rebirth world (table of docs 12-22) | see rows below | |
| ... doc 14 server audit | Partial | polling-write fix built (`ANCHOR_REFRESH_MS` in `src/lib/offline/service.ts`); `/api/rebirth` built; biome legality flags and `player_ledger.craft` Open |
| ... doc 12 five rebirth biomes | Open | jungle, fields, orchard, blight, battlefield exist only as dev entries in `BIOMES`; no rule or unlock gives them out |
| ... doc 13 rebirth reset and paragon | Partial | respec and gear/bag wipe built (`rebirthSlice.ts`); +20 points per rebirth Open (`totalStatPoints` has no rebirth term); paragon Open (no code) |
| ... doc 15 rankings and preview map | Open | `player_stats` row is written on every save; no ranking endpoint or UI, no preview route |
| ... doc 16 landing and `/play` | Open | no `middleware.ts`, no `src/config/branding.ts`, no `src/app/play` |
| ... doc 18 biome buildings and material tiers | Partial | shorter castle timers and the resource-key registry built; Producer/Extractor/Idol, roads, T2-T4 Open (16 generic buildings still in `BUILDINGS`) |
| ... doc 20 monster families and rewards | Partial | 16-monster roster, reward model (caps, `levelMult`), relevance fade first slice built; spawn tables per band, danger offsets, goods per family, relics Open |
| ... doc 21 classes, avatars, achievements, offline report | Open | classes cosmetic (`PLAYER_CLASSES`), no avatars/achievements/epoch/reset flow; `OfflineDialog` exists, the away-time bar not checked |
| ... doc 22 glossary and mastery | Open | no code |
| ... doc 17 crafting | Open | no code (a rebirth wipes gear with no crafting sink, see DISAGREEMENTS B8) |
| Release order and principles | Info | plan text |
| Later features agreed in principle (tutorial rework, one-time reset, class bonuses, achievements, offline report rework, landing, Map-lab landing scene) | Open | `Tutorial.tsx` still the wall of text; nothing else in code |
| Known bugs and leftovers: R7 dangerBonus | Open | still `floor(distance / 8)`; per-band offsets are 0 and unread |
| ... R8 Rat King / Rattatui | Done | Rattatui deleted; the King is The Great Auroch |
| ... R9 local dev needs Supabase | Done (accepted) | |
| ... B6 / B7 | Info | decided, carried as acceptance lines |
| ... IDL-166 Ember bound, IDL-167 flagged save pays, IDL-168 merchant levels unpaid | Done | `emberModel.ts`, `trustedEconomy.ts`, `restoreMerchantLevels`, `netWorth.ts` |
| ... IDL-169 building cost ignores Charisma and Bulk Discount | Open | `calculateBuildingCost` uses Thrift only |
| Server authority 0: attribute sum check, server rebirth, biome flags, `craft` | Partial | `reconcileCharacter` and `/api/rebirth` built (without the +20 term); biome flags, craft Open |
| ... 1 enforce `verify.ts` | Open | `ENFORCEMENT.enabled = false` |
| ... 2 server-run economy actions (castle upgrade, farm, building costs) | Open | rebirth only |
| ... 3 XP award by the server | Open | XP is modelled and clamped (`xpModel.ts`), not awarded |
| ... 4 server-priced merchant | Open | prices and shelf in the browser |
| ... 5 spawn caps from the real map | Open | see DISAGREEMENTS B5 |
| Server authority notes (no cron, catalogs in code, free-tier polling, deploy order) | Info | still true; the example `LOOT_SECRET` is still in `.env.example` |
| Features: CI workflow | Done | `.github/workflows/ci.yml`, `scripts/pacing-guard.ts` |
| ... Playwright smoke test (IDL-124) | Done (script) | `e2e/smoke.spec.ts`, `npm run e2e`; whether CI runs it not checked |
| ... Framework upgrades (IDL-125) | Open | `next` 15.5.28, TypeScript 5, ESLint 9 |
| ... content 1 crafting instead of item upgrading | Open | |
| ... content 2 building rework | Open | doc 18 |
| ... content 3 quests, 4 gambling | Open | placeholder tabs in `MerchantOverlay.tsx` |
| ... content 5 mobile layout | Open | |
| ... content 6 monster depth (hills/coast/lake rosters, glossary, skill tree, elites, monster chests) | Open | |
| ... content 7 weather/day-night, 8 zoom 0.5 | Open | ambient critters exist (`AmbientLife.tsx`), weather and zoom 0.5 do not |
| Config extensions: `MonsterDef.spawn`, `COMBAT` tunables | Done | `src/config/combatConfig.ts` |
| ... biomes unlocked by rebirth, generic ticket list, per-biome loot | Open | `unlockAfterPurchases` only; bank still `rats` / `king` |
| Paragon levels | Open | |
| Draft ideas for later (market saturation, new Ember shop shapes, more economy sets, autobuyers, gem sockets, skill tree, set depth) | Open | uncommitted ideas |
| Building rework and late-game resources | Superseded in part | by doc 18 (the section says so); rules about "do not undo" are still true; `canSpawnOn` keeps monsters off buildings |
| Balance backlog: BL16 late tile price | Done | `TILE_PRICE.tailExponent` 3.5, `REBIRTH.minTiles` 400, `tilesPerRebirth` 50 |
| ... BL1 + BL3 (clicks, chests), BL4 (meat engine) | Open | decisions recorded, task IDL-197 not built |
| Technical risks | Info | |
| Combat and items: known limits | Done (accurate) | four biomes, no hills/coast/lake monsters, crits, speed, Heal/Stun, auto-battle, queue all in code |

## RELEASE-PLAN.md

| Section | Status | Checked |
| --- | --- | --- |
| 0 Reading guide, 1 Integrity rules | Info | still the working rules |
| 2.1 Known bugs triage | Superseded | by Linear and the ROADMAP rows above |
| 2.2 Balance backlog triage | Superseded | ROADMAP trimmed the table on 2026-10-29 |
| 3 The releases in order | Info | overview of P0-P13 |
| P0.1 CI | Done | `ci.yml` |
| P0.2 fixtures and `check-live-saves` | Done | `scripts/check-live-saves.ts`, `tests/checkLiveSaves.test.ts` |
| P0.3 fight-polling write fix | Done | `ANCHOR_REFRESH_MS` |
| P0.4 castle timers | Done, numbers Superseded | the plan's 1/3/9/16/36 h were halved again to 30 min, 2 h, 6 h, 12 h, 24 h ... (`CASTLE_UPGRADE.durationsSec`) |
| P0.5 resource registry | Done | `src/catalog/resourceKeys.ts` |
| P0.6 distance helper and bands | Done | `src/lib/distance.ts`, `src/config/distanceBands.ts` (nothing reads the bands yet) |
| P1.1 branding, 1.2 `/play`, 1.3 landing v1, 1.6 password reset | Open | no `branding.ts`, no `play` route, no middleware |
| P1.4 monster growth indicator | Done (logic) | `growthInfo` in `src/lib/monsters.ts`, used by `TileMonster.tsx` |
| P1.5 offline report bar | Open (not checked) | `OfflineDialog.tsx` exists; the bar against the cap was not verified |
| P2.1-P2.9 New chapter (epoch, avatars, achievements, tutorial, class passives, reset) | Open | none of it in code |
| P2.7 secrets hygiene | Open | `.env.example` still has a concrete `LOOT_SECRET` |
| P3.1 generic ticket bank | Open | `bank.rats` / `bank.king` remain (A5 rename Open) |
| P3.2 placeholder sprite mechanism | Open (not checked) | |
| P3.3 reward model and kill-sim | Done | `MonsterDef.reward`, `scripts/kill-sim.ts` |
| P3.4 spawn tables per band, relevance fade, danger offsets | Partial | relevance fade built (`spawnWeights.ts`); per-band tables and offsets Open |
| P3.5 home families | Done | 16 monsters |
| P3.6 retire Rattatui, demote King | Done | set deleted; King is a plains boss |
| P4 Glossary and mastery | Open | |
| P5 Biome engine | Open | no new `BIOME_RULES` fields |
| P6 Buildings (6.1-6.9) | Open | superseded in shape by doc 18 only if the owner agrees |
| P7.1 respec | Done | `rebirthSlice.ts` |
| P7.1 +20 points per rebirth | Open | |
| P7.2 server sum check | Partial | `reconcileCharacter`, without `20 x rebirths` |
| P7.3 dialog preview and sell-all, P7.4 sim bot | Open (not checked) | |
| P8, P10, P12 new biomes | Open | |
| P9 Rankings, paragon display, preview map, enforce `verify.ts` | Open | |
| P11.1-11.3, 11.5 crafting | Open | |
| P11.4 server-side inventory wipe | Done, out of order | live without crafting (DISAGREEMENTS B8) |
| P13 MVP: landing v2, mobile, Playwright, upgrades, public checklist | Open | Playwright smoke exists locally |
| 5 Landing, 6 Asset plan, 7 Decisions D1-D11, 8 Risk register | Info | |
| Not in this plan (parked) | Info | |

## 26-next-updates-plan.md

| Section | Status | Checked |
| --- | --- | --- |
| Why this order | Info | |
| Phase 0 core cleanup | Done | |
| Phase A: A1 Prettier, A2 store slices, A3 config and utils split, A4 fight split, A6 Tile split, A8 pacing guard | Done | `src/stores/game/*`, `src/config/*`, `src/utils/game/*`, `src/lib/offline/fight*.ts`, `scripts/pacing-guard.ts` |
| A5 rename the rat leftovers | Open | `bank.rats`, `luckyRat`, `ratsMinted` still present |
| A7 generated docs in CI | Done; tests-by-area half Open or in progress (IDL-214) | `tests/` has area folders (audit, catalog, combat, economy, loot, monsters, saves, server) |
| B0 three art passes | Partial | see ROADMAP "Item art" |
| B1 icon registry | Done | `src/config/itemIcons/*.json` |
| B2 cut and register sheets | Partial | in progress in other sessions |
| B3 item definitions for G1-G9 and S1-S3 | Partial | the `enabled` flag and `src/catalog/items/reuse.ts` exist; grade mapping, S1-S3 Open |
| B4 consumables beyond HP potions | Open | `healHp` only |
| B5 old art retirement | Open | |
| C0 re-base test fixtures on the grade ladder | Open | tests still name Obsidian |
| C1 per-biome loot pools | Open | one `monster` source |
| C2 bosses own their drops | Partial | `boss` source and `king_legendary` table exist; per-boss pieces Open |
| C3 more affixes and stats | Open | 13 affix stats today |
| C4 legendary effects | Open | no `effects.ts`; three plain legendary weapons |
| C5 rarity/level windows revisited, C6 merchant shelf follows pools | Open | |
| Phase D monsters for the rest of the world | Open | |
| Phase E the rebirth world | Open | |
| Golden monsters stay | Done (mechanic) | `LUCK.luckyRat`, x3 reward, extra gear roll; the renames, per-monster palette and UI extras Open |
| Small things: queue win-chance buckets, three-defeat pause | Open | not in `COMBAT.auto` |
| Small things: per-band danger offsets | Open | |
| Small things: castle timer tables in docs 02, 06, 19 | Partial | doc 02 is right, doc 03 §4 table still old (DISAGREEMENTS 3.2); docs 06 and 19 not checked |
| Small things: real-browser look, Playwright for the queue | Open | |
| Decisions needed | Info | all four are answered in practice (A first, `enabled` flag shipped, Prettier in use) |
