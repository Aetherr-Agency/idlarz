-- season_reset: when a player's game was last reset, and the one global "last reset" the server compares it with.
-- Additive: one nullable column and one small table. Run ONCE, before deploying the code that reads them.
-- A player whose reset_at is older than app_settings 'last_reset' (or has none) is reset on their next login (see lib/offline/season.ts).
alter table public.player_ledger add column if not exists reset_at timestamptz;

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb       not null,
  updated_at  timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on table public.app_settings from anon, authenticated, public;
comment on table public.app_settings is 'Deliberately no policies: only the service role reads or writes it. last_reset = {"at": "<iso>"}.';
grant select, insert, update, delete on public.app_settings to service_role;
