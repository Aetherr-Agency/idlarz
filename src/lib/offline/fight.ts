import { COMBAT } from '@/config/combatConfig';
import { ITEM_CATALOG } from '@/catalog';
import { autoBattleUnlocked } from '@/lib/combat';
import { combatOf, EPS, type CombatEnv, type FightCtx } from '@/lib/offline/fightContext';
import { engage, queueHasTarget } from '@/lib/offline/fightTargets';
import { applyCommand, endFight, fightStep, idleStep } from '@/lib/offline/fightSteps';
import { COSMETIC_EVENTS, freshCooldowns, type CombatCommand, type CombatState, type QueueResult } from '@/lib/offline/fightTypes';
import type { Ledger } from '@/lib/offline/ledger';
import { playerProfile } from '@/lib/offline/profile';
import { inventoryFromCore } from '@/lib/offline/inventory';
import { takeMonster } from '@/lib/offline/tickets';

// SERVER ONLY. The fight engine. Combat is a pure function of the player's saved strength, the monster's ticket and a sealed random
// stream, stepped in fixed ticks (COMBAT.tickSec): the player swings at the weapon's attack speed, the monster at its own, and
// cooldowns, mana and stun run on the same clock. There is no server process ticking in the background: every request fast-forwards
// the player's combat from where it stopped to the server clock (at most COMBAT.maxCatchUpSec of fighting), so a missed poll loses nothing
// and nobody can speed a fight up by asking more often.
//
// This file is the orchestrator and the public face; the parts live next to it (IDL-16), each importing only the ones before it:
//   fightContext  the request's environment and working state, the event log, the sealed random stream
//   fightProfile  the numbers a fight is judged on: the player's profile, the resume line, the win estimate, how a fight starts
//   fightTargets  who is fought next: placed monsters, auto-battle's pick, the battle queue, the wait between fights
//   fightSteps    what happens in a fight, tick by tick: swings, skills, potions, the end of a fight, commands
//   fightView     the picture the browser is given
// tests/combat/goldenFight.test.ts pins the whole engine to recorded fights: a change to any of them that moves a number there changes the game.

export type { CombatEnv } from '@/lib/offline/fightContext';
export { combatView } from '@/lib/offline/fightView';

export interface CombatTotals {
	ledger: Ledger;
	behind: boolean;
	/** What the last `fight` or `unqueue` command did to the queue (left out when there was none) */
	queued?: QueueResult;
}

/**
 * Brings the player's combat up to `env.nowSec`, then applies what the player asked for (switches, hotkeys) and starts the next fight when
 * auto-battle allows. Returns the new ledger. All events are in `ledger.combat.log`.
 */
export const runCombat = (
	input: Ledger,
	env: CombatEnv,
	ask: { commands?: CombatCommand[]; autoBattle?: boolean; autoUse?: boolean; ack?: number } = {},
): CombatTotals => {
	// the bag is the ledger's (the engine tests and the sim build a ledger from a core: the inventory is read from it then)
	const ledger: Ledger = input.inv ? input : { ...input, inv: inventoryFromCore(env.stored.core) };
	const base = combatOf(ledger, env);
	// what the browser has told us it applied (its `since`) is not kept: only cosmetic events are ever dropped unacknowledged
	const log = ask.ack === undefined ? [...base.log] : base.log.filter((event) => COSMETIC_EVENTS.has(event.kind) || event.no > ask.ack!);
	const c: CombatState = { ...base, cd: { ...base.cd }, log, fight: base.fight ? { ...base.fight } : null, queue: [...(base.queue ?? [])] };
	const ctx: FightCtx = {
		env,
		c,
		ledger,
		profileNow: playerProfile(env.stored.core),
		potionIds: Object.keys(ITEM_CATALOG).filter((id) => ITEM_CATALOG[id].consumable?.healHp),
	};
	let queued: QueueResult | undefined;
	// auto-battle is locked until the first rebirth: a save that has it on from before (or a request for it) does not get it
	const autoAllowed = autoBattleUnlocked(ledger.rebirths);
	if (!autoAllowed) c.autoBattle = false;

	// ---- fast-forward to now ----
	const now = env.nowSec;
	let t = Math.min(c.at, now);
	let budget = COMBAT.maxCatchUpSec;
	let behind = false;
	for (let guard = 0; t < now - EPS && guard < 200000; guard++) {
		if (!c.fight) {
			if (engage(ctx, t)) continue;
			// nothing to fight yet: rest until something can change
			t += idleStep(ctx, t, now);
			continue;
		}
		const dt = Math.min(COMBAT.tickSec, now - t);
		t += dt;
		fightStep(ctx, t, dt);
		budget -= dt;
		if (budget <= 0 && t < now - EPS) {
			behind = true;
			break;
		}
	}
	c.at = t;

	// ---- what the player asked for, at the clock's time ----
	if (ask.autoUse !== undefined) c.autoUse = ask.autoUse;
	if (ask.autoBattle !== undefined) {
		c.autoBattle = ask.autoBattle && autoAllowed;
		if (!ask.autoBattle && c.fight) endFight(ctx, t, 'retreat');
	}
	for (const command of ask.commands ?? []) {
		const result = applyCommand(ctx, t, command, behind);
		if (result) queued = result;
	}
	if (!behind && !c.fight) engage(ctx, t);

	// a retry time only matters for a monster that is still there
	const standing = new Set([...ctx.ledger.bank.rats.map((ticket) => ticket.n), ...(ctx.ledger.bank.king ? [ctx.ledger.bank.king.n] : [])].map(String));
	c.retryAt = Object.fromEntries(Object.entries(c.retryAt).filter(([n]) => standing.has(n)));

	// a queued monster must still be there
	queueHasTarget(ctx);

	return { ledger: { ...ctx.ledger, combat: c }, behind, ...(queued ? { queued } : {}) };
};

/** Takes a monster off the map without a fight (a monster that cannot be beaten, or that is in the way). Ends the fight against it. */
export const dismissTicket = (ledger: Ledger, env: CombatEnv, n: number): { ledger: Ledger; ok: boolean } => {
	const taken = takeMonster(ledger.bank, n);
	if (!taken) return { ledger, ok: false };
	const base = combatOf(ledger, env);
	const combat = { ...base, fight: base.fight?.n === n ? null : base.fight, queue: (base.queue ?? []).filter((queuedN) => queuedN !== n) };
	return { ledger: { ...ledger, bank: taken.bank, combat }, ok: true };
};

/** After an absence the player is back on their feet: HP and mana refilled by resting for `gapSec`, no fight open, cooldowns over. */
export const restThrough = (ledger: Ledger, env: CombatEnv, gapSec: number): Ledger => {
	const base = combatOf(ledger, env);
	const p = playerProfile(env.stored.core);
	const rest = Math.max(0, gapSec);
	const combat: CombatState = {
		...base,
		at: env.nowSec,
		hp: Math.min(p.maxHp, base.hp + (COMBAT.regenPerSec + p.hpRegen) * rest),
		mp: Math.min(p.maxMp, base.mp + p.mpRegen * rest),
		cd: freshCooldowns(),
		fight: null,
		queue: [],
	};
	return { ...ledger, combat };
};
