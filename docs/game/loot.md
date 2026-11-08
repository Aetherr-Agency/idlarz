# Loot and items

One data-driven pipeline gives gear to every source (normal monsters, bosses, chests, the merchant's shelf). Data: `src/catalog/lootConfig.ts` (profiles, pools, sources), `src/catalog/rarity.ts`, `src/catalog/affixes.ts`, `src/catalog/stats.ts`, `src/catalog/sets.ts`, `src/catalog/items/*.ts`; code `src/lib/loot/*`. Item, affix, set and loot-source tables are generated: [generated/item-catalog.md](../generated/item-catalog.md) (`npm run catalog-report`); drop rates measured in [generated/loot-sim.md](../generated/loot-sim.md).

## 1. The pipeline (`generateLoot`, `src/lib/loot/generate.ts`)

```
source -> profile -> number of rolls -> source level -> item level -> eligible bases -> rarity -> base -> instance (quality, affixes)
                  -> then every bonus table of the profile (potions, legendary weapon)
```

1. **Source and profile** (`LOOT_SOURCES`): `monster` → `normal_monster`, `boss` → `boss`, `chest` → `basic_chest`, `merchant` → `merchant_stock`. A monster's `lootSourceId` picks `monster` or `boss`.
2. **Rolls** (`RollsDef`): the first `guaranteed` rolls always hit, the rest hit with `chancePerRoll + chancePerLevel x (monster level - 1)`; the general gear roll's chance is also multiplied by `1 + 0.002 x Luck` (`dropChanceMultiplier`). A golden monster adds one guaranteed roll.
3. **Source level**: a monster passes its own level; a chest and the shelf use `4 + 3 x (castle level - 1)` (`LOOT_SOURCES`, `resolveSourceLevel`). Never the player's level.
4. **Item level**: `source level + offset ± variance`, clamped to 1-100 (`rollItemLevel`).
5. **Eligible bases**: pool members whose item-level window contains the item level (`eligibleCandidates` in `src/lib/loot/pools.ts`).
6. **Rarity**: the profile's weights, minus rarities gated above the item level (`rarityLevelGate`), minus rarities with no eligible base; rarities of rank rare and above get their weight multiplied by `min(1.6, 1 + 0.004 x Luck)`; one weighted draw.
7. **Base** by `poolWeight`; **instance** `{ base, level, rarity, quality 0-100, affixes[] }`. Number of affixes comes from the rarity (table below); affixes are picked without replacement, one per stat group, respecting `minItemLevel` and tags (`rollAffixes`).
8. **Bonus tables** run after the gear rolls: `extra` adds, `fallback` only runs if no gear dropped, `replace` cancels the gear roll when it triggers. Pity counters (`profile:table`) add `perMiss` to the chance up to `maxBonus` and reset on a drop.

Nothing is silently substituted: an empty pool returns a `warning` and a per-roll `trace`.

## 2. Profiles

All in `LOOT_PROFILES` (`src/catalog/lootConfig.ts`).

| Profile | Gear rolls | Item level | Rarity weights (common / uncommon / rare / epic / legendary) | Rarity level gates | Bonus tables |
| --- | --- | --- | --- | --- | --- |
| `normal_monster` | 1 roll, chance 12% + 1% per monster level above 1 | monster level ± 1 | 70 / 22 / 7 / 1 / 0.2 | rare 3, epic 8, legendary 15 | potion (`potions_rat`): 25% + 1.5% per level; Minor 4 : Greater 1, Greater only from level 7 |
| `boss` | 1 guaranteed roll | boss level exactly | 20 / 30 / 30 / 15 / 5 | none | legendary weapon (`legendary_weapons`) 5% + 1% per miss up to +10%; all potions of `potions_king` (2 Minor, 1 Greater) |
| `basic_chest` | 1 roll, chance 82% | source level ± 1 | 62 / 24 / 9 / 4 / 1 | rare 3, epic 6, legendary 12 | legendary weapon 1.9% (replaces the gear roll); potion (`potions_chest`, Minor 60 : Greater 25) if no gear dropped |
| `merchant_stock` | 12 guaranteed rolls (the shelf keeps the first 6) | source level ± 2 | 60 / 40 / 0 / 0 / 0 | none | none |

Item level of a monster's drops is at most its monster level + 1 and at least 1. Loot source level ranges checked by `validateLootData`: monster 1-30, boss 15-45 (`LOOT_SOURCES`).

## 3. Items

### Rarities (`RARITIES`)

| Rarity | Rank | Affixes | Merchant pays at item level 1 |
| --- | --- | --- | --- |
| Common | 0 | 0 | 300 |
| Uncommon | 1 | 1 | 1,200 |
| Rare | 2 | 2-3 | 3,600 |
| Epic | 3 | 3-4 | 12,000 |
| Legendary | 4 | 4-5 | 45,000 |

`statMultiplier` is 1 for all rarities: rarity adds affixes, not a second multiplier.

### Stats and item level (`src/catalog/stats.ts`)

- Stats are derived, never stored. A base item is authored at the first level of its tier window; an instance of level `L` has `base stat x (1 + (levelScale(L) / levelScale(minLevel) - 1) x levelShare) x (1 + (quality - 50) / 50 x 0.08)`, rounded.
- `levelScale(L) = 1 + 0.07 x (L - 1)` (`POWER_PER_LEVEL`, max item level 100).
- `levelShare` (how much of the growth a stat follows): damage, armor, max HP 1; max mana 0.7; regen 0.6; luck, gold find, mana regen 0.5; spell power 0.4; crit chance, super crit, dodge, life leech 0.3.
- Stats an item can carry: damage, armor, max HP, crit chance %, super crit %, HP regen /s, luck, gold find %, dodge %, max mana, mana regen /s, spell power %, life leech %. Base values per tier: `STAT_BASE_BY_TIER`.
- Set-only stats (no item rolls them): damage %, max HP %, income %, XP %, kill rewards %, away income, away time hours, click gold % (`STAT_DEFS` with `setOnly`).
- Affixes (`AFFIXES`): a prefix and a suffix for each of damage, armor, max HP, crit chance, super crit (item level 6+), dodge, gold find, luck, regen, max mana, mana regen, spell power, life leech (item level 5+). Value = `STAT_BASE_BY_TIER[stat][0] x levelFactor x power x roll range`. Full list: [generated/item-catalog.md](../generated/item-catalog.md#affixes).
- Weapon attack speeds by type: see [combat.md](combat.md) §1.

### Value

`sellValueOf` (`src/lib/itemInstance.ts`) = `rarity value x valueCurve(level) x qualityValue(quality) x affixesValue(rolls)`, at least 1. `valueCurve` = `1.3^(min(level,10)-1) x 1.12^max(0,level-10)`; `qualityValue` 0.75 to 1.25; each affix adds `0.15 + 0.35 x roll/100` to the multiplier (`ITEM_VALUE`). Potions have flat prices from the catalog. The merchant's shelf price is `ceil(sell value x 5)`.

### Families and sets

- Plain loot families (`src/catalog/items/`): wood/leather, apprentice cloth, steel; the Obsidian set; three legendary weapons; potions; `reuse.ts` holds disabled items that never drop or sell (`enabled: false`). Lists and stats: [generated/item-catalog.md](../generated/item-catalog.md).
- One set exists in `SET_DEFS` (`src/catalog/sets.ts`): **Obsidian** (2/4/6/9/12 pieces; up to +26% income, +25% XP, +37% kill rewards, +30 gold find, +15 points away income, +3 h away time, +10% click gold). Bonuses are fixed amounts that do not follow item level; every threshold reached applies and they add up. The economy ones are derived from the worn gear on the server (`src/lib/gearEconomy.ts`).
- Starter kit: Wooden Sword, Wooden Shield, 2 potions (`rebirthKit` in `src/lib/inventory.ts` is the same kit).

## 4. What happens to a drop (server)

`payKill` → `receiveInto` (`src/lib/offline/reward.ts`, `inventory.ts`, `src/lib/loot/receive.ts`):

1. Gear at or below the auto-sell rarity (`autoSellUpTo`) is sold at once for its sell value with Haggler.
2. The rest goes into the ledger's bag (36 slots + 4 per Pack Rat level, `LIMITS.bagSize`).
3. Gear that does not fit becomes gold at its plain sell value; potion overflow becomes gold at the potion's sell value.
4. Gold from sold or converted drops is added to the server's `granted` totals so the next save passes the checks.

The roll is sealed on the run's kill counter, so a reload cannot reroll it (see [saves-and-server.md](saves-and-server.md)).

## 5. Chest items

A chest's `item` reward (weight 8 of 105) is one roll of the `chest` source: gear 82%, else a potion; 1.9% a legendary weapon instead. Full chest contents: [economy.md](economy.md) §9.
