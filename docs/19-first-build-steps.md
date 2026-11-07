# 19 · First build steps (built; what is left)

Both steps of this doc are built and their text is gone from here; the code and the tests are the record.

- **Step A, castle timers: built, and changed.** The balancing pass halved **all nine** timers (30 min, 2 h, 6 h, 12 h, 24 h, 1.5 d, 2 d, 2.5 d, 3.5 d, `CASTLE_UPGRADE.durationsSec`, pinned in `tests/castle.test.ts`) instead of the 1/3/9/16/36 h proposed here. A save in the middle of an upgrade is clamped to the new maximum by `repairSave.ts`.
- **Step B, one registry for resource keys: built.** A resource is one catalog entry with `stored: true` (`catalog/resources.ts`); `catalog/resourceKeys.ts` derives the key lists; `tests/catalog.test.ts` pins their order. Tier ladder labels t2-t4 exist and the header skips empty tiers.

## Still open

- **The first five castle costs x0.75** proposed here was never applied. With the halved timers the first rebirth of the `hardcore-rebirth6` bot comes on day 2.8 (the old target was day 5-7, [06](06-pacing-targets.md)), and between upgrades 5 and 6 the castle waits about 12 h for resources: the costs, not the timers, are the limit there. Decide with `npm run sim -- --seeds=3` whether the costs go **up** instead, and re-measure the human bot (its 7-8 day first run is limited by something other than income or timers; find out what).
- The pacing table in [06](06-pacing-targets.md) and the castle table in [02](02-mechanics.md) still show the old timers.
