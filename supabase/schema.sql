-- Balbtopia online tables. Paste all of this into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

-- one row per account: everything in the player's save (bag, skin, gold, level, ...)
create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- one row per world, shared by every player
create table if not exists public.worlds (
  name text primary key check (name ~ '^[A-Z0-9]{1,16}$'),
  data jsonb not null,
  owner text,
  updated_at timestamptz not null default now()
);
create index if not exists worlds_updated_at on public.worlds (updated_at desc);

-- let logged-in players use the tables through the API (newer projects don't do this by default)
grant usage on schema public to authenticated;
grant select, insert, update on public.players to authenticated;
grant select on public.worlds to authenticated; -- writes only through save_world (SECURITY, below)

alter table public.players enable row level security;
alter table public.worlds enable row level security;

-- players: you can only read and write your own save
drop policy if exists "own save: read" on public.players;
drop policy if exists "own save: insert" on public.players;
drop policy if exists "own save: update" on public.players;
create policy "own save: read" on public.players for select to authenticated using (auth.uid() = id);
create policy "own save: insert" on public.players for insert to authenticated with check (auth.uid() = id);
create policy "own save: update" on public.players for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- worlds: any logged-in player can read them; changes go through save_world (SECURITY, at the end)
drop policy if exists "worlds: read" on public.worlds;
drop policy if exists "worlds: insert" on public.worlds; -- (old: anyone could write any world)
drop policy if exists "worlds: update" on public.worlds;
create policy "worlds: read" on public.worlds for select to authenticated using (true);

-- email between players: you can send to anyone, and only read / change / delete your own inbox
create table if not exists public.mail (
  id bigint generated always as identity primary key,
  to_id uuid not null references auth.users (id) on delete cascade,
  to_name text not null,
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_name text not null,
  subject text not null default '' check (char_length(subject) <= 40),
  body text not null check (char_length(body) <= 500),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists mail_inbox on public.mail (to_id, created_at desc);
grant select, insert, update, delete on public.mail to authenticated;
alter table public.mail enable row level security;
drop policy if exists "mail: read own" on public.mail;
drop policy if exists "mail: send" on public.mail;
drop policy if exists "mail: mark read" on public.mail;
drop policy if exists "mail: delete own" on public.mail;
create policy "mail: read own" on public.mail for select to authenticated using (auth.uid() = to_id or auth.uid() = from_id);
create policy "mail: send" on public.mail for insert to authenticated with check (auth.uid() = from_id);
create policy "mail: mark read" on public.mail for update to authenticated using (auth.uid() = to_id) with check (auth.uid() = to_id);
create policy "mail: delete own" on public.mail for delete to authenticated using (auth.uid() = to_id);

-- sign-up limit: how many accounts were made from each connection (only a hash of the IP address is kept).
-- Only the "signup" Edge Function (service role) uses it; players can't read or write it.
create table if not exists public.signup_ips (
  ip_hash text not null,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists signup_ips_hash on public.signup_ips (ip_hash);
alter table public.signup_ips enable row level security;

-- =====================================================================================================
-- SECURITY (Oct 2026). Everything below makes the server, not the game in the player's browser, decide:
--   * who a player is (usernames can't be changed after sign-up),
--   * who is a GM (table gms) and who is banned (table bans),
--   * who may change a world (save_world: owner, players with access, open worlds, GMs; visitors may only
--     change floating drops and buy from Vending Machines),
--   * who may kick (kick_player / claim_kick), and who may send building changes in realtime (build:NAME),
--   * mail sender names and how much mail one player can send,
--   * and it logs saves where gold or items jump suspiciously (cheat_log) so a GM can look and ban.
-- Safe to run more than once.
-- =====================================================================================================

-- ---------- usernames: fixed at sign-up ----------
-- The game used the username in the account's user_metadata, which a player can change themselves.
-- This table is filled once, when the account is made, from the e-mail (username@players.balbtopia.app,
-- which is unique), and players can't write to it.
create table if not exists public.usernames (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null
);
create unique index if not exists usernames_lower on public.usernames (lower(name));
alter table public.usernames enable row level security;
revoke all on public.usernames from anon, authenticated;

create or replace function public.name_from_user(u auth.users)
returns text language sql immutable as $$
  select case
    when lower(coalesce(u.raw_user_meta_data ->> 'username', '')) = lower(split_part(u.email, '@', 1))
      then u.raw_user_meta_data ->> 'username' -- keeps the capitals the player typed
    else split_part(u.email, '@', 1)
  end
$$;

create or replace function public.on_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- only game accounts (username@players.balbtopia.app); anything else gets no name and so can't play
  if new.email is null or new.email !~* '^[a-z0-9_]{3,16}@players\.balbtopia\.app$' then return new; end if;
  insert into public.usernames (id, name) values (new.id, public.name_from_user(new)) on conflict do nothing;
  return new;
end $$;
drop trigger if exists balbtopia_new_user on auth.users;
create trigger balbtopia_new_user after insert on auth.users for each row execute function public.on_new_user();

-- accounts made before this ran
insert into public.usernames (id, name)
select u.id, public.name_from_user(u) from auth.users u
where u.email ~* '^[a-z0-9_]{3,16}@players\.balbtopia\.app$'
on conflict do nothing;

-- the signed-in player's name (null when not signed in)
create or replace function public.my_name()
returns text language sql stable security definer set search_path = public as $$
  select name from public.usernames where id = auth.uid()
$$;

-- ---------- GMs and bans ----------
create table if not exists public.gms (name text primary key);
alter table public.gms enable row level security;
revoke all on public.gms from anon, authenticated;
insert into public.gms (name) values ('tae123') on conflict do nothing;

create or replace function public.is_gm()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.gms g where lower(g.name) = lower(public.my_name()))
$$;
-- the game asks this after logging in (the GM bag and free Shop are only shown to real GMs)
create or replace function public.am_i_gm()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_gm()
$$;

create table if not exists public.bans (
  id uuid primary key references auth.users (id) on delete cascade,
  reason text not null default '',
  by_name text,
  created_at timestamptz not null default now()
);
alter table public.bans enable row level security;
revoke all on public.bans from anon, authenticated;

create or replace function public.is_banned()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bans where id = auth.uid())
$$;
create or replace function public.am_i_banned()
returns text language sql stable security definer set search_path = public as $$
  select reason from public.bans where id = auth.uid()
$$;

-- everything the game needs right after logging in, in one call: { name, gm, banned (reason or null) }
create or replace function public.whoami()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', public.my_name(), 'gm', public.is_gm(), 'banned', public.am_i_banned())
$$;

-- GM only: ban (p_on = true) or unban a player by name
create or replace function public.gm_ban(p_name text, p_on boolean, p_reason text default '')
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_gm() then raise exception 'Only a GM can ban' using errcode = '42501'; end if;
  select id into uid from public.usernames where lower(name) = lower(p_name);
  if uid is null then raise exception 'No player called %', p_name; end if;
  if p_on then
    insert into public.bans (id, reason, by_name) values (uid, left(coalesce(p_reason, ''), 200), public.my_name())
    on conflict (id) do update set reason = excluded.reason, by_name = excluded.by_name, created_at = now();
    return 'banned';
  end if;
  delete from public.bans where id = uid;
  return 'unbanned';
end $$;

-- ---------- player saves: real name, no saving while banned, suspicious jumps logged ----------
create table if not exists public.cheat_log (
  id bigint generated always as identity primary key,
  player_id uuid references auth.users (id) on delete cascade,
  name text,
  what text not null,
  before_value bigint,
  after_value bigint,
  created_at timestamptz not null default now()
);
create index if not exists cheat_log_time on public.cheat_log (created_at desc);
alter table public.cheat_log enable row level security;
revoke all on public.cheat_log from anon, authenticated;
grant select on public.cheat_log to authenticated;
drop policy if exists "cheat log: GMs read" on public.cheat_log;
create policy "cheat log: GMs read" on public.cheat_log for select to authenticated using (public.is_gm());

-- a number out of a save (0 when missing or not a number)
create or replace function public.jnum(j jsonb)
returns bigint language sql immutable as $$
  select case when jsonb_typeof(j) = 'number' then least(greatest((j #>> '{}')::numeric, -9e15), 9e15)::bigint else 0 end
$$;
-- every item in a save's bag added up
create or replace function public.inv_total(d jsonb)
returns bigint language sql immutable as $$
  select coalesce(sum(public.jnum(s -> 'qty')), 0)::bigint
  from jsonb_array_elements(case when jsonb_typeof(d -> 'inv') = 'array' then d -> 'inv' else '[]'::jsonb end) s
$$;

create or replace function public.on_player_save()
returns trigger language plpgsql security definer set search_path = public as $$
declare g0 bigint; g1 bigint; i0 bigint; i1 bigint;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  new.username := coalesce(public.my_name(), new.username); -- the real name, whatever the game sent
  if tg_op = 'UPDATE' and not public.is_gm() then
    g0 := public.jnum(old.data -> 'gold'); g1 := public.jnum(new.data -> 'gold');
    i0 := public.inv_total(old.data);     i1 := public.inv_total(new.data);
    -- saves go out every few seconds, so these are far more than normal play gives in one save
    if g1 - g0 > 100000 then
      insert into public.cheat_log (player_id, name, what, before_value, after_value) values (new.id, new.username, 'gold', g0, g1);
    end if;
    if i1 - i0 > 3000 then
      insert into public.cheat_log (player_id, name, what, before_value, after_value) values (new.id, new.username, 'items', i0, i1);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists balbtopia_player_save on public.players;
create trigger balbtopia_player_save before insert or update on public.players for each row execute function public.on_player_save();

-- ---------- worlds: only through save_world ----------
-- Who may change a world: nobody owns it, you own it, you are a GM, it is open to everyone, or you are on its
-- access list (data.lock.open / data.lock.access, lower-case names). Banned players never.
create or replace function public.world_can_edit(p_owner text, p_data jsonb, p_me text, p_gm boolean)
returns boolean language sql immutable as $$
  select p_me is not null and (
    p_owner is null or p_gm or lower(p_owner) = lower(p_me)
    or coalesce(p_data -> 'lock' -> 'open' = 'true'::jsonb, false)
    or (jsonb_typeof(p_data -> 'lock' -> 'access') = 'array' and p_data -> 'lock' -> 'access' ? lower(p_me))
  )
$$;
-- lockv counts changes of a world's owner or lock (access list, open). The realtime build channel's topic carries
-- it (build:NAME:LOCKV), so a player who was allowed to build and joined before a change can't keep sending after
-- it: the others move to the new topic, which checks the rights again.
alter table public.worlds add column if not exists lockv integer not null default 0;

-- the same for a world by name (a world not saved yet: no). Used by the API and the realtime build channel.
create or replace function public.can_edit_world(p_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare r public.worlds;
begin
  if auth.uid() is null or public.is_banned() then return false; end if;
  select * into r from public.worlds where name = p_name;
  if not found then return false; end if;
  return public.world_can_edit(r.owner, r.data, public.my_name(), public.is_gm());
end $$;
-- realtime: may this player send on topic build:NAME:LOCKV (right world, current lock version, may build)
create or replace function public.can_send_build(p_topic text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare r public.worlds; v text := split_part(p_topic, ':', 3);
begin
  if auth.uid() is null or public.is_banned() or v !~ '^[0-9]{1,9}$' then return false; end if;
  select * into r from public.worlds where name = split_part(p_topic, ':', 2);
  if not found or r.lockv <> v::integer then return false; end if;
  return public.world_can_edit(r.owner, r.data, public.my_name(), public.is_gm());
end $$;

-- a visitor's Vending Machine: the item, price and kind stay the same; stock can only go down and the
-- earnings only up, by at least what that many items cost. Anything else keeps the saved machine.
-- c counts the owner's collects, so a visitor's old copy (from before a collect) can't bring the earnings back.
create or replace function public.vend_ok(o jsonb, n jsonb)
returns boolean language plpgsql immutable as $$
declare sold bigint; paid bigint; p bigint;
begin
  if jsonb_typeof(o) is distinct from 'object' or jsonb_typeof(n) is distinct from 'object' then return false; end if;
  if jsonb_typeof(n -> 'n') is distinct from 'number' or jsonb_typeof(n -> 'e') is distinct from 'number' then return false; end if;
  if (o -> 'id') is distinct from (n -> 'id') or (o -> 'p') is distinct from (n -> 'p')
     or coalesce(o -> 'per' = 'true'::jsonb, false) <> coalesce(n -> 'per' = 'true'::jsonb, false)
     or public.jnum(o -> 'c') <> public.jnum(n -> 'c') then return false; end if;
  sold := public.jnum(o -> 'n') - public.jnum(n -> 'n');
  paid := public.jnum(n -> 'e') - public.jnum(o -> 'e');
  p := greatest(public.jnum(o -> 'p'), 1);
  if sold < 0 or paid < 0 or public.jnum(n -> 'n') < 0 then return false; end if;
  if coalesce(o -> 'per' = 'true'::jsonb, false) then return paid * p >= sold; end if; -- p items for 1 Gold Lock
  return paid >= sold * p; -- p Gold Locks each
end $$;

-- returns { r: 'saved' | 'visitor', v: lockv } (the game rejoins build:NAME:v when v changes)
drop function if exists public.save_world(text, jsonb);
create or replace function public.save_world(p_name text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me text := public.my_name();
  gm boolean := public.is_gm();
  r public.worlds;
  req text;
  own text;
  boss boolean; -- may change the lock (owner of an unowned or own world, or GM)
  outd jsonb;
  ov jsonb;
  nv jsonb;
  merged jsonb := '[]'::jsonb;
  e jsonb;
  lv integer;
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if p_name !~ '^[A-Z0-9]{1,16}$' then raise exception 'Bad world name'; end if;
  if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text) > 3000000 then
    raise exception 'Bad world data';
  end if;
  req := nullif(p_data ->> 'owner', '');
  select * into r from public.worlds where name = p_name for update;

  if not found then
    -- a new world: you can only lock it for yourself
    own := case when req is not null and (lower(req) = lower(me) or gm) then req end;
    outd := jsonb_set(p_data, '{owner}', coalesce(to_jsonb(own), 'null'::jsonb));
    insert into public.worlds (name, data, owner, updated_at, lockv) values (p_name, outd, own, now(), 0);
    return jsonb_build_object('r', 'saved', 'v', 0);
  end if;

  boss := r.owner is null or gm or lower(r.owner) = lower(me);
  if public.world_can_edit(r.owner, r.data, me, gm) then
    -- the owner: unowned -> you may lock it for yourself; yours -> you may keep it or unlock it; else unchanged
    if r.owner is null then
      own := case when req is not null and (lower(req) = lower(me) or gm) then req end;
    elsif gm or lower(r.owner) = lower(me) then
      own := case when req is null or lower(req) = lower(r.owner) or gm then req else r.owner end;
    else
      own := r.owner;
    end if;
    outd := jsonb_set(p_data, '{owner}', coalesce(to_jsonb(own), 'null'::jsonb));
    if not boss then
      -- builders with access can't change who has access
      outd := jsonb_set(outd, '{lock}', coalesce(r.data -> 'lock', 'null'::jsonb));
    end if;
    update public.worlds
    set data = outd, owner = own, updated_at = now(),
        lockv = lockv + case when own is distinct from r.owner or outd -> 'lock' is distinct from r.data -> 'lock' then 1 else 0 end
    where name = p_name
    returning lockv into lv;
    return jsonb_build_object('r', 'saved', 'v', lv);
  end if;

  -- a visitor: everything stays as saved except the floating drops and paid-for Vending Machine sales
  outd := r.data;
  if jsonb_typeof(p_data -> 'drops') = 'array' and jsonb_array_length(p_data -> 'drops') <= 400 then -- MAX_DROPS
    outd := jsonb_set(outd, '{drops}', p_data -> 'drops');
  end if;
  if jsonb_typeof(r.data -> 'vends') = 'array' and jsonb_typeof(p_data -> 'vends') = 'array' then
    for e in select * from jsonb_array_elements(r.data -> 'vends') loop
      ov := e -> 1;
      select x -> 1 into nv from jsonb_array_elements(p_data -> 'vends') x where x -> 0 = e -> 0 limit 1;
      if nv is not null and public.vend_ok(ov, nv) then
        -- only the sale itself is taken: stock and earnings; the rest stays the saved machine's
        merged := merged || jsonb_build_array(jsonb_build_array(e -> 0,
          ov || jsonb_build_object('n', public.jnum(nv -> 'n'), 'e', public.jnum(nv -> 'e'))));
      else
        merged := merged || jsonb_build_array(e);
      end if;
      nv := null;
    end loop;
    outd := jsonb_set(outd, '{vends}', merged);
  end if;
  update public.worlds set data = outd, updated_at = now() where name = p_name;
  return jsonb_build_object('r', 'visitor', 'v', r.lockv);
end $$;

revoke insert, update, delete on public.worlds from anon, authenticated;
drop policy if exists "worlds: insert" on public.worlds;
drop policy if exists "worlds: update" on public.worlds;
grant execute on function public.save_world(text, jsonb) to authenticated;

-- ---------- kick: only the world's owner (or a GM) ----------
-- The owner's game calls kick_player, then tells the world the kick's id; each player's game asks claim_kick
-- whether that kick is real and meant for them before obeying it.
create table if not exists public.world_kicks (
  id bigint generated always as identity primary key,
  world text not null,
  from_name text not null,
  to_id text not null, -- a player's id or '*' for everyone
  kind text not null check (kind in ('spawn', 'out')),
  created_at timestamptz not null default now()
);
alter table public.world_kicks enable row level security;
revoke all on public.world_kicks from anon, authenticated;

create or replace function public.kick_player(p_world text, p_to text, p_kind text)
returns bigint language plpgsql security definer set search_path = public as $$
declare r public.worlds; me text := public.my_name(); k bigint;
begin
  select * into r from public.worlds where name = p_world;
  if me is null or public.is_banned() or not found or r.owner is null
     or not (public.is_gm() or lower(r.owner) = lower(me)) then
    raise exception 'Only the owner of this world can do that' using errcode = '42501';
  end if;
  delete from public.world_kicks where created_at < now() - interval '1 hour';
  insert into public.world_kicks (world, from_name, to_id, kind) values (p_world, me, p_to, p_kind) returning id into k;
  return k;
end $$;

create or replace function public.claim_kick(p_id bigint)
returns table (world text, kind text, from_name text)
language sql stable security definer set search_path = public as $$
  select k.world, k.kind, k.from_name from public.world_kicks k
  where k.id = p_id and (k.to_id = '*' or k.to_id = auth.uid()::text) and k.created_at > now() - interval '1 minute'
$$;

-- ---------- mail: real names, and a limit on how much one player sends ----------
create or replace function public.on_mail_send()
returns trigger language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); recent int; today int;
begin
  if me is null or public.is_banned() then raise exception 'You can''t send mail' using errcode = '42501'; end if;
  new.from_id := auth.uid();
  new.from_name := me;
  select name into new.to_name from public.usernames where id = new.to_id;
  if new.to_name is null then raise exception 'No such player'; end if;
  select count(*) filter (where created_at > now() - interval '1 minute'), count(*) into recent, today
  from public.mail where from_id = auth.uid() and created_at > now() - interval '1 day';
  if recent >= 5 then raise exception 'Too many emails: wait a minute' using errcode = 'P0001'; end if;
  if today >= 100 then raise exception 'Too many emails today' using errcode = 'P0001'; end if;
  return new;
end $$;
-- the receiver may only change "read" (not the sender's name or the text)
revoke update on public.mail from authenticated;
grant update (read) on public.mail to authenticated;
drop trigger if exists balbtopia_mail_send on public.mail;
create trigger balbtopia_mail_send before insert on public.mail for each row execute function public.on_mail_send();

-- ---------- realtime: private channels ----------
-- world:NAME  positions, chat, punches, drops, Vending Machine sales (everyone signed in)
-- build:NAME:LOCKV  blocks, signs, songs, displays, Clear World, world sync, machine changes (only players who may
--              build there; LOCKV is the world's lock version, see can_send_build)
-- lobby       messages, trades, gifts between players (everyone signed in)
-- Turn OFF "Allow public access" in Supabase -> Realtime -> Settings so these rules are enforced.
do $$
begin
  if to_regclass('realtime.messages') is null then
    raise notice 'realtime.messages not found: realtime rules skipped';
    return;
  end if;
  -- (row level security is already on for realtime.messages in every Supabase project; that table belongs to
  -- Supabase, so this script doesn't touch its settings, only adds the two rules)
  begin
    execute 'drop policy if exists "balbtopia: receive" on realtime.messages';
    execute 'drop policy if exists "balbtopia: send" on realtime.messages';
    execute $p$create policy "balbtopia: receive" on realtime.messages for select to authenticated using (
      not public.is_banned() and (realtime.topic() like 'world:%' or realtime.topic() like 'build:%' or realtime.topic() = 'lobby')
    )$p$;
    execute $p$create policy "balbtopia: send" on realtime.messages for insert to authenticated with check (
      not public.is_banned() and (
        realtime.topic() like 'world:%' or realtime.topic() = 'lobby'
        or (realtime.topic() like 'build:%' and public.can_send_build(realtime.topic()))
      )
    )$p$;
  exception when insufficient_privilege then
    -- the rest of this file still runs; the game then uses public channels (keep "Allow public access" ON)
    raise warning 'Could not add the realtime rules (%). Keep "Allow public access" ON in Realtime settings.', sqlerrm;
  end;
end $$;

grant execute on function public.whoami(), public.my_name(), public.am_i_gm(), public.am_i_banned(), public.gm_ban(text, boolean, text),
  public.kick_player(text, text, text), public.claim_kick(bigint), public.can_edit_world(text), public.can_send_build(text), public.is_gm(),
  public.is_banned() to authenticated;
