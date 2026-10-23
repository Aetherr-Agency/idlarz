# Idle Explorer — design & technical docs

Live build: https://idlarz.vercel.app · Repo stack: Next.js 15.5 (App Router) · React 19 · Tailwind 4 · Zustand 5 (persisted to `localStorage`).

These documents describe the game **as the code actually behaves** (not as the in-game tutorial claims — the tutorial text in `NamePrompt.tsx` is out of date, see [04](04-unfinished-and-known-issues.md)). Every number is traceable to a file; the large tables are generated from the real config so they can be refreshed after tuning.

| Doc | What it answers |
| --- | --- |
| [01-architecture.md](01-architecture.md) | How the code is organised, the state shape, the tick loop, persistence |
| [02-mechanics.md](02-mechanics.md) | Every player-visible mechanic and its exact rules |
| [03-formulas-and-scaling.md](03-formulas-and-scaling.md) | Every formula, constant, and how the numbers scale |
| [04-unfinished-and-known-issues.md](04-unfinished-and-known-issues.md) | Half-built features, dead config, bugs (fixed and open) |
| [05-balance-backlog-and-roadmap.md](05-balance-backlog-and-roadmap.md) | Balance observations, proposed tweaks, suggested next features, upgrade notes |
| [06-playtest-and-pacing-report.md](06-playtest-and-pacing-report.md) | Sped-up playthrough: where the time goes, why the game "finishes" in ~3 days, prioritised rebalancing recommendations |
| [generated/balance-tables.md](generated/balance-tables.md) | Auto-generated tables (tile cost, levels, castle, animals, rates, idle simulation) |

## Regenerating the tables

```bash
npx tsx scripts/balance-report.ts
```

`tsx` is fetched on demand (it is not a project dependency). The script imports the real `gameConfig.ts` / `gameUtils.ts`, so any tuning change shows up in the tables immediately. Re-run it and commit the diff whenever balance values change.

## Conventions used in the docs

- `file:line` references point at the code at the time of writing (branch `agntc/game-docs-dependencies-cd99bf`).
- "Per second" rates are *before* the click multiplier; "modifier" values are fractions (0.25 = +25%).
- **D1, D2…** are *discrepancies* that were found but deliberately **not** changed because changing them alters game balance; they need a product decision (see 04).
