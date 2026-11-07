# 26 · Next updates: a draft plan in logical order

Written after the balancing pass (castle timers, rebirth wipe and respec, the Ember curve, the merchant clock, the 16-monster roster, the growth badge and the battle queue are built; see git history, nothing of it is repeated here). This is a **proposal**: the order is meant to make the core readable and cheap to change first, then fill the game with content, then go back to the rebirth world ([ROADMAP](ROADMAP.md), [RELEASE-PLAN](RELEASE-PLAN.md)). Sizes: S ≈ half a day, M ≈ 1-2 days, L ≈ a week.

## Why this order

1. The next stretch is **content** (items, affixes, loot pools, biome goods). Content work touches the same few files again and again (`gameStore.ts` 1,350 lines, `gameConfig.ts` 940, `gameUtils.ts` 920, `fight.ts` 480, `lootConfig.ts`, `sanitizeSave.ts` 550). Cleaning those first makes every later change smaller and the diffs readable.
2. The art is **already here and unused**: `art_style_reference/equip` holds about 600 equipment icons and 48 potions per sheet, a 12-grades-per-slot plan and three special sets ([equip/README](../art_style_reference/equip/README.md)); the monster art in `public/pixel/enemies` is already wired for four biomes. Wiring item art is mechanical and has no balance risk, so it comes before the loot work that needs it.
3. Loot depends on the monsters (done) and on the items that exist. Once the items exist as data, the pools, affixes and uniques can be tuned with `npm run loot-sim` and `npm run monster-ladder`.

## Phase 0 · Core cleanup (done)

Before Phase A, the old-save support was removed (nothing needs it after `reset-players`): the save migrations 1 to 5 and their modules, the lenient `repairSave` reader, the legacy 3x3 and 50x50 layouts in `sanitizeSave`, `upgradeBank`, the `derived.known` gate and the `purchased` fallback, the `itemCatalog` re-export shim, the duplicate seeded generators (`lib/rng.ts` `mulberry32` is the one), `isRecord` (`lib/isRecord.ts`), unused exports and dead CSS. `SAVE_SCHEMA` is 7 and any other schema is refused ([07](07-saves-and-security.md)). Not done and still open: the `monster_rat`/`monster_ratking`/`bonus_chest`/`menu_main` icons (they come from the `scripts/pixel` generators, so remove them together with B1/B5), moving `lib/fightSim.ts` to `scripts/`, the exports only tests use, and `scripts/sim.ts --legacy`.

## Phase A · Core you can read (M-L in total, no behaviour change)

Rule for every step: **no gameplay change, the sim and the generated docs stay identical** (`npm run sim -- --no-write human hardcore` before and after), one PR each.

| # | Step | Size | Notes |
|---|---|---|---|
| A1 | **Line endings and format.** Add `.gitattributes` (`* text=auto eol=lf`), `.editorconfig`, one Prettier config and a single "format everything" commit that is the only noisy diff. Add `npm run format:check` to CI. | S | Today the index is LF but working copies are CRLF on Windows and `git` warns on every commit; a formatter ends style talk in reviews. Do it first, in its own PR, so no other PR is mixed with it. |
| A2 | **Split `gameStore.ts` into slices** (`economy`, `map`, `character`, `inventory`, `combat`, `merchant`, `farm`, `rebirth`) composed in `stores/gameStore.ts`; keep the public `useGameStore` and the action names. | M | Zustand slices; each slice file under about 250 lines with its own helpers. The tests import the store, so they are the safety net. |
| A3 | **Split `gameConfig.ts` by domain** (`config/castle.ts`, `rebirth.ts`, `merchant.ts`, `farm.ts`, `biomes.ts`, `economy.ts`) and re-export from `gameConfig.ts` until imports are moved. | M | Pure moves. (`LEGACY_GRID_SIZE` there is now only used by tests: move it to `tests/helpers.ts`.) |
| A4 | **Split `fight.ts`.** `runCombat` is one 300-line closure. Pull out `profile`, `targets` (pickTarget, queue), `steps` (swings, skills, potions) and the view; keep the closure only as the orchestrator. | M | `tests/fightEngine.test.ts` and `battleQueue.test.ts` pin it. |
| A5 | **Rename the rat leftovers.** `bank.rats`, `TicketKind 'rat'`, `LUCK.luckyRat`, `ratsMinted`, `luckyRatChance`, `monster_rat` icons: say `monsters` / `normal` / golden monster (the golden variant itself stays, see the section below). The ledger bank is stored JSON: no reader for the old names is needed (the ledger is reset), so rename, bump `SAVE_SCHEMA` if the save changes, and run `npm run reset-players` with that release. | M | Replaces the "additive ledger columns first" rule of [14](14-server-audit-and-data-plan.md) for this step. |
| A6 | **Component hygiene.** `Tile.tsx` (the tile, the monster, the menu, the tooltip) into `Tile`, `TileMonster`, `TileMenu`; `Tutorial.tsx` (400 lines of prose with numbers) onto the guided-tutorial data format of [21](21-classes-avatars-achievements-offline-report.md) section 7 when that is built, until then split per section. | M | |
| A7 | **Tests and generated docs.** One folder per area (`tests/combat`, `tests/economy`, `tests/saves`, ...), a shared builder for ledgers/monsters (`tests/builders.ts`), `npm run docs:gen` in CI with a "no diff" check so the generated tables cannot rot (item catalog, fight-sim, monster ladder, loot-sim). | S-M | The catalog doc test already shows the pattern. The frozen old-save fixtures are gone; `tests/helpers.ts` `rawSnapshot` now builds the `land` layout. |
| A8 | **Make the pacing guard blocking** once A2-A4 land (the sim job in CI fails a PR that moves the first rebirth by more than ±15 %). | S | The job exists and is informational. |

## Phase B · Prepare the item assets (M-L, art and data, no balance change)

Goal: every item we will ship exists as **data with an icon**, behind a switch, so the loot work in Phase C only chooses what drops.

| # | Step | Size | Notes |
|---|---|---|---|
| B1 | **An icon registry that is one line per icon.** Today `pixelIcons.ts` and `scripts/pixel/sprites_*.py` are edited by hand per item. Make an `assets/items.json` (id -> file, slot, grade) read by both the build script and `pixelIcons.ts`. | S-M | Same idea as the resource-key registry. **Partly built (2026-11-07):** `src/config/itemArt.ts` maps 115 art ids to `public/pixel/items/<slot>/` (64x64, registered natively through `pixelIcons.ts`); it is a TypeScript map, not `assets/items.json`, and the legacy 40 px `item_*` icons still use the old path. |
| B2 | **Cut and register the prepared sheets** by the procedure in the art README (`extract_sheet.py`, nearest-neighbour, our 40 px, no baked glow): potions first (hp, mana, buffs, antidotes), then weapons by type (sword, dagger, axe, mace, spear, bow, crossbow, staff, wand), then armour by slot (head, shoulder, chest, hands, legs, feet), then neck/ring/charm/cape. Gaps to draw in our kit: shields and off-hands, tomes, quivers, shoulders, gloves, capes. | L | One PR per family; the PR description names the sheet and region (art README rule 8). |
| B3 | **Item definitions for the 12-grade ladder** (G1-G9 plus three special sets S1-S3) as entries in `catalog/items/*.ts` with `enabled: false` (new flag) and the grade as a tag, so they exist and are validated by `tests/catalog.test.ts` but nothing drops them yet. | M | The names are working titles in the equip README section 4. **Partly built (2026-11-07):** the `enabled` flag exists and `src/catalog/items/reuse.ts` holds 91 disabled items (feet, legs, neck, ring, off-hand, sword, mace/maul, legendary), never sold and never dropped (tests). Still open: grade mapping G1-G9 and S1-S3, the belt slot, dagger/axe/spear/bow/crossbow/staff/wand, and chest/head/shoulder/hands/cape/charm art. |
| B4 | **Consumables beyond HP potions**: mana, stamina/regen, buff potions, antidotes with their effects as data (`consumable: { healHp | healMp | buff }`), shown in the bag and hotkeys. Needs a buff model on the server (a timed modifier in `CombatState`); a design for consumables, buffs and drop chests exists on another branch (`agntc/mystifying-turing-7454b2`, not merged yet) and should be taken from there. | M-L | Server-side effect first, art second. Decided in IDL-22 and IDL-160 (timed combat buffs, 4 utility potions); the 12 potion icons sit in `public/pixel/items/consumable/`, no definitions yet. |
| B5 | **Old art retirement.** Delete the superseded `item_*` icons and the procedural gear sprites in the same PR that switches each catalog entry (art README rule 6). | S | |

## Phase C · Loot pools, variety and uniques (L)

| # | Step | Size | Notes |
|---|---|---|---|
| C1 | **Per-biome loot pools.** Pools get a `biomes` / `grade` tag and a monster's `lootSourceId` picks a pool by biome and grade (plains G1-G3, forest G2-G4, swamp G3-G5, tundra G5-G7), so the ladder in `generated/monster-ladder.md` and the gear tiers line up. Normal monsters stop sharing one `monster` source. | M | Update `loot-sim` to print drops per biome. |
| C2 | **Bosses own their drops.** Each boss gets its own source: a guaranteed piece of its biome's set or a named unique; the **Rattatui set stops dropping from every boss** (it keeps one source). | M | |
| C3 | **More affixes and stats.** New affix groups on the existing level curve (thorns, dodge, mana regen, gold find, XP gain, crit damage, resist stun, per-weapon-type bonuses) and **tiered affixes** (a higher item level unlocks a stronger tier of the same affix). New stats need: `catalog/stats.ts`, `effectiveStats.ts`, the server profile (`playerProfile`) and the fight engine, in that order. | M-L | Each stat is data plus one use in the engine; keep a test per stat that it changes the right number. |
| C4 | **Legendary and unique items with special effects.** An item can carry an `effect` id (on-hit, on-kill, on-low-HP, aura) implemented by small named handlers in the engine (`lib/offline/effects.ts`): e.g. Emberbrand burns, a ring that refunds a potion, a cloak that dodges the first hit. Legendaries get fixed names and lore text; drop only from a boss or a rare event. | L | The fight engine is the place; the effects must be deterministic from the sealed stream. |
| C5 | **Rarity and item-level windows revisited** with the monster ladder and `loot-sim`: how many drops per hour per tier, pity for sets, the auto-sell filter defaults. | S-M | Numbers from the sims, not from prose. |
| C6 | **Merchant shelf follows the pools** (grade by the player's gear, the shelf never sells the next tier) and shows the new items. | S | |

## Phase D · Monsters for the rest of the world (M, per biome)

Hills, coast and lake have art or are missing it (hills has none). Enable a biome's roster the way the plains one was: stats in `BIOME_TIER`, entries in `MONSTERS`, the ladder table, the loot pool of C1. The water biomes need **shoreline spawns** (a land tile next to water) first. Then the reward caps of [20](20-monster-families-and-rewards.md), generic spawn weights per monster, and the glossary of [22](22-glossary-and-mastery.md).

## Phase E · The rebirth world (as in the ROADMAP release order)

Only after A-C: server-run rebirth (`/api/rebirth`, closes the short window in which a modified client can sell old gear), the "New chapter" release ([21](21-classes-avatars-achievements-offline-report.md): classes, avatars, reserved names, the one-time reset, tutorial), then biomes (12), buildings (18), rankings (15), crafting (17). Crafting needs Phase B/C: it consumes the item grades and the new materials.

## Golden monsters stay (keep and extend)

The rats had a **golden ("lucky") variant** and we keep that for every monster: the server decides it when the monster appears (`luckyRatChance` in `lib/luck.ts`, `LUCK.luckyRat`: 2 % plus Luck, at most 10 %), the map draws it gold-tinted (`.tile-monster[data-lucky]` in `Monsters.css`) and a kill pays x3 gold and XP plus one extra gear roll (`rollKillLoot`). It still works for the new roster. What is missing, to do with the monster phases:

- **Rename** `luckyRat` / `luckyRatChance` to golden/lucky *monster* (part of A5); the ledger ticket field `lucky` stays.
- **Show it everywhere**: the gold tint also in the fight window (`CombatPanel`), the "Next" strip of the queue and the glossary; a small sparkle on the tile so it is seen from far away; the badge star already exists.
- **Per-monster golden art** later: a hand-picked gold palette per monster instead of one sepia filter (the art sheets are single images, so this is a palette swap in the pipeline).
- **Tune per biome**: the chance and the multiplier follow the monster ladder (a golden tundra monster is worth more than a golden plains one; the x3 reward is capped by the reward caps of [20](20-monster-families-and-rewards.md)); decide whether bosses may be golden (today they never are).
- **Drops**: a golden monster rolls from the next grade's pool (C1) once pools exist, so finding one is an event.

## Small things to do on the way

- Show the **estimated win chance** of each queued monster in the Next strip ([24](24-battle-queue.md)); decide whether a defeat should also switch Auto-battle off. **Decided 2026-11-07 (IDL-59): coloured Safe/Risky/Unlikely bucket with the percent on hover; three defeats in a row pause Auto-battle.**
- Per-band danger offsets (`dangerBonus` is 0 or 1, ROADMAP R7).
- Docs 02, 06 and 19: the castle timer tables still show the old numbers.
- Look at the growth badge, the queue markers and the Next strip in a real browser session once (nobody has yet), and write a Playwright smoke test for them.

## Decisions needed

1. Phase A first as proposed, or items first? (Proposed: A1-A4, then B, with A5-A8 alongside.)
2. How many special effects at launch of C4 (proposed: 6 handlers, 10 legendaries).
3. Is `enabled: false` item data allowed to ship in the catalog (proposed: yes, it is validated and never dropped).
4. Prettier style (tabs, single quotes, print width 160 to match the code today) so that A1 changes as little as possible.
