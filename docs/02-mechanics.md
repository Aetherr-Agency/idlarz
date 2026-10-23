# 02 · Mechanics

Exact rules as implemented. Formulas are only summarised here; the full derivations and tables are in [03](03-formulas-and-scaling.md).

## 1. The loop in one paragraph

You start with a castle on a 50×50 map and 125 gold. Gold (and passive XP) trickle in per second; you spend gold on **adjacent unexplored tiles**, each of which becomes a random biome (or one you pick) that adds resource income. XP from buying tiles and passive XP raises your **level**; each level gives one **stat point** that boosts specific resource modifiers. Resources other than gold are spent on **castle upgrades** (big global multiplier) and on **farm animals** (meat), or sold to the **merchant** for gold. You can also **click anywhere** for bonus gold and collect random **chests**.

## 2. Map & buying tiles

- Grid: `GRID_SIZE × GRID_HEIGHT = 50 × 50` (`gameConfig.ts:41-42`), castle at `(25, 25)` (owned from the start). Tile size 48 px; drag to pan.
- A tile can be bought only if it is **4-neighbour adjacent** to an owned tile (`gameStore.ts` `buyTile`). Non-adjacent tiles are drawn as dark checker cells; adjacent ones show ❔ and a hover card with the cost.
- Cost: see [03 §1](03-formulas-and-scaling.md#1-tile-cost) — exponential in the number of owned tiles (castle counts). It depends only on the *count*, never on the tile's position or biome. Charisma gives a discount (0.5 %/point, max 25 %).
- Not enough gold → the tile shakes and plays the `wrong` sound. Success → `purchase` sound, `+XP`, `+100 reputation`.
- **Biome assignment**
  - Normal purchase: uniformly random among the 7 non-special biomes (`forest, plains, hills, swamp, tundra, lake, grounds` — `castle` and `empty` are excluded).
  - **Pick-your-biome purchase**: when the number of owned tiles *before* the purchase satisfies `owned % 4 === 3` (owned = 3, 7, 11, 15 … i.e. the 3rd, 7th, 11th … tile you buy, because the castle counts as owned), buying opens a biome picker. **Gold is not charged until you choose**; Cancel (or backdrop click) costs nothing. The hover card says "N tiles until manual selection".
  - The in-game tutorial says "every 4th purchase"; the real cadence is every 4th *owned count* as above.
- Name prompt: when exactly **2 tiles** are owned and the name is still `Explorer`, the game asks for a name (max 9 chars) and shows a long tutorial (its numbers were corrected in the quick-win pass, [04](04-unfinished-and-known-issues.md)).

## 3. Biomes & resource generation

Per-second base output of one owned tile (before adjacency and modifiers):

| Biome | gold | wood | stone | coal | food | xp | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Castle 🏰 (unique, start) | see §5 | | | | | | effective values differ from the config table |
| Grounds 🛠️ | 0.05 | 0.05 | | | | 0.15 | can host one building (§6) |
| Forest 🌲 | 0.1 | 0.3 | | | | | |
| Plains 🌾 | 0.1 | | | | 0.3 | | each owned Plains tile also gives **+5 % meat modifier** |
| Hills ⛰️ | 0.05 | | 0.3 | 0.2 | | | |
| Swamp 🌿 | | 0.2 | | | 0.1 | | |
| Tundra ❄️ | 0.1 | | | 0.35 | | | |
| Lake 💧 | 0.05 | | | | 0.25 | | |

- **Adjacency bonus**: for each of the 4 neighbours that is owned **and the same biome**, the tile's output (biome *and* its building) is multiplied by `1 + 0.25·count` (`ADJACENCY_BONUS = 0.25`, `SCALING_CONFIG.adjacencyBonus`). Four same-biome neighbours = ×2. This is the only spatial strategy in the game.
- Global base income: `BASE_GENERATION_RATES` = **0.1 gold/s** and **0.25 xp/s** flow in regardless of tiles.
- Total income of a resource = `base × (1 + modifiers)` where modifiers come from the castle level, character stats and (for meat) Plains tiles — [03 §3](03-formulas-and-scaling.md#3-resource-rate-pipeline).
- `meat` is never produced by tiles — only by farm animals.

## 4. Resources

| Resource | Source | Uses |
| --- | --- | --- |
| 💰 Gold | base, tiles, click, chests, selling | tiles, castle upgrade, merchant purchases, click-multiplier upgrade |
| 🪓 Wood, 🧱 Stone, ⚫ Coal | tiles, buildings, buying | castle upgrades; sell |
| 🌾 Food | tiles, buildings | farm animals, castle upgrades from level 3; sell |
| 🥩 Meat | farm animals | castle upgrades from level 3; sell (best price) |
| ✨ XP | base 0.25/s, castle 0.5/s, Grounds, Workshop, tile purchases | levels |

Header shows every resource except XP (XP is shown as the level bar).

## 5. Castle

- Single castle, always level 1 at the start, **max level 6** (`CASTLE_UPGRADE.maxLevel`). Click the castle tile → upgrade dialog.
- Upgrading costs the resources listed per level (`CASTLE_UPGRADE.upgradeCosts`; first five rows used — [03 §4](03-formulas-and-scaling.md#4-castle)). Cost is paid in full from the stockpile.
- Effect of level L: **adds `0.2 × 2^(L−1)` to the modifier of every resource** (+20 %, +40 %, +80 %, +160 %, +320 %, +640 %). It does *not* change base rates.
- Castle's own base output: effectively **0.1 gold, 0.05 wood, 0.05 food, 0.5 xp, 0.1 stone** per second (`CASTLE_BASE_RATES` overrides the matching `BIOMES.castle` entries; stone comes from the biome table because `CASTLE_BASE_RATES.stone` is 0). The biome table's other castle numbers (0.2 gold, 0.1 wood, 0.1 food, 1.0 xp) are therefore dead — see [04](04-unfinished-and-known-issues.md) D3.
- `CASTLE_UPGRADE.xpBonus` ("+0.5 XP/s flat per castle level") is **not implemented** (D2); the dialog no longer advertises it.

## 6. Grounds & buildings

- Buying a **Grounds** tile gives a plot. Clicking an owned, un-upgraded Grounds tile opens the building picker.
- Choosing a building is **free, instant and permanent** (no cost, no removal, no swap): the tile gets `level: 2` and `building`.
- A building adds its output to the tile's own (Grounds) output and benefits from the Grounds adjacency multiplier:

| Building | Output /s |
| --- | --- |
| Farm 🌱 | food 0.2 |
| Mine ⚫ | stone 0.2, coal 0.2 |
| Lumber Mill 🪓 | wood 0.2 |
| Market 🏪 | gold 0.2 |
| Blacksmith 🔨 | stone, coal, gold, food, wood 0.1 each |
| Workshop 🏭 | xp 0.2 |

Because buildings cost nothing, there is no decision beyond "which resource do I need" — the Blacksmith (0.5 total) is strictly the biggest raw yield.

## 7. Farm (meat)

- Opened with the 🌾 header button. Four animals; each can be bought repeatedly ("level" = times bought).
- Cost is paid in **food**; production is meat/s. See [03 §5](03-formulas-and-scaling.md#5-farm-animals) for formulas and the payback table.
- Meat income = `Σ animal production × (1 + castle modifier + 0.05 × plains tiles)` (stat modifiers do not touch meat).
- Meat is the best thing to sell (15 gold each vs 0.75 for food) — the farm is the main late-game gold engine and a major balance outlier (05).

## 8. Merchant (💰 header button)

Five tabs; only the first two work.

- **Sell Resources**: wood 0.5, stone 0.5, coal 1, food 0.75, meat 15 gold per unit; slider or "sell all"; `floor(amount × price)`. Gold and XP cannot be sold.
- **Buy Goods**: resource packs at **2× the sell price** (`floor(amount × price × 2)`), slider limited by gold. Also the **Gold Click Multiplier** ladder: 2× → 4× (250 K gold) → 8× (500 K) → 16× (2 M), max 16×.
- **Upgrade Items / Quests / Gambling**: placeholder screens ("Coming soon").
- Opening the Merchant closes the Character and Statistics windows.

## 9. Clicking for gold

`ResourceDisplay` registers a **global `window` click listener**. *Every* click anywhere on the page (map, buttons, dialogs) adds `total gold/s × clickMultiplier` gold (no cooldown, nothing at 0 income) and spawns a floating "+N 💰" by the gold counter. Starting multiplier 2. Consequently active play is far stronger than idle play, and the click multiplier scales linearly with your income.

## 10. Chests

- Timer `chestSpawnTimer` advances every tick. When it reaches **600 s** *and* fewer than **5** chests exist, it resets to 0 and a chest appears on a random owned, non-castle tile without one (💰 icon, amber border).
- If 5 chests already exist the timer **keeps growing** (it is not reset), so collecting one makes the next one spawn on the very next tick.
- Click the tile to collect: reward `floor(total gold/s × random whole seconds in [300, 3000])` — i.e. between 5 and 50 minutes of current income — shown in a 3 s toast. Collection does not consume the click for the gold-click bonus (the global listener still fires).
- Chests persist in the save (they live on tiles). The dev panel has "Spawn Chest".

## 11. XP, levels and stat points

- XP sources: passive `total.xp/s × (1 + xpGainMultiplier/100)` per second, and a lump on each tile purchase `calculateXpGain(newOwned) × (1 + xpGainMultiplier/100)`.
- Level N → N+1 needs `floor(750 × 1.3^(N−1))` XP ([03 §2](03-formulas-and-scaling.md#2-xp-and-levels)). Hovering the % in the level ring shows an ETA.
- Each level gained grants **1 stat point** (awarded by `tick`; bought-tile level-ups now also award it after the fix in 04).
- Level-up shows a notification and plays a fanfare (the Statistics overlay owns the sound listener).

## 12. Character stats

Five base stats, all starting at 5. Spend points in the Statistics overlay (header avatar).

| Stat | Resource modifiers per point | Other derived (display only unless noted) |
| --- | --- | --- |
| Strength | stone +2.5 %, coal +2.5 % | physicalAtk +1, def +0.5, critDmg +1 % |
| Dexterity | wood +2.5 %, food +2.5 % | def +1, atkSpeed +0.25, critChance +0.25 %, critDmg +0.5 % |
| Intelligence | gold +2.5 %, **xp +0.2 %** (modifier) | magicAtk +1, magicDef +1, mp +2, **xpGainMultiplier +0.2** |
| Vitality | wood +2.5 %, food +2.5 % | hp +3, def +0.5, magicDef +0.5 |
| Charisma | gold +2.5 %, coal +2.5 %, **xp +0.25 %** (modifier) | hp/def/magicDef +0.25, luck +1, crit +0.5, **xpGainMultiplier +0.25**, **tileCostDiscount +0.5 %** (cap 25 %) |

Only the bold/modifier effects change gameplay. HP, MP, ATK, DEF, crit, luck, atk speed and reputation exist but nothing consumes them yet. XP benefits from stats **twice** (once as a resource modifier, once as `xpGainMultiplier`). (The Charisma tooltip previously said 0.1 %/point; it now matches the code: 0.5 %/point, capped at 25 % at 50 points.)

## 13. UI surfaces

Header (avatar → Statistics, ⚔️ Character, 💰 Merchant, 🌾 Farm; resource counters with tooltips of base/modifier/total) · Map · Tile hover cards · Castle dialog · Building dialog · Biome picker · Level-up toast · Chest toast · Loading screen (2.5 s) · Name prompt/tutorial · dev-only debug panel (+100 K of each resource, spawn chest, reset name).

> There is no in-game way to reset a save: `ResetGameDialog.tsx` (a "Reset Game (Testing)" button that clears localStorage) exists but is not mounted anywhere. Clear site data in the browser to start over.
