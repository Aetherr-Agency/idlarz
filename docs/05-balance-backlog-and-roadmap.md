# 05 · Balance backlog, roadmap & upgrade notes

Nothing in this file has been applied to the code. Items marked **needs approval** change game feel and should be decided by the owner; numbers refer to [generated/balance-tables.md](generated/balance-tables.md) and [03](03-formulas-and-scaling.md).

> **See also [06 — Playtest & pacing report](06-playtest-and-pacing-report.md)**: a sped-up playthrough shows the game "finishes" in ~3–4 days mainly because click income scales with total income (R1), meat sells for 15 (R2), the castle is cheap relative to income (R3) and tiles beyond ~25 cost far more than they return (R4: tile #38 ≈ 29 M gold). 06 contains the prioritised, one-at-a-time rebalancing plan and candidate tile-cost curves; the list below is the older, formula-level view.

## 1. Observations from the numbers

1. **Tile-cost wall.** Cost ≈ 55 × 1.42ⁿ. Idle-only income reaches ~2.5 gold/s at 20 tiles, so the 25th tile costs ~423 K (≈ 2 days idle) and the 40th ~92 M (≈ 1.6 years idle). Real progress comes from clicking (`gold/s × multiplier` per click, no cooldown), chests (5–50 min of income) and the castle modifier. The 2,500-tile map is decoration.
2. **Tile income is tiny relative to tile cost.** A random tile adds ~0.05–0.1 gold/s (≈ 0.1 with adjacency); the 20th tile costs ~60 K → payback of days and growing exponentially. Past ~15 tiles, buying a tile is never "profitable" — it is purely for XP/progress.
3. **Castle is the real economy.** +20 % → +640 % additive on top of base. 1→2 costs 35 K gold + 5 K wood/stone, which is roughly the cost of tile ~#19–20. Levels 3→4 and up demand food and meat, forcing the farm.
4. **Meat is a runaway currency.** Merchant sells meat at 15 gold vs 0.75 for food (20×). A cow level 1 (1 M food) yields 2 meat/s = 30 gold/s (before modifiers) — more than the entire early-game income — with a 6.9 h food-value payback. Later levels are poor value (payback days), so the *first purchase of each animal* dominates. The farm is where the game's gold comes from past mid-game.
5. **Stat points are weak and linear.** +2.5 % per point on a base that is small; at castle level ≥ 3 the modifier pool is dominated by the castle. INT/CHA double-dip on XP (modifier + `xpGainMultiplier`). Charisma is best (gold + coal + XP + tile discount).
6. **Grounds/buildings have no cost or trade-off**, and Blacksmith (0.1×5) is strictly the highest-yield pick on average; Market/Lumber/Farm 0.2 single-resource. A build cost (or upgrade tiers) would create decisions.
7. **XP curve** (×1.3 per level) outpaces passive XP (~1.1/s) quickly: L10 needs ~8 K XP and L20 ~110 K per level; tile XP (63 → 12 K per tile) is the main source, which couples levelling to the tile wall.
8. **Early game is very slow before the first clicks matter:** starting income 0.31 gold/s (0.39 after the first tile). It is only playable because clicking gives 2× income per click.
9. **Discrepancy D1** quietly adds +10 % gold / +25 % XP to everyone.

## 2. Proposed tweaks (ordered; each **needs approval**)

| # | Change | Rationale | Risk |
| --- | --- | --- | --- |
| T1 | Decide D1: keep as a documented "+10 % gold, +25 % xp" bonus **or** zero the initial modifiers | removes hidden coupling; makes tooltips honest | −10 %/−25 % income if zeroed |
| T2 | Flatten the tile cost curve: e.g. `55 × 1.42ⁿ` → growth 1.18–1.22/tile for n ≤ 40, then 1.25 | lets the 40–60-tile territory exist; today it is unreachable | needs matching income-per-tile bump; regenerate tables and check §8/§9 |
| T3 | Raise per-tile output or add a per-tile "level"/building cost system so tiles remain worth buying after ~15 | tile payback currently days → years | rebalancing the whole economy |
| T4 | Meat/food price ratio: sell meat at ~5–8 (not 15), or cap meat sold per hour | removes runaway; keeps farm useful | nerfs current players' gold |
| T5 | Animals: make level 2+ add `bp × ps^(N−1)` of *new* output (stacking animals) rather than upgrading one animal's multiplier, or reduce `cs` | makes later purchases meaningful (chicken lvl 2 adds only +0.04 meat/s) | buff |
| T6 | Buildings cost resources (e.g. 25–100 % of the current tile cost in wood/stone) and Blacksmith is slightly weaker | creates choice | |
| T7 | Implement castle `xpBonus` (U7) **or** delete the claim | honesty; small XP boost | |
| T8 | Give meaning to non-resource stats (luck → chest size / gambling, reputation → merchant discount, hp/atk → expeditions) | 70 % of the stat table is inert | scope |
| T9 | Chest rule: reset spawn timer when at cap, and base reward on tile count/progress instead of pure income | avoids chest farming at high income | |
| T10 | Click: add a modest cooldown or only count clicks on the map | prevents autoclicker domination and UI-click accidents (D10) | feel |

Suggested first balance pass: T1 → T2 → T5 → T4, re-running `scripts/balance-report.ts` after each and keeping the "idle-only baseline" table under ~2 weeks for 40 tiles with typical play.

## 3. Feature roadmap (suggested order)

1. **Safety nets**: in-game reset + save export/import (U11, U12), tests for `gameUtils.ts` (rate pipeline, level curve), persist throttling.
2. **Text correctness**: rewrite the tutorial from these docs (D6), tooltips (D5, D8).
3. **Inventory & equipment** (U1) → unlocks Merchant *Upgrade Items* (U2) and gives chests/quests something to drop.
4. **Quests** (U3) as the early-game guidance layer and item source.
5. **Offline progress** (U9) with a cap (e.g. 8 h at 50 %).
6. **Prestige** (U10) once the cost wall is flattened — reputation is a natural prestige currency.
7. **Gambling** (U4) as a gold sink using `luck`.
8. Combat/expeditions only if the stats should matter (U5) — otherwise trim the stat table to what is used.

## 4. Framework upgrade notes

Done now (in-range): Next 15.5.28, React 19.3, Tailwind 4.3.3, Zustand 5.0.16, TypeScript 5.9.3, ESLint 9.39.5 (see `package.json`).

Held back deliberately (user asked for minor/patch only). Newest majors at the time of writing: **Next 16.4, TypeScript 7.0, ESLint 10.13, @types/node 26**. When moving:

- **Next 16**: removes `next lint` (migrate the `lint` script to `eslint .`; codemod: `npx @next/codemod@canary next-lint-to-eslint-cli .`), Turbopack becomes default, requires Node ≥ 20.9, fixes the remaining PostCSS advisories bundled in Next 15. Also set `outputFileTracingRoot` if the repo sits under another lockfile (a warning appears today because a stray `package-lock.json` exists higher up the tree).
- **TypeScript 7** (native compiler) and **ESLint 10**: check `typescript-eslint`/`eslint-config-next` peer ranges first; upgrade one at a time and keep `npm run build` green.
- `tsconfig.json` still targets `es5`; bumping to `ES2017+` is harmless with Next.
- Consider moving state to selector-based subscriptions + `partialize`d persist when touching the store.
