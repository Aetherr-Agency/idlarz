# 24 · Battle queue (built)

Clicking another monster while a fight is open adds it to a **server-owned queue**; the server fights them one after the other. Built in the balancing pass; this page says how it works.

- **Where:** `CombatState.queue` (ticket numbers, first to fight first) in the ledger's `combat` record (`lib/offline/fightTypes.ts`); the engine is `lib/offline/fight.ts` (`queueTicket`, `engage`, `endFight`, `dismissTicket`, `restThrough`). Old rows without the field read as an empty queue (`supabaseLedger.ts`).
- **Commands:** the existing `fight` command joins the queue while a fight is open (or while the hero rests before the next queued fight) and leaves it when the monster is already queued; `unqueue` takes one out. The answer says `queued: 'queued' | 'removed' | 'full' | 'refused'`. No new request, no new route.
- **Size:** `LIMITS.battleQueue` = 10, ceiling `HARD_LIMITS.battleQueue` = 16, read through `limitOf('battleQueue')`.
- **Running it:** when no fight is open the queue's head starts first (it ignores the retry time and the win estimate: the player chose it), but only when HP is at least `COMBAT.auto.resumeHpPct`; below that the hero rests, like auto-battle. Gone or unplaced monsters are skipped. When the queue is empty, auto-battle goes on as before. The queue works before the first rebirth too.
- **Clearing:** kept after a win; cleared by a defeat, a timeout, Flee, a rebirth or an absence (`restThrough`); a dismissed monster leaves it.
- **Resting and polling:** while the hero rests before the queue's next monster the view says `resting` and `restSec`, and `nextPollSec` is the time until the HP is back above the resume line (with Auto-battle on or off). Before this the idle wait (up to 10 minutes) applied, so after a fight that left the hero under 80 % HP the next queued monster seemed never to start.
- **Rest countdown:** the server says how long the rest takes (`restSec`), not every second, so the browser stores `restEndsAt` (its own clock plus `restSec`) and counts down itself (`hooks/useRestCountdown.ts`). The open window (also while the result of the last fight is shown) has a "Resting before the next fight (Monster): N s" line under the queue strip; the minimized icon counts down too. The next poll comes about when the rest is over, and the queued fight starts by itself.
- **Minimized:** the icon shows the monster's level, its HP bar (red) above the hero's (green) and the queue under it (up to four monster icons, the next one framed, `+N` for the rest); while resting it shows the next monster dimmed with "Rest N s", in either window mode.
- **Shown:** a gold number on each queued monster (`MonsterSprite`), the "Next (2/3)" strip with a × per entry (`CombatPanel`), the right-click entry "Add ... to the queue" / "Remove from the queue", toasts, a line in the Guide.
- **Auto-battle switch:** the combat window shows the checkbox only once Auto-battle is unlocked (first rebirth); before that it is not drawn at all (no greyed-out switch). The right-click menu entry is still shown greyed.
- **Tests:** `tests/battleQueue.test.ts` (engine), `tests/clientCombat.test.ts` (store).

## Still open

- Show the estimated win chance of each queued monster in the strip (the server already computes it for auto-battle, `offline/winChance.ts`). **Decided 2026-11-07 (IDL-59): a coloured bucket (Safe 80 %+, Risky 50-79 %, Unlikely below 50 %) with the exact percent on hover.**
- Should a defeat also switch Auto-battle off? (Today it only clears the queue.) **Decided 2026-11-07 (IDL-59): no, it stays on; three defeats in a row pause it with a notice, one win resets the count (`COMBAT.auto.pauseAfterDefeats`).**
- Ember-shop or other raises of the queue size through `LIMIT_BONUSES`.
- Look at it in a real session; add a Playwright smoke test.
