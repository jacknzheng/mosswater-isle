begin;
create table if not exists public.mosswater_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  campaign jsonb not null check (jsonb_typeof(campaign) = 'object')
);
alter table public.mosswater_saves enable row level security;
revoke all on public.mosswater_saves from public, anon, authenticated;
grant select, insert, update on public.mosswater_saves to authenticated;
drop policy if exists mosswater_read_own on public.mosswater_saves;
create policy mosswater_read_own on public.mosswater_saves for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists mosswater_insert_own on public.mosswater_saves;
create policy mosswater_insert_own on public.mosswater_saves for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists mosswater_update_own on public.mosswater_saves;
create policy mosswater_update_own on public.mosswater_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;
