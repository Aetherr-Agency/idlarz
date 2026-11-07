# 24 · Battle queue (built; design as written below, queue size 3)

The roadmap item BAL5 ([ROADMAP](ROADMAP.md)). Today a click on a monster starts a fight, and **while a fight is open further clicks are refused** (`startFight` in `stores/gameStore.ts` returns false when `combat.fight` is set; `engageTicket` in `lib/offline/fight.ts` returns false the same way). The queue lets the player keep clicking monsters during a fight; the server then fights them one after the other.

## 1. What exists

- The fight is the server's: `runCombat` brings `ledger.combat` (`CombatState`) up to now and applies `ask.commands`; a click is the command `{ kind: 'fight', n }` sent through `POST /api/fight` (`action: 'use'`) by `requestUse` with an idempotency key. The answer carries a `CombatView` and `accepted`.
- Between fights the engine's loop calls `engage(t)`: with **Auto-battle** on (locked until the first rebirth) it takes `pickTarget` (weakest placed monster that is winnable and not waiting out its `retryAt`), otherwise it rests.
- A monster that beat the player gets `retryAt[n]`; a win pays through `payKill` and removes the ticket; `dismissTicket` removes a ticket (and ends a fight against it); `restThrough` ends the fight after a real absence.
- The browser draws the fight in `CombatPanel` / `CombatWidget`, the monsters on tiles in `Tile.tsx` (`MapMonster`).

## 2. Design

**The queue is the server's.** `CombatState` gets `queue: number[]` (ticket numbers, in the order clicked). It lives in the ledger's `combat` JSON, so it survives a reload, is bounded, cannot be forged and costs **no new request**: a click during a fight is the same `fight` command, answered with `accepted: true` and the new queue in the view.

- **Add:** the `fight` command while a fight is open (or while the hero rests before the next queued fight) appends the ticket if it is placed, is not the fight's own monster, is not queued yet and the queue is not full. Otherwise `accepted: false` with a reason the toast shows ("Queue full", "Already queued").
- **Toggle off:** a click on an already queued monster removes it (`{ kind: 'unqueue', n }` is the explicit form used by the panel's × buttons).
- **Size:** `LIMITS.battleQueue` = 3, with a `HARD_LIMITS.battleQueue` of 8, read through `limitOf('battleQueue', ctx)` so Ember-shop or Ancestral-style raises come later without a save change ([ROADMAP](ROADMAP.md) principle "soft caps everywhere").
- **Run order:** when no fight is open, `engage(t)` first looks at the queue head. A head whose ticket is gone or not placed is dropped silently; a valid one starts a fight like a click (it ignores `retryAt` and the win-chance gate: the player chose it). After the queue is empty the existing auto-battle rules apply unchanged.
- **HP rule:** a queued fight starts only when HP is at least `COMBAT.auto.resumeHpPct` of the maximum, like auto-battle; below it the hero rests (the engine's idle loop already works out the rest time for auto-battle; the queue head counts as a target there too), so the queue never walks a weak hero into the next fight.
- **Stop rules:** the queue is **kept after a win**, **cleared on a defeat or a timeout** (the hero is at the knock-out HP and the plan failed), **cleared by Flee** (Flee already switches Auto-battle off), cleared by a rebirth or a new game (the combat record starts over), and by `restThrough` (a real absence ends every fight; tickets age while away). `dismissTicket` removes the dismissed ticket from the queue.
- **Auto-battle:** independent. With it on, the queue has priority and auto-battle resumes when the queue is empty. With it off (before the first rebirth) the queue is the way to chain fights, so it is **not** locked behind the rebirth.

**What the player sees**
- Tiles: a small numbered marker (1, 2, 3) on every queued monster, in the style of the growth bar (`MonsterSprite`), so the order is readable on the map.
- Fight window: a "Next" strip under the fight listing the queued monsters (name, level, an estimated win chance from `offline/winChance.ts` that the server already sends for the fight view, a × to remove one), hidden when the queue is empty.
- Click feedback: "Added to the queue (2/3)", "Queue full", "Already queued" toasts. The right-click menu on a monster gets "Add to queue" / "Remove from queue" while a fight is open.
- A queued monster is not protected: it keeps growing and it can still be fought first by a click once the fight is over, which simply moves it to the front (the click is a fresh `fight` command with no fight open and the old entry is removed).

## 3. Data and compatibility

- `CombatState.queue` is optional on read (`row.combat.queue ?? []`), so old ledger rows load as they are; written only by the server. No save (`SAVE_SCHEMA`) change, no SQL migration (`combat` is a JSON column).
- `CombatView` gains `queue: { n: number; type: MonsterType; level: number }[]` (what the browser draws; the numbers are derived from the tickets, so a stale entry cannot show). `FightReply.accepted` already exists; `queueResult?: 'queued' | 'removed' | 'full' | 'duplicate'` tells the toast what happened.
- The polling-write fix ([ROADMAP](ROADMAP.md) F2) already keeps idle polls from writing; a queue change is a real change and writes once.

## 4. Build order

1. **Engine** (`lib/offline/fight.ts`, `fightTypes.ts`, `config/limits.ts`): the field, the `fight`/`unqueue` commands while a fight is open, `engage` taking the queue first, the HP rule, the stop rules, `dismissTicket` and `restThrough`. Tests in `tests/fightEngine.test.ts` and `tests/offlineOnline.test.ts`: queue runs in order after wins; cap and duplicates; a defeat clears; flee clears; a dismissed or missing ticket is skipped; HP below the resume line waits; auto-battle resumes after an empty queue; a replayed request (same key) does not queue twice; old rows without `queue` load.
2. **View and store** (`lib/offline/types.ts`, `stores/gameStore.ts` `startFight`/`settleFight`): let `startFight` through during a fight (it returns the queue result), keep `combat.queue` in the store, toasts.
3. **UI**: tile markers, the "Next" strip in `CombatPanel`, the context-menu entries, a tutorial line in the Guide's fighting section.

## 5. Open questions

- Queue size 3 or 5 for the first release (3 proposed; Ember-shop raises later).
- Should a queued fight against a monster the win-chance estimate calls hopeless ask for a confirmation, or just show the red estimate? (Proposed: show the estimate, no confirmation.)
- Bosses: allowed in the queue (they have a clock; the HP rule protects the start). Proposed: yes.
- Does a defeat clear only the queue or also switch Auto-battle off? (Proposed: only the queue; Auto-battle keeps its own retry rules.)
