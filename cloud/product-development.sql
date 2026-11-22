-- Separate from marketing backups. Run once in Laura's Supabase SQL editor.
create table public.product_development_backups (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and snapshot @> '{"version":1,"app":"laura-product-development"}'::jsonb
    and octet_length(snapshot::text) <= 12582912
  )
);
create index product_backups_owner_date on public.product_development_backups(user_id,created_at desc);
alter table public.product_development_backups enable row level security;
alter table public.product_development_backups force row level security;
revoke all on public.product_development_backups from anon,authenticated;
grant usage on schema public to authenticated;
grant select,insert on public.product_development_backups to authenticated;
create policy "Read own product backups" on public.product_development_backups
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own product backups" on public.product_development_backups
  for insert to authenticated with check ((select auth.uid()) = user_id);
