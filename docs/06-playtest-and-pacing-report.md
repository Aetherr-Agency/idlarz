# 06 · Playtest & pacing report

**Why this exists:** a friend "finished" the live game in about 3 days of heavy play. The goal is for progress to be noticeably slower. This report records a sped-up playthrough of the current code and ranks the levers that make it fast. **No balance values were changed** — the recommendations below are to be tackled one at a time (each one should be followed by re-running `npx tsx scripts/balance-report.ts` and a new playtest).

## 1. How the playthrough was done

- Dev server on `localhost:3111`, driven through the in-app browser.
- Time was accelerated by replacing `Date.now()` in the page (the game's tick uses wall-clock deltas): ×60 early, ×300, ×1200 and ×3000 later. Late-game ticks therefore cover 100–300 game-seconds each, which is coarse but fine for these slow rates.
- A bot played through the real UI (clicking tiles, dialogs and buttons) as a *moderate* active player:
  - **2 clicks per game-second, 24 h a day** (clicks anywhere give gold — [02 §9](02-mechanics.md)); a human would click far less over a day, an auto-clicker far more.
  - Buys the cheapest adjacent tile whenever affordable (plains when it can choose), upgrades the castle when it can pay, spends stat points on Charisma/Intelligence, buys the first copy of each animal and upgrades when food is plentiful, buys the click multiplier when it can afford 1.2× the price, and sells excess meat/wood/stone/coal to the merchant.
  - Flaws: until ~day 2.5 it did not sell (the merchant window was stuck on the Buy tab — fixed, B13), later it over-sold stone/meat it needed for castle 6, and it never collected chests. Treat the numbers as **directional**.

## 2. Timeline of the run

| Game time | Tiles | Level | Castle | Click × | Passive gold/s | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 0.03 d (40 min) | 9 | 4 | 1 | 2 | 1.1 | |
| 0.07 d (1.6 h) | 16 | 7 | 1 | 2 | 2.4 | tiles are cheap (< 10 K) |
| 0.17 d (4 h) | — | — | **2** | 2 | — | castle 1→2 costs 35 K gold, 5 K wood/stone |
| 0.35 d | — | — | **3** | 2 | — | 100 K gold + 10 K coal |
| 0.51 d (12 h) | 24 | 14 | 3 | 2 | 5.3 | 154 K gold banked; chickens/deer bought |
| 0.66 d | — | — | 3 | **4** | — | click upgrade 250 K |
| 1.25 d | 26 | 18 | 3 | 4 | 5.7 | tile 26 cost 406 K |
| 1.32 d | — | — | **4** | 4 | — | first food/meat requirement |
| 2.17 d | 28 | 21 | 4 | 8 | 8.1 | stockpile: wood 423 K, stone 733 K, coal 870 K, **meat 649 K** (unsold) |
| 2.56 d | 29 → 33 | — | 4 | **16** | — | one merchant liquidation = **17.9 M gold**; bought 4 tiles and the last click upgrade in one go |
| 3.42 d | — | — | **5** | 16 | 14.5 | |
| 3.57 d | 35 | 24 | 5 | 16 | 14.5 | |
| 5.79 d | 38 | 27 | 5 | 16 | 16.0 | 21.6 M gold banked, 5.2 M food; castle 6 pending (needs 10 M gold, 1 M wood/stone, 500 K coal, 5 M food, 250 K meat) |

Tile purchase times past 25 (game days / cost): #26 0.99 d / 406 K · #27 1.6 d / 575 K · #28 2.15 d / 823 K · #29 2.56 d / 1.18 M · #30–33 2.58–2.60 d / 1.7–4.9 M (liquidation burst) · #34 2.8 d / 7.1 M · #35 3.15 d / 10.1 M · #36 3.75 d / 14.4 M · #37 4.38 d / 20.6 M · #38 5.23 d / 29.3 M.

**Reading:** every system with a hard cap (click multiplier 16×, castle 5 of 6, all four animals, 35+ tiles) is essentially done by **day 3.5–4** with a moderately active player, and the only things still unfinished (castle 6, more tiles) are limited by exponential costs that now buy almost nothing. That is the "finished in 3 days" experience.

## 3. What drives the speed (ranked)

1. **Clicking is the real income and it scales with income.** Click gold = `total gold/s × clickMultiplier`, no cooldown ([03 §3](03-formulas-and-scaling.md)). Total gold/s ≈ `passive × (1 + CPS × multiplier)`:
   - Day 1.25 (×4): passive 5.7/s, bot clicks add 2 × 4 × 5.7 = **45/s → 89 % of income**.
   - End state (×16): passive 16/s → **528/s at 2 CPS**, **~2,600/s at 10 CPS** (an auto-clicker or a very active player). The multiplier ladder costs only 250 K / 500 K / 2 M gold — trivial relative to what the same income produces.
2. **Meat is a gold fountain.** Sell price 15 gold vs food 0.75 → 20×. At day ~2.5 the unsold meat alone was worth ~9.7 M gold (54 % of the 17.9 M liquidation). The farm's *first purchase of each animal* pays back in 42 min (chicken) to 7 h (cow) in food-sell-value terms ([03 §5](03-formulas-and-scaling.md)), and meat income stacks with castle and Plains modifiers.
3. **Castle is cheap relative to income and doubles everything.** Levels 2–4 cost 35 K–500 K gold; by day 1.3 the bot had castle 4 (+160 %, ×2.6 total). Only levels 5–6 need large food/meat stockpiles. Total castle price to level 6 ≈ 12.6 M gold + 1.27 M wood/stone + 635 K coal + 6.1 M food + 320 K meat — roughly **one merchant liquidation** at day 2.5.
4. **Stockpiles have no use besides the castle and merchant**: by day 2.2 stone was at 3.7× and coal at 8.7× the next castle need. Everything non-gold is effectively sellable gold (see 2), so non-gold resource production is money.
5. **Tiles stopped being a goal long ago.** Cost n=30 → 1.7 M, n=38 → 29 M while a tile adds only ~0.05–0.1 gold/s (≈ 0.1 with adjacency). Payback is years; tiles are only bought with spare liquidation money. The user's own observation matches: past ~25 tiles the cost feels insane.
6. **Levels and stat points do not matter**: level 27 on day 5.8, ≈ 26 stat points × 2.5 % on a ×7+ castle multiplier, XP has no other use.
7. **Chests are irrelevant**: 5–50 min of *passive* gold (16/s → 5 K–48 K) versus income of hundreds per second from clicking; the bot ignored all five and lost nothing.

## 4. Recommendations (one at a time, highest leverage first)

For each: what to change, expected effect, and how to verify. Re-run the generated tables and repeat the playtest after each step.

### R1 — Decouple click income from total income (biggest single lever)
- Today: `gold per click = totalGold/s × multiplier`, unlimited clicks.
- Options (pick one, combine with R1b):
  - **a)** Cooldown / max CPS (e.g. one paying click per 300 ms, i.e. ≤ 3.3 CPS). Stops auto-clickers and button-mashing, keeps clicking as an active bonus.
  - **b)** Make the click value a separate stat: `clickPower = base + 0.2 × castle level + upgrades` (flat gold), instead of a multiple of passive income, so late-game clicks stop dominating.
  - **c)** Lower the multiplier ladder to 2 → 3 → 4 → 5 (or give the upgrades diminishing returns) and rescale prices.
- Also stop paying gold for clicks on UI buttons/map-drag (only the map) — D10.
- Target: clicks should be ~25–40 % of income, not 90 %.

### R2 — Tame meat
- Lower the merchant sell price of meat from 15 to **~2–3** (food stays 0.75), or cap meat sold per hour, or make animals consume food continuously. With price 2.5 the chicken payback goes from 42 min to ≈ 4.2 h and the cow from 6.9 h to ≈ 41 h.
- Alternatively keep 15 but raise animal costs ×5–10 (first-copy costs 50 K / 250 K / 1 M / 5 M food).
- Make animals' later levels worthwhile (each purchase adds a new animal's output rather than +20 % of one) — see 05 T5 — only *after* the price is fixed.

### R3 — Slow the castle (the "finish line")
- Raise costs of levels 2–4 (currently 35 K–500 K) by ~×5 and 5–6 by ×2–3, and require wood/stone/coal early so mining matters.
- Add **upgrade timers** (e.g. 30 min, 2 h, 8 h, 24 h, 48 h). Time gates are the most direct way to keep a 3-day game from finishing in 3 days, independent of how fast the player earns.
- Optionally make the bonus less front-loaded: `+0.5 per level` linear (L6 = +300 %) instead of doubling (+640 %).

### R4 — Fix the tile-cost curve and make tiles worth buying
- Observed problem: the current exponential makes tile #25+ hundreds of thousands and #38 ≈ 29 M for ~0.1 gold/s. Candidate curves in [generated §10](generated/balance-tables.md):

  | n | A (now) | B (1.42ⁿ to 20 then ×1.22) | C (×1.30) | D (×1.25) |
  | --- | --- | --- | --- | --- |
  | 25 | 434 K | 165 K | 39 K | 15 K |
  | 30 | 2.61 M | 446 K | 144 K | 44 K |
  | 40 | 94.6 M | 3.3 M | 2.0 M | 414 K |
  | 50 | 5.17 B | 23.8 M | 27.4 M | 3.9 M |
  | cumulative to 40 tiles | 219 M | 14.7 M | 6.6 M | 1.7 M |

- Recommendation: **B** (or a gentler tail) *combined with R1–R3* so that tiles become the long-term, time-gating sink instead of an unreachable wall. Since the goal is slower progress overall, do **not** flatten tiles first — flatten them after the faster levers are tamed, otherwise the game ends sooner.
- Make tiles pay for themselves: per-tile output scaled by castle level or tile "levels" with costs, so the 40th tile is a real choice.

### R5 — Give stockpiles a purpose and a cap
- Add sinks for wood/stone/coal: building construction costs, equipment/upgrade tab (U2), animal housing.
- Or cap resource storage at a castle-level-dependent size (e.g. `250 K × 2^(L-1)`), forcing spend/sell decisions and preventing multi-day hoards from turning into one huge gold injection.

### R6 — Make levels/stat points matter or retire them
- Raise stat effect to ~5 %/point and/or make XP gate castle levels (e.g. castle N needs player level 5·N), turning the already-existing XP/level system into pacing.
- Re-add the unused castle `xpBonus` (U7) only after deciding the above.

### R7 — Chests
- Scale reward with progress (e.g. 30–60 min of *total* income including clicks, or flat resource packs), reset the spawn timer at the cap, and let chests expire — or they stay irrelevant.

### R8 — Pacing targets to aim for (proposal, tune with the script)
Let the "fully finished" state (castle 6, all animals, ~50 tiles, max click) take roughly:

| Milestone | Now (moderate bot) | Proposed target |
| --- | --- | --- |
| 16 tiles | ~1.6 h | 3–4 h |
| Castle 2 | ~4 h | ~1 day |
| Castle 3 | ~8 h | ~3 days |
| Castle 4 | ~1.3 d | ~7 days |
| Castle 5 | ~3.4 d | ~14 days |
| Castle 6 | > 6 d | ~21–28 days |
| 40 tiles | ~3.5 d | ~21 days |
| Max click multiplier | ~2.6 d | ~10–14 days |

Numbers are placeholders; the *shape* matters: early game stays quick (first session feels good), mid game becomes timer/gate driven, and the end state is a multi-week goal.

### Suggested order of work
1. R1 (click) — measure again; 2. R2 (meat) — measure; 3. R3 (castle costs + timers); 4. R4 (tile curve B + per-tile value); 5. R5 sinks/caps; 6. R6 levels; 7. R7 chests; then revisit R8 targets. Remember D1 (+10 % gold/+25 % XP hidden modifier) can be folded into whichever step touches `calculateResourceRates`.

## 5. Quick wins done during this pass

Inertia drift and per-frame re-render of the map, negative-clock resource drain, misleading castle/tooltip/tutorial/comment text, and the merchant tab reset — see B8–B13 in [04](04-unfinished-and-known-issues.md). None of these change the economy.

## 6. Caveats

- The bot clicks 2×/s around the clock; real players click less per day but can auto-click; both extremes are covered by the formula in §3.1.
- Time acceleration makes late-game ticks coarse (100–300 game-seconds); resource totals are a little off but not by orders of magnitude.
- Only one run was made, with a few flaws in the bot (§1). Use the numbers to compare *changes*, not as absolute truth. The headless simulation in `scripts/balance-report.ts` (§9 of the generated tables) is an idle-only baseline; extending it with a click/castle/animal strategy would give a reproducible way to evaluate each recommendation without the browser.
