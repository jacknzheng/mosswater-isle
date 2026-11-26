begin;
alter table mosswater_private.player
 add column grade_minute timestamptz, add column grade_minute_count integer not null default 0,
 add column grade_day date, add column grade_day_count integer not null default 0;
create function public.mosswater_grading_slot(device text) returns text
language plpgsql security definer set search_path = '' as $$
declare
 minute_start timestamptz := date_trunc('minute',clock_timestamp());
 today date := (clock_timestamp() at time zone 'UTC')::date;
begin
 if device is null or length(device) <> 64 or not exists (
  select 1 from mosswater_private.devices d where d.digest=extensions.digest(device,'sha256') and d.expires_at>clock_timestamp()
 ) then return 'locked'; end if;
 update mosswater_private.player set
  grade_minute=minute_start, grade_minute_count=case when grade_minute=minute_start then grade_minute_count+1 else 1 end,
  grade_day=today, grade_day_count=case when grade_day=today then grade_day_count+1 else 1 end
 where singleton and (grade_minute is distinct from minute_start or grade_minute_count<12)
 and (grade_day is distinct from today or grade_day_count<150);
 if not found then return 'limited'; end if;
 return 'ok';
end $$;
revoke all on function public.mosswater_grading_slot(text) from public;
grant execute on function public.mosswater_grading_slot(text) to anon, authenticated;
commit;
