-- rebirth_history: one row per rebirth a player did (the Rebirths tab of the Character window).
-- Run ONCE on a project that already has the offline_ledger schema, BEFORE deploying the code that writes it. Additive and idempotent.
-- Written ONLY by the server (service role) when an accepted save shows a higher rebirth count; the numbers are the last accepted save of
-- the run that ended (never numbers the client sends). A player may read their own rows and nothing else.
create table if not exists public.rebirth_history (
  id             bigint generated always as identity primary key,
  user_id        uuid        not null references auth.users (id) on delete cascade,
  rebirth_no     integer     not null,                 -- the rebirth count reached (1 = the first rebirth)
  at             timestamptz not null default now(),
  run_seconds    numeric     not null default 0,       -- play time of the run that ended
  play_seconds   numeric     not null default 0,       -- total play time at the rebirth
  tiles          integer     not null default 0,
  buildings      integer     not null default 0,
  castle_level   integer     not null default 1,
  level          integer     not null default 1,
  xp             numeric     not null default 0,
  gold           numeric     not null default 0,
  gold_per_sec   numeric     not null default 0,       -- the run's gold income when it ended (the "generation")
  click_level    integer     not null default 0,
  embers_gained  integer     not null default 0,
  legacy_earned  integer     not null default 0,       -- Embers ever earned, after this rebirth
  stats          jsonb       not null default '{}'::jsonb,  -- anything else worth keeping: income per second of every resource
  unique (user_id, rebirth_no)                         -- a retried save never records one rebirth twice
);
create index if not exists rebirth_history_user on public.rebirth_history (user_id, rebirth_no desc);

alter table public.rebirth_history enable row level security;
revoke all on table public.rebirth_history from anon, authenticated, public;
grant select on public.rebirth_history to authenticated;
drop policy if exists "rebirth_history_select_own" on public.rebirth_history;
create policy "rebirth_history_select_own" on public.rebirth_history for select to authenticated using (user_id = (select auth.uid()));
-- this project does not hand service_role table access by default: be explicit
grant select, insert, update, delete on public.rebirth_history to service_role;
grant usage, select on sequence public.rebirth_history_id_seq to service_role;
