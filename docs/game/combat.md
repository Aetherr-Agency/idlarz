# Combat

Fights run on the server. The browser only asks for a fight and draws the answer. Read from `src/config/combatConfig.ts` (`COMBAT`, `STAT_RULES`), `src/lib/combat.ts` (pure rules), `src/lib/offline/fight*.ts` (engine), `src/lib/offline/winChance.ts`, `src/catalog/skills.ts`, `src/lib/skills.ts`. Monsters and their numbers: [monsters.md](monsters.md). Drops: [loot.md](loot.md).

## 1. The player's numbers

Everything a fight needs is frozen into a `PlayerProfile` when the fight starts (`playerProfile` in `src/lib/offline/profile.ts`, built from the last accepted save and the ledger's gear).

| Number | Formula | Source |
| --- | --- | --- |
| Max HP | `round((85 + 3 x Vitality + 0.25 x Charisma + gear Max HP) x (1 + set Max HP% / 100))`, 101 for a new character | `maxHp` in `src/lib/combat.ts`, `COMBAT.baseHp`, `calculateCombatStats` |
| Damage per hit | `max(1, round1(gear damage x (1 + attribute% / 100 + merchant% / 100) x (1 + set damage% / 100)))` | `damagePerHit` |
| Attribute damage % | Strength: 2% per point above 5 (physical weapons, bare hands). Intelligence: 2.4% per point above 5 (staff, wand) | `STAT_RULES`, `src/lib/statBonuses.ts` |
| Attacks per second | `weapon speed x (1 + (0.25% x (Dexterity - 5) + Quick Hands%) / 100)`, 1 bare-handed | `attacksPerSecond`; speeds in `WEAPON_ATTACK_SPEED` (`src/catalog/weapons.ts`): dagger 1.6, wand 1.3, sword 1.2, spear 1.1, bow 1, axe 1, staff 0.9, crossbow 0.8, mace 0.8, maul 0.6 |
| Crit chance | `0.25 x Dexterity + 0.5 x Charisma + gear + Keen Eye`, capped at 75% | `critOdds`, `COMBAT.crit.maxCritChance` |
| Super-crit chance | `5% + gear Super Crit + Deadly Aim`, capped at 50% (rolled only when a hit already crit) | `COMBAT.crit` |
| Crit multipliers | crit x2, super crit x5, each times `1 + (Str-5 x 1 + Dex-5 x 0.5 + Cha-5 x 0.5) / 100` | `swing`, `critDamagePercent` |
| Armor | gear armor + 0.5 x (Dex-5) + 0.5 x (Vit-5) + 0.25 x (Str-5) | `armorOf`, `statArmor` |
| Dodge | gear Dodge, capped at 40% | `dodgeChance`, `COMBAT.maxDodge` |
| Life leech | gear + Vampiric Fang, capped at 15% of damage dealt | `lifeLeechPercent`, `STAT_RULES.lifeLeechCap` |
| HP regen | 1 HP/s with no fight open (`COMBAT.regenPerSec`); during a fight only gear Regen + Second Wind | `regen`, `fightStep` |
| Mana | max `20 + 4 x Intelligence + gear`; regen `0.5 + 0.05 x Intelligence + gear` per second | `STAT_RULES.mana`, `maxMana`, `manaRegenPerSec` |

Armor reduction (`armorReduction`): `r = armor / (armor + 40)`; up to 50% it is `r`, above that every extra point counts half: `0.5 + (r - 0.5) x 0.5`, so the ceiling is 75% (`COMBAT.armorK`, `armorSoftCap`, `armorSoftSlope`). A monster hit does `max(1, round(attack x (1 - reduction)))` (`mitigate`).

## 2. A fight

`runCombat` in `src/lib/offline/fight.ts` fast-forwards the player's combat to the server clock in 0.1 s ticks (`COMBAT.tickSec`) on every request; at most 120 s of fighting per request (`maxCatchUpSec`), then it reports `behind`.

Per tick (`fightStep` in `src/lib/offline/fightSteps.ts`):

1. HP and mana regenerate, cooldowns run, the boss clock runs, auto-use may act.
2. Player swings every `1 / attacks per second`. A swing rolls crit, then super crit (`swing` in `src/lib/combat.ts`; two random numbers at most). Damage to the monster is `max(1, round1(hit x (1 - armorReduction(monster armor))))`. Life leech heals `damage x leech%`.
3. If the monster is dead the kill is paid (`payKill`, see [loot.md](loot.md)) and the fight closes.
4. The monster swings every `1 / attackSpeed` (a stunned monster's timer does not advance). Dodge is rolled first; a monster crit uses its `critChance` and `critMult` (1.5).
5. At 0 HP the fight ends `defeated`: HP set to 30% of max (`knockoutHpFraction`). If the boss clock reaches 0, or a fight lasts 180 s (`maxFightSec`), it ends `timeout`. Neither costs anything; the monster stays (see retry below). `retreat` (switching auto-battle off) also keeps it.

The random stream is sealed per swing (`rngFor` in `src/lib/offline/fightContext.ts`), so a fight is a pure function of profile, ticket and secret. `tests/combat/goldenFight.test.ts` pins the engine to recorded fights.

### Starting a fight

- **Click** on a monster (`CombatCommand` `fight`): fights it at once whatever the HP, the retry time, and with auto-battle on or off. Refused with a fight open (it queues instead), at 0 HP, or while the server is `behind`.
- **Auto-battle** (switch, default off, locked until the first rebirth: `COMBAT.auto.minRebirths` = 1; `autoBattleUnlocked`): when HP is at least 80% of max (`resumeHpPct`), the server picks the next placed monster: weakest level first (`engageOrder`), normal monsters before a boss, skipping any monster whose win chance is below 0.5 (`minWinChance`) or whose retry time has not passed. A monster that beat the player (or timed out) waits 300 s (a boss 600 s) (`retryCooldownSec`, `bossRetryCooldownSec`). Source: `pickTarget`, `engage` in `src/lib/offline/fightTargets.ts`.
- **Battle queue**: a click on another monster while a fight is open (or while resting for the next queued one) queues it; clicking it again removes it. Size `LIMITS.battleQueue` = 10 (hard 16). The queue's head starts as soon as HP is back at 80%, ignoring retry time and win estimate; it works before the first rebirth; it is cleared by a defeat, timeout, retreat, rebirth or an absence, kept by a win. Source: `queueTicket`, `engage`, `endFight`.
- **Dismiss** removes a monster for good (no loot), not allowed for the monster being fought (`dismissTicket`).

### Win chance

`estimateWin` in `src/lib/offline/winChance.ts`: closed form from the frozen profile and `monsterStats`.

```
killSec    = monster HP / (attacks/s x expectedHit)           expectedHit: crits and super crits weighted, monster armor applied
surviveSec = (HP + potions that fit between cooldowns) / (monster dps - regen - leech)
chance     = min(logistic(6 x ln(surviveSec / killSec)), logistic(6 x ln(limit / killSec)))
```

`limit` = min(180 s, the boss's own clock). If `killSec > limit` the chance is 0. The same estimate weights new spawns (see [monsters.md](monsters.md)).

## 3. Potions, skills, auto-use

- Potions (`healHp` in the item catalog): Minor Healing 35 HP, Greater Healing 90 HP; they work in and out of fights, share an 8 s cooldown inside a fight (`COMBAT.potionCooldownSec`), cannot be drunk at full HP. Hotkeys 1-3 are requests the server checks.
- Skills (`SKILLS` in `src/catalog/skills.ts`), mana spent on cast, cooldown after:

| Skill | Unlock level | Mana | Cooldown | Effect |
| --- | --- | --- | --- | --- |
| Heal | 5 | 20 | 12 s | restores `25% of max HP x (1 + magic damage% / 100) x (1 + Spell Power / 100)`, in or out of a fight (`healAmount` in `src/lib/skills.ts`) |
| Stun | 10 | 15 | 30 s | freezes the monster's attack timer for 10 s; fights only; the monster's `stunResist` % can make it fail (mana and cooldown still spent) |

- **Auto-use** (switch, default on; a fixed preset in `COMBAT.auto`, `autoUse` in `fightSteps.ts`): a potion below 40% HP (best fit for the missing HP), Heal below 50%, Stun whenever it is ready.

## 4. Results and rest

- After a win the fight closes and the result stays in the event log until the browser acknowledges it; the window shows it `victoryToastSec` = 15 s.
- A real absence (the gap since the server last saw the player is more than `UNCLAIMED_SEC` = 900 s, `src/lib/offline/service.ts`) rests the hero: HP/mana regenerated by the gap, cooldowns cleared, no fight open, queue cleared (`restThrough`).
- The ledger's `combat` record holds HP, mana, cooldowns, the open fight, switches, retry times and the numbered event log (`CombatState` in `src/lib/offline/fightTypes.ts`).
- Polling: 2 s with the combat panel open, 8 s minimised or hidden (`COMBAT.poll`), or whatever `nextPollSec` the server says.

## 5. Measured balance

`npm run fight-sim` and `npm run monster-ladder` print which gear beats which monster: [generated/fight-sim.md](../generated/fight-sim.md), [generated/monster-ladder.md](../generated/monster-ladder.md). `tests/combat/fightBalance.test.ts` pins the plains boss tuning.
