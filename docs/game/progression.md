# Progression: levels, attributes, skills, rebirth, Embers, limits

Data: `src/config/character.ts`, `src/config/rebirth.ts`, `src/config/limits.ts`, `src/config/playerClasses.ts`; maths `src/utils/game/character.ts`, `src/utils/game/rebirth.ts`, `src/lib/statBonuses.ts`, `src/lib/limits.ts`; the store action `src/stores/game/rebirthSlice.ts`.

## 1. Character level

- Level 1-100 (`LEVELING.maxLevel`); XP is lifetime and **carries over a rebirth**.
- The curve is written as anchors, total XP to reach a level (`LEVELING.anchors`): 10 → 1.4e5, 30 → 1.0e8, 80 → 3.0e9, 90 → 6.5e9, 100 → 1.85e10. The first step (level 1→2) is 5,000 XP (`firstStepXp`). Between two anchors each step is the one before times a constant ratio, solved by bisection so the segment sums to the anchor and steps never shrink at a join (`buildLevelSteps`, `xpToNextLevel`, `cumulativeXp`, `calculateLevel`). Soft cap level is 80 (`softCapLevel`, informational).
- Examples (computed): level 2 needs 5,000 total, level 5 29.6 K, level 10 140 K, level 20 3.4 M, level 30 100 M, level 50 853 M, level 80 3.0e9, level 99 1.68e10.
- XP sources: passive `rates.xp x (1 + XP gain %)`, every tile purchase, and server payouts (kills, chests, away time). See [economy.md](economy.md) and [monsters.md](monsters.md).
- Attribute points: 1 per level, plus 2 extra per level for levels 2-30 (`LEVELING.earlyBonusUntil` 30, `earlyBonusPoints` 2). `totalStatPoints(level)` = `level - 1 + (min(level,30) - 1) x 2`: level 10 → 27, level 30 → 87, level 80 → 137, level 100 → 157. `reconcileCharacter` hands every point back when a character holds more than its level has earned.
- There is no paragon level in the code.

## 2. Attributes

Five attributes start at 5 (`INITIAL_CHARACTER_STATS`). Resource effects use **all** points; combat effects count the points **above 5** (`STAT_RULES.base`).

| Attribute | Economy per point | Combat per point (above 5 unless noted) |
| --- | --- | --- |
| Strength | +2.5% stone and coal | +2% damage with physical weapons, +0.25 armor, +1% crit damage |
| Dexterity | +2.5% wood and food | +0.5 armor, +0.25% attack speed, +0.5% crit damage; +0.25% crit chance (all points) |
| Intelligence | +2.5% gold; +0.2% XP production; +0.2% XP gained | +2.4% damage with staves and wands (and Heal), +4 max mana (all points), +0.05 mana/s (all points) |
| Vitality | +2.5% food and wood | +0.5 armor; +3 max HP (all points) |
| Charisma | +2.5% gold and coal; +0.25% XP production; +0.25% XP gained; -0.5% tile cost (max 25%); +1 Luck | +0.5% crit damage; +0.5% crit chance (all points); +0.25 HP (all points) |

Sources: `CHARACTER_STAT_CONFIG`, `STAT_RULES`, `calculateStatResourceModifiers`, `calculateCombatStats`. Mana base is 20 (`STAT_RULES.mana`), so a new character has 40 mana.

## 3. Skills and classes

- Two skills, Heal (level 5) and Stun (level 10): numbers in [combat.md](combat.md) §3. Nothing else is learned or levelled.
- Four classes (warrior, paladin, ranger, mage) are cosmetic: a portrait and a name (`PLAYER_CLASSES`). No class gives a bonus.

## 4. Rebirth

Rules in `REBIRTH` (`src/config/rebirth.ts`), checked by `rebirthStatus` (`src/utils/game/rebirth.ts`), the one function the button, the dialog, the store and the server share.

- **Requirements**: castle level ≥ 6 (`minCastleLevel`), economy tile count ≥ `400 + 50 x rebirths already done` (`minTiles`, `tilesPerRebirth`), no castle upgrade running, and at least 1 Ember of gain.
- **Embers gained**:

```
base = floor(3 x (castle level - 5)^1.3 x (sqrt(tiles / 10) + 0.02 x max(0, tiles - tilesNeeded)))
gain = floor(base x (1 + 0.05 x Ancestral Tithe level))
```

(`REBIRTH.gain`, `emberGain`; `gainScale` 3, `castleExponent` 1.3, `surplusPerTile` 0.02.) Examples (computed, no Tithe): castle 6 with 400 tiles → 18; castle 6 / 450 → 23; castle 8 / 500 → 113; castle 10 / 500 → 220; castle 10 / 1,000 → 534; castle 10 / 450 with one rebirth done → 163.
- **Income bonus**: `1 + 0.1 x (Embers ever earned)^0.6`, folded into the income modifier on every resource (`emberIncomeBonus`). Spending Embers never lowers it. Examples: 10 earned → +40%, 22 → +64%, 47 → +101%, 76 → +134%, 170 → +218%, 500 → +416%.
- **What resets** (`rebirth` in `rebirthSlice.ts`): map (new start ring), resources, castle, animals, buildings, chests, monsters and any open fight, click level, farm upgrades, all merchant upgrades except Pack Rat, the bag and worn gear (back to the starter kit; Pack Rat bag size kept), loot pity, attributes (all points handed back to spend again), HP/mana refilled.
- **What is kept**: name, class, play time, gems, all Embers and shop levels, lifetime XP and level, the auto-sell setting, the merchant's shelf and its rotation clock and the refresh count (a rebirth is no free reshuffle).
- The server runs the rebirth first (`POST /api/rebirth`): it checks the stored save, wipes the ledger's inventory to the starter kit and pays at most its own computed gain; the browser takes the lower number (see [saves-and-server.md](saves-and-server.md)).
- Auto-battle unlocks after the first rebirth (`COMBAT.auto.minRebirths`).
- There is no +20 points per rebirth in the code (`totalStatPoints` takes no rebirth count).

## 5. Ember shop

`EMBER_UPGRADES` in `src/config/rebirth.ts`; level N+1 costs `ceil(baseCost x 1.4^N)` Embers (`emberUpgradeCost`); every upgrade has 10 levels.

| Id | Label | Base cost | Effect per level |
| --- | --- | --- | --- |
| thrift | Thrift | 2 | -2% tile and building cost (tiles share the 45% cap with Charisma and Bulk Discount; buildings take Thrift only) |
| builders | Master Builders | 3 | -5% castle build time |
| mastery | Click Mastery | 2 | +25% gold per click |
| provisions | Provisions | 2 | start every run with +1,500 gold, +400 wood, +400 stone |
| nightwatch | Night Watch | 2 | +1 hour of paid away time (base 8 h, hard cap 72 h) |
| steward | Steward | 3 | +5% income while away (base 50%, hard cap 100%) |

Shop levels are permanent: nothing refunds Embers. The save is valid only if `unspent + spent = earned` and `rebirths = 0` implies `earned = 0` (checked in `src/lib/sanitizeSave.ts`).

## 6. Limits that upgrades raise

`LIMITS` in `src/config/limits.ts` are base values; code reads them through `limitOf(key, ctx)` (`src/lib/limits.ts`), which adds the bonuses registered in `LIMIT_BONUSES` (today: Pack Rat → bag size; Night Watch and set bonuses → away hours; Steward and set bonuses → away efficiency). `HARD_LIMITS` is the most a save may hold.

| Limit | Base | Hard cap | Raised by |
| --- | --- | --- | --- |
| `monsterGrowthLevels` | 10 | 40 | nothing yet |
| `monsterGrowthIntervalSec` | 1,800 | n/a | nothing yet |
| `battleQueue` | 10 | 16 | nothing yet |
| `merchantOffers` | 6 | 12 | nothing yet |
| `merchantRotateSec` | 1,800 | n/a | nothing yet |
| `merchantRefreshBase` | 10,000 | n/a | nothing yet |
| `bagSize` | 36 | n/a | Pack Rat +4 per level |
| `offlineCapHours` | 8 | 72 | Night Watch +1 h per level, set bonus hours |
| `offlineEfficiency` | 0.5 | 1 | Steward +0.05 per level, set bonus points |
| `offlineMinGapSec` | 300 | n/a | nothing |

## 7. Gems

Premium currency, not part of `Resources`. Every player starts with 1,000 (`STARTING_GEMS`), a cap of 1e9 (`GEMS_CAP`), a rebirth keeps them, nothing spends them yet. The only gem source is the chest bonus roll ([economy.md](economy.md) §9). The server's ledger holds the real balance.
