-- Apply once in the project's SQL editor, then provision the verifier privately.
begin;
create schema if not exists mosswater_private;
revoke all on schema mosswater_private from public, anon, authenticated;
create table mosswater_private.player (
 singleton boolean primary key default true check (singleton),
 pin_hash text, failures integer not null default 0, retry_after timestamptz,
 revision integer not null default 0, campaign jsonb
);
create table mosswater_private.devices (
 digest bytea primary key, expires_at timestamptz not null
);
alter table mosswater_private.player enable row level security;
alter table mosswater_private.devices enable row level security;
revoke all on all tables in schema mosswater_private from public, anon, authenticated;
do $$
begin
 if (select count(*) from public.mosswater_saves)>1 then
  raise exception 'Choose which previous save belongs to the personal profile before migrating';
 end if;
 insert into mosswater_private.player(singleton,revision,campaign)
 values(true,coalesce((select revision from public.mosswater_saves),0),(select campaign from public.mosswater_saves));
end $$;

create function public.mosswater_unlock(pin text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p mosswater_private.player; secret text;
begin
 select * into strict p from mosswater_private.player where singleton for update;
 if p.pin_hash is null then return jsonb_build_object('status','unavailable'); end if;
 if p.retry_after>clock_timestamp() then return jsonb_build_object('status','cooldown'); end if;
 if pin is null or pin !~ '^[0-9]{6}$' then return jsonb_build_object('status','invalid'); end if;
 if extensions.crypt(pin,p.pin_hash)<>p.pin_hash then
  update mosswater_private.player set failures=(failures+1)%5,
   retry_after=case when failures=4 then clock_timestamp()+interval '15 minutes' end where singleton;
  return jsonb_build_object('status',case when p.failures=4 then 'cooldown' else 'invalid' end);
 end if;
 update mosswater_private.player set failures=0,retry_after=null where singleton;
 delete from mosswater_private.devices where expires_at<=clock_timestamp();
 secret:=encode(extensions.gen_random_bytes(32),'hex');
 insert into mosswater_private.devices values(extensions.digest(secret,'sha256'),clock_timestamp()+interval '30 days');
 return jsonb_build_object('status','ok','device',secret);
end $$;

create function public.mosswater_progress(device text, expected integer default null, snapshot jsonb default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p mosswater_private.player;
begin
 if device is null or length(device)<>64 or not exists(select 1 from mosswater_private.devices d
  where d.digest=extensions.digest(device,'sha256') and d.expires_at>clock_timestamp()) then
  return jsonb_build_object('status','locked');
 end if;
 if expected is not null then
  if snapshot is null or jsonb_typeof(snapshot)<>'object' or (snapshot->>'version') is distinct from '2'
    or jsonb_typeof(snapshot->'runs') is distinct from 'object' then raise exception 'Invalid campaign'; end if;
  update mosswater_private.player set revision=revision+1,campaign=snapshot
   where singleton and revision=expected returning * into p;
  if found then return jsonb_build_object('status','ok','revision',p.revision); end if;
 end if;
 select * into strict p from mosswater_private.player where singleton;
 return jsonb_build_object('status',case when expected is null then 'ok' else 'conflict' end,
  'revision',p.revision,'campaign',p.campaign);
end $$;

create function public.mosswater_lock(device text) returns void
language sql security definer set search_path = '' as $$
 delete from mosswater_private.devices where digest=extensions.digest(device,'sha256');
$$;
revoke all on function public.mosswater_unlock(text),public.mosswater_progress(text,integer,jsonb),public.mosswater_lock(text) from public;
grant execute on function public.mosswater_unlock(text),public.mosswater_progress(text,integer,jsonb),public.mosswater_lock(text) to anon, authenticated;
commit;
