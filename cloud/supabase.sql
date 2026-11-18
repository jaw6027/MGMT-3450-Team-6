-- Run once in Laura's Supabase project's SQL editor. Backups are private,
-- immutable snapshots; restoring one never edits or deletes earlier copies.
create table public.dashboard_backups (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and snapshot @> '{"version":1}'::jsonb
    and octet_length(snapshot::text) <= 12582912
  )
);
create index dashboard_backups_owner_date on public.dashboard_backups (user_id, created_at desc);
alter table public.dashboard_backups enable row level security;
alter table public.dashboard_backups force row level security;
revoke all on public.dashboard_backups from anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert on public.dashboard_backups to authenticated;
create policy "Read only own backups" on public.dashboard_backups
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create only own backups" on public.dashboard_backups
  for insert to authenticated with check ((select auth.uid()) = user_id);
-- No public access, update, or delete policy. Never disable RLS.
