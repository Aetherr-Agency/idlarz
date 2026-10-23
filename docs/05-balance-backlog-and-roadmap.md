# 05 · Balance backlog, roadmap & upgrade notes

Only **remaining** work. The first rebalance pass (click limiter, meat price, stacking animals, tile curve + resource costs, castle timers/costs, building costs, critter/chest limits, T1–T10) is done and documented in [06](06-playtest-and-pacing-report.md); its leftovers are below.

## 1. Balance leftovers (each needs approval before changing)

| # | Topic | Observation | Idea |
| --- | --- | --- | --- |
| BL1 | **Gap between active and idle players is small** (hardcore ≈ 28 d, idle ≈ 36 d in the sim) | Gold is only part of the economy; the castle timers (5 d 5 h) and resource costs dominate | Raise click power further, or let clicks also pay a small share of other resources / tap yields; re-run the sim |
| BL2 | **Levels and stat points barely matter** | ~1 point/level, +2.5 % each on a pool that the castle multiplies to ×7.4 | Gate castle levels by player level, or raise per-point effects, or add respec |
| BL3 | **Chests and tile taps are small** next to income | chest = 10–60 min of *passive* gold; tap = 0.5 s of one tile | Scale chests with the click-inclusive income or give resource packs |
| BL4 | **Meat/food is still the strongest engine** (animal stacking × castle multiplier) | animals dominate mid-game income in the sim traces | Revisit `costScaling` (1.5–1.8) or add upkeep once the unfinished systems exist |
| BL5 | **Resource sinks end after the castle and tiles** | wood/stone/coal beyond tile and castle needs only sell for 0.5–1 gold | Equipment upgrades (U2), buildings with upgrade levels (U13), storage caps tied to the castle |
| BL6 | **Merchant has no depth** | one flat price per resource, no saturation | optional "market saturation" (price drops with volume sold, recovers over ~30 min) if burst selling shows up again |
| BL7 | **No cap on late tiles** | tile 50 ≈ 118 M gold + 12 M wood/stone + 9 M coal/food | fine as an endgame sink, but check the ending once the finish line moves (U8/U10) |
| BL8 | **Idle tile income** | with `BIOME_YIELD.scale` = 1.3 a tile adds ~0.1–0.5 gold-equivalent/s | consider per-biome specialisation bonuses (e.g. +x % per 4 same biome) |

## 2. Feature roadmap (suggested order)

1. **Inventory & equipment** (U1) → unlocks Merchant *Upgrade Items* (U2) and gives chests/quests something to drop; remember `PERSISTED_KEYS` + `sanitizeSave`.
2. **Quests** (U3) as the early guidance layer and an item source.
3. **Visible settings** (volume, link to save tools) and a castle-timer badge (open issues B4/U12).
4. **Offline progress** (U9) once there is trusted time ([07 §6](07-security-and-exploits.md)).
5. **More endgame**: castle levels 7–10 (U8) or prestige (U10) before the pacing changes make the 4-week finish line feel short.
6. **Gambling** (U4) as a gold sink using `luck`.
7. Combat/expeditions only if the stats should matter (U5); otherwise trim the stat table to what is used.
8. **Server-verified saves** ([07 §6](07-security-and-exploits.md)) if leaderboards/online features are planned.

## 3. Framework upgrade notes

Already on Next 15.5.28, React 19.3, Tailwind 4.3, Zustand 5.0, TypeScript 5.9, ESLint 9.39 (all within their majors). Held back deliberately: **Next 16**, **TypeScript 7**, **ESLint 10**, `@types/node` 26.

- Next 16 removes `next lint` (migrate the `lint` script to `eslint .`: `npx @next/codemod@canary next-lint-to-eslint-cli .`), makes Turbopack default, needs Node ≥ 20.9, and fixes the two PostCSS advisories bundled inside Next 15 (build-time tooling, not shipped to players). Also set `outputFileTracingRoot` / `turbopack.root` because a lockfile exists above the repo (warning on every build).
- TypeScript 7 and ESLint 10: check `typescript-eslint` / `eslint-config-next` peer ranges first; upgrade one at a time and keep `npm run build`, `npm test` and `npm run sim` green.
- A UI branch (`agntc/pixel-graphics-capability`, `agntc/stoic-saha`) and the Dependabot PR for `next` 15.2.3 are superseded by this branch's Next 15.5.28.

## 4. Performance backlog

Per-tile store subscriptions (re-render on every tick), the 10 Hz `set()` that rebuilds `resources`, and the sprite/CSS weight of the pixel UI. Measure before optimising; saves are already debounced.
