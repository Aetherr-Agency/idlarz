# 03 · Formulas & scaling

All constants live in [`src/config/gameConfig.ts`](../src/config/gameConfig.ts); the maths in [`src/utils/gameUtils.ts`](../src/utils/gameUtils.ts) and `tick`/`buyTile` in [`src/stores/gameStore.ts`](../src/stores/gameStore.ts). Full tables: [generated/balance-tables.md](generated/balance-tables.md) (regenerate with `npx tsx scripts/balance-report.ts`).

Notation: `n` = tiles owned (castle included), `L` = player level, `C` = castle level, `x^y` = power.

## 1. Tile cost

`SCALING_CONFIG.costFormula` (`gameConfig.ts:63-81`):

```
tier   = floor(n / 24)
factor = 1.42 × (1 + 0.01 × (tier > 20 ? tier : tier / 1.2))
base   = floor(55 × factor^n)
cost   = floor(base × (1 − discount%/100))        // buyTile / selectBiome / TileStatus
discount% = min(charisma × 0.5, 25)               // calculateCombatStats.tileCostDiscount
```

`n` is the count **before** the purchase (castle only → n = 1 → cost 78, or 76 with the starting 2.5 % discount).

| n | 1 | 5 | 10 | 15 | 20 | 25 | 30 | 40 | 50 | 60 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cost (cha 5) | 76 | 309 | 1.79 K | 10.3 K | 59.6 K | 423 K | 2.55 M | 92.3 M | 5.04 B | 198 B |

Growth is ≈ ×1.42 per tile (plus a small tier term, +0.83 % to the factor per 24 tiles) — a pure exponential wall. At 100 gold/s a 40th tile costs ~11 days of income; the 80th would cost ~6×10¹⁴. The 2,500-tile map is effectively unreachable.

Biome picker cadence: `n % 4 === 3`. XP and reputation per purchase are in §2.

## 2. XP and levels

```
tileXP(n')   = 125 × 1.02^(n' − 1) × (n' / 4)          n' = owned count AFTER the purchase
awardedXP    = tileXP × (1 + xpGainMultiplier / 100)    xpGainMultiplier = 0.2·INT + 0.25·CHA  (percent)
passiveXP/s  = rates.total.xp × (1 + xpGainMultiplier / 100)
XP to leave level L = floor(750 × 1.3^(L − 1))           // calculateLevel; cumulative in generated tables
stat points  = 1 per level gained
reputation   = +100 per tile bought (starts at 1000), unused
```

Examples: first purchase gives `tileXP(2) = 63.75` (×1.0225); level 1 → 2 needs 750 XP; level 10 → 11 needs 7,953; level 20 → 21 needs ~109.6 K.

`rates.total.xp` (starting value 1.10/s) = `(0.25 base + 0.5 castle + 0.15·Grounds + 0.2·Workshops …) × (1 + modifiers.xp)`, where `modifiers.xp` includes the castle modifier (`0.2·2^(C−1)`), `0.002·INT`, `0.0025·CHA`, and the D1 +25 %. Then `xpGainMultiplier` multiplies again (XP gets two multipliers).

## 3. Resource rate pipeline

`calculateResourceRates` (`gameUtils.ts:332-446`):

```
base[r]  = BASE_GENERATION_RATES[r]                         // gold 0.1, xp 0.25, rest 0
         + Σ over owned tiles t, over (biome[t].resourceGeneration[r]
                                       + building[t].resourceGeneration[r] if grounds level 2):
                rate × (1 + 0.25 × sameBiomeNeighbours(t))
           (castle's biome entries are skipped when CASTLE_BASE_RATES[r] is truthy — see §4)
         + CASTLE_BASE_RATES[r]                              // gold .1, wood .05, food .05, xp .5
         + (r == meat ? Σ animalProduction : 0)

modifiers[r] = BASE_GENERATION_RATES[r]                     // ← D1: accidental, +0.10 gold, +0.25 xp
             + 0.2 × 2^(C − 1)                              // castle, ALL resources
             + statMod[r]                                   // table below
             + (r == meat ? 0.05 × plainsTiles : 0)

total[r] = base[r] × (1 + modifiers[r])
```

`total` is added every tick (`resources[r] += total[r] × dt`; xp gets the extra `xpGainMultiplier`).

Stat modifiers (`calculateStatResourceModifiers`), additive fractions per point:

| Stat | gold | wood | stone | coal | food | xp |
| --- | --- | --- | --- | --- | --- | --- |
| STR | | | .025 | .025 | | |
| DEX | | .025 | | | .025 | |
| INT | .025 | | | | | .002 |
| VIT | | .025 | | | .025 | |
| CHA | .025 | | | .025 | | .0025 |

Because everything is **additive inside one `(1 + Σ)`**, +2.5 %/point is a *linear* gain on the same base: with 10 INT and 10 CHA, gold gets `+0.5`. Stat points therefore have rapidly diminishing relative value as the castle modifier grows (castle 6 = +6.4), but absolute value grows with base income.

**New-game rates** (all starting stats 5, castle 1): gold 0.20 base × 1.55 = **0.31/s**; wood 0.05 × 1.45; food 0.05 × 1.45; stone 0.10 × 1.325; xp 0.75 × 1.4725 = **1.10/s**; coal 0 (modifier 45 % on a zero base); meat 0.

**Click gold** = `total.gold × clickMultiplier` per click (multiplier 2/4/8/16).
**Chest gold** = `floor(total.gold × U{300…3000} s)`, timer 600 s, cap 5 chests.

## 4. Castle

```
modifier(C) = 0.2 × 2^(C−1)             C = 1..6  → 0.2, 0.4, 0.8, 1.6, 3.2, 6.4
upgrade C→C+1 cost = CASTLE_UPGRADE.upgradeCosts[C − 1]   (all paid in full, no refund)
```

| Upgrade | gold | wood | stone | coal | food | meat |
| --- | --- | --- | --- | --- | --- | --- |
| 1→2 | 35 K | 5 K | 5 K | — | — | — |
| 2→3 | 100 K | 15 K | 15 K | 10 K | — | — |
| 3→4 | 500 K | 50 K | 50 K | 25 K | 100 K | 20 K |
| 4→5 | 2 M | 200 K | 200 K | 100 K | 1 M | 50 K |
| 5→6 | 10 M | 1 M | 1 M | 500 K | 5 M | 250 K |
| 6→7…9→10 | present in config but **unreachable** (max level is 6) | | | | | |

Effective castle tile output: see 02 §5 (`CASTLE_BASE_RATES` shadows the biome table for gold/wood/food/xp; stone 0.1 comes from the biome table; adjacency never applies to a unique tile).

## 5. Farm animals

For animal with `baseCost, costScaling (cs), baseProduction (bp), productionScaling (ps)` and `lvl` = purchases so far:

```
cost of next purchase (food) = floor(baseCost × cs^lvl)
production of ONE animal at level N = bp × ps^(N−1)           (N ≥ 1; 0 if not owned)
meat base rate = Σ production over the 4 animals
meat total     = base × (1 + castleModifier + 0.05 × plainsTiles)
```

| Animal | baseCost (food) | cs | bp (meat/s) | ps |
| --- | --- | --- | --- | --- |
| 🐔 Chicken | 10,000 | 1.5 | 0.2 | 1.2 |
| 🦌 Deer | 50,000 | 1.6 | 0.5 | 1.25 |
| 🐖 Pig | 200,000 | 1.7 | 1.0 | 1.3 |
| 🐄 Cow | 1,000,000 | 1.8 | 2.0 | 1.4 |

Note the shape: the **first** purchase of each animal gives its entire `bp`; later purchases only multiply that same animal's output by `ps` (e.g. chicken level 2 adds just +0.04 meat/s for 15 K food). Because cost grows faster than production (`cs > ps`), upgrades have rising payback; the first purchase of each animal is the best buy (payback ≈ 42 min chicken … 6.9 h cow *if* food is only valued at its sell price 0.75 and meat at 15). See generated tables §4 for levels 1–20.

## 6. Merchant & click upgrade

```
sell:  gold = floor(amount × price)          price: wood .5, stone .5, coal 1, food .75, meat 15
buy:   gold = floor(amount × price × 2)
click multiplier price: 250,000 (2→4), 500,000 (4→8), 2,000,000 (8→16)
```

No spread tricks: buy = 2× sell, so converting resources back and forth only loses gold. Price ratios are the interesting part: meat is worth 20× food and 30× wood.

## 7. Character-derived stats (display unless noted)

`calculateCombatStats(stats)`:

| Stat | Formula | Gameplay effect |
| --- | --- | --- |
| physicalAtk | STR | none |
| magicAtk | INT | none |
| hp | 3·VIT + 0.25·CHA | none |
| mp | 2·INT | none |
| def | DEX + 0.5·STR + 0.5·VIT + 0.25·CHA | none |
| magicDef | INT + 0.5·VIT + 0.25·CHA | none |
| luck | CHA | none |
| critChance (%) | 0.25·DEX + 0.5·CHA | none |
| critDmg (%) | 100 + STR + 0.5·DEX + 0.5·CHA | none |
| atkSpeedIncrease (%) | 0.25·DEX | none |
| **xpGainMultiplier (%)** | 0.2·INT + 0.25·CHA | **XP income & tile XP** |
| **tileCostDiscount (%)** | min(0.5·CHA, 25) | **tile cost** (cap at CHA 50) |

`INITIAL_CHARACTER_STATS` hard-codes slightly different starting values from this function for hp/def/magicDef/critDmg (D4); the first stat point overwrites them with the formula values.

## 8. What the numbers say (short version)

- Early game (first ~15 tiles): tile cost roughly ×1.42 per tile while income per tile is ~0.05–0.1 gold/s → passive growth stalls around 20 tiles; clicking, chests and castle multipliers carry the player. Idle-only baseline (generated §9): 10 tiles ≈ 66 min, 20 tiles ≈ 19 h, 30 tiles ≈ 21 days, 40 tiles ≈ 1.6 years.
- Mid game: the castle (+20 % → +640 %) is the biggest multiplier but its full cost (about 12.6 M gold + 1.27 M wood/stone + …) is paid in a resource mix that tiles produce slowly; meat/food requirements at level 3→4+ force a farm.
- Late game: income is dominated by meat (15 gold each) and the click multiplier; tiles stop mattering because of the cost wall.

See [05](05-balance-backlog-and-roadmap.md) for proposed changes.
