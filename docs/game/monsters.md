# Monsters

The roster, how a monster appears, grows and pays. Data: `MONSTERS`, `BIOME_TIER`, `BUILD` in `src/config/combatConfig.ts`; maths `src/lib/monsters.ts`; spawning `src/lib/offline/tickets.ts`, `placement.ts`, `spawnWeights.ts`; bands `src/config/distanceBands.ts`, `src/lib/distance.ts`; rewards `src/lib/loot/kill.ts`.

## 1. Roster

16 monsters in four biomes: three normal ones and a boss each. Plains, forest, swamp and tundra only; hills, coast and lake have none (a monster may only stand on a biome in its `spawn.biomes`).

Stats at level 1 (bosses at their `refLevel`), straight from `monsterStats` (`src/lib/monsters.ts`). Speed is attacks per second.

| Biome | Monster | Build | HP | Attack | Armor | Speed | Spawn level window (castle 1 → castle 10) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Plains | Thistle Boar | even | 100 | 4 | 0 | 0.5 | 1-3 → 8-10 |
| Plains | Burrow Badger | tough | 130 | 3 | 0 | 0.4 | 1-3 → 8-10 |
| Plains | Dust Strider | fierce | 80 | 5 | 0 | 0.6 | 1-3 → 8-10 |
| Plains | The Great Auroch (boss) | | 1,000 | 11 | 15 | 1/3 | 15-18 → 22-25 |
| Forest | Mossback Wolf | fierce | 128 | 8 | 1 | 0.6 | 4-6 → 12-14 |
| Forest | Bramble Imp | even | 160 | 6 | 1 | 0.5 | 4-6 → 12-14 |
| Forest | Rotcap Stag | tough | 208 | 5 | 1 | 0.4 | 4-6 → 12-14 |
| Forest | The Elder Stag (boss) | | 1,900 | 16 | 24 | 1/3 | 20-23 → 27-30 |
| Swamp | Garbage Ogre | tough | 286 | 6 | 2 | 0.4 | 8-10 → 16-18 |
| Swamp | Dumpback | even | 220 | 7 | 2 | 0.5 | 8-10 → 16-18 |
| Swamp | Rot Heron | fierce | 176 | 9 | 2 | 0.6 | 8-10 → 16-18 |
| Swamp | The Mire Matriarch (boss) | | 2,800 | 21 | 32 | 1/3 | 25-28 → 32-35 |
| Tundra | Frost Hare | fierce | 240 | 10 | 3 | 0.6 | 12-14 → 16-18 |
| Tundra | Icetusk Calf | tough | 390 | 6 | 3 | 0.4 | 12-14 → 16-18 |
| Tundra | Rime Wraith | elite | 600 | 12 | 11 | 0.45 | 12-14 → 16-18 |
| Tundra | The Winter Wyrm (boss) | | 7,000 | 36 | 58 | 1/3 | 30-33 → 37-40 |

- Builds (`BUILD`): even ×1 HP ×1 attack, speed 0.5; tough ×1.3 HP ×0.8 attack, 0.4; fierce ×0.8 HP ×1.25 attack, 0.6; elite ×2 HP ×1.5 attack, 0.45, +8 armor.
- Normal monsters never crit (`critChance` 0, `critMult` 1.5, no Stun resistance). Bosses: crit 8 / 9 / 10 / 13 %, Stun resistance 20 / 25 / 30 / 45 %, time limit 75 / 80 / 85 / 90 s, one hit every 3 s (`BIOME_TIER`).
- Tier numbers per biome (`BIOME_TIER`): plains HP 100 attack 4; forest 160 / 6; swamp 220 / 7; tundra 300 / 8.
- The ladder against gear: [generated/monster-ladder.md](../generated/monster-ladder.md).

## 2. Level scaling

A monster has an integer level. Stats follow `monsterStats`:

- **Normal** (`scaling: 'exp'`): `HP = round(hp x sqrt(1.5)^(level-1))`, `attack = round(attack x sqrt(1.25)^(level-1))`, `armor = armor + 0.5 x (level-1)`. A level 9 plains monster has 506 HP.
- **Boss** (`scaling: 'gear'`): HP and attack `x levelScale(level) / levelScale(refLevel)` (`1 + 0.07 x (level - 1)`, `src/catalog/stats.ts`); armor `+0.5` per level away from `refLevel`. The plains boss has 1,000 HP and 11 attack at level 15.
- Reference levels: plains 15, forest 20, swamp 25, tundra 30.

### Spawn level and growth

- **Spawn window** (`spawnLevelRange`): `min = max(1, min(cap - spread, base + floor(perCastleLevel x (castle level - 1))))`, `max = min(cap, min + spread)`. Plains normal: base 1, +1 per castle level, spread 2, cap 10; forest 4/+1/2/14; swamp 8/+1/2/18; tundra 12/+0.5/2/20. Bosses: base 15 / 20 / 25 / 30, +0.8 per castle level, spread 3, cap 25 / 30 / 35 / 40.
- The level is rolled from a generator seeded by the monster's ticket number only (`rollSpawnLevel`), plus a **danger bonus** of 1 level per 8 tiles of Chebyshev distance from the castle (`dangerBonus`, `COMBAT.spawn.dangerStep`). The per-band `dangerOffset` in `DISTANCE_BANDS` is 0 everywhere and unused.
- **Growth**: +1 level per 1,800 s on the map (`LIMITS.monsterGrowthIntervalSec`), at most +10 above the spawn level (`LIMITS.monsterGrowthLevels`, hard 40). The level is a function of age, `levelAtAge`. A monster whose spawn was capped for a weak player has a smaller `growCap`.

## 3. Where and when they appear (server)

- **Timers** (`COMBAT.spawn`, `advanceBank` in `src/lib/offline/tickets.ts`): the first normal monster 120 s after the run starts, then one per 900 s; one boss at a time, 10,800 s after the last one left (or after the start). The timers pause when the map has no room or no free tile for it.
- **Room**: monsters and chests together hold at most 30% of the free tiles, at least 2, at most 40 tickets (`ticketCap`, `SPAWN_LIMIT`, `TICKET_CAP`).
- **Tile** (`canSpawnOn`, `MonsterDef.spawn`): an owned tile whose biome is in the monster's list, Chebyshev distance from the castle 2 to 9 (`minCastleDistance`, `maxCastleDistance`), no building, no chest, no other monster, outside the castle ward from castle level 7. `minRebirths` exists in the rule but no monster uses it.
- **Which type** (`src/lib/offline/spawnWeights.ts`): each type is weighted by the player's win chance against it at the middle of its spawn window: full weight (1) for 40-95%, falling to 0.75 for a trivial monster (chance 1) and to 0.1 for a hopeless one (chance ≤ 5%); equal weights give the plain uniform pick. The spawn level is capped at the highest level the player still beats (never below the window's bottom) and so is its growth (`growCap`), for new spawns only. Bosses are never weighted or capped: among the boss types that still have a free tile the pick is uniform (`place` in `src/lib/offline/placement.ts`). Measured: [generated/spawn-mix.md](../generated/spawn-mix.md).
- **Golden (lucky) monsters**: chance `min(10%, 2% + 0.05% x Luck)` per new normal monster; a kill pays x3 gold, XP and hide and adds one guaranteed gear roll (`LUCK.luckyRat`). Bosses are never golden.
- **Distance bands** (`DISTANCE_BANDS`): home 1-6, outskirts 7-12, frontier 13-21, wilds 22+, read by `bandOf` (`src/lib/distance.ts`). No spawn rule reads them yet.

## 4. What a kill pays

`killIncome` in `src/lib/loot/kill.ts`, `MonsterDef.reward`:

```
goldBase = min(gold/s x rewardSec, goldCap) x levelMult^(level - refLevel)
gold     = floor(max(10, goldBase x (1 + 0.005 x Luck) x (1 + Gold Find%)) x (lucky ? 3 : 1) x (1 + Kill Rewards%))
xp       = max(5, min(xp/s x rewardSec, xpCap) x levelMult^(level - refLevel)) x (lucky ? 3 : 1) x (1 + Kill Rewards%)     (xp/s includes the XP gain %)
hide     = floor(hide/s x rewardSec x levelMult^(level - refLevel) x 0.6 x (lucky ? 3 : 1))
```

| Biome | rewardSec | Gold cap (level 1) | XP cap (level 1) |
| --- | --- | --- | --- |
| Plains | 90 | 300 | 42 |
| Forest | 110 | 600 | 85 |
| Swamp | 135 | 1,200 | 171 |
| Tundra | 190 | 2,400 | 342 |
| Boss (all) | 3,600 | 600,000 (at refLevel) | 45,000 (at refLevel) |

`levelMult` is 1.08 per level for normal monsters and 1.03 for bosses. Luck, Gold Find and Kill Rewards are applied after the cap, so pay can exceed it. Minimums: 10 gold, 5 XP (`COMBAT.rewards`). Items: [loot.md](loot.md). Measured share of income: [generated/kill-sim.md](../generated/kill-sim.md).
