# 24 · Battle queue (built)

Clicking another monster while a fight is open adds it to a **server-owned queue**; the server fights them one after the other. Built in the balancing pass; this page says how it works.

- **Where:** `CombatState.queue` (ticket numbers, first to fight first) in the ledger's `combat` record (`lib/offline/fightTypes.ts`); the engine is `lib/offline/fight.ts` (`queueTicket`, `engage`, `endFight`, `dismissTicket`, `restThrough`). Old rows without the field read as an empty queue (`supabaseLedger.ts`).
- **Commands:** the existing `fight` command joins the queue while a fight is open (or while the hero rests before the next queued fight) and leaves it when the monster is already queued; `unqueue` takes one out. The answer says `queued: 'queued' | 'removed' | 'full' | 'refused'`. No new request, no new route.
- **Size:** `LIMITS.battleQueue` = 3, ceiling `HARD_LIMITS.battleQueue` = 8, read through `limitOf('battleQueue')`.
- **Running it:** when no fight is open the queue's head starts first (it ignores the retry time and the win estimate: the player chose it), but only when HP is at least `COMBAT.auto.resumeHpPct`; below that the hero rests, like auto-battle. Gone or unplaced monsters are skipped. When the queue is empty, auto-battle goes on as before. The queue works before the first rebirth too.
- **Clearing:** kept after a win; cleared by a defeat, a timeout, Flee, a rebirth or an absence (`restThrough`); a dismissed monster leaves it.
- **Shown:** a gold number on each queued monster (`MonsterSprite`), the "Next (2/3)" strip with a × per entry (`CombatPanel`), the right-click entry "Add ... to the queue" / "Remove from the queue", toasts, a line in the Guide.
- **Tests:** `tests/battleQueue.test.ts` (engine), `tests/clientCombat.test.ts` (store).

## Still open

- Show the estimated win chance of each queued monster in the strip (the server already computes it for auto-battle, `offline/winChance.ts`).
- Should a defeat also switch Auto-battle off? (Today it only clears the queue.)
- Ember-shop or other raises of the queue size through `LIMIT_BONUSES`.
- Look at it in a real session; add a Playwright smoke test.
