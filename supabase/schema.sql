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
-- worlds: NO direct reads or writes (Oct 27 2026): reads go through load_world / world_infos / my_worlds /
-- world_lock_info / world_door_exists, writes through save_world (both below)
revoke select on public.worlds from anon, authenticated;

alter table public.players enable row level security;
alter table public.worlds enable row level security;

-- players: you can only read and write your own save
drop policy if exists "own save: read" on public.players;
drop policy if exists "own save: insert" on public.players;
drop policy if exists "own save: update" on public.players;
create policy "own save: read" on public.players for select to authenticated using (auth.uid() = id);
create policy "own save: insert" on public.players for insert to authenticated with check (auth.uid() = id);
create policy "own save: update" on public.players for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- worlds: read through the functions in "WORLD READS" (end of file); changes go through save_world
drop policy if exists "worlds: read" on public.worlds;
drop policy if exists "worlds: insert" on public.worlds; -- (old: anyone could write any world)
drop policy if exists "worlds: update" on public.worlds;

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
--   * and it logs saves where items jump suspiciously (cheat_log) so a GM can look and ban (gold: see ECONOMY).
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
  -- a name someone already uses (Change Name keeps the first name's e-mail, so the e-mail alone can't tell)
  if exists (select 1 from public.usernames where lower(name) = lower(public.name_from_user(new))) then
    raise exception 'That username is taken' using errcode = '23505';
  end if;
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
-- (the GM was tae123 until Oct 27 2026, renamed with supabase/admin/rename_gm.sql)
insert into public.gms (name) select 'anTz' where not exists (select 1 from public.usernames where lower(name) = 'tae123') on conflict do nothing;

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
  if p_on and uid = auth.uid() then raise exception 'You can''t ban yourself' using errcode = 'P0001'; end if;
  if p_on and exists (select 1 from public.gms g where lower(g.name) = lower(p_name)) then
    raise exception 'A GM can''t be banned' using errcode = 'P0001';
  end if;
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
declare i0 bigint; i1 bigint; wgold bigint; wbc bigint; gm boolean := public.is_gm(); it record; c bigint; o bigint;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  new.username := coalesce(public.my_name(), new.username); -- the real name, whatever the game sent
  -- gold: always the wallet's (ECONOMY); saves from before the wallet existed keep their own
  -- (a plain select: the wallets table is made further down this file)
  execute 'select gold, bc from public.wallets where id = $1' into wgold, wbc using new.id;
  -- a name without a wallet can only happen before the ECONOMY part has run once; then the save keeps its gold
  if wgold is not null then
    new.data := jsonb_set(jsonb_set(new.data, '{gold}', to_jsonb(wgold)), '{bc}', to_jsonb(coalesce(wbc, 0)));
  end if;
  if tg_op = 'UPDATE' and not gm then
    i0 := public.inv_total(old.data); i1 := public.inv_total(new.data);
    -- saves go out every few seconds, so this is far more than normal play gives in one save
    if i1 - i0 > 3000 then
      insert into public.cheat_log (player_id, name, what, before_value, after_value) values (new.id, new.username, 'items', i0, i1);
    end if;
  end if;
  -- Shop-only items: more in the save than bought / traded / bought from a machine -> logged, once a day per item
  if wgold is not null and not gm then
    for it in execute 'select distinct item from public.shop_prices where tracked' loop
      c := public.save_count(new.data, it.item);
      if c > 0 then
        execute 'select qty from public.owned_items where player_id = $1 and item = $2' into o using new.id, it.item;
        o := coalesce(o, 0);
        if c > o and not exists (select 1 from public.cheat_log where player_id = new.id and what = 'item: ' || it.item
                                 and created_at > now() - interval '1 day') then
          insert into public.cheat_log (player_id, name, what, before_value, after_value)
          values (new.id, new.username, 'item: ' || it.item, o, c);
        end if;
        o := null;
      end if;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists balbtopia_player_save on public.players;
create trigger balbtopia_player_save before insert or update on public.players for each row execute function public.on_player_save();

-- ---------- worlds: only through save_world ----------
-- does a Red / Blue Lock (data.al, www/js/world/alocks.js) let this player build somewhere in the world?
create or replace function public.alock_grants(p_data jsonb, p_me text)
returns boolean language sql immutable as $$
  select p_me is not null and jsonb_typeof(p_data -> 'al') = 'array' and exists (
    select 1 from jsonb_array_elements(p_data -> 'al') x
    where jsonb_typeof(x -> 1) = 'object' and (
      coalesce(x -> 1 -> 'open' = 'true'::jsonb, false) or coalesce(x -> 1 -> 'air' = 'true'::jsonb, false)
      or (jsonb_typeof(x -> 1 -> 'acc') = 'array' and x -> 1 -> 'acc' ? lower(p_me))))
$$;
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
-- (Nov 8 2026, owner) CO-OWNERS: a locked world's owner, or a player on its access list (data.lock.access), may
-- kick / spawn / pull / ban / unban there. A co-owner can't do it to the owner or to another co-owner. GMs always.
create or replace function public.world_admin(p_owner text, p_data jsonb, p_me text)
returns boolean language sql immutable as $$
  select p_me is not null and p_owner is not null and (
    lower(p_owner) = lower(p_me)
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
  -- (build j) the event worlds: only the GM builds there
  if r.name in ('SPLASHWARS', 'SPLASHPRIZE', 'MOONEVENT') and not public.is_gm() then return false; end if;
  -- (also players a Red / Blue Lock lets build in part of a locked world: their saves only take that part)
  return public.world_can_edit(r.owner, r.data, public.my_name(), public.is_gm())
    or (r.owner is not null and public.alock_grants(r.data, public.my_name()));
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

-- ---------- Red / Blue Lock (area locks, www/js/world/alocks.js) in a world without an owner ----------
-- data.al = [[lock tile, { k, o (owner), t: [tiles], acc: [lower-case names], open, air }], ...]
-- Anyone may save a world nobody owns, so here the server keeps what belongs to other players' area locks:
--   * other players' locks stay exactly as saved (nobody else can remove or change them)
--   * a lock the saver adds is always the saver's own (o = the saver's name)
--   * the blocks / backgrounds (fg, bg, vari) of another player's area keep their saved values, unless that lock is
--     open to everyone or lists the saver; with "ignore empty air" (air) only tiles that weren't empty are kept
-- Trees, signs and the rest of a tile are only checked by the game. GMs are not limited.
create or replace function public.alock_owned_by_other(e jsonb, p_me text)
returns boolean language sql immutable as $$
  select jsonb_typeof(e) = 'array' and jsonb_typeof(e -> 1) = 'object' and lower(coalesce(e -> 1 ->> 'o', '')) <> lower(p_me)
$$;
-- (Nov 11 2026, build u) a lock whose owner has been away 1000+ days (public.alock_abandoned, defined with the hellos
-- further down) is ABANDONED: anyone may break it. Its tiles aren't kept, and it may leave the list; while it stays in
-- the new list it is kept exactly as it was (it never becomes the saver's).
create or replace function public.alock_guard(p_old jsonb, p_new jsonb, p_me text)
returns jsonb language plpgsql stable as $$
declare
  others jsonb := '[]'::jsonb;
  gone jsonb := '[]'::jsonb; -- abandoned locks of other players
  ab jsonb;
  merged jsonb := '[]'::jsonb;
  e jsonb;
  o jsonb;
  ti jsonb;
  t integer;
  ofg bytea; nfg bytea; obg bytea; nbg bytea; ova bytea; nva bytea;
  ofx bytea; nfx bytea; -- fgx: blocks above 254 (fg byte 255 = look here; Oct 26 2026)
  touched boolean := false;
  outd jsonb := p_new;
begin
  if jsonb_typeof(p_old -> 'al') = 'array' then
    select coalesce(jsonb_agg(x), '[]'::jsonb) into others
    from jsonb_array_elements(p_old -> 'al') x
    where public.alock_owned_by_other(x, p_me) and not public.alock_abandoned(x -> 1 ->> 'o');
    select coalesce(jsonb_agg(x), '[]'::jsonb) into gone
    from jsonb_array_elements(p_old -> 'al') x
    where public.alock_owned_by_other(x, p_me) and public.alock_abandoned(x -> 1 ->> 'o');
  end if;
  merged := others;
  if jsonb_typeof(p_new -> 'al') = 'array' then
    for e in select * from jsonb_array_elements(p_new -> 'al') loop
      if jsonb_typeof(e) <> 'array' or jsonb_typeof(e -> 0) <> 'number' or jsonb_typeof(e -> 1) <> 'object' then continue; end if;
      if exists (select 1 from jsonb_array_elements(others) k where k -> 0 = e -> 0) then continue; end if;
      -- an abandoned lock still in the list: as it was
      select k into ab from jsonb_array_elements(gone) k where k -> 0 = e -> 0 limit 1;
      if ab is not null then
        merged := merged || jsonb_build_array(ab);
        continue;
      end if;
      merged := merged || jsonb_build_array(jsonb_build_array(e -> 0, jsonb_set(e -> 1, '{o}', to_jsonb(p_me))));
    end loop;
  end if;
  outd := jsonb_set(outd, '{al}', merged);
  if jsonb_array_length(others) = 0 then return outd; end if;
  begin
    ofg := decode(p_old ->> 'fg', 'base64'); nfg := decode(p_new ->> 'fg', 'base64');
    obg := decode(p_old ->> 'bg', 'base64'); nbg := decode(p_new ->> 'bg', 'base64');
    ova := decode(p_old ->> 'vari', 'base64'); nva := decode(p_new ->> 'vari', 'base64');
    ofx := decode(p_old ->> 'fgx', 'base64'); nfx := decode(p_new ->> 'fgx', 'base64');
  exception when others then
    return outd; -- not readable: leave the tiles (the world's own checks still apply)
  end;
  if nfx is not null and octet_length(nfx) <> octet_length(nfg) then nfx := null; end if;
  if ofx is not null and octet_length(ofx) <> octet_length(ofg) then ofx := null; end if;
  if ofg is null or nfg is null or obg is null or nbg is null or octet_length(ofg) <> octet_length(nfg)
     or octet_length(obg) <> octet_length(nbg) then
    return outd;
  end if;
  for e in select * from jsonb_array_elements(others) loop
    o := e -> 1;
    if coalesce(o -> 'open' = 'true'::jsonb, false)
       or (jsonb_typeof(o -> 'acc') = 'array' and o -> 'acc' ? lower(p_me)) then continue; end if;
    if jsonb_typeof(o -> 't') <> 'array' then continue; end if;
    for ti in select * from jsonb_array_elements(o -> 't') loop
      if jsonb_typeof(ti) <> 'number' then continue; end if;
      t := (ti #>> '{}')::integer;
      if t < 0 or t >= octet_length(ofg) then continue; end if;
      if coalesce(o -> 'air' = 'true'::jsonb, false) and t <> (e ->> 0)::integer
         and get_byte(ofg, t) = 0 and get_byte(obg, t) = 0 then continue; end if;
      if get_byte(nfg, t) <> get_byte(ofg, t) then nfg := set_byte(nfg, t, get_byte(ofg, t)); touched := true; end if;
      if get_byte(nbg, t) <> get_byte(obg, t) then nbg := set_byte(nbg, t, get_byte(obg, t)); touched := true; end if;
      if ova is not null and nva is not null and t < octet_length(ova) and t < octet_length(nva)
         and get_byte(nva, t) <> get_byte(ova, t) then
        nva := set_byte(nva, t, get_byte(ova, t)); touched := true;
      end if;
      if nfx is not null and get_byte(nfx, t) <> coalesce(case when ofx is null then 0 else get_byte(ofx, t) end, 0) then
        nfx := set_byte(nfx, t, case when ofx is null then 0 else get_byte(ofx, t) end); touched := true;
      end if;
    end loop;
  end loop;
  if touched then
    outd := jsonb_set(outd, '{fg}', to_jsonb(translate(encode(nfg, 'base64'), E'\n', '')));
    outd := jsonb_set(outd, '{bg}', to_jsonb(translate(encode(nbg, 'base64'), E'\n', '')));
    if nva is not null then outd := jsonb_set(outd, '{vari}', to_jsonb(translate(encode(nva, 'base64'), E'\n', ''))); end if;
    if nfx is not null then outd := jsonb_set(outd, '{fgx}', to_jsonb(translate(encode(nfx, 'base64'), E'\n', ''))); end if;
  end if;
  return outd;
end $$;
revoke execute on function public.alock_guard(jsonb, jsonb, text) from public, anon, authenticated;

-- In a LOCKED world only its owner places Red / Blue Locks. A player without access to the world but listed on one
-- of them (or the lock is open, or "ignore empty air" and the tile was empty) may change ONLY those tiles: the save
-- keeps everything as saved except those tiles' fg / bg / vari, the trees / signs / Display Boxes / Mannequins /
-- Pianos on them, and the floating drops (like any visitor). The lock tiles themselves never change.
create or replace function public.alock_merge_tiles(p_old jsonb, p_new jsonb, p_tiles integer[])
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select x from jsonb_array_elements(case when jsonb_typeof(p_old) = 'array' then p_old else '[]'::jsonb end) x
    where not (jsonb_typeof(x -> 0) = 'number' and (x ->> 0)::numeric = any (p_tiles::numeric[]))
    union all
    select x from jsonb_array_elements(case when jsonb_typeof(p_new) = 'array' then p_new else '[]'::jsonb end) x
    where jsonb_typeof(x -> 0) = 'number' and (x ->> 0)::numeric = any (p_tiles::numeric[])
  ) s
$$;
create or replace function public.alock_area_only(p_old jsonb, p_new jsonb, p_me text)
returns jsonb language plpgsql immutable as $$
declare
  outd jsonb := p_old;
  tiles integer[] := '{}';
  locks integer[] := '{}';
  e jsonb; o jsonb; ti jsonb; t integer; k text;
  ofg bytea; nfg bytea; obg bytea; nbg bytea; ova bytea; nva bytea;
  ofx bytea; nfx bytea; -- fgx: blocks above 254 (see alock_guard)
  mine boolean;
begin
  -- floating drops, as for any visitor
  if jsonb_typeof(p_new -> 'drops') = 'array' and jsonb_array_length(p_new -> 'drops') <= 2000 then -- MAX_DROPS 1200 + room (Nov 6 2026)
    outd := jsonb_set(outd, '{drops}', p_new -> 'drops');
  end if;
  if jsonb_typeof(p_old -> 'al') <> 'array' then return outd; end if;
  begin
    ofg := decode(p_old ->> 'fg', 'base64'); nfg := decode(p_new ->> 'fg', 'base64');
    obg := decode(p_old ->> 'bg', 'base64'); nbg := decode(p_new ->> 'bg', 'base64');
    ova := decode(p_old ->> 'vari', 'base64'); nva := decode(p_new ->> 'vari', 'base64');
    ofx := decode(p_old ->> 'fgx', 'base64'); nfx := decode(p_new ->> 'fgx', 'base64');
  exception when others then
    return outd;
  end;
  if nfx is not null and octet_length(nfx) <> octet_length(nfg) then nfx := null; end if;
  if ofx is null or octet_length(ofx) <> octet_length(ofg) then ofx := decode(repeat('00', octet_length(ofg)), 'hex'); end if;
  if ofg is null or nfg is null or obg is null or nbg is null or octet_length(ofg) <> octet_length(nfg)
     or octet_length(obg) <> octet_length(nbg) then
    return outd;
  end if;
  for e in select * from jsonb_array_elements(p_old -> 'al') loop
    if jsonb_typeof(e -> 0) = 'number' then locks := locks || (e ->> 0)::integer; end if;
  end loop;
  for e in select * from jsonb_array_elements(p_old -> 'al') loop
    o := e -> 1;
    if jsonb_typeof(o) <> 'object' or jsonb_typeof(o -> 't') <> 'array' then continue; end if;
    mine := coalesce(o -> 'open' = 'true'::jsonb, false) or (jsonb_typeof(o -> 'acc') = 'array' and o -> 'acc' ? lower(p_me));
    for ti in select * from jsonb_array_elements(o -> 't') loop
      if jsonb_typeof(ti) <> 'number' then continue; end if;
      t := (ti #>> '{}')::integer;
      if t < 0 or t >= octet_length(ofg) or t = any (locks) then continue; end if;
      if mine or (coalesce(o -> 'air' = 'true'::jsonb, false) and get_byte(ofg, t) = 0 and get_byte(obg, t) = 0) then
        tiles := tiles || t;
      end if;
    end loop;
  end loop;
  if cardinality(tiles) = 0 then return outd; end if;
  foreach t in array tiles loop
    ofg := set_byte(ofg, t, get_byte(nfg, t));
    obg := set_byte(obg, t, get_byte(nbg, t));
    if ova is not null and nva is not null and t < octet_length(ova) and t < octet_length(nva) then
      ova := set_byte(ova, t, get_byte(nva, t));
    end if;
    ofx := set_byte(ofx, t, case when nfx is null then 0 else get_byte(nfx, t) end);
  end loop;
  outd := jsonb_set(outd, '{fg}', to_jsonb(translate(encode(ofg, 'base64'), E'\n', '')));
  outd := jsonb_set(outd, '{bg}', to_jsonb(translate(encode(obg, 'base64'), E'\n', '')));
  if ova is not null then outd := jsonb_set(outd, '{vari}', to_jsonb(translate(encode(ova, 'base64'), E'\n', ''))); end if;
  outd := jsonb_set(outd, '{fgx}', to_jsonb(translate(encode(ofx, 'base64'), E'\n', '')));
  foreach k in array array['trees', 'signs', 'disp', 'mann', 'songs', 'atm'] loop
    outd := jsonb_set(outd, array[k], public.alock_merge_tiles(p_old -> k, p_new -> k, tiles));
  end loop;
  return outd;
end $$;
revoke execute on function public.alock_area_only(jsonb, jsonb, text) from public, anon, authenticated;

-- returns { r: 'saved' | 'visitor', v: lockv } (the game rejoins build:NAME:v when v changes)
drop function if exists public.save_world(text, jsonb);
-- worlds moved to a new name by World Transfer (transfer_world, at the end): old name -> new name
create table if not exists public.world_moves (
  old_name text primary key,
  new_name text not null,
  at timestamptz not null default now()
);
alter table public.world_moves enable row level security;
revoke all on public.world_moves from anon, authenticated;
-- (owner, Nov 4 2026: floating coins and items in his world kept vanishing) a save's drop list only says what THAT game
-- has. A game that came in later or missed a 'drop' message doesn't have every drop, and its save used to wipe the
-- ones it never got (a builder's list replaced the saved one; a visitor's list took out every drop older than 15 s
-- that it didn't have). New games send `dt` = the drops they SAW go away (picked up, joined into a bigger coin,
-- packed, cleared). keep_unseen_drops puts back every saved drop that isn't in the new list and isn't in `dt`.
-- Old games (no `dt`) are unchanged: their list is taken as before.
-- (Nov 6 2026, owner: harvested coins left floating for 1-2 hours vanished) the list may now hold up to 2000 (the
-- game's MAX_DROPS is 1200 and it packs, never cuts; the rest is room for drops another game hasn't seen yet). Uses
-- jsonb objects as lookup sets, so a big list is quick (the old version compared every drop with every drop).
create or replace function public.keep_unseen_drops(p_old jsonb, p_new jsonb, p_gone jsonb)
returns jsonb language plpgsql immutable as $$
declare
  have jsonb;
  gone jsonb;
  extra jsonb;
  room integer;
begin
  if jsonb_typeof(p_new) is distinct from 'array' then p_new := '[]'::jsonb; end if;
  if jsonb_typeof(p_gone) is distinct from 'array' or jsonb_typeof(p_old) is distinct from 'array' then return p_new; end if;
  room := 2000 - jsonb_array_length(p_new);
  if room <= 0 then return p_new; end if;
  select coalesce(jsonb_object_agg(x ->> 0, true), '{}'::jsonb) into have
    from jsonb_array_elements(p_new) x where jsonb_typeof(x) = 'array' and (x ->> 0) is not null;
  select coalesce(jsonb_object_agg(g #>> '{}', true), '{}'::jsonb) into gone
    from jsonb_array_elements(p_gone) g where jsonb_typeof(g) = 'string';
  select coalesce(jsonb_agg(s.o order by s.n), '[]'::jsonb) into extra from (
    select t.o, t.n from jsonb_array_elements(p_old) with ordinality t(o, n)
    where jsonb_typeof(t.o) = 'array' and (t.o ->> 0) is not null
      and not (have ? (t.o ->> 0)) and not (gone ? (t.o ->> 0))
    order by t.n limit room) s;
  return p_new || extra;
end $$;
revoke execute on function public.keep_unseen_drops(jsonb, jsonb, jsonb) from public, anon, authenticated;

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
  gmw boolean := false;
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if p_name !~ '^[A-Z0-9]{1,16}$' then raise exception 'Bad world name'; end if;
  -- (Nov 12 2026, build g) a SPLASH WARS match world (SPW + 6) is made by the game for one match and never kept
  if p_name ~ '^SPW[A-Z0-9]{6}$' then return jsonb_build_object('r', 'saved', 'v', 0); end if;
  -- (build j, security) the event worlds the game builds are the GM's: a player's game never creates them and only
  -- saves what a visitor may (drops, Vending Machine sales), even if one was ever saved without an owner
  gmw := p_name in ('SPLASHWARS', 'SPLASHPRIZE', 'MOONEVENT') and not gm;
  if public.world_banned(p_name) then raise exception 'You are banned from this world' using errcode = '42501'; end if;
  if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text) > 3000000 then
    raise exception 'Bad world data';
  end if;
  req := nullif(p_data ->> 'owner', '');
  select * into r from public.worlds where name = p_name for update;

  if not found then
    if gmw then return jsonb_build_object('r', 'saved', 'v', 0); end if;
    -- a world that was just moved (World Transfer): old games still in it would make it again at the old name
    if exists (select 1 from public.world_moves m where m.old_name = p_name and m.at > now() - interval '10 minutes') then
      raise exception 'This world moved to a new name' using errcode = 'P0001';
    end if;
    -- a new world: you can only lock it for yourself
    own := case when req is not null and (lower(req) = lower(me) or gm) then req end;
    if not gm then p_data := public.alock_guard('{}'::jsonb, p_data, me); end if; -- area locks: only your own
    outd := jsonb_set(p_data - 'dt', '{owner}', coalesce(to_jsonb(own), 'null'::jsonb));
    insert into public.worlds (name, data, owner, updated_at, lockv) values (p_name, outd, own, now(), 0);
    perform public.vend_track(p_name, '[]'::jsonb, outd -> 'vends');
    return jsonb_build_object('r', 'saved', 'v', 0);
  end if;

  boss := r.owner is null or gm or lower(r.owner) = lower(me);
  if not gmw and public.world_can_edit(r.owner, r.data, me, gm) then
    -- the owner: unowned -> you may lock it for yourself; yours -> you may keep it or unlock it; else unchanged
    if r.owner is null then
      own := case when req is not null and (lower(req) = lower(me) or gm) then req end;
      if not gm then
        -- area locks: other players' locks and tiles stay (alock_guard); no Gold Lock while someone else has one
        if own is not null and jsonb_typeof(r.data -> 'al') = 'array' and exists (
          select 1 from jsonb_array_elements(r.data -> 'al') x where public.alock_owned_by_other(x, me)) then
          own := null;
        end if;
        p_data := public.alock_guard(r.data, p_data, me);
      end if;
    elsif not boss then
      -- a builder with access to a locked world: the owner's Red / Blue Lock areas stay as saved unless they list
      -- them, and only the world's owner places, changes or removes area locks there
      own := r.owner;
      p_data := jsonb_set(public.alock_guard(r.data, p_data, me), '{al}', coalesce(r.data -> 'al', '[]'::jsonb));
    elsif gm or lower(r.owner) = lower(me) then
      own := case when req is null or lower(req) = lower(r.owner) or gm then req else r.owner end;
    else
      own := r.owner;
    end if;
    outd := jsonb_set(p_data, '{owner}', coalesce(to_jsonb(own), 'null'::jsonb));
    -- (Nov 4 2026) drops this game never had stay (keep_unseen_drops); `dt` itself isn't kept
    -- (Nov 5 2026, owner: floating coins / items still vanished after he put a new build in) a save with NO `dt` comes
    -- from an OLD build still open somewhere (another tab, the phone app, a cached page): it may ADD drops but never
    -- take any away (gone = nothing), so it can't wipe what newer games left floating
    outd := jsonb_set(outd, '{drops}', public.keep_unseen_drops(r.data -> 'drops', p_data -> 'drops',
      case when jsonb_typeof(p_data -> 'dt') = 'array' then p_data -> 'dt' else '[]'::jsonb end));
    outd := outd - 'dt';
    if not boss then
      -- builders with access can't change who has access
      outd := jsonb_set(outd, '{lock}', coalesce(r.data -> 'lock', 'null'::jsonb));
    end if;
    if own is distinct from r.owner then delete from public.world_keys where world = p_name; end if;
    perform public.vend_track(p_name, r.data -> 'vends', p_data -> 'vends');
    update public.worlds
    set data = outd, owner = own, updated_at = now(),
        lockv = lockv + case when own is distinct from r.owner or outd -> 'lock' is distinct from r.data -> 'lock'
          -- (an area lock's list changed in a locked world: who may send on build: changes too)
          or (own is not null and outd -> 'al' is distinct from r.data -> 'al') then 1 else 0 end
    where name = p_name
    returning lockv into lv;
    return jsonb_build_object('r', 'saved', 'v', lv);
  end if;

  -- a visitor: everything stays as saved except the floating drops and paid-for Vending Machine sales, and the
  -- tiles of Red / Blue Lock areas that let this player build (alock_area_only)
  outd := case when public.alock_grants(r.data, me) then public.alock_area_only(r.data, p_data, me) else r.data end;
  -- (Oct 27 2026) not the visitor's whole list any more: visitor_drops keeps the saved drops they may not take
  -- (Nov 4 2026) a drop the visitor's game never had counts as still there, not as taken (keep_unseen_drops)
  outd := jsonb_set(outd - 'dt', '{drops}', public.visitor_drops(r.data -> 'drops',
    public.keep_unseen_drops(r.data -> 'drops', p_data -> 'drops',
      case when jsonb_typeof(p_data -> 'dt') = 'array' then p_data -> 'dt' else '[]'::jsonb end), me));
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
    perform public.vend_track(p_name, r.data -> 'vends', merged);
  end if;
  update public.worlds set data = outd, updated_at = now() where name = p_name;
  return jsonb_build_object('r', 'visitor', 'v', r.lockv);
end $$;

revoke insert, update, delete on public.worlds from anon, authenticated;
drop policy if exists "worlds: insert" on public.worlds;
drop policy if exists "worlds: update" on public.worlds;
grant execute on function public.save_world(text, jsonb) to authenticated;

-- ---------- kick / spawn / pull: only the world's owner (or a GM) ----------
-- The owner's game calls kick_player, then tells the world the kick's id; each player's game asks claim_kick
-- whether that kick is real and meant for them before obeying it. 'pull' brings the player to (px, py), the owner's
-- spot in world pixels.
create table if not exists public.world_kicks (
  id bigint generated always as identity primary key,
  world text not null,
  from_name text not null,
  to_id text not null, -- a player's id or '*' for everyone
  kind text not null,
  created_at timestamptz not null default now()
);
alter table public.world_kicks add column if not exists px integer;
alter table public.world_kicks add column if not exists py integer;
alter table public.world_kicks drop constraint if exists world_kicks_kind_check;
alter table public.world_kicks add constraint world_kicks_kind_check check (kind in ('spawn', 'out', 'pull'));
alter table public.world_kicks enable row level security;
revoke all on public.world_kicks from anon, authenticated;

drop function if exists public.kick_player(text, text, text);
create or replace function public.kick_player(p_world text, p_to text, p_kind text, p_x integer default null, p_y integer default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare r public.worlds; me text := public.my_name(); k bigint;
begin
  select * into r from public.worlds where name = p_world;
  if me is null or public.is_banned() or not found or r.owner is null
     or not (public.is_gm() or public.world_admin(r.owner, r.data, me)) then
    raise exception 'Only the owner of this world can do that' using errcode = '42501';
  end if;
  -- a co-owner (not the owner, not a GM) can't send the owner or another co-owner anywhere
  if not public.is_gm() and lower(r.owner) <> lower(me) and p_to <> '*' and exists (
       select 1 from public.usernames u where u.id::text = p_to and public.world_admin(r.owner, r.data, u.name)) then
    raise exception 'You can''t do that to a player with access here' using errcode = 'P0001';
  end if;
  if p_kind = 'pull' and (p_to = '*' or p_x is null or p_y is null) then raise exception 'Pull one player to a spot'; end if;
  delete from public.world_kicks where created_at < now() - interval '1 hour';
  insert into public.world_kicks (world, from_name, to_id, kind, px, py) values (p_world, me, p_to, p_kind, p_x, p_y)
  returning id into k;
  return k;
end $$;

drop function if exists public.claim_kick(bigint);
create or replace function public.claim_kick(p_id bigint)
returns table (world text, kind text, from_name text, px integer, py integer)
language sql stable security definer set search_path = public as $$
  select k.world, k.kind, k.from_name, k.px, k.py from public.world_kicks k
  where k.id = p_id and (k.to_id = '*' or k.to_id = auth.uid()::text) and k.created_at > now() - interval '1 minute'
$$;

-- ---------- World Keys: the owner takes the key from the lock, trades it, the new holder uses it ----------
-- The server keeps who holds each world's key (the item in the bag only shows it), so a key can't be made up.
-- One key per world. It stops working if the world's owner changes any other way (unlocked, or a new owner).
create table if not exists public.world_keys (
  world text primary key references public.worlds (name) on delete cascade,
  holder_id uuid not null references auth.users (id) on delete cascade,
  owner_name text not null, -- the owner who took it out; the key only works while this is still the owner
  created_at timestamptz not null default now()
);
alter table public.world_keys enable row level security;
revoke all on public.world_keys from anon, authenticated;

-- the owner takes the key (once: while it is out, no second one)
create or replace function public.get_world_key(p_world text)
returns text language plpgsql security definer set search_path = public as $$
declare r public.worlds; me text := public.my_name(); k public.world_keys;
begin
  select * into r from public.worlds where name = p_world;
  if me is null or public.is_banned() or not found or r.owner is null or lower(r.owner) <> lower(me) then
    raise exception 'Only the owner of this world can take its key' using errcode = '42501';
  end if;
  select * into k from public.world_keys where world = p_world for update;
  if found and lower(k.owner_name) = lower(r.owner) then
    if k.holder_id = auth.uid() then return 'already'; end if;
    raise exception 'The key of this world is already out' using errcode = 'P0001';
  end if;
  delete from public.world_keys where world = p_world; -- an old key from a former owner
  insert into public.world_keys (world, holder_id, owner_name) values (p_world, auth.uid(), r.owner);
  return 'ok';
end $$;

-- the holder gives the key to another player (called by the giver's game when a trade or gift goes through)
create or replace function public.give_world_key(p_world text, p_to uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if public.is_banned() or not exists (select 1 from public.usernames where id = p_to) then
    raise exception 'Can''t give the key to that player';
  end if;
  update public.world_keys set holder_id = p_to where world = p_world and holder_id = auth.uid();
  if not found then raise exception 'You don''t hold the key of %', p_world using errcode = 'P0001'; end if;
  return 'ok';
end $$;

-- the holder uses the key on the world's lock: becomes the owner (the lock's access list is cleared). The owner
-- using their own key puts it back. Returns { r: 'owner' | 'back', v: lock version }.
create or replace function public.use_world_key(p_world text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); k public.world_keys; r public.worlds; lv integer;
begin
  if me is null or public.is_banned() then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into k from public.world_keys where world = p_world for update;
  if not found or k.holder_id <> auth.uid() then raise exception 'This key doesn''t work' using errcode = 'P0001'; end if;
  select * into r from public.worlds where name = p_world for update;
  if not found or r.owner is null or lower(r.owner) <> lower(k.owner_name) then
    delete from public.world_keys where world = p_world;
    raise exception 'This key doesn''t work any more: the world changed owner' using errcode = 'P0001';
  end if;
  delete from public.world_keys where world = p_world;
  if lower(r.owner) = lower(me) then return jsonb_build_object('r', 'back', 'v', r.lockv); end if;
  update public.worlds
  set owner = me,
      data = jsonb_set(jsonb_set(data, '{owner}', to_jsonb(me)), '{lock}',
                       jsonb_build_object('desc', coalesce(data -> 'lock' ->> 'desc', ''), 'open', false, 'access', '[]'::jsonb)),
      lockv = lockv + 1, updated_at = now()
  where name = p_world
  returning lockv into lv;
  return jsonb_build_object('r', 'owner', 'v', lv);
end $$;

-- the worlds whose key this player holds (the game fixes the keys in the bag to match)
create or replace function public.my_world_keys()
returns setof text language sql stable security definer set search_path = public as $$
  select world from public.world_keys where holder_id = auth.uid()
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

-- ---------- world bans (Oct 22 2026): wrench a player -> Ban from this world ----------
-- The world's owner (or a GM) keeps a player out of one world for a while or until lifted. The banned player is
-- kicked out at once (a world_kicks row, like Kick), can't go back in (the game asks my_world_ban first), can't
-- join that world's realtime channels (policies below), can't save it and can't chat there.
create table if not exists public.world_bans (
  world text not null,
  player_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  until timestamptz, -- null: until the owner lifts it
  by_name text not null,
  created_at timestamptz not null default now(),
  primary key (world, player_id)
);
alter table public.world_bans enable row level security;
revoke all on public.world_bans from anon, authenticated;

create or replace function public.world_banned(p_world text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.world_bans b where b.world = p_world and b.player_id = auth.uid()
                 and (b.until is null or b.until > now()))
$$;
-- the game asks before going into a world: null, or { until (null = no end), by }
create or replace function public.my_world_ban(p_world text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('until', b.until, 'by', b.by_name) from public.world_bans b
  where b.world = p_world and b.player_id = auth.uid() and (b.until is null or b.until > now()) limit 1
$$;
-- ban (p_minutes null = until lifted) and kick out; returns the kick's id (the game sends { kid } like a Kick)
create or replace function public.ban_from_world(p_world text, p_to uuid, p_minutes integer)
returns bigint language plpgsql security definer set search_path = public as $$
declare r public.worlds; me text := public.my_name(); tn text; k bigint;
begin
  select * into r from public.worlds where name = p_world;
  if me is null or public.is_banned() or not found or r.owner is null
     or not (public.is_gm() or public.world_admin(r.owner, r.data, me)) then
    raise exception 'Only the owner of this world can do that' using errcode = '42501';
  end if;
  select name into tn from public.usernames where id = p_to;
  if tn is not null and not public.is_gm() and lower(r.owner) <> lower(me) and public.world_admin(r.owner, r.data, tn) then
    raise exception 'You can''t ban a player with access here' using errcode = 'P0001';
  end if;
  if tn is null then raise exception 'No such player' using errcode = 'P0001'; end if;
  if p_to = auth.uid() or lower(tn) = lower(r.owner) then
    raise exception 'You can''t ban the owner of this world' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.gms g where lower(g.name) = lower(tn)) then
    raise exception 'You can''t ban a GM' using errcode = 'P0001';
  end if;
  if p_minutes is not null and (p_minutes < 1 or p_minutes > 525600) then raise exception 'Bad ban time'; end if;
  delete from public.world_bans where until is not null and until < now();
  insert into public.world_bans (world, player_id, name, until, by_name)
  values (p_world, p_to, tn, case when p_minutes is null then null else now() + make_interval(mins => p_minutes) end, me)
  on conflict (world, player_id) do update
    set name = excluded.name, until = excluded.until, by_name = excluded.by_name, created_at = now();
  delete from public.world_kicks where created_at < now() - interval '1 hour';
  insert into public.world_kicks (world, from_name, to_id, kind) values (p_world, me, p_to::text, 'out')
  returning id into k;
  return k;
end $$;
create or replace function public.unban_from_world(p_world text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare r public.worlds; me text := public.my_name();
begin
  select * into r from public.worlds where name = p_world;
  if me is null or public.is_banned() or not found or r.owner is null
     or not (public.is_gm() or public.world_admin(r.owner, r.data, me)) then
    raise exception 'Only the owner of this world can do that' using errcode = '42501';
  end if;
  delete from public.world_bans where world = p_world and lower(name) = lower(p_name);
  if not found then return 'not banned'; end if;
  return 'ok';
end $$;
-- the owner's list of players banned from the world (bans that ran out are left out)
create or replace function public.world_ban_list(p_world text)
returns table (name text, until timestamptz) language plpgsql stable security definer set search_path = public as $$
declare r public.worlds; me text := public.my_name();
begin
  select * into r from public.worlds w where w.name = p_world;
  if me is null or not found or r.owner is null or not (public.is_gm() or public.world_admin(r.owner, r.data, me)) then
    raise exception 'Only the owner of this world can do that' using errcode = '42501';
  end if;
  return query select b.name, b.until from public.world_bans b
    where b.world = p_world and (b.until is null or b.until > now()) order by b.created_at desc;
end $$;

-- ---------- realtime: private channels ----------
-- world:NAME  positions, punches, drops, Vending Machine sales (everyone signed in and not banned from the world)
-- chat:NAME   world chat, sent only by the server (send_chat) so the names can't be faked
-- build:NAME:LOCKV  blocks, signs, songs, displays, Clear World, world sync, machine changes (only players who may
--              build there; LOCKV is the world's lock version, see can_send_build)
-- lobby       who is online (presence); old builds also sent messages / trades / gifts here
-- inbox:UID   messages, friend requests, trades, gifts TO that player, sent only by the server (lobby_send), so the
--             sender's name can't be faked and nobody else reads them; only that player can listen
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
    -- chat:NAME: world chat with the server's names (send_chat); players can only listen there, never send
    execute $p$create policy "balbtopia: receive" on realtime.messages for select to authenticated using (
      not public.is_banned()
      and (realtime.topic() like 'world:%' or realtime.topic() like 'build:%' or realtime.topic() like 'chat:%' or realtime.topic() = 'lobby' or realtime.topic() = 'global'
           or realtime.topic() = 'inbox:' || auth.uid()::text)
      and not public.world_banned(split_part(realtime.topic(), ':', 2))
    )$p$;
    execute $p$create policy "balbtopia: send" on realtime.messages for insert to authenticated with check (
      not public.is_banned() and not public.world_banned(split_part(realtime.topic(), ':', 2)) and (
        realtime.topic() like 'world:%' or realtime.topic() = 'lobby'
        or (realtime.topic() like 'build:%' and public.can_send_build(realtime.topic()))
      )
    )$p$;
  exception when insufficient_privilege then
    -- the rest of this file still runs; the game then uses public channels (keep "Allow public access" ON)
    raise warning 'Could not add the realtime rules (%). Keep "Allow public access" ON in Realtime settings.', sqlerrm;
  end;
end $$;

-- ---------- world chat with real names (Oct 22 2026) ----------
-- The game calls send_chat; the server puts the sender's real name on it and broadcasts it on chat:NAME, where
-- players can only listen (no send policy for it). Same limit as the game (3 quickly, then a wait), a bit looser.
create table if not exists public.chat_sent (
  id bigint generated always as identity primary key,
  from_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_sent_from on public.chat_sent (from_id, created_at);
alter table public.chat_sent enable row level security;
revoke all on public.chat_sent from anon, authenticated;
create or replace function public.send_chat(p_world text, p_text text)
returns text language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); t text; n integer;
begin
  if me is null or public.is_banned() then raise exception 'You can''t chat' using errcode = '42501'; end if;
  if p_world !~ '^[A-Z0-9]{1,16}$' then raise exception 'Bad world name'; end if;
  if public.world_banned(p_world) then raise exception 'You are banned from this world' using errcode = '42501'; end if;
  t := left(btrim(regexp_replace(coalesce(p_text, ''), '[[:cntrl:]]', ' ', 'g')), 80); -- CHAT_MAX
  if t = '' then return 'empty'; end if;
  select count(*) into n from public.chat_sent where from_id = auth.uid() and created_at > now() - interval '5 seconds';
  if n >= 5 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  delete from public.chat_sent where created_at < now() - interval '1 minute';
  insert into public.chat_sent (from_id) values (auth.uid());
  perform realtime.send(jsonb_build_object('id', auth.uid(), 'n', me, 'text', t), 'chat', 'chat:' || p_world, true);
  return 'ok';
end $$;

grant execute on function public.world_banned(text), public.my_world_ban(text), public.ban_from_world(text, uuid, integer),
  public.unban_from_world(text, text), public.world_ban_list(text), public.send_chat(text, text) to authenticated;
grant execute on function public.whoami(), public.my_name(), public.am_i_gm(), public.am_i_banned(), public.gm_ban(text, boolean, text),
  public.kick_player(text, text, text, integer, integer), public.claim_kick(bigint), public.get_world_key(text),
  public.give_world_key(text, uuid), public.use_world_key(text), public.my_world_keys(), public.can_edit_world(text), public.can_send_build(text), public.is_gm(),
  public.is_banned() to authenticated;

-- =====================================================================================================
-- ECONOMY (Oct 2026): gold lives on the server (wallets), the Shop sells on the server (shop_buy), and the
-- server keeps how many of each Shop-only item every player got (owned_items) so a save with more is logged.
-- Owner's choice: anything over a limit is LOGGED (cheat_log) or HELD for a GM to look at; honest saves are never
-- refused.
--   * Gold only comes from breaking blocks and harvesting trees (picked up as coins), trades, and the Shop.
--     earn_gold credits at most EARN_PER_HOUR (30,000 since build p; was 10,000) per rolling hour; the rest waits in wallets.held (logged).
--     A GM can release it:  update wallets set gold = gold + held, held = 0 where id = (select id from usernames
--     where lower(name) = lower('NAME'));
--   * The gold in a player's save is always set to the wallet's (the save can't add gold).
--   * shop_prices must match the game's SHOP list (www/js/ui/shop.js, music.js): change both together.
-- Safe to run more than once.
-- =====================================================================================================
create table if not exists public.wallets (
  id uuid primary key references auth.users (id) on delete cascade,
  gold bigint not null default 0 check (gold >= 0),
  held bigint not null default 0, -- earned over the hourly limit, waiting for a GM
  hour_start timestamptz not null default now(),
  earned_hour bigint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.wallets add column if not exists bc bigint not null default 0; -- Balb Coins
alter table public.wallets add column if not exists quest_day date; -- the last day a daily quest was claimed
alter table public.wallets enable row level security;
revoke all on public.wallets from anon, authenticated;

create table if not exists public.shop_prices (
  item text not null,
  qty integer not null,
  gold bigint not null,
  tracked boolean not null default true, -- a Shop-only item (no recipe, not a lock): counted in owned_items
  primary key (item, qty)
);
alter table public.shop_prices add column if not exists bc bigint not null default 0; -- > 0: costs Balb Coins, not gold
alter table public.shop_prices enable row level security;
revoke all on public.shop_prices from anon, authenticated;
grant select on public.shop_prices to authenticated;
drop policy if exists "shop prices: read" on public.shop_prices;
create policy "shop prices: read" on public.shop_prices for select to authenticated using (true);
insert into public.shop_prices (item, qty, gold, tracked, bc) values
  ('world_lock', 1, 2000, false, 0),
  ('red_lock', 1, 50, true, 0), -- area locks (alocks.js)
  ('blue_lock', 1, 200, true, 0),
  ('atm_machine', 1, 10000, true, 0), -- atm.js
  ('door_mover', 1, 10000, true, 0),
  ('signal_jammer', 1, 15000, true, 0),
  ('punch_jammer', 1, 15000, true, 0),
  ('snow_weather_machine', 1, 10000, true, 0),
  ('sunny_weather_machine', 1, 10000, true, 0),
  ('rain_weather_machine', 1, 10000, true, 0),
  ('desert_weather_machine', 1, 10000, true, 0), -- weather.js (Oct 26 2026)
  ('blackout_weather_machine', 1, 10000, true, 0), -- weather.js (Nov 3 2026)
  ('disco_weather_machine', 1, 10000, true, 0), -- weather.js (Nov 3 2026)
  ('halloween_weather_machine', 1, 10000, true, 0), -- weather.js (Nov 3 2026)
  ('night_weather_machine', 1, 10000, true, 0), -- weather.js (Nov 3 2026)
  ('clear_world', 1, 10000, true, 0),
  ('vending_machine', 1, 5000, true, 0),
  ('item_vacuum', 1, 100000, true, 0), -- vacuum.js (Nov 7 2026): Item Warp Pod
  ('coin_vacuum', 1, 100000, true, 0), -- Gold Warp Pod
  ('hologram_board', 1, 15000, true, 0), -- hologram.js (Nov 7 2026)
  ('hologram_sign', 1, 5000, true, 0), -- holosign.js (Nov 7 2026 build zj)
  -- (display_box / mannequin: recipes now, not sold; Oct 25 2026)
  ('shovel', 1, 50000, true, 0),
  -- (golden_pickaxe: no longer sold, it is the level 100 reward: claim_level_reward)
  ('name_changer', 1, 30000, true, 0), -- rename.js
  ('world_transfer', 1, 10000, true, 0), -- rename.js
  ('beach_blast', 1, 20000, true, 0), -- blast.js (Nov 5 2026)
  ('diamond_pickaxe', 1, 0, true, 200),
  ('black_diamond_pickaxe', 1, 0, true, 300),
  ('angel_wings', 1, 0, true, 30),
  ('tiny_angel_wings', 1, 0, true, 16),
  -- pixel wings + Halo (Oct 30 2026; Devil Wings taken out again the same day)
  ('tiny_devil_wings', 1, 10000, true, 0),
  ('vampire_wings', 1, 20000, true, 0),
  ('tiny_vampire_wings', 1, 10000, true, 0),
  ('halo', 1, 15000, true, 0),
  ('golden_wings', 1, 0, true, 120),
  ('golden_aura', 1, 0, true, 200),
  ('blue_fire_eyes', 1, 0, true, 200), -- fire_eyes.js (Oct 26 2026)
  ('red_fire_eyes', 1, 0, true, 200),
  ('faceless_head', 1, 20000, true, 0),
  -- scarves (scarves.js), capes (capes.js), Vampire Face (vampire_face.js); Oct 31 2026
  ('red_knit_scarf', 1, 3000, true, 0),
  ('blue_striped_scarf', 1, 3000, true, 0),
  ('red_bandana', 1, 3000, true, 0),
  ('big_orange_scarf', 1, 8000, true, 0),
  ('big_black_scarf', 1, 8000, true, 0),
  ('big_striped_scarf', 1, 10000, true, 0),
  ('black_scarf', 1, 3000, true, 0),
  ('candy_stripe_scarf', 1, 5000, true, 0),
  ('green_plaid_scarf', 1, 5000, true, 0),
  ('snowflake_scarf', 1, 5000, true, 0),
  ('pink_fluffy_scarf', 1, 8000, true, 0),
  ('rainbow_scarf', 1, 8000, true, 0),
  ('royal_silk_scarf', 1, 15000, true, 0),
  ('hero_cape', 1, 15000, true, 0),
  ('blue_hero_cape', 1, 15000, true, 0),
  ('forest_cape', 1, 15000, true, 0),
  ('vampire_cape', 1, 25000, true, 0),
  ('royal_cape', 1, 30000, true, 0),
  ('galaxy_cape', 1, 35000, true, 0),
  ('golden_cape', 1, 40000, true, 0),
  ('vampire_face', 1, 15000, true, 0), -- Vampire Fangs
  ('vampire_eyes', 1, 20000, true, 0),
  -- more clothes (clothes.js, Oct 31 2026)
  ('sailor_shirt', 1, 4000, true, 0),
  ('flower_shirt', 1, 6000, true, 0),
  ('camo_shirt', 1, 6000, true, 0),
  ('red_flannel', 1, 5000, true, 0),
  ('heart_tee', 1, 4000, true, 0),
  ('star_tee', 1, 5000, true, 0),
  ('ball_jersey', 1, 6000, true, 0),
  ('sunset_tee', 1, 6000, true, 0),
  -- t-shirts and polos with sleeves (tees.js, Nov 5 2026)
  ('white_tee', 1, 3000, true, 0),
  ('red_tee', 1, 4000, true, 0),
  ('blue_tee', 1, 4000, true, 0),
  ('green_tee', 1, 4000, true, 0),
  ('yellow_tee', 1, 4000, true, 0),
  ('black_tee', 1, 4000, true, 0),
  ('striped_tee', 1, 4000, true, 0),
  ('ringer_tee', 1, 4000, true, 0),
  ('navy_polo', 1, 5000, true, 0),
  ('pink_polo', 1, 5000, true, 0),
  ('green_polo', 1, 5000, true, 0),
  ('white_polo', 1, 5000, true, 0),
  ('red_polo', 1, 5000, true, 0),
  ('black_polo', 1, 5000, true, 0),
  ('yellow_polo', 1, 5000, true, 0),
  ('striped_polo', 1, 6000, true, 0),
  ('sky_polo', 1, 5000, true, 0),
  ('aloha_polo', 1, 6000, true, 0),
  ('hawaiian_polo', 1, 8000, true, 0),
  ('hawaiian_polo_red', 1, 8000, true, 0),
  -- watches and wristbands (wrist.js, Nov 5 2026)
  ('gold_watch', 1, 25000, true, 0),
  ('silver_watch', 1, 15000, true, 0),
  ('diamond_watch', 1, 0, true, 150),
  ('black_watch', 1, 8000, true, 0),
  ('red_wristband', 1, 3000, true, 0),
  ('blue_wristband', 1, 3000, true, 0),
  ('black_wristband', 1, 3000, true, 0),
  ('white_wristband', 1, 3000, true, 0),
  ('rainbow_wristband', 1, 6000, true, 0),
  ('gold_bracelet', 1, 12000, true, 0),
  -- the Cloud Ring (wrist.js, Nov 5 2026): wearing it = the Cloud Ride, which is no longer sold
  ('cloud_ring', 1, 100000, true, 0),
  ('prism_ring', 1, 85000, true, 0), -- Phantom Ring (prismtrail.js, Nov 8 2026): dark after-images
  ('denim_shorts', 1, 3000, true, 0),
  ('black_shorts', 1, 3000, true, 0),
  ('track_shorts', 1, 4000, true, 0),
  ('board_shorts', 1, 5000, true, 0),
  ('camo_shorts', 1, 5000, true, 0),
  ('blue_slippers', 1, 2000, true, 0),
  ('pink_slippers', 1, 2000, true, 0),
  ('green_slippers', 1, 2000, true, 0),
  ('gold_slippers', 1, 8000, true, 0),
  ('red_sneakers', 1, 5000, true, 0),
  ('black_sneakers', 1, 5000, true, 0),
  ('blue_sneakers', 1, 5000, true, 0),
  ('gold_sneakers', 1, 12000, true, 0),
  ('ride_horse', 1, 60000, true, 0), -- rides.js (Oct 31 2026)
  ('ride_truck', 1, 80000, true, 0),
  ('ride_car', 1, 70000, true, 0),
  ('ride_harvester', 1, 75000, true, 0),
  ('ride_leaf', 1, 90000, true, 0), -- Leaf Glider (Nov 4 2026)
  ('ride_leaf_green', 1, 90000, true, 0), -- Green / Yellow Leaf Glider (Nov 9 2026; Autumn event only, see shop_buy)
  ('ride_leaf_yellow', 1, 90000, true, 0),
  ('ride_carpet', 1, 95000, true, 0), -- Sultan's Flying Carpet (Nov 8 2026)
  ('autumn_chest', 1, 10000, true, 0), -- Autumn event chest (autumn.js; sold Nov 4 - Dec 4 2026 only, see shop_buy)
  -- girls' clothes (clothes.js) and styled hair (hairstyles.js), Oct 31 2026
  ('pink_sundress', 1, 6000, true, 0),
  ('flower_dress', 1, 7000, true, 0),
  ('red_party_dress', 1, 9000, true, 0),
  ('blue_polka_dress', 1, 6000, true, 0),
  ('sailor_dress', 1, 6000, true, 0),
  ('lavender_gown', 1, 15000, true, 0),
  ('ruffle_blouse', 1, 5000, true, 0),
  ('bow_top', 1, 5000, true, 0),
  ('pink_skirt', 1, 3000, true, 0),
  ('plaid_skirt', 1, 4000, true, 0),
  ('denim_skirt', 1, 3000, true, 0),
  ('pink_flats', 1, 3000, true, 0),
  ('red_flats', 1, 3000, true, 0),
  ('white_flats', 1, 3000, true, 0),
  ('lilac_slippers', 1, 2000, true, 0),
  ('fire_quiff', 1, 12000, true, 0),
  ('frosted_quiff', 1, 10000, true, 0),
  ('pink_ombre_long_hair', 1, 10000, true, 0),
  ('rainbow_long_hair', 1, 15000, true, 0),
  ('afro_hair', 1, 8000, true, 0), -- afro.js (Nov 10 2026): Afro and Rainbow Afro
  ('rainbow_afro', 1, 15000, true, 0),
  ('silver_wild_hair', 1, 12000, true, 0), -- oldman.js (Nov 12 2026, builds n-o; prices picked by Claude)
  ('silver_full_beard', 1, 12000, true, 0),
  ('boss_shades', 1, 6000, true, 0),
  ('blue_streak_spikes', 1, 8000, true, 0),
  ('galaxy_spikes', 1, 8000, true, 0),
  ('sunset_ponytail', 1, 12000, true, 0),
  ('mint_ponytail', 1, 8000, true, 0),
  ('lavender_swept_hair', 1, 8000, true, 0),
  ('blue_streak_swept_hair', 1, 8000, true, 0),
  ('cotton_candy_bun', 1, 12000, true, 0),
  ('galaxy_bun', 1, 8000, true, 0),
  ('blue_tip_bob', 1, 10000, true, 0),
  ('red_streak_bob', 1, 8000, true, 0),
  ('gold_tip_top_bun', 1, 10000, true, 0),
  ('mint_top_bun', 1, 8000, true, 0),
  ('purple_ombre_long_hair', 1, 10000, true, 0),
  ('silver_streak_long_hair', 1, 8000, true, 0),
  ('blue_pacifier', 1, 5000, true, 0),
  ('golden_diaper', 1, 50000, true, 0), -- diaper.js: Wisdom Diaper (Oct 26 2026, the owner's own pictures)
  ('diamond_diaper', 1, 0, true, 100), -- Angel Diaper
  ('red_aura', 1, 0, true, 200),
  ('dark_diamond_aura', 1, 0, true, 200),
  ('diamond_aura', 1, 0, true, 200),
  ('white_aura', 1, 0, true, 200),
  ('super_saiyan_hair', 1, 0, true, 200),
  ('seraph_wings', 1, 20000, true, 0),
  ('demon_wings', 1, 20000, true, 0),
  ('phoenix_wings', 1, 20000, true, 0),
  ('crystal_wings', 1, 20000, true, 0),
  ('fairy_wings', 1, 20000, true, 0),
  ('shadow_wings', 1, 20000, true, 0),
  ('celestial_wings', 1, 20000, true, 0),
  ('dragon_wings', 1, 20000, true, 0),
  ('leaf_wings', 1, 20000, true, 0),
  ('galaxy_wings', 1, 20000, true, 0),
  ('piano', 1, 3000, true, 0),
  ('genie_teapot', 1, 1000, true, 0),
  ('microphone', 1, 2000, true, 0), -- globalchat.js: one Global Chat broadcast each
  -- outfit sets (sets.js): the set gives its pieces, which have recipes no more but aren't tracked
  ('set_gentleman', 1, 20000, false, 0),
  ('set_sporty', 1, 20000, false, 0),
  ('set_biker', 1, 20000, false, 0),
  ('set_lolo', 1, 20000, false, 0),
  ('set_chill_guy', 1, 20000, false, 0),
  ('set_sunshine', 1, 20000, false, 0),
  ('set_cozy_night', 1, 20000, false, 0),
  ('set_autumn_red', 1, 20000, false, 0),
  ('set_pastel_pop', 1, 20000, false, 0),
  ('set_lady_green', 1, 20000, false, 0),
  ('set_pink_rock', 1, 20000, false, 0),
  ('set_skull_beanie', 1, 20000, false, 0),
  ('set_cat_hoodie', 1, 20000, false, 0),
  ('set_astronaut', 1, 20000, false, 0), -- spacesuit.js: Astronaut Set (helmet, suit, boots; + Laser Gun since build y, asteroids.js)
  ('starter_pack', 1, 2000, false, 0), -- starterpack.js (Nov 10 2026): 5 random recipe wearables / weapons, picked in the game
  ('leaf_blower', 1, 5000, false, 0), -- musicset.js (Nov 10 2026): the Guitar, Shop MUSIC only now; not tracked (players had it from its recipe)
  ('set_music', 1, 20000, false, 0), -- musicset.js: Music Set (Music Tee, Rocker Jeans, Rocker Sneakers, Guitar, Piano, Drum Set, Boombox)
  -- scythes (asteroids.js, build y): Shop-only now, only the Iron Scythe still has a recipe; not tracked (players already have recipe-made ones)
  ('garden_scythe', 1, 15000, false, 0),
  ('golden_scythe', 1, 30000, false, 0),
  ('flame_scythe', 1, 30000, false, 0),
  ('death_scythe', 1, 60000, false, 0),
  ('furious_scythe', 1, 80000, false, 0),
  ('reaper_scythe', 1, 100000, true, 0), -- reaperscythe.js (Nov 8 2026): Shop-only from the start, so tracked
  ('set_stage', 1, 20000, false, 0), -- concert.js: Stage Set
  ('set_factory', 1, 25000, false, 0), -- factorypack.js (Nov 11 2026): Factory Pack (price picked by Claude)
  ('set_fishing', 1, 10000, false, 0), -- fish.js: Fish Tank Set (basket, lid, water bucket, 20 Fish Tanks)
  -- pets (pets.js): Shop-only, tracked
  ('pet_puppy', 1, 15000, true, 0),
  ('pet_kitten', 1, 15000, true, 0),
  ('pet_bunny', 1, 15000, true, 0),
  ('pet_chick', 1, 15000, true, 0),
  ('pet_piglet', 1, 15000, true, 0),
  ('pet_turtle', 1, 15000, true, 0),
  ('pet_bee', 1, 15000, true, 0),
  ('pet_sprout_slime', 1, 15000, true, 0),
  ('pet_penguin', 1, 30000, true, 0),
  ('pet_parrot', 1, 30000, true, 0),
  ('pet_panda', 1, 30000, true, 0),
  ('pet_fox', 1, 30000, true, 0),
  ('pet_husky', 1, 30000, true, 0),
  ('pet_arctic_fox', 1, 30000, true, 0),
  ('pet_bat', 1, 30000, true, 0),
  ('pet_jellyfish', 1, 30000, true, 0),
  ('pet_shark', 1, 30000, true, 0),
  ('pet_snow_owl', 1, 30000, true, 0),
  ('pet_farmer_cat', 1, 30000, true, 0),
  ('pet_lion', 1, 30000, true, 0),
  ('pet_green_dragon', 1, 60000, true, 0),
  ('pet_ice_dragon', 1, 60000, true, 0),
  ('pet_unicorn', 1, 60000, true, 0),
  ('pet_phoenix', 1, 60000, true, 0),
  ('pet_trex', 1, 80000, true, 0),
  ('pet_raptor', 1, 80000, true, 0),
  ('pet_cyborg', 1, 100000, true, 0),
  ('pet_shadow_dragon', 1, 100000, true, 0),
  ('pet_bone_dragon', 1, 100000, true, 0),
  ('pet_glacier_dragon', 1, 100000, true, 0),
  ('pet_pearl_dragon', 1, 100000, true, 0),
  ('pet_jade_dragon', 1, 100000, true, 0)
on conflict (item, qty) do update set gold = excluded.gold, tracked = excluded.tracked, bc = excluded.bc;
-- anything no longer in the game's Shop list stops being sold
delete from public.shop_prices where (item, qty) not in (values ('name_changer', 1), ('world_transfer', 1), ('beach_blast', 1), ('world_lock', 1), ('red_lock', 1), ('blue_lock', 1), ('atm_machine', 1), ('door_mover', 1), ('signal_jammer', 1), ('punch_jammer', 1), ('snow_weather_machine', 1), ('sunny_weather_machine', 1), ('rain_weather_machine', 1), ('desert_weather_machine', 1), ('blackout_weather_machine', 1), ('disco_weather_machine', 1), ('halloween_weather_machine', 1), ('night_weather_machine', 1), ('clear_world', 1), ('vending_machine', 1), ('item_vacuum', 1), ('coin_vacuum', 1), ('hologram_board', 1), ('hologram_sign', 1), ('shovel', 1), ('diamond_pickaxe', 1), ('black_diamond_pickaxe', 1), ('angel_wings', 1), ('tiny_angel_wings', 1), ('tiny_devil_wings', 1), ('vampire_wings', 1), ('tiny_vampire_wings', 1), ('halo', 1), ('golden_wings', 1), ('golden_aura', 1), ('red_aura', 1), ('dark_diamond_aura', 1), ('diamond_aura', 1), ('white_aura', 1), ('blue_fire_eyes', 1), ('red_fire_eyes', 1), ('faceless_head', 1), ('red_knit_scarf', 1), ('blue_striped_scarf', 1), ('red_bandana', 1), ('big_orange_scarf', 1), ('big_black_scarf', 1), ('big_striped_scarf', 1), ('black_scarf', 1), ('candy_stripe_scarf', 1), ('green_plaid_scarf', 1), ('snowflake_scarf', 1), ('pink_fluffy_scarf', 1), ('rainbow_scarf', 1), ('royal_silk_scarf', 1), ('hero_cape', 1), ('blue_hero_cape', 1), ('forest_cape', 1), ('vampire_cape', 1), ('royal_cape', 1), ('galaxy_cape', 1), ('golden_cape', 1), ('vampire_face', 1), ('vampire_eyes', 1), ('sailor_shirt', 1), ('flower_shirt', 1), ('camo_shirt', 1), ('red_flannel', 1), ('heart_tee', 1), ('star_tee', 1), ('ball_jersey', 1), ('sunset_tee', 1), ('white_tee', 1), ('red_tee', 1), ('blue_tee', 1), ('green_tee', 1), ('yellow_tee', 1), ('black_tee', 1), ('striped_tee', 1), ('ringer_tee', 1), ('navy_polo', 1), ('pink_polo', 1), ('green_polo', 1), ('white_polo', 1), ('red_polo', 1), ('black_polo', 1), ('yellow_polo', 1), ('striped_polo', 1), ('sky_polo', 1), ('aloha_polo', 1), ('hawaiian_polo', 1), ('hawaiian_polo_red', 1), ('gold_watch', 1), ('silver_watch', 1), ('diamond_watch', 1), ('black_watch', 1), ('red_wristband', 1), ('blue_wristband', 1), ('black_wristband', 1), ('white_wristband', 1), ('rainbow_wristband', 1), ('gold_bracelet', 1), ('cloud_ring', 1), ('prism_ring', 1), ('denim_shorts', 1), ('black_shorts', 1), ('track_shorts', 1), ('board_shorts', 1), ('camo_shorts', 1), ('blue_slippers', 1), ('pink_slippers', 1), ('green_slippers', 1), ('gold_slippers', 1), ('red_sneakers', 1), ('black_sneakers', 1), ('blue_sneakers', 1), ('gold_sneakers', 1), ('ride_horse', 1), ('ride_truck', 1), ('ride_car', 1), ('ride_harvester', 1), ('ride_leaf', 1), ('ride_leaf_green', 1), ('ride_leaf_yellow', 1), ('ride_carpet', 1), ('autumn_chest', 1), ('pink_sundress', 1), ('flower_dress', 1), ('red_party_dress', 1), ('blue_polka_dress', 1), ('sailor_dress', 1), ('lavender_gown', 1), ('ruffle_blouse', 1), ('bow_top', 1), ('pink_skirt', 1), ('plaid_skirt', 1), ('denim_skirt', 1), ('pink_flats', 1), ('red_flats', 1), ('white_flats', 1), ('lilac_slippers', 1), ('fire_quiff', 1), ('frosted_quiff', 1), ('pink_ombre_long_hair', 1), ('rainbow_long_hair', 1), ('afro_hair', 1), ('rainbow_afro', 1), ('silver_wild_hair', 1), ('silver_full_beard', 1), ('boss_shades', 1), ('blue_streak_spikes', 1), ('galaxy_spikes', 1), ('sunset_ponytail', 1), ('mint_ponytail', 1), ('lavender_swept_hair', 1), ('blue_streak_swept_hair', 1), ('cotton_candy_bun', 1), ('galaxy_bun', 1), ('blue_tip_bob', 1), ('red_streak_bob', 1), ('gold_tip_top_bun', 1), ('mint_top_bun', 1), ('purple_ombre_long_hair', 1), ('silver_streak_long_hair', 1), ('blue_pacifier', 1), ('golden_diaper', 1), ('diamond_diaper', 1), ('super_saiyan_hair', 1), ('seraph_wings', 1), ('demon_wings', 1), ('phoenix_wings', 1), ('crystal_wings', 1), ('fairy_wings', 1), ('shadow_wings', 1), ('celestial_wings', 1), ('dragon_wings', 1), ('leaf_wings', 1), ('galaxy_wings', 1), ('piano', 1), ('genie_teapot', 1), ('microphone', 1), ('set_gentleman', 1), ('set_sporty', 1), ('set_biker', 1), ('set_lolo', 1), ('set_chill_guy', 1), ('set_sunshine', 1), ('set_cozy_night', 1), ('set_autumn_red', 1), ('set_pastel_pop', 1), ('set_lady_green', 1), ('set_pink_rock', 1), ('set_skull_beanie', 1), ('set_cat_hoodie', 1), ('set_astronaut', 1), ('starter_pack', 1), ('leaf_blower', 1), ('set_music', 1), ('garden_scythe', 1), ('golden_scythe', 1), ('flame_scythe', 1), ('death_scythe', 1), ('furious_scythe', 1), ('reaper_scythe', 1), ('set_fishing', 1), ('set_stage', 1), ('set_factory', 1), ('pet_puppy', 1), ('pet_kitten', 1), ('pet_bunny', 1), ('pet_chick', 1), ('pet_piglet', 1), ('pet_turtle', 1), ('pet_bee', 1), ('pet_sprout_slime', 1), ('pet_penguin', 1), ('pet_parrot', 1), ('pet_panda', 1), ('pet_fox', 1), ('pet_husky', 1), ('pet_arctic_fox', 1), ('pet_bat', 1), ('pet_jellyfish', 1), ('pet_shark', 1), ('pet_snow_owl', 1), ('pet_farmer_cat', 1), ('pet_lion', 1), ('pet_green_dragon', 1), ('pet_ice_dragon', 1), ('pet_unicorn', 1), ('pet_phoenix', 1), ('pet_trex', 1), ('pet_raptor', 1), ('pet_cyborg', 1), ('pet_shadow_dragon', 1), ('pet_bone_dragon', 1), ('pet_glacier_dragon', 1), ('pet_pearl_dragon', 1), ('pet_jade_dragon', 1));

create table if not exists public.owned_items (
  player_id uuid not null references auth.users (id) on delete cascade,
  item text not null,
  qty bigint not null default 0,
  primary key (player_id, item)
);
alter table public.owned_items enable row level security;
revoke all on public.owned_items from anon, authenticated;

-- the Shop-only items
create or replace function public.is_tracked(p_item text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shop_prices where item = p_item and tracked)
$$;
create or replace function public.add_owned(p_player uuid, p_item text, p_qty bigint)
returns void language sql security definer set search_path = public as $$
  insert into public.owned_items (player_id, item, qty) values (p_player, p_item, greatest(p_qty, 0))
  on conflict (player_id, item) do update set qty = greatest(public.owned_items.qty + p_qty, 0)
$$;
-- how many of an item a save has: in the bag, worn, in the hand
create or replace function public.save_count(d jsonb, p_item text)
returns bigint language sql immutable as $$
  select coalesce((select sum(public.jnum(s -> 'qty'))
                   from jsonb_array_elements(case when jsonb_typeof(d -> 'inv') = 'array' then d -> 'inv' else '[]'::jsonb end) s
                   where s ->> 'id' = p_item), 0)::bigint
       + coalesce((select count(*) from jsonb_each_text(case when jsonb_typeof(d -> 'equipped') = 'object' then d -> 'equipped' else '{}'::jsonb end) e
                   where e.value = p_item), 0)::bigint
$$;

-- Wallets for accounts that had a save before the economy: made ONCE, here, from those saves (the gold and Shop-only
-- items they already had). Re-running this file only adds wallets that don't exist yet. Big amounts are logged.
with made as (
  insert into public.wallets (id, gold)
  select p.id, greatest(public.jnum(p.data -> 'gold'), 0) from public.players p
  join public.usernames u on u.id = p.id
  on conflict (id) do nothing
  returning id, gold
), items as (
  select p.id, t.item, public.save_count(p.data, t.item) as n
  from made m join public.players p on p.id = m.id
  cross join (select distinct item from public.shop_prices where tracked) t
)
insert into public.owned_items (player_id, item, qty)
select id, item, n from items where n > 0
on conflict (player_id, item) do nothing;
insert into public.cheat_log (player_id, name, what, before_value, after_value)
select w.id, u.name, 'wallet started big', 0, w.gold
from public.wallets w join public.usernames u on u.id = w.id
where w.gold > 1000000 and w.created_at > now() - interval '1 minute'
  and not exists (select 1 from public.cheat_log c where c.player_id = w.id and c.what = 'wallet started big');
-- every account made from now on starts with an empty wallet
create or replace function public.on_new_wallet()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wallets (id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists balbtopia_new_wallet on public.usernames;
create trigger balbtopia_new_wallet after insert on public.usernames for each row execute function public.on_new_wallet();
-- any name without a wallet (made between runs): an empty one
insert into public.wallets (id) select id from public.usernames on conflict do nothing;

-- the caller's wallet (an empty one if somehow missing; a save is never read here)
create or replace function public.my_wallet()
returns jsonb language plpgsql security definer set search_path = public as $$
declare w public.wallets;
begin
  if auth.uid() is null or public.my_name() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  insert into public.wallets (id) values (auth.uid()) on conflict do nothing;
  select * into w from public.wallets where id = auth.uid();
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc);
end $$;

-- coins picked up from broken blocks and harvested trees: at most 30,000 per rolling hour (owner, build p; was 10,000), the rest held + logged
create or replace function public.earn_gold(p_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w public.wallets; lim constant bigint := 30000; ok bigint; over bigint; used bigint;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('gold', w.gold, 'held', w.held, 'over', 0); end if;
  p_amount := least(p_amount, 100000000);
  -- a rolling hour: what was earned drains away at 30,000 an hour (hour_start = last time it was worked out)
  used := greatest(0, w.earned_hour - floor(lim * extract(epoch from (now() - w.hour_start)) / 3600)::bigint);
  ok := least(p_amount, greatest(lim - used, 0));
  -- (build v) coins only count while the game is really online (a hello in the last 75 s); otherwise they are held
  if not public.is_gm() and not public.online_now(auth.uid()) then ok := 0; end if;
  if public.is_gm() then ok := p_amount; end if;
  over := p_amount - ok;
  update public.wallets
  set gold = gold + ok, held = held + over, hour_start = now(), earned_hour = used + ok
  where id = auth.uid()
  returning * into w;
  if over > 0 and not exists (select 1 from public.cheat_log where player_id = auth.uid() and what like 'gold held%'
                              and created_at > now() - interval '1 hour') then
    insert into public.cheat_log (player_id, name, what, before_value, after_value)
    values (auth.uid(), public.my_name(), 'gold held (over 30,000 an hour, or not online)', w.gold, w.held);
  end if;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'over', over, 'bc', w.bc);
end $$;

-- the Shop: the server's price; a GM gets it free. Returns the gold left.
create or replace function public.shop_buy(p_item text, p_qty integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr public.shop_prices; w public.wallets; gm boolean := public.is_gm();
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  select * into pr from public.shop_prices where item = p_item and qty = p_qty;
  if not found then raise exception 'That isn''t sold in the Shop' using errcode = 'P0001'; end if;
  -- AUTUMN EVENT (autumn.js AUTUMN_FROM / AUTUMN_TO): the chest and the Leaf Gliders are sold only from Nov 4 to the end
  -- of Dec 4 2026, Manila time (GMs any time)
  if p_item in ('autumn_chest', 'ride_leaf', 'ride_leaf_green', 'ride_leaf_yellow') and not gm
     and not (now() >= timestamptz '2026-11-04 00:00:00+08' and now() < timestamptz '2026-12-05 00:00:00+08') then
    raise exception 'The Autumn event is over' using errcode = 'P0001';
  end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if not gm then
    if pr.bc > 0 then
      -- sold for Balb Coins
      if w.bc < pr.bc then raise exception 'Not enough Balb Coins' using errcode = 'P0001'; end if;
      update public.wallets set bc = bc - pr.bc where id = auth.uid() returning * into w;
    else
      if w.gold < pr.gold then raise exception 'Not enough gold' using errcode = 'P0001'; end if;
      update public.wallets set gold = gold - pr.gold where id = auth.uid() returning * into w;
    end if;
  end if;
  if pr.tracked then perform public.add_owned(auth.uid(), p_item, p_qty); end if;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc);
end $$;

-- a trade's gold: BOTH players' games call trade_gold(other player, gold I give, gold I get) when the trade goes
-- through. The first call waits (trade_gold_offers); the second, if it matches, moves both amounts at once. A game
-- that never calls it moves nothing. Offers older than 2 minutes are dropped.
drop function if exists public.give_gold(uuid, bigint);
create table if not exists public.trade_gold_offers (
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  give bigint not null,
  get bigint not null,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id)
);
alter table public.trade_gold_offers enable row level security;
revoke all on public.trade_gold_offers from anon, authenticated;
create or replace function public.trade_gold(p_with uuid, p_give bigint, p_get bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.trade_gold_offers; a public.wallets; b public.wallets; me uuid := auth.uid();
begin
  if public.is_banned() or me is null or p_with = me or not exists (select 1 from public.usernames where id = p_with) then
    raise exception 'Can''t trade gold with that player';
  end if;
  if p_give is null or p_get is null or p_give < 0 or p_get < 0 or (p_give = 0 and p_get = 0) then raise exception 'Bad amount'; end if;
  delete from public.trade_gold_offers where created_at < now() - interval '2 minutes';
  select * into o from public.trade_gold_offers where from_id = p_with and to_id = me for update;
  if not found or o.give <> p_get or o.get <> p_give then
    insert into public.trade_gold_offers (from_id, to_id, give, get) values (me, p_with, p_give, p_get)
    on conflict (from_id, to_id) do update set give = excluded.give, get = excluded.get, created_at = now();
    return jsonb_build_object('r', 'waiting');
  end if;
  -- both agree: lock both wallets (in id order, so two trades can't wait on each other) and move the gold
  insert into public.wallets (id) values (me), (p_with) on conflict do nothing;
  perform 1 from public.wallets where id in (me, p_with) order by id for update;
  select * into a from public.wallets where id = me;
  select * into b from public.wallets where id = p_with;
  if a.gold < p_give or b.gold < p_get then
    delete from public.trade_gold_offers where from_id = p_with and to_id = me;
    raise exception 'Not enough gold for this trade' using errcode = 'P0001';
  end if;
  update public.wallets set gold = gold - p_give + p_get where id = me returning * into a;
  update public.wallets set gold = gold - p_get + p_give where id = p_with;
  delete from public.trade_gold_offers where from_id = p_with and to_id = me;
  return jsonb_build_object('r', 'done', 'gold', a.gold, 'held', a.held, 'bc', a.bc);
end $$;
create or replace function public.give_item(p_to uuid, p_item text, p_qty bigint)
returns text language plpgsql security definer set search_path = public as $$
declare had bigint;
begin
  if public.is_banned() or p_to = auth.uid() or not exists (select 1 from public.usernames where id = p_to) then
    raise exception 'Can''t give that player items';
  end if;
  if not public.is_tracked(p_item) or p_qty is null or p_qty <= 0 then return 'not tracked'; end if;
  select qty into had from public.owned_items where player_id = auth.uid() and item = p_item for update;
  had := coalesce(had, 0);
  if public.is_gm() then had := greatest(had, p_qty); end if;
  -- only what the giver really got moves (an item that was never bought can't be passed on as a real one)
  perform public.add_owned(auth.uid(), p_item, -least(had, p_qty));
  perform public.add_owned(p_to, p_item, least(had, p_qty));
  return 'ok';
end $$;

-- Vending Machines and Shop-only items: stock put in a machine has to come out of the filler's own count
-- (vend_backed holds it while it is in the machine, per world + tile); stock that leaves the machine (sold to a
-- visitor, or taken back out) is credited from there. Stock put in beyond what the filler had is logged and backs
-- nothing, so it can never become a real item for anyone. Called by save_world with the saved and the new machines.
create table if not exists public.vend_backed (
  world text not null,
  tile integer not null,
  item text not null,
  qty bigint not null default 0,
  primary key (world, tile)
);
alter table public.vend_backed enable row level security;
revoke all on public.vend_backed from anon, authenticated;
drop function if exists public.credit_vend_sales(jsonb, jsonb);
create or replace function public.vend_track(p_world text, p_old jsonb, p_new jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  t integer; ov jsonb; nv jsonb; oi text; ni text; on_ bigint; nn bigint; d bigint; bk bigint; mine bigint; mv bigint;
  tiles integer[];
begin
  if jsonb_typeof(p_old) is distinct from 'array' then p_old := '[]'; end if;
  if jsonb_typeof(p_new) is distinct from 'array' then p_new := '[]'; end if;
  select array_agg(distinct (x ->> 0)::integer) into tiles
  from (select x from jsonb_array_elements(p_old) x union all select x from jsonb_array_elements(p_new) x) z
  where jsonb_typeof(x) = 'array' and (x ->> 0) ~ '^[0-9]{1,7}$';
  if tiles is null then return; end if;
  foreach t in array tiles loop
    select x -> 1 into ov from jsonb_array_elements(p_old) x where x ->> 0 = t::text limit 1;
    select x -> 1 into nv from jsonb_array_elements(p_new) x where x ->> 0 = t::text limit 1;
    oi := ov ->> 'id'; ni := nv ->> 'id';
    on_ := case when public.is_tracked(oi) then greatest(public.jnum(ov -> 'n'), 0) else 0 end;
    nn := case when public.is_tracked(ni) then greatest(public.jnum(nv -> 'n'), 0) else 0 end;
    select qty into bk from public.vend_backed where world = p_world and tile = t for update;
    bk := coalesce(bk, 0);
    if oi is distinct from ni then
      -- the machine changed item (the game only allows that when it is empty) or went away: whatever backed the
      -- old item is forfeited (never moved to the new item), and the new item starts from 0
      bk := 0;
      on_ := 0;
    end if;
    if nn < on_ then
      -- stock left the machine (a sale, or the owner took it out): the saver gets what was backed
      d := least(on_ - nn, bk);
      if d > 0 then
        perform public.add_owned(auth.uid(), coalesce(oi, ni), d);
        bk := bk - d;
      end if;
    elsif nn > on_ and public.is_tracked(ni) then
      -- stock went in: it must come out of the saver's own count
      d := nn - on_;
      select qty into mine from public.owned_items where player_id = auth.uid() and item = ni for update;
      mv := least(d, coalesce(mine, 0));
      if mv > 0 then
        perform public.add_owned(auth.uid(), ni, -mv);
        bk := bk + mv;
      end if;
      if d > mv and not public.is_gm() then
        insert into public.cheat_log (player_id, name, what, before_value, after_value)
        values (auth.uid(), public.my_name(), 'item put in a machine without having it: ' || ni, coalesce(mine, 0), d);
      end if;
      if public.is_gm() then bk := bk + (d - mv); end if;
    end if;
    bk := least(bk, nn); -- never more backed than is in the machine
    insert into public.vend_backed (world, tile, item, qty) values (p_world, t, coalesce(ni, oi, ''), bk)
    on conflict (world, tile) do update set item = excluded.item, qty = excluded.qty;
    ov := null; nv := null; bk := null; mine := null;
  end loop;
end $$;

grant execute on function public.my_wallet(), public.earn_gold(bigint), public.shop_buy(text, integer),
  public.trade_gold(uuid, bigint, bigint), public.give_item(uuid, text, bigint) to authenticated;

-- internal helpers: never callable by players directly (they would let anyone add to their own counts)
revoke execute on function public.add_owned(uuid, text, bigint), public.vend_track(text, jsonb, jsonb) from public, anon, authenticated;

-- ---------- Balb Coins and daily quests (Oct 2026) ----------
-- Balb Coins (wallets.bc) come only from daily quests (1 a day) and, later, top-ups. The Genie Teapot shows the day's
-- quest (the game picks it from the day and the player's name); finishing it is checked by the game, so the server
-- only makes sure it pays out once a day (Philippine time). A GM can give coins in the SQL Editor:
--   update wallets set bc = bc + 10 where id = (select id from usernames where lower(name) = lower('NAME'));
-- QUEST KIND ON THE SERVER (Oct 25 2026, build w): the server, not the game, decides whether a player's quest of
-- the day pays a Balb Coin ('bc') or gold: a fixed pick from the player id + the Manila day, 'bc' for QUEST_BC_PER_MILLE
-- (287) in 1,000, the share of Balb Coin quests in the game's quest list (120 of 418 in Oct 2026). The game then picks
-- its quest from the quests of that kind (quests.js todayQuest), and claim_daily_quest pays the server's kind
-- whatever the game asks for.
create or replace function public.quest_kind_for(p_id uuid, p_day date)
returns text language sql immutable as $$
  select case when (('x' || substr(md5(p_day::text || ':' || p_id::text), 1, 8))::bit(32)::bigint % 1000) < 287
              then 'bc' else 'gold' end
$$;
revoke all on function public.quest_kind_for(uuid, date) from public, anon, authenticated;
create or replace function public.quest_today()
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; w public.wallets;
begin
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid();
  return jsonb_build_object('day', d, 'done', w.quest_day is not distinct from d, 'bc', w.bc,
                            'kind', public.quest_kind_for(auth.uid(), d));
end $$;
-- QUEST PLAY TIME (Oct 25 2026, build v): the game counts a quest's blocks / seeds / trees itself, so a changed game
-- could claim without playing. A claim now needs real time online today, counted by the server from the game's hellos
-- (world_here.play_secs, see PLAYER NAMES OVER HEADS): QUEST_GOLD_MIN (5 min) for a gold quest, QUEST_BC_MIN (15 min)
-- for a Balb Coin one. GMs are not checked.
create or replace function public.quest_play_check(p_kind text)
returns void language plpgsql security definer set search_path = public as $$
declare need integer := case when p_kind = 'bc' then 15 * 60 else 5 * 60 end; have integer;
begin
  if public.is_gm() then return; end if;
  execute 'select public.played_today($1)' into have using auth.uid();
  if coalesce(have, 0) < need then
    raise exception 'Play a little longer today first (% more min)', greatest(1, ceil((need - coalesce(have, 0)) / 60.0)::integer)
      using errcode = 'P0001';
  end if;
end $$;
revoke all on function public.quest_play_check(text) from public, anon, authenticated;

create or replace function public.claim_daily_quest(p_day date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; w public.wallets;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if p_day is distinct from d then raise exception 'A new day started: open the teapot again' using errcode = 'P0001'; end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if w.quest_day is not distinct from d then raise exception 'You already did today''s quest' using errcode = 'P0001'; end if;
  -- (build w) old builds call this one: it pays the server's kind too
  return public.claim_daily_quest(p_day, public.quest_kind_for(auth.uid(), d));
end $$;
grant execute on function public.quest_today(), public.claim_daily_quest(date) to authenticated;
-- Reward (owner, Oct 23 2026): a RARE quest pays 1 Balb Coin, a common one a random 250-1,000 gold (steps of 50).
-- The game says which kind (it knows the day's quest); the server rolls the amount and still pays once a day.
-- Keep the ranges the same as QUEST_REWARD in www/js/gameplay/quests.js. The one-argument version above stays for old builds.
create or replace function public.claim_daily_quest(p_day date, p_kind text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; w public.wallets; n bigint;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if p_kind is null or p_kind not in ('bc', 'gold') then raise exception 'Unknown reward' using errcode = 'P0001'; end if;
  p_kind := public.quest_kind_for(auth.uid(), d); -- (build w) the server's kind, not the game's
  if p_day is distinct from d then raise exception 'A new day started: open the teapot again' using errcode = 'P0001'; end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if w.quest_day is not distinct from d then raise exception 'You already did today''s quest' using errcode = 'P0001'; end if;
  perform public.quest_play_check(p_kind);
  if p_kind = 'bc' then
    n := 1;
    update public.wallets set bc = bc + n, quest_day = d where id = auth.uid() returning * into w;
  else
    n := 250 + 50 * floor(random() * 16)::bigint;
    update public.wallets set gold = gold + n, quest_day = d where id = auth.uid() returning * into w;
  end if;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc, 'got', n, 'kind', p_kind);
end $$;
grant execute on function public.claim_daily_quest(date, text) to authenticated;

-- LEVEL REWARDS (owner, Oct 24 2026): levels come from breaking blocks (counted by the game, saved as data.level).
-- Each reward is paid once per account: level 50 Cat Ear Hoodie, 70 10,000 gold, 80 20,000 gold, 90 50 Balb Coins,
-- 100 Golden Pickaxe (can't be traded; no longer sold). The server checks the level by its own XP count (LEVEL CHECK) and
-- pays gold / coins straight into the wallet (not through earn_gold's hourly limit); items are put in the bag by the
-- game. Keep the list the same as LEVEL_REWARDS in www/js/player/levels.js.
create table if not exists public.level_rewards (
  player_id uuid not null references auth.users (id) on delete cascade,
  lv integer not null,
  at timestamptz not null default now(),
  primary key (player_id, lv)
);
alter table public.level_rewards enable row level security;
revoke all on public.level_rewards from anon, authenticated;
-- LEVEL CHECK (Oct 25 2026): the level in a save comes from the game, so a changed save could claim every reward.
-- The server keeps its OWN count of XP (`xp_track.total`, all levels added up, `xp_total`) and only takes in what real
-- play can give: at most XP_RATE (2) a second, saved up to XP_BURST (300) for quick bursts, and XP_PER_DAY (20,000)
-- per Manila day. A save claiming more is never refused or changed: the server just counts less (and logs a big gap
-- once a day to cheat_log); an honest player's count catches up while they play on. claim_level_reward reads the
-- level from this count (`xp_level`), not from the save. GMs are not counted. Formula = xpNeed in www/js/ui/menu.js.
create table if not exists public.xp_track (
  player_id uuid primary key references auth.users (id) on delete cascade,
  total bigint not null default 0,       -- XP the server accepts (every level added up)
  credit numeric not null default 0,     -- XP that may still come in now (fills at XP_RATE a second, up to XP_BURST)
  at timestamptz not null default now(), -- when credit was last worked out
  day date,                              -- the Manila day day_xp counts
  day_xp bigint not null default 0       -- XP taken in on that day
);
alter table public.xp_track enable row level security;
revoke all on public.xp_track from anon, authenticated;

-- XP to go from level lv to lv + 1 (same as xpNeed in menu.js)
create or replace function public.xp_need(lv bigint)
returns bigint language sql immutable as $$ select 20 + 10 * lv + (lv * lv) / 5 $$;
-- a level + the XP inside it -> XP in all (levels above 1000 count as 1000)
create or replace function public.xp_total(lv bigint, xp bigint)
returns bigint language sql immutable as $$
  select coalesce((select sum(public.xp_need(l)) from generate_series(1::bigint, least(greatest(coalesce(lv, 1), 1), 1000) - 1) l), 0)::bigint
         + least(greatest(coalesce(xp, 0), 0), 1000000)
$$;
-- XP in all -> level
create or replace function public.xp_level(total bigint)
returns integer language plpgsql immutable as $$
declare lv integer := 1; t bigint := greatest(coalesce(total, 0), 0);
begin
  while lv < 1000 and t >= public.xp_need(lv) loop t := t - public.xp_need(lv); lv := lv + 1; end loop;
  return lv;
end $$;
revoke all on function public.xp_need(bigint), public.xp_total(bigint, bigint), public.xp_level(bigint) from anon;

create or replace function public.on_player_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  xp_rate constant numeric := 2; xp_burst constant numeric := 300; xp_per_day constant bigint := 20000;
  t public.xp_track; claim bigint; ok bigint; today date := (now() at time zone 'Asia/Manila')::date;
begin
  -- a GM's own save isn't counted
  if exists (select 1 from public.gms g join public.usernames u on lower(u.name) = lower(g.name) where u.id = new.id) then
    return new;
  end if;
  claim := public.xp_total(public.jnum(new.data -> 'level'), public.jnum(new.data -> 'xp'));
  select * into t from public.xp_track where player_id = new.id for update;
  if not found then
    -- a new account (players who were here when this went in were counted once below)
    insert into public.xp_track (player_id, day) values (new.id, today) returning * into t;
  end if;
  t.credit := least(xp_burst, t.credit + xp_rate * greatest(0, extract(epoch from (now() - t.at))));
  if t.day is distinct from today then t.day := today; t.day_xp := 0; end if;
  ok := 0;
  if claim > t.total then
    ok := least(claim - t.total, floor(t.credit)::bigint, greatest(xp_per_day - t.day_xp, 0));
    -- far ahead of what play can give: logged once a day
    if claim - (t.total + ok) > 2000 and not exists (select 1 from public.cheat_log where player_id = new.id
        and what = 'level ahead of the server' and created_at > now() - interval '1 day') then
      insert into public.cheat_log (player_id, name, what, before_value, after_value)
      values (new.id, new.username, 'level ahead of the server', public.xp_level(t.total + ok), public.xp_level(claim));
    end if;
  end if;
  update public.xp_track
  set total = t.total + ok, credit = t.credit - ok, at = now(), day = t.day, day_xp = t.day_xp + ok
  where player_id = new.id;
  return new;
end $$;
drop trigger if exists balbtopia_player_xp on public.players;
create trigger balbtopia_player_xp before insert or update on public.players for each row execute function public.on_player_xp();

-- once: everyone already playing keeps the level in their save; level 50 and up is logged so a GM can look
with made as (
  insert into public.xp_track (player_id, total)
  select id, public.xp_total(public.jnum(data -> 'level'), public.jnum(data -> 'xp')) from public.players
  on conflict (player_id) do nothing
  returning player_id, total
)
insert into public.cheat_log (player_id, name, what, before_value, after_value)
select m.player_id, p.username, 'level when the level check started', 0, public.xp_level(m.total)
from made m join public.players p on p.id = m.player_id
where public.xp_level(m.total) >= 50;

create or replace function public.claim_level_reward(p_lv integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w public.wallets; have integer; it text;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if p_lv is null or p_lv not in (50, 70, 80, 90, 100) then raise exception 'No reward for that level' using errcode = 'P0001'; end if;
  -- the server's own count (LEVEL CHECK above), not the level in the save
  select public.xp_level(total) into have from public.xp_track where player_id = auth.uid();
  if coalesce(have, 1) < p_lv then
    raise exception 'The server has you at level % so far. Keep breaking blocks and try again later', coalesce(have, 1)
      using errcode = 'P0001';
  end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  begin
    insert into public.level_rewards (player_id, lv) values (auth.uid(), p_lv);
  exception when unique_violation then
    raise exception 'You already claimed the level % reward', p_lv using errcode = 'P0001';
  end;
  if p_lv = 70 then update public.wallets set gold = gold + 10000 where id = auth.uid() returning * into w;
  elsif p_lv = 80 then update public.wallets set gold = gold + 20000 where id = auth.uid() returning * into w;
  elsif p_lv = 90 then update public.wallets set bc = bc + 50 where id = auth.uid() returning * into w;
  else
    it := case p_lv when 50 then 'cat_ear_hoodie' else 'golden_pickaxe' end;
    perform public.add_owned(auth.uid(), it, 1);
  end if;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc, 'lv', p_lv);
end $$;
grant execute on function public.claim_level_reward(integer) to authenticated;

-- ---------- CHANGE NAME and WORLD TRANSFER (owner, Oct 24 2026; www/js/online/rename.js) ----------
-- Both are Shop items (name_changer, world_transfer: tracked, so the server knows how many each player bought);
-- using one takes one away here. GMs use them for free.
-- Change Name: a new name of 3-16 letters / numbers that nobody uses (nor any account's login e-mail name). The
-- account keeps logging in with the e-mail made from its FIRST name; login_email tells the game which one belongs to
-- a name. Everything that is stored by name follows: the world owner (column + data), Gold Lock access lists, Red /
-- Blue Lock owners and lists, World Keys, world bans, mail names. GM accounts can't change their name (the LOBBY and
-- RECIPES are locked to the GM's name).
create or replace function public.login_email(p_name text)
returns text language sql stable security definer set search_path = public, auth as $$
  select u.email from public.usernames n join auth.users u on u.id = n.id where lower(n.name) = lower(p_name) limit 1
$$;
grant execute on function public.login_email(text) to anon, authenticated;

create or replace function public.use_owned(p_item text)
returns void language plpgsql security definer set search_path = public as $$
declare q bigint;
begin
  if public.is_gm() then return; end if;
  select qty into q from public.owned_items where player_id = auth.uid() and item = p_item for update;
  if coalesce(q, 0) < 1 then raise exception 'You don''t have one: buy it in the Shop' using errcode = 'P0001'; end if;
  update public.owned_items set qty = qty - 1 where player_id = auth.uid() and item = p_item;
end $$;
revoke execute on function public.use_owned(text) from public, anon, authenticated;

-- a name in a json array of names (lowercase lists) -> the new name
create or replace function public.rename_in_list(l jsonb, p_old text, p_new text)
returns jsonb language sql immutable as $$
  select case when jsonb_typeof(l) = 'array' then
    coalesce((select jsonb_agg(case when lower(x #>> '{}') = lower(p_old) then to_jsonb(lower(p_new)) else x end)
              from jsonb_array_elements(l) x), '[]'::jsonb)
  else l end
$$;

create or replace function public.change_name(p_new text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := auth.uid(); old text := public.my_name(); w record; d jsonb; al jsonb; e jsonb; changed boolean;
begin
  if old is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if public.is_gm() then raise exception 'A GM account can''t change its name' using errcode = 'P0001'; end if;
  p_new := trim(coalesce(p_new, ''));
  if p_new !~ '^[A-Za-z0-9]{3,16}$' then raise exception 'Name: 3 to 16 letters or numbers (no symbols)' using errcode = 'P0001'; end if;
  if p_new = old then raise exception 'That is already your name' using errcode = 'P0001'; end if;
  if exists (select 1 from public.usernames where lower(name) = lower(p_new) and id <> me)
     or exists (select 1 from auth.users where lower(split_part(email, '@', 1)) = lower(p_new) and id <> me)
     or exists (select 1 from public.gms where lower(name) = lower(p_new)) then
    raise exception 'That name is taken' using errcode = 'P0001';
  end if;
  perform public.use_owned('name_changer');
  update public.usernames set name = p_new where id = me;
  update public.players set username = p_new where id = me;
  -- worlds: owner, Gold Lock access, Red / Blue Lock owner and list (lockv up: build rights are checked by name)
  for w in select name, data, owner from public.worlds
           where lower(owner) = lower(old) or position(lower(old) in lower(data::text)) > 0 for update loop
    d := w.data; changed := false;
    if lower(w.owner) = lower(old) then d := jsonb_set(d, '{owner}', to_jsonb(p_new)); changed := true; end if;
    if jsonb_typeof(d -> 'lock' -> 'access') = 'array' and (d -> 'lock' -> 'access') ? lower(old) then
      d := jsonb_set(d, '{lock,access}', public.rename_in_list(d -> 'lock' -> 'access', old, p_new)); changed := true;
    end if;
    if jsonb_typeof(d -> 'al') = 'array' then
      al := '[]'::jsonb;
      for e in select * from jsonb_array_elements(d -> 'al') loop
        if jsonb_typeof(e -> 1) = 'object' then
          if lower(e -> 1 ->> 'o') = lower(old) then e := jsonb_set(e, '{1,o}', to_jsonb(p_new)); changed := true; end if;
          if jsonb_typeof(e -> 1 -> 'acc') = 'array' and (e -> 1 -> 'acc') ? lower(old) then
            e := jsonb_set(e, '{1,acc}', public.rename_in_list(e -> 1 -> 'acc', old, p_new)); changed := true;
          end if;
        end if;
        al := al || jsonb_build_array(e);
      end loop;
      d := jsonb_set(d, '{al}', al);
    end if;
    if changed then
      update public.worlds set data = d, owner = case when lower(owner) = lower(old) then p_new else owner end,
        lockv = lockv + 1, updated_at = now() where name = w.name;
    end if;
  end loop;
  update public.world_keys set owner_name = p_new where lower(owner_name) = lower(old);
  update public.world_bans set name = p_new where player_id = me;
  update public.world_bans set by_name = p_new where lower(by_name) = lower(old);
  update public.mail set to_name = p_new where to_id = me;
  update public.mail set from_name = p_new where from_id = me;
  return jsonb_build_object('name', p_new, 'old', old);
end $$;
grant execute on function public.change_name(text) to authenticated;

-- World Transfer: the owner (or a GM) moves their locked world to a new, unused name; everything in it goes along
-- (World Key, bans, Vending Machine backing). p_data: the world as the owner's game has it right now (saved under
-- the new name through save_world, so the newest blocks aren't lost). The old name stays free for anyone after
-- 10 minutes (world_moves keeps old games from making it again at once); players still inside are told by the
-- owner's game to follow (world_moved).
create or replace function public.transfer_world(p_old text, p_new text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); r public.worlds; res jsonb;
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  p_new := upper(trim(coalesce(p_new, '')));
  if p_new !~ '^[A-Z0-9]{1,16}$' then raise exception 'World name: up to 16 letters or numbers' using errcode = 'P0001'; end if;
  if p_new in ('LOBBY', 'RECIPES', 'START') or p_old in ('LOBBY', 'RECIPES', 'START') then
    raise exception 'That world can''t be moved there' using errcode = 'P0001';
  end if;
  if p_new = p_old then raise exception 'That is already its name' using errcode = 'P0001'; end if;
  select * into r from public.worlds where name = p_old for update;
  if not found or r.owner is null or not (public.is_gm() or lower(r.owner) = lower(me)) then
    raise exception 'Only the owner of a locked world can move it' using errcode = '42501';
  end if;
  if exists (select 1 from public.worlds where name = p_new) then
    raise exception 'A world called % already exists' , p_new using errcode = 'P0001';
  end if;
  perform public.use_owned('world_transfer');
  insert into public.worlds (name, data, owner, updated_at, lockv) values (p_new, r.data, r.owner, now(), r.lockv + 1);
  update public.world_keys set world = p_new where world = p_old;
  update public.world_bans set world = p_new where world = p_old;
  update public.vend_backed set world = p_new where world = p_old;
  delete from public.worlds where name = p_old;
  delete from public.world_moves where old_name = p_new or at < now() - interval '1 day';
  insert into public.world_moves (old_name, new_name) values (p_old, p_new)
  on conflict (old_name) do update set new_name = excluded.new_name, at = now();
  if jsonb_typeof(p_data) = 'object' then res := public.save_world(p_new, p_data); end if;
  return jsonb_build_object('name', p_new, 'old', p_old);
end $$;
grant execute on function public.transfer_world(text, text, jsonb) to authenticated;
-- Beach Blast (blast.js, Nov 5 2026): make a NEW world (a sand island the game built, p_data) with a name nobody has,
-- locked for you. Takes one Beach Blast (tracked Shop item, use_owned); the world itself is saved through save_world
-- (its new-world path: only you as the owner, area locks guarded).
create or replace function public.create_beach_world(p_name text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me text := public.my_name();
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  p_name := upper(trim(coalesce(p_name, '')));
  if p_name !~ '^[A-Z0-9]{1,16}$' then raise exception 'Use up to 16 letters or numbers' using errcode = 'P0001'; end if;
  if p_name in ('LOBBY', 'RECIPES', 'START') then raise exception 'That name can''t be used' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Bad world data' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('world:' || p_name));
  if exists (select 1 from public.worlds where name = p_name) then
    raise exception 'A world called % already exists', p_name using errcode = 'P0001';
  end if;
  if exists (select 1 from public.world_moves m where m.old_name = p_name and m.at > now() - interval '10 minutes') then
    raise exception 'A world called % already exists', p_name using errcode = 'P0001';
  end if;
  perform public.use_owned('beach_blast');
  p_data := jsonb_set(p_data, '{owner}', to_jsonb(me));
  perform public.save_world(p_name, p_data);
  if not exists (select 1 from public.worlds where name = p_name) then
    raise exception 'The world could not be made' using errcode = 'P0001';
  end if;
  return jsonb_build_object('name', p_name);
end $$;
grant execute on function public.create_beach_world(text, jsonb) to authenticated;
-- where did a world move to (in the last 10 minutes)? null if it didn't
create or replace function public.world_moved(p_old text)
returns text language sql stable security definer set search_path = public as $$
  select new_name from public.world_moves where old_name = p_old and at > now() - interval '10 minutes'
$$;
grant execute on function public.world_moved(text) to authenticated;

-- ---------- NOTICE BOARD SUGGESTIONS (owner, Oct 25 2026; www/js/blocks/board.js) ----------
-- Clicking a Notice Board shows its suggestions and a box to post one. Anyone signed in can post (not banned, not
-- banned from that world): at most 120 letters, 3 posts per 30 s, the newest 100 per board are kept. The server puts
-- the real name on each post. The poster, the world's owner and GMs remove posts; players who may build there clear
-- a board when they break it. Safe to run more than once.
create table if not exists public.board_posts (
  id bigint generated always as identity primary key,
  world text not null,
  tile integer not null,
  from_id uuid not null,
  from_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists board_posts_board on public.board_posts (world, tile, id);
create index if not exists board_posts_from on public.board_posts (from_id, created_at);
alter table public.board_posts enable row level security;
revoke all on public.board_posts from anon, authenticated;

create or replace function public.board_list(p_world text, p_tile integer)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'n', from_name, 't', body,
    'at', (extract(epoch from created_at) * 1000)::bigint) order by id), '[]'::jsonb)
  from (select * from public.board_posts where world = p_world and tile = p_tile order by id desc limit 100) p
$$;

create or replace function public.board_post(p_world text, p_tile integer, p_text text)
returns text language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); t text; n integer;
begin
  if me is null or public.is_banned() then raise exception 'You can''t post here' using errcode = '42501'; end if;
  if p_world !~ '^[A-Z0-9]{1,16}$' then raise exception 'Bad world name'; end if;
  if p_tile is null or p_tile < 0 or p_tile >= 100 * 60 then raise exception 'Bad tile'; end if;
  if public.world_banned(p_world) then raise exception 'You are banned from this world' using errcode = '42501'; end if;
  t := left(btrim(regexp_replace(coalesce(p_text, ''), '[[:cntrl:][:space:]]+', ' ', 'g')), 120); -- BOARD_MAX
  if t = '' then raise exception 'Write your suggestion first' using errcode = 'P0001'; end if;
  select count(*) into n from public.board_posts where from_id = auth.uid() and created_at > now() - interval '30 seconds';
  if n >= 3 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  insert into public.board_posts (world, tile, from_id, from_name, body) values (p_world, p_tile, auth.uid(), me, t);
  delete from public.board_posts where world = p_world and tile = p_tile and id not in
    (select id from public.board_posts where world = p_world and tile = p_tile order by id desc limit 100);
  return 'ok';
end $$;

create or replace function public.board_delete(p_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare r public.board_posts; own text;
begin
  select * into r from public.board_posts where id = p_id;
  if not found then return 'gone'; end if;
  select owner into own from public.worlds where name = r.world;
  if r.from_id <> auth.uid() and not public.is_gm() and lower(coalesce(own, '')) <> lower(coalesce(public.my_name(), '-'))
  then raise exception 'Only the poster or the world owner can remove this' using errcode = '42501'; end if;
  delete from public.board_posts where id = p_id;
  return 'ok';
end $$;

create or replace function public.board_clear(p_world text, p_tile integer)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.can_edit_world(p_world) then raise exception 'You can''t build here' using errcode = '42501'; end if;
  delete from public.board_posts where world = p_world and tile = p_tile;
  return 'ok';
end $$;
grant execute on function public.board_list(text, integer), public.board_post(text, integer, text),
  public.board_delete(bigint), public.board_clear(text, integer) to authenticated;

-- ---------- MAILBOX: the GM's updates (owner, Oct 25 2026; www/js/blocks/mailbox.js) ----------
-- The GM posts an update (title + text) from a Mailbox; every player's Mailbox shows its flag up until they read it.
-- Everyone signed in can read them; only GMs post or remove. Safe to run more than once.
create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  title text not null default '',
  body text not null,
  by_name text,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to authenticated;
drop policy if exists "announcements: read" on public.announcements;
create policy "announcements: read" on public.announcements for select to authenticated using (true);
create or replace function public.post_announcement(p_title text, p_body text)
returns bigint language plpgsql security definer set search_path = public as $$
declare t text; b text; nid bigint;
begin
  if not public.is_gm() then raise exception 'Only the GM can post updates' using errcode = '42501'; end if;
  t := left(btrim(regexp_replace(coalesce(p_title, ''), '[[:cntrl:]]', ' ', 'g')), 60);
  b := left(btrim(coalesce(p_body, '')), 600);
  if b = '' then raise exception 'Write the update first' using errcode = 'P0001'; end if;
  insert into public.announcements (title, body, by_name) values (t, b, public.my_name()) returning id into nid;
  return nid;
end $$;
create or replace function public.delete_announcement(p_id bigint)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gm() then raise exception 'Only the GM can remove updates' using errcode = '42501'; end if;
  delete from public.announcements where id = p_id;
  return 'ok';
end $$;
grant execute on function public.post_announcement(text, text), public.delete_announcement(bigint) to authenticated;

-- ---------- NEWS (owner, Nov 9 2026; www/js/ui/news.js) ----------
-- The GM's news papers: a title, the text, 'update' or 'event', and a picture (a small JPEG data URL made in the game,
-- at most 400,000 characters). Players get the newest unseen one as a pop-up when they come into their lobby, and all
-- of them in the scroll list under the menu button. Everyone signed in reads them; only GMs post or remove. Safe to
-- run more than once.
create table if not exists public.news (
  id bigint generated always as identity primary key,
  title text not null default '',
  body text not null default '',
  kind text not null default 'update',
  img text,
  has_img boolean generated always as (img is not null) stored,
  by_name text,
  created_at timestamptz not null default now()
);
alter table public.news enable row level security;
revoke all on public.news from anon, authenticated;
grant select on public.news to authenticated;
drop policy if exists "news: read" on public.news;
create policy "news: read" on public.news for select to authenticated using (true);
create or replace function public.post_news(p_title text, p_body text, p_kind text, p_img text)
returns bigint language plpgsql security definer set search_path = public as $$
declare t text; b text; k text; nid bigint;
begin
  if not public.is_gm() then raise exception 'Only the GM can post news' using errcode = '42501'; end if;
  t := left(btrim(regexp_replace(coalesce(p_title, ''), '[[:cntrl:]]', ' ', 'g')), 60);
  b := left(btrim(coalesce(p_body, '')), 1500);
  k := case when p_kind = 'event' then 'event' else 'update' end;
  if t = '' and b = '' then raise exception 'Write the news first' using errcode = 'P0001'; end if;
  if p_img is not null and (length(p_img) > 400000 or p_img !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$') then
    raise exception 'That picture is too big or not a picture' using errcode = 'P0001';
  end if;
  insert into public.news (title, body, kind, img, by_name) values (t, b, k, p_img, public.my_name()) returning id into nid;
  return nid;
end $$;
create or replace function public.delete_news(p_id bigint)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_gm() then raise exception 'Only the GM can remove news' using errcode = '42501'; end if;
  delete from public.news where id = p_id;
  return 'ok';
end $$;
revoke execute on function public.post_news(text, text, text, text), public.delete_news(bigint) from public, anon;
grant execute on function public.post_news(text, text, text, text), public.delete_news(bigint) to authenticated;

-- ---------- MAILBOX LETTERS (owner, Oct 25 2026; www/js/blocks/mailbox.js) ----------
-- Anyone signed in can put a letter (subject, text and up to 5 items) in a Mailbox (block 208) of a LOCKED world; it
-- is for the world's owner. Everyone sees who sent each letter and its subject; only the owner gets the text and the
-- items (Claim takes them out once), marks it read and deletes it (only once its items are claimed).
-- At most 50 letters per Mailbox, one letter every 5 seconds per player. Safe to run more than once.
create table if not exists public.mailbox_letters (
  id bigint generated always as identity primary key,
  world text not null,
  tile integer not null,
  from_id uuid not null,
  from_name text not null,
  subject text not null default '',
  body text not null default '',
  items jsonb not null default '[]'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists mailbox_letters_world on public.mailbox_letters (world, tile);
create index if not exists mailbox_letters_from on public.mailbox_letters (from_id, created_at);
alter table public.mailbox_letters enable row level security;
revoke all on public.mailbox_letters from anon, authenticated;
-- is the caller the owner of this world?
create or replace function public.mailbox_mine(p_world text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.worlds w where w.name = p_world and w.owner is not null
    and lower(w.owner) = lower(public.my_name()));
$$;
create or replace function public.mailbox_list(p_world text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare mine boolean;
begin
  if public.my_name() is null or public.is_banned() then return '[]'::jsonb; end if;
  mine := public.mailbox_mine(p_world);
  return coalesce((select jsonb_agg(case when mine then
      jsonb_build_object('id', l.id, 'tile', l.tile, 'n', l.from_name, 's', l.subject, 'at', l.created_at,
        'b', l.body, 'items', l.items, 'r', l.is_read)
    else jsonb_build_object('id', l.id, 'tile', l.tile, 'n', l.from_name, 's', l.subject, 'at', l.created_at,
        'k', jsonb_array_length(l.items)) end order by l.id desc)
    from public.mailbox_letters l where l.world = p_world), '[]'::jsonb);
end $$;
create or replace function public.mailbox_send(p_world text, p_tile integer, p_subject text, p_body text, p_items jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); w public.worlds; t integer; s text; b text; e jsonb; clean jsonb := '[]'::jsonb;
  n integer; nid bigint;
begin
  if me is null or public.is_banned() then raise exception 'You can''t send mail' using errcode = '42501'; end if;
  select * into w from public.worlds where name = p_world;
  if not found then raise exception 'This world isn''t saved yet' using errcode = 'P0001'; end if;
  if w.owner is null then raise exception 'Nobody gets mail here: the world isn''t locked' using errcode = 'P0001'; end if;
  begin
    t := get_byte(decode(w.data ->> 'fg', 'base64'), p_tile);
  exception when others then t := -1;
  end;
  if t <> 208 then raise exception 'There is no Mailbox there' using errcode = 'P0001'; end if;
  s := left(btrim(regexp_replace(coalesce(p_subject, ''), '[[:cntrl:]]', ' ', 'g')), 40);
  b := left(btrim(coalesce(p_body, '')), 300);
  if s = '' then raise exception 'Write a subject first' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_items) = 'array' then
    if jsonb_array_length(p_items) > 5 then raise exception 'At most 5 items' using errcode = 'P0001'; end if;
    for e in select * from jsonb_array_elements(p_items) loop
      if jsonb_typeof(e) <> 'array' or coalesce(e ->> 0, '') !~ '^[a-z0-9_]{1,40}$'
        or jsonb_typeof(e -> 1) <> 'number' or (e ->> 1)::numeric < 1 or (e ->> 1)::numeric > 200 then
        raise exception 'Bad item' using errcode = 'P0001';
      end if;
      clean := clean || jsonb_build_array(jsonb_build_array(e ->> 0, floor((e ->> 1)::numeric)::integer));
    end loop;
  end if;
  select count(*) into n from public.mailbox_letters where from_id = auth.uid() and created_at > now() - interval '5 seconds';
  if n > 0 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  select count(*) into n from public.mailbox_letters where world = p_world and tile = p_tile;
  if n >= 50 then raise exception 'This Mailbox is full' using errcode = 'P0001'; end if;
  insert into public.mailbox_letters (world, tile, from_id, from_name, subject, body, items)
    values (p_world, p_tile, auth.uid(), me, s, b, clean) returning id into nid;
  return nid;
end $$;
-- the owner takes the items out (once): returns them
create or replace function public.mailbox_claim(p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare l public.mailbox_letters;
begin
  select * into l from public.mailbox_letters where id = p_id for update;
  if not found then raise exception 'That letter is gone' using errcode = 'P0001'; end if;
  if not public.mailbox_mine(l.world) then raise exception 'This mail isn''t yours' using errcode = '42501'; end if;
  update public.mailbox_letters set items = '[]'::jsonb, is_read = true where id = p_id;
  return l.items;
end $$;
create or replace function public.mailbox_read(p_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare wn text;
begin
  select world into wn from public.mailbox_letters where id = p_id;
  if wn is null or not public.mailbox_mine(wn) then raise exception 'This mail isn''t yours' using errcode = '42501'; end if;
  update public.mailbox_letters set is_read = true where id = p_id;
  return 'ok';
end $$;
create or replace function public.mailbox_delete(p_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare l public.mailbox_letters;
begin
  select * into l from public.mailbox_letters where id = p_id for update;
  if not found then return 'ok'; end if;
  if not public.mailbox_mine(l.world) then raise exception 'This mail isn''t yours' using errcode = '42501'; end if;
  if jsonb_array_length(l.items) > 0 then raise exception 'Claim the items first' using errcode = 'P0001'; end if;
  delete from public.mailbox_letters where id = p_id;
  return 'ok';
end $$;
revoke execute on function public.mailbox_mine(text) from public, anon;
grant execute on function public.mailbox_list(text), public.mailbox_send(text, integer, text, text, jsonb),
  public.mailbox_claim(bigint), public.mailbox_read(bigint), public.mailbox_delete(bigint) to authenticated;

-- ---------- GLOBAL CHAT (owner, Oct 25 2026; www/js/online/globalchat.js) ----------
-- Everyone sees the Global Chat panel. Sending a broadcast uses up one Microphone (Shop item, tracked in
-- owned_items; GMs send for free). The server puts the real name and the sender's world on it, keeps the newest 200,
-- and sends it live on the 'global' topic (players can only listen there; the receive policy above allows it).
-- At most one broadcast every 3 seconds per player. Safe to run more than once.
create table if not exists public.global_chat (
  id bigint generated always as identity primary key,
  from_id uuid not null,
  from_name text not null,
  world text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists global_chat_from on public.global_chat (from_id, created_at);
alter table public.global_chat enable row level security;
revoke all on public.global_chat from anon, authenticated;
grant select on public.global_chat to authenticated;
drop policy if exists "global chat: read" on public.global_chat;
create policy "global chat: read" on public.global_chat for select to authenticated using (not public.is_banned());
create or replace function public.send_broadcast(p_text text, p_world text)
returns bigint language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); t text; w text; n integer; nid bigint;
begin
  if me is null or public.is_banned() then raise exception 'You can''t broadcast' using errcode = '42501'; end if;
  t := left(btrim(regexp_replace(coalesce(p_text, ''), '[[:cntrl:]]', ' ', 'g')), 120);
  if t = '' then raise exception 'Write something first' using errcode = 'P0001'; end if;
  select count(*) into n from public.global_chat where from_id = auth.uid() and created_at > now() - interval '3 seconds';
  if n > 0 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  perform public.use_owned('microphone'); -- one Microphone per broadcast (GMs: free); none = an error
  w := case when coalesce(p_world, '') ~ '^[A-Z0-9]{1,16}$' then p_world else '' end;
  insert into public.global_chat (from_id, from_name, world, body) values (auth.uid(), me, w, t) returning id into nid;
  delete from public.global_chat where id < nid - 200;
  begin
    perform realtime.send(jsonb_build_object('id', nid, 'u', auth.uid(), 'n', me, 'w', w, 't', t), 'g', 'global', true);
  exception when others then null; -- (the game also reads the table every few seconds)
  end;
  return nid;
end $$;
grant execute on function public.send_broadcast(text, text) to authenticated;

-- ---------- PLAYER NAMES OVER HEADS (Oct 25 2026, build t; who is online, build u) ----------
-- A position message carries the sender's id and name, both written by the sender's game, so a changed game could
-- show any name over its head. Now receivers ask the server for the name of each id they see (`world_names`), and
-- the server only answers for players who really said hello in THIS world in the last 75 s (`world_hello`, sent on
-- joining a world and every 20 s after; the game: net.js `realNames`). A message with someone else's id is ignored
-- unless that player is really here. The game says hello every 20 s wherever it is (world '' = own lobby / PLAY
-- screen), so `online_people` is also the list of who is online and where.
create table if not exists public.world_here (
  player_id uuid primary key references auth.users (id) on delete cascade,
  world text not null,
  at timestamptz not null default now()
);
-- time online today (Manila day), added up from the hellos: never more than the real time between them
alter table public.world_here add column if not exists play_day date;
alter table public.world_here add column if not exists play_secs integer not null default 0;
alter table public.world_here enable row level security;
revoke all on public.world_here from anon, authenticated;

create or replace function public.world_hello(p_world text)
returns void language plpgsql security definer set search_path = public as $$
declare w text := case when coalesce(p_world, '') ~ '^[A-Z0-9]{1,16}$' then p_world else '' end;
begin
  if auth.uid() is null or public.my_name() is null or public.is_banned() then return; end if;
  if w <> '' and public.world_banned(w) then w := ''; end if;
  -- '' = online but in no shared world (own lobby, the PLAY screen)
  insert into public.world_here (player_id, world, at, play_day, play_secs)
  values (auth.uid(), w, now(), (now() at time zone 'Asia/Manila')::date, 0)
  on conflict (player_id) do update set
    world = excluded.world,
    at = excluded.at,
    play_day = excluded.play_day,
    -- the time since the last hello counts (at most 30 s: hellos come every 20 s; a longer gap = was offline)
    play_secs = case when world_here.play_day is distinct from excluded.play_day then 0 else world_here.play_secs end
      + case when world_here.at > now() - interval '60 seconds'
             then least(30, floor(extract(epoch from (now() - world_here.at))))::integer else 0 end;
end $$;
-- seconds online today (0 when not seen today)
create or replace function public.played_today(p_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((select play_secs from public.world_here
                   where player_id = p_id and play_day = (now() at time zone 'Asia/Manila')::date), 0)
$$;
-- said hello in the last 75 s (online now)
create or replace function public.online_now(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.world_here where player_id = p_id and at > now() - interval '75 seconds')
$$;
revoke all on function public.played_today(uuid), public.online_now(uuid) from public, anon, authenticated;

create or replace function public.world_names(p_world text, p_ids uuid[])
returns table (id uuid, name text) language sql stable security definer set search_path = public as $$
  select u.id, u.name
  from public.usernames u join public.world_here h on h.player_id = u.id
  where u.id = any ((coalesce(p_ids, '{}'::uuid[]))[1:60])
    and h.world = p_world and p_world <> '' and h.at > now() - interval '75 seconds'
$$;
-- everyone online (said hello in the last 75 s) and the world they are in ('' = none): the game's Net.people, used for
-- the player limit of a world, friends online and "is X online" (was the lobby channel's presence, which any game
-- could fill with made-up names and worlds)
create or replace function public.online_people()
returns table (id uuid, name text, world text) language sql stable security definer set search_path = public as $$
  select u.id, u.name, h.world
  from public.world_here h join public.usernames u on u.id = h.player_id
  where h.at > now() - interval '75 seconds' and auth.uid() is not null
  order by h.at desc
  limit 2000
$$;
revoke all on function public.world_hello(text), public.world_names(text, uuid[]), public.online_people() from public, anon;
grant execute on function public.world_hello(text), public.world_names(text, uuid[]), public.online_people() to authenticated;

-- ---------- Red / Blue Lock: days its owner has been away (Nov 11 2026, build u; www/js/world/alockaway.js) ----------
-- Last online = the newest of the player's last hello (world_here.at) and last save (players.updated_at: players who
-- haven't played since hellos began). null = no player by that name (deleted; renames update the locks' owner).
create or replace function public.days_away(p_name text)
returns integer language sql stable security definer set search_path = public as $$
  select floor(extract(epoch from (now() - greatest(h.at, p.updated_at))) / 86400)::integer
  from public.usernames u
  left join public.world_here h on h.player_id = u.id
  left join public.players p on p.id = u.id
  where lower(u.name) = lower(p_name)
  limit 1
$$;
-- 1000+ days away: anyone may break the lock (alock_guard)
create or replace function public.alock_abandoned(p_owner text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(p_owner, '') <> '' and coalesce(public.days_away(p_owner) >= 1000, false)
$$;
-- the game asks for the owners of the locks in a world (at most 60 names)
create or replace function public.alock_days_away(p_names text[])
returns table (name text, days integer) language sql stable security definer set search_path = public as $$
  select n, public.days_away(n)
  from unnest((coalesce(p_names, '{}'::text[]))[1:60]) n
  where auth.uid() is not null
$$;
revoke all on function public.days_away(text), public.alock_abandoned(text), public.alock_days_away(text[]) from public, anon;
grant execute on function public.alock_days_away(text[]) to authenticated;

-- ---------- PRIVATE MESSAGES, FRIEND REQUESTS, TRADES, GIFTS THROUGH THE SERVER (Oct 25 2026, build v) ----------
-- These used to be broadcast by the sender's game on the shared 'lobby' channel: everyone there could read them and
-- the sender's id / name were whatever that game wrote. Now the game calls lobby_send; the server puts the REAL
-- sender on it (from = auth.uid(), fn = the real name) and sends it on 'inbox:<receiver id>', which only that player
-- can listen to (realtime rules above) and only the server can send to. The game ignores the old lobby broadcasts once
-- its inbox is joined (net.js `iJoined`). Gold / items in trades are still settled by trade_gold / give_item.
create table if not exists public.lobby_sent (
  id bigint generated always as identity primary key,
  from_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists lobby_sent_from on public.lobby_sent (from_id, created_at);
alter table public.lobby_sent enable row level security;
revoke all on public.lobby_sent from anon, authenticated;
create or replace function public.lobby_send(p_event text, p_to uuid, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); d jsonb; n integer;
begin
  if me is null or public.is_banned() then raise exception 'You can''t send messages' using errcode = '42501'; end if;
  if p_event is null or p_event not in ('dm', 'friend_req', 'friend_ok', 'friend_no', 'gift', 'gift_ok', 'gift_no',
      'trade_req', 'trade_yes', 'trade_no', 'trade_offer', 'trade_accept', 'trade_cancel', 'mail_ping', 'gold_done') then
    raise exception 'Unknown message' using errcode = 'P0001';
  end if;
  if p_to is null or p_to = auth.uid() or not exists (select 1 from public.usernames where id = p_to) then
    raise exception 'No such player' using errcode = 'P0001';
  end if;
  d := case when jsonb_typeof(p_data) = 'object' then p_data else '{}'::jsonb end;
  if length(d::text) > 4000 then raise exception 'Message too big' using errcode = 'P0001'; end if;
  if p_event = 'dm' then
    d := jsonb_set(d, '{text}', to_jsonb(left(btrim(regexp_replace(coalesce(d ->> 'text', ''), '[[:cntrl:]]', ' ', 'g')), 120)));
    if d ->> 'text' = '' then raise exception 'Write something first' using errcode = 'P0001'; end if;
  end if;
  -- at most 40 in 10 s (a trade sends a few at once)
  select count(*) into n from public.lobby_sent where from_id = auth.uid() and created_at > now() - interval '10 seconds';
  if n >= 40 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  insert into public.lobby_sent (from_id) values (auth.uid());
  delete from public.lobby_sent where created_at < now() - interval '1 minute';
  d := (d - 'to' - 'from' - 'fn') || jsonb_build_object('to', p_to, 'from', auth.uid(), 'fn', me);
  perform realtime.send(d, p_event, 'inbox:' || p_to::text, true);
end $$;
revoke all on function public.lobby_send(text, uuid, jsonb) from public, anon;
grant execute on function public.lobby_send(text, uuid, jsonb) to authenticated;

-- =====================================================================================================
-- SECURITY FIXES (Oct 27 2026, from the audit). Safe to run more than once.
--   * visitor_drops: a visitor's save can't wipe or rewrite a locked world's floating drops any more
--   * trade_settle: a trade's gold AND Shop-only items move on the server in one go, or nothing moves
--   * mailbox_send / mailbox_claim: Shop-only items in a letter must really be owned, and move with it
--   * my_owned: how many of a Shop-only item the server says you have (gifts check it)
-- =====================================================================================================

-- a drop in a world save: [uid, id, qty, x, y, born (ms), by (name or 0), ck?]
create or replace function public.drop_ok(d jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(d) = 'array' and jsonb_array_length(d) between 7 and 8
    and jsonb_typeof(d -> 0) = 'string' and length(d ->> 0) between 1 and 40
    and coalesce(d ->> 1, '') ~ '^[a-z0-9_]{1,40}$'
    and jsonb_typeof(d -> 2) = 'number' and (d ->> 2)::numeric between 1 and 999999
    and jsonb_typeof(d -> 3) = 'number' and jsonb_typeof(d -> 4) = 'number' and jsonb_typeof(d -> 5) = 'number'
$$;
-- A visitor (can't build in this locked world) saves the world: which floating drops are kept.
--   * a saved drop the visitor's list no longer has (picked up) only goes if the visitor could take it:
--     dropped by them, or older than the 15 s owner-only time (DROP_LOCK_MS); otherwise it stays
--   * a saved drop that is still there keeps its SAVED item, amount and place (a visitor can't change it),
--     except the visitor's own drops (more fell on their pile)
--   * a new drop is always marked as the visitor's own (by = their name) and can't be dated in the past
--   * at most 2000 in all (Nov 6 2026: was 400 = MAX_DROPS, now 1200 + room), anything malformed is skipped
--   (lookups go through jsonb objects and the list is built as an array, so a big list stays quick)
create or replace function public.visitor_drops(p_old jsonb, p_new jsonb, p_me text)
returns jsonb language plpgsql stable as $$
declare
  nowms numeric := floor(extract(epoch from clock_timestamp()) * 1000);
  o jsonb; n jsonb; outa jsonb[] := '{}'; newm jsonb; oldm jsonb; mine boolean;
begin
  if jsonb_typeof(p_old) is distinct from 'array' then p_old := '[]'; end if;
  if jsonb_typeof(p_new) is distinct from 'array' then p_new := '[]'; end if;
  -- uid -> the visitor's copy (the first one with that uid), and the uids already saved
  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into newm from (
    select distinct on (x ->> 0) x ->> 0 as k, x as v from jsonb_array_elements(p_new) with ordinality t(x, pos)
    where jsonb_typeof(x) = 'array' and (x ->> 0) is not null order by x ->> 0, t.pos) s;
  select coalesce(jsonb_object_agg(o2 ->> 0, true), '{}'::jsonb) into oldm
    from jsonb_array_elements(p_old) o2 where jsonb_typeof(o2) = 'array' and (o2 ->> 0) is not null;
  for o in select * from jsonb_array_elements(p_old) loop
    if jsonb_typeof(o) <> 'array' then continue; end if;
    n := case when (o ->> 0) is null then null else newm -> (o ->> 0) end;
    mine := jsonb_typeof(o -> 6) = 'string' and lower(o ->> 6) = lower(p_me);
    if n is null then
      -- taken: allowed only for a drop this visitor may pick up
      if not (mine or nowms - public.jnum(o -> 5) >= 15000) then outa := outa || o; end if;
    elsif mine and public.drop_ok(n) then
      outa := outa || jsonb_set(n, '{6}', o -> 6);
    else
      outa := outa || o;
    end if;
  end loop;
  for n in select x from jsonb_array_elements(p_new) with ordinality t(x, ord) order by t.ord loop
    if coalesce(array_length(outa, 1), 0) >= 2000 then exit; end if;
    if not public.drop_ok(n) or oldm ? (n ->> 0) then continue; end if;
    oldm := oldm || jsonb_build_object(n ->> 0, true); -- (a uid twice in the new list counts once)
    n := jsonb_set(n, '{6}', to_jsonb(p_me));
    n := jsonb_set(n, '{5}', to_jsonb(least(public.jnum(n -> 5), nowms::bigint)));
    outa := outa || n;
  end loop;
  return to_jsonb(outa);
end $$;
revoke execute on function public.visitor_drops(jsonb, jsonb, text) from public, anon, authenticated;

-- ---------- trades: one server call settles both sides ----------
-- Both games call trade_settle(other player, what I give, what I get) with the offers they both accepted
-- ([{id, qty}], up to 6). Answers r = 'waiting', 'done' or 'failed' (+ why). The first call waits; the matching second call checks that both sides really have the
-- gold (wallets) and Shop-only items (owned_items) and moves all of it in ONE transaction, or nothing. The first
-- game keeps calling with the same offers until it hears 'done' (or 'failed'). Other items live in the saves and
-- are moved by the games once the server says 'done'. Offers older than 2 minutes are dropped.
create table if not exists public.trade_offers (
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  give jsonb not null,
  get jsonb not null,
  status text not null default 'waiting',
  why text,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id)
);
alter table public.trade_offers enable row level security;
revoke all on public.trade_offers from anon, authenticated;
-- [{id, qty}, ...] -> {"id": total, ...} (bad lists raise)
create or replace function public.trade_norm(p jsonb)
returns jsonb language plpgsql immutable as $$
declare e jsonb; outo jsonb := '{}'::jsonb; q numeric;
begin
  if p is null or jsonb_typeof(p) = 'null' then return outo; end if;
  if jsonb_typeof(p) <> 'array' or jsonb_array_length(p) > 6 then raise exception 'Bad trade offer'; end if;
  for e in select * from jsonb_array_elements(p) loop
    if jsonb_typeof(e) <> 'object' or coalesce(e ->> 'id', '') !~ '^[a-z0-9_]{1,40}$' or jsonb_typeof(e -> 'qty') <> 'number' then
      raise exception 'Bad trade offer';
    end if;
    q := floor((e ->> 'qty')::numeric);
    if q < 1 or q > 1000000000 then raise exception 'Bad trade offer'; end if;
    outo := jsonb_set(outo, array[e ->> 'id'], to_jsonb(public.jnum(outo -> (e ->> 'id')) + q::bigint));
  end loop;
  return outo;
end $$;
-- can this player give this side of a trade? (null = yes, else the reason)
create or replace function public.trade_lack(p_id uuid, p_give jsonb)
returns text language plpgsql stable security definer set search_path = public as $$
declare k text; q bigint; have bigint;
begin
  for k, q in select key, public.jnum(value) from jsonb_each(p_give) loop
    if k = 'gold' then
      select gold into have from public.wallets where id = p_id;
      if coalesce(have, 0) < q then return 'Not enough gold for this trade'; end if;
    elsif public.is_tracked(k) then
      select qty into have from public.owned_items where player_id = p_id and item = k;
      if coalesce(have, 0) < q then return 'Not enough ' || k || ' for this trade'; end if;
    end if;
    have := null;
  end loop;
  return null;
end $$;
-- move one side's gold / Shop-only items from a to b (checked before)
create or replace function public.trade_move(a uuid, b uuid, p_give jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare k text; q bigint;
begin
  for k, q in select key, public.jnum(value) from jsonb_each(p_give) loop
    if k = 'gold' then
      update public.wallets set gold = gold - q where id = a;
      update public.wallets set gold = gold + q where id = b;
    elsif public.is_tracked(k) then
      perform public.add_owned(a, k, -q);
      perform public.add_owned(b, k, q);
    end if;
  end loop;
end $$;
revoke execute on function public.trade_lack(uuid, jsonb), public.trade_move(uuid, uuid, jsonb) from public, anon, authenticated;
create or replace function public.trade_settle(p_with uuid, p_give jsonb, p_get jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); g jsonb; t jsonb; o public.trade_offers; mine public.trade_offers; v_why text; w public.wallets;
begin
  if me is null or public.is_banned() or p_with = me or not exists (select 1 from public.usernames where id = p_with) then
    raise exception 'Can''t trade with that player';
  end if;
  g := public.trade_norm(p_give);
  t := public.trade_norm(p_get);
  delete from public.trade_offers where created_at < now() - interval '2 minutes';
  -- already settled by the other side (we were waiting)?
  select * into mine from public.trade_offers where from_id = me and to_id = p_with;
  if found and mine.give = g and mine.get = t and mine.status <> 'waiting' then
    delete from public.trade_offers where from_id = me and to_id = p_with;
    if mine.status = 'failed' then return jsonb_build_object('r', 'failed', 'why', coalesce(mine.why, 'The trade didn''t go through')); end if;
    select * into w from public.wallets where id = me;
    return jsonb_build_object('r', 'done', 'gold', w.gold, 'held', w.held, 'bc', w.bc);
  end if;
  select * into o from public.trade_offers where from_id = p_with and to_id = me and status = 'waiting' for update;
  if not found or o.give <> t or o.get <> g then
    insert into public.trade_offers (from_id, to_id, give, get) values (me, p_with, g, t)
    on conflict (from_id, to_id) do update set give = excluded.give, get = excluded.get, status = 'waiting', why = null, created_at = now();
    return jsonb_build_object('r', 'waiting');
  end if;
  -- both agree: lock both wallets in id order, check both sides, move everything
  insert into public.wallets (id) values (me), (p_with) on conflict do nothing;
  perform 1 from public.wallets where id in (me, p_with) order by id for update;
  perform 1 from public.owned_items where player_id in (me, p_with) order by player_id, item for update;
  v_why := coalesce(public.trade_lack(me, g), public.trade_lack(p_with, t));
  if v_why is not null and not public.is_gm() then
    -- (returned, not raised: the other game has to see 'failed' when it asks again)
    update public.trade_offers set status = 'failed', why = v_why where from_id = p_with and to_id = me;
    return jsonb_build_object('r', 'failed', 'why', v_why);
  end if;
  perform public.trade_move(me, p_with, g);
  perform public.trade_move(p_with, me, t);
  update public.trade_offers set status = 'done' where from_id = p_with and to_id = me;
  select * into w from public.wallets where id = me;
  return jsonb_build_object('r', 'done', 'gold', w.gold, 'held', w.held, 'bc', w.bc);
end $$;
grant execute on function public.trade_settle(uuid, jsonb, jsonb) to authenticated;

-- how many of a Shop-only item the server counts for the caller (-1: not a counted item)
create or replace function public.my_owned(p_item text)
returns bigint language sql stable security definer set search_path = public as $$
  select case when not public.is_tracked(p_item) then -1
    else coalesce((select qty from public.owned_items where player_id = auth.uid() and item = p_item), 0) end
$$;
grant execute on function public.my_owned(text) to authenticated;

-- ---------- Mailbox: Shop-only items in a letter must be owned, and move with it ----------
create or replace function public.mailbox_send(p_world text, p_tile integer, p_subject text, p_body text, p_items jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); w public.worlds; t integer; s text; b text; e jsonb; clean jsonb := '[]'::jsonb;
  n integer; nid bigint; have bigint; gm boolean := public.is_gm();
begin
  if me is null or public.is_banned() then raise exception 'You can''t send mail' using errcode = '42501'; end if;
  select * into w from public.worlds where name = p_world;
  if not found then raise exception 'This world isn''t saved yet' using errcode = 'P0001'; end if;
  if w.owner is null then raise exception 'Nobody gets mail here: the world isn''t locked' using errcode = 'P0001'; end if;
  begin
    t := get_byte(decode(w.data ->> 'fg', 'base64'), p_tile);
  exception when others then t := -1;
  end;
  if t <> 208 then raise exception 'There is no Mailbox there' using errcode = 'P0001'; end if;
  s := left(btrim(regexp_replace(coalesce(p_subject, ''), '[[:cntrl:]]', ' ', 'g')), 40);
  b := left(btrim(coalesce(p_body, '')), 300);
  if s = '' then raise exception 'Write a subject first' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_items) = 'array' then
    if jsonb_array_length(p_items) > 5 then raise exception 'At most 5 items' using errcode = 'P0001'; end if;
    for e in select * from jsonb_array_elements(p_items) loop
      if jsonb_typeof(e) <> 'array' or coalesce(e ->> 0, '') !~ '^[a-z0-9_]{1,40}$'
        or jsonb_typeof(e -> 1) <> 'number' or (e ->> 1)::numeric < 1 or (e ->> 1)::numeric > 200 then
        raise exception 'Bad item' using errcode = 'P0001';
      end if;
      clean := clean || jsonb_build_array(jsonb_build_array(e ->> 0, floor((e ->> 1)::numeric)::integer));
    end loop;
  end if;
  select count(*) into n from public.mailbox_letters where from_id = auth.uid() and created_at > now() - interval '5 seconds';
  if n > 0 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  select count(*) into n from public.mailbox_letters where world = p_world and tile = p_tile;
  if n >= 50 then raise exception 'This Mailbox is full' using errcode = 'P0001'; end if;
  -- Shop-only items: out of the sender's server count (the letter holds them now)
  for e in select * from jsonb_array_elements(clean) loop
    if public.is_tracked(e ->> 0) and not gm then
      select qty into have from public.owned_items where player_id = auth.uid() and item = e ->> 0 for update;
      if coalesce(have, 0) < (e ->> 1)::bigint then raise exception 'You don''t have that many %', e ->> 0 using errcode = 'P0001'; end if;
      perform public.add_owned(auth.uid(), e ->> 0, -((e ->> 1)::bigint));
      have := null;
    end if;
  end loop;
  insert into public.mailbox_letters (world, tile, from_id, from_name, subject, body, items)
    values (p_world, p_tile, auth.uid(), me, s, b, clean) returning id into nid;
  return nid;
end $$;
create or replace function public.mailbox_claim(p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare l public.mailbox_letters; e jsonb;
begin
  select * into l from public.mailbox_letters where id = p_id for update;
  if not found then raise exception 'That letter is gone' using errcode = 'P0001'; end if;
  if not public.mailbox_mine(l.world) then raise exception 'This mail isn''t yours' using errcode = '42501'; end if;
  update public.mailbox_letters set items = '[]'::jsonb, is_read = true where id = p_id;
  for e in select * from jsonb_array_elements(l.items) loop
    if public.is_tracked(e ->> 0) then perform public.add_owned(auth.uid(), e ->> 0, (e ->> 1)::bigint); end if;
  end loop;
  return l.items;
end $$;
-- stop waiting for a trade (cancelled, or the other side never came): 'gone' = nothing will move any more,
-- 'done' / 'failed' = the other side already settled it just before (the game then finishes / drops it)
create or replace function public.trade_unsettle(p_with uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare mine public.trade_offers; w public.wallets;
begin
  if auth.uid() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  delete from public.trade_offers where from_id = auth.uid() and to_id = p_with returning * into mine;
  if not found or mine.status = 'waiting' then return jsonb_build_object('r', 'gone'); end if;
  if mine.status = 'failed' then return jsonb_build_object('r', 'failed', 'why', mine.why); end if;
  select * into w from public.wallets where id = auth.uid();
  return jsonb_build_object('r', 'done', 'gold', w.gold, 'held', w.held, 'bc', w.bc);
end $$;
grant execute on function public.trade_unsettle(uuid) to authenticated;

-- ---------- gifts of Shop-only items: held by the server on the way ----------
-- gift_send takes them out of the sender's count (must really own them); the receiver's game gets them only through
-- gift_take (the server says what and how many); a refused / lost gift goes back with gift_back. Whoever is first
-- wins, so a gift is never both taken and given back.
create table if not exists public.gift_escrow (
  id bigint generated always as identity primary key,
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  item text not null,
  qty bigint not null check (qty > 0),
  created_at timestamptz not null default now()
);
alter table public.gift_escrow enable row level security;
revoke all on public.gift_escrow from anon, authenticated;
create or replace function public.gift_send(p_to uuid, p_item text, p_qty bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare had bigint; nid bigint;
begin
  if auth.uid() is null or public.is_banned() or p_to = auth.uid() or not exists (select 1 from public.usernames where id = p_to) then
    raise exception 'Can''t give that player items';
  end if;
  if not public.is_tracked(p_item) then return null; end if; -- an ordinary item: not held
  if p_qty is null or p_qty < 1 or p_qty > 100000 then raise exception 'Bad amount'; end if;
  if (select count(*) from public.gift_escrow where from_id = auth.uid() and created_at > now() - interval '10 seconds') >= 5 then
    raise exception 'Too many gifts, wait a moment' using errcode = 'P0001';
  end if;
  select qty into had from public.owned_items where player_id = auth.uid() and item = p_item for update;
  if coalesce(had, 0) < p_qty and not public.is_gm() then raise exception 'You don''t have that many' using errcode = 'P0001'; end if;
  if not public.is_gm() then perform public.add_owned(auth.uid(), p_item, -p_qty); end if;
  insert into public.gift_escrow (from_id, to_id, item, qty) values (auth.uid(), p_to, p_item, p_qty) returning id into nid;
  return nid;
end $$;
create or replace function public.gift_take(p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.gift_escrow;
begin
  delete from public.gift_escrow where id = p_id and to_id = auth.uid() returning * into g;
  if not found then return null; end if;
  perform public.add_owned(auth.uid(), g.item, g.qty);
  return jsonb_build_object('item', g.item, 'qty', g.qty, 'from', g.from_id);
end $$;
create or replace function public.gift_back(p_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare g public.gift_escrow;
begin
  delete from public.gift_escrow where id = p_id and (to_id = auth.uid() or from_id = auth.uid()) returning * into g;
  if not found then return 'gone'; end if; -- already taken (or never there)
  perform public.add_owned(g.from_id, g.item, g.qty);
  return 'back';
end $$;
grant execute on function public.gift_send(uuid, text, bigint), public.gift_take(bigint), public.gift_back(bigint) to authenticated;

-- =====================================================================================================
-- RECOVERY E-MAIL + FORGOT PASSWORD (Oct 27 2026, owner). Logins still use the made-up
-- name@players.balbtopia.app address; the player's REAL e-mail is kept here, only for password resets.
-- The "signup" Edge Function saves it at sign-up; players add / change theirs with set_my_email (Menu -> Profile).
-- The "password-reset" Edge Function (service role) sends a 6-digit code through Brevo and sets the new password.
-- Players can't read these tables directly.
-- =====================================================================================================
create table if not exists public.account_emails (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  updated_at timestamptz not null default now()
);
alter table public.account_emails enable row level security;
revoke all on public.account_emails from anon, authenticated;

create table if not exists public.password_resets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  tries int not null default 0,
  sent_at timestamptz not null default now()
);
alter table public.password_resets enable row level security;
revoke all on public.password_resets from anon, authenticated;

-- every code request, for the per-connection limit (hash of the IP only)
create table if not exists public.password_reset_log (
  ip_hash text not null,
  at timestamptz not null default now()
);
create index if not exists password_reset_log_ip on public.password_reset_log (ip_hash, at);
alter table public.password_reset_log enable row level security;
revoke all on public.password_reset_log from anon, authenticated;

create or replace function public.set_my_email(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if auth.uid() is null then raise exception 'Log in first' using errcode = 'P0001'; end if;
  if length(e) > 120 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'That e-mail doesn''t look right' using errcode = 'P0001';
  end if;
  if e like '%@players.balbtopia.app' then raise exception 'Use your real e-mail' using errcode = 'P0001'; end if;
  insert into public.account_emails (user_id, email) values (auth.uid(), e)
    on conflict (user_id) do update set email = excluded.email, updated_at = now();
end $$;
revoke execute on function public.set_my_email(text) from public, anon;
grant execute on function public.set_my_email(text) to authenticated;

-- your own recovery e-mail (null = none yet)
create or replace function public.my_email()
returns text language sql stable security definer set search_path = public as $$
  select email from public.account_emails where user_id = auth.uid()
$$;
revoke execute on function public.my_email() from public, anon;
grant execute on function public.my_email() to authenticated;


-- =====================================================================================================
-- WORLD READS (Oct 27 2026, owner): the worlds table can't be read directly any more (before, any signed-in player
-- could download every world with the API). Only these, one world (or a short named list) at a time:
--   load_world(name)          the world you are entering: { data, owner, lockv } or null (refused if banned there)
--   world_lock_info(name)     { lockv, owner, lock } of a world (lock version checks while you are in it)
--   world_infos(names[])      owner / last change / jammers of up to 60 NAMED worlds (your own world list)
--   my_worlds()               the worlds you own (Menu -> Worlds)
--   world_door_exists(w, id)  does world w have door #id (Mystery Door destinations)
-- =====================================================================================================
create or replace function public.load_world(p_name text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record;
begin
  if auth.uid() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if public.world_banned(p_name) then raise exception 'You are banned from this world' using errcode = '42501'; end if;
  select data, owner, lockv into r from public.worlds where name = p_name;
  if not found then return null; end if;
  return jsonb_build_object('data', r.data, 'owner', r.owner, 'lockv', r.lockv);
end $$;

create or replace function public.world_lock_info(p_name text)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then null else
    (select jsonb_build_object('lockv', w.lockv, 'owner', w.owner, 'lock', w.data -> 'lock') from public.worlds w where w.name = p_name)
  end
$$;

create or replace function public.world_infos(p_names text[])
returns table (name text, owner text, updated_at timestamptz, jam jsonb)
language sql stable security definer set search_path = public as $$
  select w.name, w.owner, w.updated_at, w.data -> 'jam'
  from public.worlds w
  where auth.uid() is not null
    and w.name = any (p_names[1:60])
$$;

create or replace function public.my_worlds()
returns table (name text, owner text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select w.name, w.owner, w.updated_at from public.worlds w
  where public.my_name() is not null and lower(w.owner) = lower(public.my_name())
  order by w.updated_at desc limit 100
$$;

-- door texts look like "#12 /WORLD#3 |label" (signs.js doorInfo)
create or replace function public.world_door_exists(p_world text, p_id integer)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.worlds w, jsonb_array_elements(case when jsonb_typeof(w.data -> 'signs') = 'array' then w.data -> 'signs' else '[]'::jsonb end) e
    where w.name = p_world and jsonb_typeof(e) = 'array' and (e ->> 1) ~ ('^#' || p_id::text || '([^0-9]|$)')
  )
$$;
-- (anyone can still ask whether a world NAME exists by trying to enter it, as before)
create or replace function public.world_exists(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (select 1 from public.worlds where name = p_name)
$$;

revoke execute on function public.load_world(text), public.world_lock_info(text), public.world_infos(text[]),
  public.my_worlds(), public.world_door_exists(text, integer), public.world_exists(text) from public, anon;
grant execute on function public.load_world(text), public.world_lock_info(text), public.world_infos(text[]),
  public.my_worlds(), public.world_door_exists(text, integer), public.world_exists(text) to authenticated;

-- ---------- SUBSCRIBERS (Nov 2 2026, owner) ----------
-- $1.99 a month through Google Play (not open yet: the game's SUBSCRIBE button says SOON). A subscriber gets a
-- SUBSCRIBER badge and 5 more skin colours (www/js/online/subscriber.js). This table is the truth; players can't write it.
-- For now a GM sets it (/sub NAME DAYS, /unsub NAME in the game's chat -> gm_set_sub). When Google Play billing is
-- added, a server function that checks the Play purchase token writes here too (source 'google_play').
create table if not exists public.subscriptions (
  id uuid primary key references auth.users (id) on delete cascade,
  until timestamptz not null,
  source text not null default 'gm',
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;

-- my subscription: { until } (null = not a subscriber or it ran out)
create or replace function public.my_subscription()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('until', (select s.until from public.subscriptions s where s.id = auth.uid() and s.until > now()))
  where auth.uid() is not null
$$;
-- which of these players are subscribers now (the badge in the wrench player menu)
create or replace function public.player_subs(p_ids uuid[])
returns table (id uuid) language sql stable security definer set search_path = public as $$
  select s.id from public.subscriptions s
  where auth.uid() is not null and s.until > now() and s.id = any ((coalesce(p_ids, '{}'::uuid[]))[1:60])
$$;
-- GM: p_days > 0 adds that many days (from now, or from the end of a subscription still running); 0 or less ends it
create or replace function public.gm_set_sub(p_name text, p_days integer)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare uid uuid; t timestamptz;
begin
  if not public.is_gm() then raise exception 'Only a GM can do that' using errcode = '42501'; end if;
  select id into uid from public.usernames where lower(name) = lower(p_name);
  if uid is null then raise exception 'No player called %', p_name; end if;
  if coalesce(p_days, 0) <= 0 then
    delete from public.subscriptions where id = uid;
    return null;
  end if;
  insert into public.subscriptions as s (id, until, source)
  values (uid, now() + make_interval(days => least(p_days, 3650)), 'gm')
  on conflict (id) do update
    set until = greatest(s.until, now()) + make_interval(days => least(p_days, 3650)), source = 'gm', updated_at = now()
  returning until into t;
  return t;
end $$;
revoke execute on function public.my_subscription(), public.player_subs(uuid[]), public.gm_set_sub(text, integer) from public, anon;
grant execute on function public.my_subscription(), public.player_subs(uuid[]), public.gm_set_sub(text, integer) to authenticated;
-- ==================== MOON EVENT (Nov 6 2026, owner) ====================
-- Every 3 days from 5:00 PM Manila (first: Nov 7 2026), for 24 hours (build f; builds d-e: every 6 hours for 2 h), the rockets in MOONEVENT fly players to the Moons (build y: 100 rockets 0-99 to MOON1 .. MOON5; was 200 to MOON, MOON1 .. MOON9; old seat numbers are folded into 0-99 by the game)
-- (rocket k -> Moon k / 20). One rocket per player per event, one player per rocket (the game: moonevent.js).
-- The schedule here must match moonevent.js: anchor Nov 7 2026 09:00 UTC = 5 PM Manila (1794042000000 ms; build d, was Nov 6 12:00 UTC), every 259200000 ms (3 days), open 86400000 ms (24 h) (build f; builds d-e: every 6 h from Nov 5)
-- `ev` counts the 3-day periods from the anchor.
create table if not exists public.moon_seats (
  ev integer not null,
  rocket integer not null check (rocket between 0 and 199),
  user_id uuid not null,
  name text not null,
  at timestamptz not null default now(),
  primary key (ev, rocket)
);
create unique index if not exists moon_seats_one_each on public.moon_seats (ev, user_id);
-- (build e) the player has landed on their Moon and is there with the rocket (it shows on that Moon's pad); false
-- again once they fly back in it
alter table public.moon_seats add column if not exists arrived boolean not null default false;
alter table public.moon_seats enable row level security;
revoke all on public.moon_seats from anon, authenticated;

create or replace function public.moon_event_now()
returns jsonb language sql stable as $$
  with t as (select floor(extract(epoch from clock_timestamp()) * 1000)::bigint as now_ms)
  select jsonb_build_object(
    'now', now_ms,
    'ev', floor((now_ms - 1794042000000)::numeric / 259200000)::int,
    'open', now_ms >= 1794042000000 and (now_ms - 1794042000000) % 259200000 < 86400000)
  from t
$$;
-- (build f) seats taken under the old 6-hour numbering carry event numbers that lie in the future now: gone
delete from public.moon_seats where ev > (public.moon_event_now() ->> 'ev')::int;
-- { now, ev, open, taken: [rockets used this event], arrived: [rockets on their Moon's pad now], mine: my rocket or null }
create or replace function public.moon_status()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  e jsonb := public.moon_event_now();
  cur integer := (e ->> 'ev')::int;
begin
  return e || jsonb_build_object(
    'taken', coalesce((select jsonb_agg(rocket order by rocket) from public.moon_seats where moon_seats.ev = cur), '[]'::jsonb),
    'arrived', coalesce((select jsonb_agg(rocket order by rocket) from public.moon_seats where moon_seats.ev = cur and arrived), '[]'::jsonb),
    'mine', (select to_jsonb(rocket) from public.moon_seats where moon_seats.ev = cur and user_id = auth.uid()));
end $$;
-- take a seat: { r: 'ok' | 'have' (you already have one: rocket) | 'taken' | 'closed', ev, rocket, now }
create or replace function public.moon_claim(p_rocket integer)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  e jsonb := public.moon_event_now();
  cur integer := (e ->> 'ev')::int;
  me uuid := auth.uid();
  nm text := public.my_name();
  have integer;
begin
  if me is null or nm is null then raise exception 'Log in first'; end if;
  if p_rocket is null or p_rocket < 0 or p_rocket > 199 then raise exception 'No such rocket'; end if;
  if not (e ->> 'open')::boolean then return jsonb_build_object('r', 'closed', 'ev', cur, 'now', e -> 'now'); end if;
  select rocket into have from public.moon_seats s where s.ev = cur and s.user_id = me;
  if have is not null then return jsonb_build_object('r', 'have', 'ev', cur, 'rocket', have, 'now', e -> 'now'); end if;
  begin
    insert into public.moon_seats (ev, rocket, user_id, name) values (cur, p_rocket, me, nm);
  exception when unique_violation then
    select rocket into have from public.moon_seats s where s.ev = cur and s.user_id = me;
    if have is not null then return jsonb_build_object('r', 'have', 'ev', cur, 'rocket', have, 'now', e -> 'now'); end if;
    return jsonb_build_object('r', 'taken', 'ev', cur, 'now', e -> 'now');
  end;
  delete from public.moon_seats s where s.ev < cur - 4; -- old events (12 days back)
  return jsonb_build_object('r', 'ok', 'ev', cur, 'rocket', p_rocket, 'now', e -> 'now');
end $$;
-- landed on my Moon (p_here true) or flew back from it in my rocket (false); answers moon_status
create or replace function public.moon_arrive(p_here boolean default true)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  cur integer := (public.moon_event_now() ->> 'ev')::int;
begin
  update public.moon_seats s set arrived = coalesce(p_here, true) where s.ev = cur and s.user_id = auth.uid();
  return public.moon_status();
end $$;
revoke execute on function public.moon_event_now(), public.moon_status(), public.moon_claim(integer), public.moon_arrive(boolean) from public, anon;
grant execute on function public.moon_event_now(), public.moon_status(), public.moon_claim(integer), public.moon_arrive(boolean) to authenticated;


-- ==================== SPLASH WARS (Nov 12 2026, owner; build g) ====================
-- The summer water gun event (www/js/events/rvb.js, SPLASH WARS section). Open every year March 15 00:00 to April 15
-- 23:59 Manila time. Players register in the SPLASHWARS world; THE SERVER makes the matches: 20 registered = a 10 v 10
-- at once, else 2+ once the first in line has waited 30 s. Each match gets its own new world 'SPW' + 6 letters /
-- digits (made by the game, never saved: save_world skips those names, and any row is deleted after the match).
-- Every game runs the match from `t0` on the server's clock: 10 s getting ready, 5 s countdown, 5 min playing, 8 s
-- result. After the end every player of the match reports the tiles he counted (spw_report); the server takes the
-- reports (once all of the match's players reported, or 15 s after the end with what came in): the side at least 2/3 of the
-- reports name wins (else a draw); every player of the winning team wins 5 Splash Tickets (a draw gives none). (build h)
-- The winners go to the SPLASHPRIZE world and take them from the Ticket Master (spw_prizes -> spw_claim -> spw_tickets);
-- the losers go to their own lobby. The exchange of tickets for items
-- comes later (the owner sends the price list).
-- The game's numbers must match these: SPW_PREP 10000, SPW_COUNT 5000, RVB_PLAY 300000, RVB_END 8000 (ms).
create table if not exists public.spw_queue (
  user_id uuid primary key,
  name text not null,
  at timestamptz not null default clock_timestamp(), -- when registered (the order of the queue)
  seen timestamptz not null default clock_timestamp() -- last spw_status / spw_register: gone 12 s = off the queue
);
alter table public.spw_queue enable row level security;
revoke all on public.spw_queue from anon, authenticated;
create table if not exists public.spw_matches (
  id text primary key check (id ~ '^SPW[A-Z0-9]{6}$'), -- = its world's name
  t0 timestamptz not null default clock_timestamp(),
  red text[] not null,
  blue text[] not null,
  red_ids uuid[] not null,
  blue_ids uuid[] not null,
  settled boolean not null default false,
  red_score integer,
  blue_score integer,
  winner text -- 'r', 'b' or 'd' (draw / nobody reported)
);
alter table public.spw_matches enable row level security;
revoke all on public.spw_matches from anon, authenticated;
create table if not exists public.spw_reports (
  match text not null references public.spw_matches (id) on delete cascade,
  user_id uuid not null,
  red integer not null,
  blue integer not null,
  primary key (match, user_id)
);
alter table public.spw_reports enable row level security;
revoke all on public.spw_reports from anon, authenticated;
-- (build h) tickets won and not taken yet: the winners take them from the Ticket Master in SPLASHPRIZE (spw_claim)
create table if not exists public.spw_prizes (
  user_id uuid not null,
  match text not null,
  tickets integer not null check (tickets > 0),
  at timestamptz not null default clock_timestamp(),
  primary key (user_id, match)
);
alter table public.spw_prizes enable row level security;
revoke all on public.spw_prizes from anon, authenticated;
create table if not exists public.spw_tickets (
  user_id uuid primary key,
  name text not null,
  tickets bigint not null default 0 check (tickets >= 0),
  wins integer not null default 0,
  played integer not null default 0
);
alter table public.spw_tickets enable row level security;
revoke all on public.spw_tickets from anon, authenticated;
-- (build p) the Ticket Exchange: what it gives and for how many tickets; `excl` = given only here (counted like a
-- Shop-only item: owned_items / bag_pool, see is_tracked at the end of this file)
create table if not exists public.spw_shop (
  item text primary key,
  tickets integer not null check (tickets > 0),
  excl boolean not null default false
);
alter table public.spw_shop enable row level security;
revoke all on public.spw_shop from anon, authenticated;
-- (build p) how many of the item one exchange gives (Water Bucket x20, Sand x30, Beach Umbrella x20)
alter table public.spw_shop add column if not exists qty integer not null default 1 check (qty between 1 and 1000);
insert into public.spw_shop (item, tickets, excl) values
  ('cow_swim_ring', 500, true), ('duck_swim_ring', 500, true),
  ('glow_cow_swim_ring', 2000, true), ('glow_duck_swim_ring', 2000, true),
  ('silver_wild_hair', 700, false), ('silver_full_beard', 500, false), ('boss_shades', 400, false),
  ('hawaiian_polo', 300, false), ('hawaiian_polo_red', 300, false), ('cargo_shorts', 200, false),
  ('pet_penguin', 1500, false), -- (owner: "the penguin pet too, 1.5k")
  ('water_gun', 800, false), ('mega_water_gun', 3000, true) -- (build p: the Water Gun 800; the Mega Water Gun 3k, only here)
on conflict (item) do update set tickets = excluded.tickets, excl = excluded.excl;
-- (build p, owner: "water bucket 50 tickets for 20, sand 10 tickets for 30, beach umbrella 5 tickets for 20")
insert into public.spw_shop (item, tickets, excl, qty) values
  ('water_bucket', 50, false, 20), ('sand', 10, false, 30), ('beach_umbrella', 5, false, 20)
on conflict (item) do update set tickets = excluded.tickets, excl = excluded.excl, qty = excluded.qty;

-- when spw_make last ran (build j)
create table if not exists public.spw_tick (k integer primary key, at timestamptz not null);
alter table public.spw_tick enable row level security;
revoke all on public.spw_tick from anon, authenticated;
-- { now (ms), open }
create or replace function public.spw_event_now()
returns jsonb language sql stable as $$
  with t as (select clock_timestamp() as ts)
  select jsonb_build_object(
    'now', floor(extract(epoch from ts) * 1000)::bigint,
    'open', to_char(ts at time zone 'Asia/Manila', 'MMDD') between '0315' and '0415')
  from t
$$;
-- the match lengths (ms) and the team size
create or replace function public.spw_len(k text)
returns integer language sql immutable as $$
  select case k when 'prep' then 10000 when 'count' then 5000 when 'play' then 300000 when 'end' then 8000
    when 'fill' then 30000 when 'team' then 10 else 0 end
$$;
-- when a match's playing is over
create or replace function public.spw_play_end(m public.spw_matches)
returns timestamptz language sql immutable as $$
  select m.t0 + make_interval(secs => (public.spw_len('prep') + public.spw_len('count') + public.spw_len('play')) / 1000.0)
$$;

-- settle a match if it can be: the median of the reports, tickets to the winners, the world gone
create or replace function public.spw_settle(p_match text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  m public.spw_matches;
  n integer;
  k integer;
  rs integer;
  bs integer;
  w text;
  win uuid[];
begin
  select * into m from public.spw_matches where id = p_match for update;
  if not found or m.settled then return; end if;
  if clock_timestamp() < public.spw_play_end(m) then return; end if;
  n := coalesce(array_length(m.red_ids, 1), 0) + coalesce(array_length(m.blue_ids, 1), 0);
  select count(*) into k from public.spw_reports where match = p_match;
  -- every player of the match reported, or 15 s after the end with what came in (60 s: nobody = no winner)
  if k < n and clock_timestamp() < public.spw_play_end(m) + interval '15 seconds' then return; end if;
  if k = 0 and clock_timestamp() < public.spw_play_end(m) + interval '60 seconds' then return; end if;
  -- (security, build j) each TEAM's reports give that team's verdict (what most of its reports say; a tie = draw);
  -- both teams agree = that result; only one team reported = its verdict; the teams disagree = a draw. So a team can't
  -- give itself the win while the other team says otherwise (before: 2/3 of ALL reports, which the bigger team of an
  -- uneven match always had). The score shown is the median of the reports that agree with the result.
  w := 'd';
  if k > 0 then
    declare
      vr text;
      vb text;
    begin
      select case when sum((red > blue)::int) > sum((blue > red)::int) and sum((red > blue)::int) * 2 > count(*) then 'r'
                  when sum((blue > red)::int) > sum((red > blue)::int) and sum((blue > red)::int) * 2 > count(*) then 'b' else 'd' end
        into vr from public.spw_reports where match = p_match and user_id = any (m.red_ids) having count(*) > 0;
      select case when sum((red > blue)::int) > sum((blue > red)::int) and sum((red > blue)::int) * 2 > count(*) then 'r'
                  when sum((blue > red)::int) > sum((red > blue)::int) and sum((blue > red)::int) * 2 > count(*) then 'b' else 'd' end
        into vb from public.spw_reports where match = p_match and user_id = any (m.blue_ids) having count(*) > 0;
      w := case when vr is null then coalesce(vb, 'd') when vb is null then vr when vr = vb then vr else 'd' end;
    end;
    select percentile_disc(0.5) within group (order by red), percentile_disc(0.5) within group (order by blue)
      into rs, bs from public.spw_reports
      where match = p_match and (w = 'd' or (case when red > blue then 'r' when blue > red then 'b' else 'd' end) = w);
  end if;
  update public.spw_matches set settled = true, red_score = rs, blue_score = bs, winner = w where id = p_match;
  win := case w when 'r' then m.red_ids when 'b' then m.blue_ids else '{}'::uuid[] end;
  -- everybody of the match: played + 1; the winners: wins + 1 and 5 tickets WAITING for them (build h: they take them
  -- from the Ticket Master, spw_claim)
  insert into public.spw_tickets (user_id, name, tickets, wins, played)
    select u.id, u.name, 0, case when u.id = any (win) then 1 else 0 end, 1
    from public.usernames u where u.id = any (m.red_ids || m.blue_ids)
  on conflict (user_id) do update set
    name = excluded.name,
    wins = public.spw_tickets.wins + excluded.wins,
    played = public.spw_tickets.played + 1;
  insert into public.spw_prizes (user_id, match, tickets)
    select u, p_match, 5 from unnest(win) u
  on conflict do nothing;
  delete from public.spw_reports where match = p_match;
  delete from public.worlds where name = p_match; -- (the match's world is gone; it should never have been saved)
end $$;

-- make matches from the queue (called by spw_register / spw_status; one at a time)
create or replace function public.spw_make()
returns void language plpgsql volatile security definer set search_path = public as $$
declare
  team integer := public.spw_len('team');
  n integer;
  first timestamptz;
  ids uuid[];
  nms text[];
  mid text;
  r record;
begin
  -- (build j) one game at a time and at most once a second: the others just read the status (no queue of waiting
  -- calls when many players ask every 2 s)
  if not pg_try_advisory_xact_lock(hashtext('spw_make')) then return; end if;
  if exists (select 1 from public.spw_tick where at > clock_timestamp() - interval '1 second') then return; end if;
  insert into public.spw_tick (k, at) values (1, clock_timestamp()) on conflict (k) do update set at = excluded.at;
  -- off the queue: not seen for 12 s (left SPLASHWARS / closed the game)
  delete from public.spw_queue where seen < clock_timestamp() - interval '12 seconds';
  -- old matches: settle what can be, forget those over a day old
  for r in select id from public.spw_matches where not settled and public.spw_play_end(spw_matches) < clock_timestamp() loop
    perform public.spw_settle(r.id);
  end loop;
  delete from public.spw_matches where t0 < clock_timestamp() - interval '1 day';
  loop
    select count(*), min(at) into n, first from public.spw_queue;
    exit when n < 2 or (n < 2 * team and first > clock_timestamp() - make_interval(secs => public.spw_len('fill') / 1000.0));
    select array_agg(user_id order by at, user_id), array_agg(name order by at, user_id) into ids, nms
      from (select user_id, name, at from public.spw_queue order by at, user_id limit 2 * team) q;
    loop
      mid := 'SPW' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      exit when mid ~ '^SPW[A-Z0-9]{6}$' and not exists (select 1 from public.spw_matches where id = mid)
        and not exists (select 1 from public.worlds where name = mid);
    end loop;
    -- RED / BLUE in turn, in the queue's order
    insert into public.spw_matches (id, red, blue, red_ids, blue_ids)
    select mid,
      array(select nms[i] from generate_subscripts(nms, 1) i where i % 2 = 1 order by i),
      array(select nms[i] from generate_subscripts(nms, 1) i where i % 2 = 0 order by i),
      array(select ids[i] from generate_subscripts(ids, 1) i where i % 2 = 1 order by i),
      array(select ids[i] from generate_subscripts(ids, 1) i where i % 2 = 0 order by i);
    delete from public.spw_queue where user_id = any (ids);
  end loop;
end $$;

-- what the game shows: { now, open, queued, pos, qn (in the queue), fill (ms until a smaller match forms, or null),
-- tickets, wins, played, match: { id, t0 (ms), red, blue, team, settled, red_score, blue_score, winner } | null }
-- (also keeps me on the queue: call it every few seconds while registered)
create or replace function public.spw_status()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  e jsonb := public.spw_event_now();
  me uuid := auth.uid();
  m public.spw_matches;
  q public.spw_queue;
  n integer;
  first timestamptz;
  t public.spw_tickets;
  pz bigint;
begin
  if me is null then raise exception 'Log in first'; end if;
  update public.spw_queue set seen = clock_timestamp() where user_id = me;
  perform public.spw_make();
  select * into q from public.spw_queue where user_id = me;
  select count(*), min(at) into n, first from public.spw_queue;
  select * into t from public.spw_tickets where user_id = me;
  select coalesce(sum(tickets), 0) into pz from public.spw_prizes where user_id = me;
  -- my match: the newest one I'm in, from the last 10 minutes
  select * into m from public.spw_matches where (me = any (red_ids) or me = any (blue_ids))
    and t0 > clock_timestamp() - interval '10 minutes' order by t0 desc limit 1;
  return e || jsonb_build_object(
    'queued', q.user_id is not null,
    'pos', case when q.user_id is null then null else (select count(*) from public.spw_queue x where (x.at, x.user_id) <= (q.at, q.user_id)) end,
    'qn', n,
    'fill', case when n >= 2 then greatest(0, floor(extract(epoch from (first + make_interval(secs => public.spw_len('fill') / 1000.0) - clock_timestamp())) * 1000))::bigint end,
    'tickets', coalesce(t.tickets, 0), 'wins', coalesce(t.wins, 0), 'played', coalesce(t.played, 0),
    'prize', pz, -- tickets won and waiting at the Ticket Master
    'shop', coalesce((select jsonb_object_agg(item, tickets) from public.spw_shop), '{}'::jsonb), -- (build p) the Exchange
    'shop_qty', coalesce((select jsonb_object_agg(item, qty) from public.spw_shop where qty > 1), '{}'::jsonb), -- (x20 ...)
    'match', case when m.id is null then null else jsonb_build_object(
      'id', m.id, 't0', floor(extract(epoch from m.t0) * 1000)::bigint, 'red', to_jsonb(m.red), 'blue', to_jsonb(m.blue),
      'team', case when me = any (m.red_ids) then 'r' else 'b' end,
      'settled', m.settled, 'red_score', m.red_score, 'blue_score', m.blue_score, 'winner', m.winner) end);
end $$;

-- register (p_on true) or leave the queue (false); answers spw_status. Not while the event is closed (the GM may),
-- not while your own match is still being played.
create or replace function public.spw_register(p_on boolean default true)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  nm text := public.my_name();
begin
  if me is null or nm is null then raise exception 'Log in first'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if coalesce(p_on, true) then
    if not (public.spw_event_now() ->> 'open')::boolean and not public.is_gm() then raise exception 'SPLASH WARS is closed'; end if;
    if exists (select 1 from public.spw_matches m where (me = any (m.red_ids) or me = any (m.blue_ids)) and not m.settled
        and public.spw_play_end(m) > clock_timestamp()) then
      raise exception 'Finish your match first';
    end if;
    insert into public.spw_queue (user_id, name) values (me, nm)
      on conflict (user_id) do update set seen = clock_timestamp(), name = excluded.name;
  else
    delete from public.spw_queue where user_id = me;
  end if;
  return public.spw_status();
end $$;

-- after the playing time: the tiles I counted (once per match); answers spw_status
create or replace function public.spw_report(p_match text, p_red integer, p_blue integer)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  m public.spw_matches;
begin
  if me is null then raise exception 'Log in first'; end if;
  select * into m from public.spw_matches where id = p_match;
  if not found or not (me = any (m.red_ids) or me = any (m.blue_ids)) then raise exception 'Not your match'; end if;
  if clock_timestamp() >= public.spw_play_end(m) - interval '2 seconds' and not m.settled then
    insert into public.spw_reports (match, user_id, red, blue)
      values (p_match, me, least(greatest(coalesce(p_red, 0), 0), 6000), least(greatest(coalesce(p_blue, 0), 0), 6000))
      on conflict do nothing;
    perform public.spw_settle(p_match);
  end if;
  return public.spw_status();
end $$;

-- (build h) take the tickets waiting for me (the Ticket Master in SPLASHPRIZE): { got, ...spw_status }
create or replace function public.spw_claim()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  nm text := public.my_name();
  got bigint;
begin
  if me is null or nm is null then raise exception 'Log in first'; end if;
  with d as (delete from public.spw_prizes where user_id = me returning tickets)
  select coalesce(sum(tickets), 0) into got from d;
  if got > 0 then
    insert into public.spw_tickets (user_id, name, tickets) values (me, nm, got)
      on conflict (user_id) do update set tickets = public.spw_tickets.tickets + excluded.tickets, name = excluded.name;
  end if;
  return public.spw_status() || jsonb_build_object('got', got);
end $$;
revoke execute on function public.spw_claim() from public, anon;
grant execute on function public.spw_claim() to authenticated;
revoke execute on function public.spw_event_now(), public.spw_len(text), public.spw_play_end(public.spw_matches), public.spw_settle(text), public.spw_make() from public, anon, authenticated;
revoke execute on function public.spw_status(), public.spw_register(boolean), public.spw_report(text, integer, integer) from public, anon;
grant execute on function public.spw_status(), public.spw_register(boolean), public.spw_report(text, integer, integer) to authenticated;

-- =====================================================================================================
-- SERVER BAG + PRIVACY (Nov 12 2026, owner, build m: "nobody plays yet, so fix it: it really must be on the server,
-- above all the players' privacy"). Safe to run more than once. The game: www/js/online/bag.js.
-- THE BAG: `bag` is the truth of what every player owns (bag + hotbar + what he wears; not gold / Balb Coins, which
-- are the wallet's, and not World Keys, which are world_keys'). The game's bag is only a copy:
--   * Items that move between players or come from the server move HERE, in one transaction: trades (trade_move),
--     gifts (gift_send / gift_take / gift_back, every item now waits in gift_escrow), Mailbox letters, the Shop
--     (shop_buy; packs give their pieces through play), level rewards, lock compressing (bag_lock_convert). The game
--     doesn't change its own bag for these: it asks the server again (bag_get) and shows what it says.
--   * Play (breaking, harvesting, fishing, picking up drops, Stove...) can't be checked here, so the game sends the
--     difference every few seconds (bag_sync): what you LOST is always taken; what you GOT is given up to an hourly
--     amount per rarity (`bag_cap`, far over normal play); the rest waits in `bag_held` and comes as the hour allows
--     (logged in cheat_log). Shop-only items (shop_prices.tracked) can't be made by play at all: they come back only
--     out of `bag_pool`, what players lost of them (dropped, placed, put in a machine...), so their number in the game
--     never grows except through the Shop. Packs, the Splash Wars console / Ticket Master: never from play.
--   * A player's first bag is copied once from his save (bag_init; big ones logged). GMs: no limits.
--   * item_info: every item's class (from the game's ITEMS; an item not listed counts as 'legendary').
-- PRIVACY: online_people shows WHERE a player is only to his friends (mutual, kept here: friend_req / friend_ok go
-- through lobby_send) and to players in the same world; everyone else sees only that he is online. world_counts()
-- gives how many are in each world (for the world list and the 30-player limit). board_list needs a login.
-- =====================================================================================================
create table if not exists public.bag (
  user_id uuid not null references auth.users (id) on delete cascade,
  item text not null check (item ~ '^[a-z0-9_]{1,40}$'),
  qty bigint not null check (qty > 0),
  primary key (user_id, item)
);
create table if not exists public.bag_meta (
  user_id uuid primary key references auth.users (id) on delete cascade,
  made_at timestamptz not null default now()
);
create table if not exists public.bag_rate (
  user_id uuid not null references auth.users (id) on delete cascade,
  cls text not null,
  hour_start timestamptz not null default now(),
  n bigint not null default 0,
  primary key (user_id, cls)
);
create table if not exists public.bag_held (
  user_id uuid not null references auth.users (id) on delete cascade,
  item text not null,
  qty bigint not null check (qty > 0),
  at timestamptz not null default now(),
  primary key (user_id, item)
);
create table if not exists public.bag_pool (item text primary key, qty bigint not null default 0 check (qty >= 0));
create table if not exists public.item_info (item text primary key, cls text not null);
do $$ begin
  alter table public.bag enable row level security;
  alter table public.bag_meta enable row level security;
  alter table public.bag_rate enable row level security;
  alter table public.bag_held enable row level security;
  alter table public.bag_pool enable row level security;
  alter table public.item_info enable row level security;
end $$;
revoke all on public.bag, public.bag_meta, public.bag_rate, public.bag_held, public.bag_pool, public.item_info from anon, authenticated;
-- the game's items and their class (made from www/js ITEMS on Nov 12 2026; add new items here when the game gets them,
-- or they count as 'legendary')
insert into public.item_info (item, cls) values
  ('afro_hair', 'rare'),
  ('air_blower_down', 'rare'),
  ('air_blower_down_seed', 'rare'),
  ('air_blower_left', 'rare'),
  ('air_blower_left_seed', 'rare'),
  ('air_blower_right', 'rare'),
  ('air_blower_right_seed', 'rare'),
  ('air_blower_up', 'rare'),
  ('air_blower_up_seed', 'rare'),
  ('air_conditioner', 'rare'),
  ('air_conditioner_seed', 'rare'),
  ('air_duct', 'uncommon'),
  ('air_duct_seed', 'uncommon'),
  ('aloha_polo', 'rare'),
  ('amber_glass', 'uncommon'),
  ('amber_glass_seed', 'uncommon'),
  ('amethyst_block', 'rare'),
  ('amethyst_block_seed', 'rare'),
  ('ammonite_fossil', 'uncommon'),
  ('angel_statue', 'epic'),
  ('angel_statue_seed', 'epic'),
  ('angel_wings', 'legendary'),
  ('anglerfish', 'rare'),
  ('anglerfish_l', 'legendary'),
  ('anglerfish_m', 'rare'),
  ('apple', 'common'),
  ('apple_seed', 'common'),
  ('aqua_block', 'common'),
  ('aqua_block_seed', 'common'),
  ('aqua_wallpaper', 'common'),
  ('aqua_wallpaper_seed', 'common'),
  ('aquarium', 'rare'),
  ('aquarium_glass', 'rare'),
  ('aquarium_glass_seed', 'rare'),
  ('aquarium_seed', 'rare'),
  ('arcade_machine', 'rare'),
  ('arcade_machine_seed', 'rare'),
  ('argyle_bg', 'rare'),
  ('argyle_bg_seed', 'rare'),
  ('arnis_stick', 'uncommon'),
  ('arnis_stick_seed', 'uncommon'),
  ('arrow_block_down', 'basic'),
  ('arrow_block_down_seed', 'basic'),
  ('arrow_block_left', 'basic'),
  ('arrow_block_left_seed', 'basic'),
  ('arrow_block_right', 'basic'),
  ('arrow_block_right_seed', 'basic'),
  ('arrow_block_up', 'basic'),
  ('arrow_block_up_seed', 'basic'),
  ('arrow_gate_down', 'rare'),
  ('arrow_gate_down_seed', 'rare'),
  ('arrow_gate_left', 'rare'),
  ('arrow_gate_left_seed', 'rare'),
  ('arrow_gate_right', 'rare'),
  ('arrow_gate_right_seed', 'rare'),
  ('arrow_gate_up', 'rare'),
  ('arrow_gate_up_seed', 'rare'),
  ('arrow_placard', 'uncommon'),
  ('arrow_placard_left', 'uncommon'),
  ('arrow_placard_left_seed', 'uncommon'),
  ('arrow_placard_seed', 'uncommon'),
  ('art_wall', 'rare'),
  ('art_wall_seed', 'rare'),
  ('atm_machine', 'epic'),
  ('autumn_boots', 'rare'),
  ('autumn_cape', 'epic'),
  ('autumn_chest', 'epic'),
  ('autumn_leaf_block', 'uncommon'),
  ('autumn_leaf_shirt', 'rare'),
  ('autumn_leaf_shorts', 'rare'),
  ('autumn_leaf_wall', 'common'),
  ('autumn_leaves', 'uncommon'),
  ('autumn_leaves_seed', 'uncommon'),
  ('autumn_scythe', 'legendary'),
  ('autumn_wings', 'legendary'),
  ('baby_bath', 'uncommon'),
  ('baby_bath_seed', 'uncommon'),
  ('baby_bottle', 'uncommon'),
  ('baby_bottle_seed', 'uncommon'),
  ('baby_crib', 'rare'),
  ('baby_crib_seed', 'rare'),
  ('baby_mobile', 'rare'),
  ('baby_mobile_seed', 'rare'),
  ('baby_rattle', 'uncommon'),
  ('baby_rattle_seed', 'uncommon'),
  ('baby_stroller', 'rare'),
  ('baby_stroller_seed', 'rare'),
  ('backpack', 'common'),
  ('backpack_seed', 'common'),
  ('bait_basket', 'rare'),
  ('bait_basket_seed', 'rare'),
  ('ball_jersey', 'uncommon'),
  ('balloon_bunch', 'uncommon'),
  ('balloon_bunch_seed', 'uncommon'),
  ('bamboo_block', 'common'),
  ('bamboo_block_seed', 'common'),
  ('banana_tree', 'uncommon'),
  ('banana_tree_seed', 'uncommon'),
  ('banig_mat', 'uncommon'),
  ('banig_mat_seed', 'uncommon'),
  ('barn_block', 'common'),
  ('barn_block_seed', 'common'),
  ('barn_door', 'common'),
  ('barn_door_seed', 'common'),
  ('barrel', 'common'),
  ('barrel_seed', 'common'),
  ('basalt_block', 'uncommon'),
  ('basalt_block_seed', 'uncommon'),
  ('baseball_cap', 'common'),
  ('baseball_cap_seed', 'common'),
  ('basketball_hoop', 'rare'),
  ('basketball_hoop_seed', 'rare'),
  ('bass_note', 'common'),
  ('bass_note_seed', 'common'),
  ('bathtub', 'uncommon'),
  ('bathtub_seed', 'uncommon'),
  ('battle_axe', 'rare'),
  ('battle_axe_seed', 'rare'),
  ('beach_blast', 'epic'),
  ('beach_umbrella', 'uncommon'),
  ('beach_umbrella_seed', 'uncommon'),
  ('bean_bag', 'common'),
  ('bean_bag_seed', 'common'),
  ('bed', 'common'),
  ('bed_seed', 'common'),
  ('bell_note', 'common'),
  ('bell_note_seed', 'common'),
  ('bent_danger_sign', 'common'),
  ('bent_danger_sign_seed', 'common'),
  ('big_black_scarf', 'rare'),
  ('big_glasses', 'common'),
  ('big_glasses_seed', 'common'),
  ('big_old_sideways_arrow', 'common'),
  ('big_old_sideways_arrow_seed', 'common'),
  ('big_orange_scarf', 'rare'),
  ('big_striped_scarf', 'rare'),
  ('biker_stache', 'common'),
  ('biker_stache_seed', 'common'),
  ('biohazard_sign', 'uncommon'),
  ('biohazard_sign_seed', 'uncommon'),
  ('bird_cage', 'uncommon'),
  ('bird_cage_seed', 'uncommon'),
  ('birthday_cake', 'uncommon'),
  ('birthday_cake_seed', 'uncommon'),
  ('black_beanie', 'rare'),
  ('black_block', 'common'),
  ('black_block_seed', 'common'),
  ('black_crystal', 'legendary'),
  ('black_crystal_block', 'epic'),
  ('black_crystal_wall', 'rare'),
  ('black_crystal_wings', 'legendary'),
  ('black_diamond_lock', 'lock3'),
  ('black_diamond_pickaxe', 'legendary'),
  ('black_pants', 'common'),
  ('black_pants_seed', 'common'),
  ('black_polo', 'uncommon'),
  ('black_scarf', 'common'),
  ('black_shorts', 'common'),
  ('black_sneakers', 'uncommon'),
  ('black_tee', 'common'),
  ('black_wallpaper', 'common'),
  ('black_wallpaper_seed', 'common'),
  ('black_watch', 'common'),
  ('black_wristband', 'common'),
  ('blackout_weather_machine', 'epic'),
  ('blonde_bombshell', 'common'),
  ('blonde_bombshell_seed', 'common'),
  ('blue_block', 'common'),
  ('blue_block_seed', 'common'),
  ('blue_crystal', 'epic'),
  ('blue_crystal_block', 'epic'),
  ('blue_crystal_wall', 'rare'),
  ('blue_fire_eyes', 'legendary'),
  ('blue_glass_block', 'uncommon'),
  ('blue_glass_block_seed', 'uncommon'),
  ('blue_hero_cape', 'rare'),
  ('blue_jeans', 'common'),
  ('blue_jeans_seed', 'common'),
  ('blue_lock', 'rare'),
  ('blue_pacifier', 'uncommon'),
  ('blue_polka_dress', 'uncommon'),
  ('blue_slippers', 'common'),
  ('blue_sneakers', 'uncommon'),
  ('blue_star_wallpaper', 'common'),
  ('blue_star_wallpaper_seed', 'common'),
  ('blue_streak_spikes', 'rare'),
  ('blue_streak_swept_hair', 'rare'),
  ('blue_striped_scarf', 'common'),
  ('blue_tee', 'common'),
  ('blue_tip_bob', 'rare'),
  ('blue_umbrella', 'epic'),
  ('blue_umbrella_seed', 'epic'),
  ('blue_wallpaper', 'common'),
  ('blue_wallpaper_seed', 'common'),
  ('blue_wristband', 'common'),
  ('blueberry', 'common'),
  ('blueberry_seed', 'common'),
  ('board_shorts', 'uncommon'),
  ('bolo', 'uncommon'),
  ('bolo_seed', 'uncommon'),
  ('bone_platform', 'uncommon'),
  ('bone_platform_seed', 'uncommon'),
  ('bonsai_tree', 'rare'),
  ('bonsai_tree_seed', 'rare'),
  ('bookcase', 'uncommon'),
  ('bookcase_seed', 'uncommon'),
  ('boombox', 'uncommon'),
  ('boombox_seed', 'uncommon'),
  ('boots', 'common'),
  ('boots_seed', 'common'),
  ('bounce_block', 'uncommon'),
  ('bounce_block_seed', 'uncommon'),
  ('bounce_mushroom', 'rare'),
  ('bounce_mushroom_seed', 'rare'),
  ('bow_top', 'uncommon'),
  ('brick_background', 'common'),
  ('brick_background_seed', 'common'),
  ('bricks', 'common'),
  ('bricks_seed', 'common'),
  ('bridal_veil', 'common'),
  ('bridal_veil_seed', 'common'),
  ('brown_block', 'common'),
  ('brown_block_seed', 'common'),
  ('brown_hair', 'common'),
  ('brown_hair_seed', 'common'),
  ('brown_shoes', 'common'),
  ('brown_shoes_seed', 'common'),
  ('brown_wallpaper', 'common'),
  ('brown_wallpaper_seed', 'common'),
  ('bubble_tea', 'uncommon'),
  ('bubble_tea_seed', 'uncommon'),
  ('bubble_wrap', 'common'),
  ('bubble_wrap_seed', 'common'),
  ('bush', 'common'),
  ('bush_block', 'common'),
  ('bush_block_seed', 'common'),
  ('bush_seed', 'common'),
  ('cactus', 'common'),
  ('cactus_pot', 'common'),
  ('cactus_pot_seed', 'common'),
  ('cactus_seed', 'common'),
  ('caltrops', 'uncommon'),
  ('caltrops_seed', 'uncommon'),
  ('camo_block', 'common'),
  ('camo_block_seed', 'common'),
  ('camo_shirt', 'uncommon'),
  ('camo_shorts', 'uncommon'),
  ('campfire', 'uncommon'),
  ('campfire_seed', 'uncommon'),
  ('candy_block', 'uncommon'),
  ('candy_block_seed', 'uncommon'),
  ('candy_platform', 'uncommon'),
  ('candy_platform_seed', 'uncommon'),
  ('candy_stripe_bg', 'rare'),
  ('candy_stripe_bg_seed', 'rare'),
  ('candy_stripe_scarf', 'uncommon'),
  ('capiz_window', 'rare'),
  ('capiz_window_seed', 'rare'),
  ('caramel_block', 'uncommon'),
  ('caramel_block_seed', 'uncommon'),
  ('cardboard_box', 'common'),
  ('cardboard_box_seed', 'common'),
  ('cargo_shorts', 'common'),
  ('cargo_shorts_seed', 'common'),
  ('carpet_block', 'uncommon'),
  ('carpet_block_seed', 'uncommon'),
  ('cat_ear_hoodie', 'epic'),
  ('cave', 'common'),
  ('cave_seed', 'common'),
  ('celestial_wings', 'legendary'),
  ('ceramic_tile', 'common'),
  ('ceramic_tile_seed', 'common'),
  ('chainsaw', 'rare'),
  ('chainsaw_seed', 'rare'),
  ('checker_marble', 'uncommon'),
  ('checker_marble_seed', 'uncommon'),
  ('checker_wallpaper', 'common'),
  ('checker_wallpaper_seed', 'common'),
  ('checkered_pajamas', 'common'),
  ('checkered_pajamas_seed', 'common'),
  ('checkpoint', 'rare'),
  ('checkpoint_seed', 'rare'),
  ('checkpoint_tower', 'rare'),
  ('checkpoint_tower_seed', 'rare'),
  ('cheese_block', 'uncommon'),
  ('cheese_block_seed', 'uncommon'),
  ('cherry', 'common'),
  ('cherry_blossom', 'rare'),
  ('cherry_blossom_seed', 'rare'),
  ('cherry_planks', 'uncommon'),
  ('cherry_planks_seed', 'uncommon'),
  ('cherry_seed', 'common'),
  ('chocolate_block', 'uncommon'),
  ('chocolate_block_seed', 'uncommon'),
  ('christmas_tree', 'rare'),
  ('christmas_tree_seed', 'rare'),
  ('circuit_block', 'rare'),
  ('circuit_block_seed', 'rare'),
  ('clear_world', 'epic'),
  ('cloud_block', 'uncommon'),
  ('cloud_block_seed', 'uncommon'),
  ('cloud_platform', 'uncommon'),
  ('cloud_platform_seed', 'uncommon'),
  ('cloud_ring', 'legendary'),
  ('clouds', 'uncommon'),
  ('clouds_seed', 'uncommon'),
  ('cloudstone_block', 'uncommon'),
  ('cloudstone_block_seed', 'uncommon'),
  ('clown_pants', 'common'),
  ('clown_pants_seed', 'common'),
  ('clownfish', 'common'),
  ('clownfish_l', 'uncommon'),
  ('clownfish_m', 'common'),
  ('cobblestone', 'common'),
  ('cobblestone_seed', 'common'),
  ('coconut_tree', 'uncommon'),
  ('coconut_tree_seed', 'uncommon'),
  ('coin_fountain', 'none'), -- (build p: taken out of the game)
  ('coin_fountain_seed', 'none'),
  ('coin_vacuum', 'epic'),
  ('colour_roll_block', 'uncommon'),
  ('colour_roll_block_seed', 'uncommon'),
  ('cookie_block', 'uncommon'),
  ('cookie_block_seed', 'uncommon'),
  ('copper_block', 'rare'),
  ('copper_block_seed', 'rare'),
  ('copper_plumbing', 'uncommon'),
  ('copper_plumbing_seed', 'uncommon'),
  ('coral_block', 'uncommon'),
  ('coral_block_seed', 'uncommon'),
  ('coral_orange', 'basic'),
  ('coral_pink', 'basic'),
  ('coral_purple', 'basic'),
  ('coral_teal', 'basic'),
  ('cotton_candy_bun', 'rare'),
  ('couch', 'uncommon'),
  ('couch_seed', 'uncommon'),
  ('crappy_sign', 'common'),
  ('crappy_sign_seed', 'common'),
  ('crude_oil', 'uncommon'),
  ('crystal_block', 'uncommon'),
  ('crystal_block_seed', 'uncommon'),
  ('crystal_cluster', 'rare'),
  ('crystal_cluster_seed', 'rare'),
  ('crystal_gate', 'epic'),
  ('crystal_platform', 'rare'),
  ('crystal_platform_seed', 'rare'),
  ('crystal_shard_gate', 'epic'),
  ('crystal_wings', 'legendary'),
  ('cupcake', 'common'),
  ('cupcake_seed', 'common'),
  ('cyclopean_visor', 'uncommon'),
  ('cyclopean_visor_seed', 'uncommon'),
  ('daisy', 'common'),
  ('daisy_seed', 'common'),
  ('danger_sign', 'common'),
  ('danger_sign_seed', 'common'),
  ('dark_aqua_block', 'common'),
  ('dark_aqua_block_seed', 'common'),
  ('dark_blue_block', 'common'),
  ('dark_blue_block_seed', 'common'),
  ('dark_brown_block', 'common'),
  ('dark_brown_block_seed', 'common'),
  ('dark_cave', 'uncommon'),
  ('dark_cave_seed', 'uncommon'),
  ('dark_diamond_aura', 'legendary'),
  ('dark_green_block', 'common'),
  ('dark_green_block_seed', 'common'),
  ('dark_grey_block', 'common'),
  ('dark_grey_block_seed', 'common'),
  ('dark_oak_planks', 'common'),
  ('dark_oak_planks_seed', 'common'),
  ('dark_orange_block', 'common'),
  ('dark_orange_block_seed', 'common'),
  ('dark_pastel_aqua_bg', 'rare'),
  ('dark_pastel_aqua_bg_seed', 'rare'),
  ('dark_pastel_blue_bg', 'rare'),
  ('dark_pastel_blue_bg_seed', 'rare'),
  ('dark_pastel_cream_bg', 'uncommon'),
  ('dark_pastel_cream_bg_seed', 'uncommon'),
  ('dark_pastel_lavender_bg', 'epic'),
  ('dark_pastel_lavender_bg_seed', 'epic'),
  ('dark_pastel_mint_bg', 'uncommon'),
  ('dark_pastel_mint_bg_seed', 'uncommon'),
  ('dark_pastel_peach_bg', 'rare'),
  ('dark_pastel_peach_bg_seed', 'rare'),
  ('dark_pastel_pink_bg', 'rare'),
  ('dark_pastel_pink_bg_seed', 'rare'),
  ('dark_pastel_yellow_bg', 'rare'),
  ('dark_pastel_yellow_bg_seed', 'rare'),
  ('dark_purple_block', 'common'),
  ('dark_purple_block_seed', 'common'),
  ('dark_red_block', 'common'),
  ('dark_red_block_seed', 'common'),
  ('dark_yellow_block', 'common'),
  ('dark_yellow_block_seed', 'common'),
  ('das_red_balloon', 'uncommon'),
  ('das_red_balloon_seed', 'uncommon'),
  ('death_scythe', 'legendary'),
  ('death_scythe_seed', 'legendary'),
  ('death_spikes', 'uncommon'),
  ('death_spikes_seed', 'uncommon'),
  ('demon_wings', 'epic'),
  ('denim_shorts', 'common'),
  ('denim_skirt', 'common'),
  ('desert_weather_machine', 'epic'),
  ('desk_lamp', 'uncommon'),
  ('desk_lamp_seed', 'uncommon'),
  ('diamond_aura', 'legendary'),
  ('diamond_diaper', 'legendary'),
  ('diamond_lock', 'lock2'),
  ('diamond_pickaxe', 'legendary'),
  ('diamond_plate', 'uncommon'),
  ('diamond_plate_seed', 'uncommon'),
  ('diamond_watch', 'legendary'),
  ('diaper_stack', 'uncommon'),
  ('diaper_stack_seed', 'uncommon'),
  ('dice_block', 'uncommon'),
  ('dice_block_seed', 'uncommon'),
  ('diner_tiles', 'uncommon'),
  ('diner_tiles_seed', 'uncommon'),
  ('dino_skull_fossil', 'epic'),
  ('dirt', 'common'),
  ('dirt_seed', 'common'),
  ('disco_ball', 'rare'),
  ('disco_ball_seed', 'rare'),
  ('disco_floor', 'rare'),
  ('disco_floor_seed', 'rare'),
  ('disco_weather_machine', 'epic'),
  ('display_box', 'uncommon'),
  ('display_box_seed', 'uncommon'),
  ('diving_board', 'rare'),
  ('diving_board_seed', 'rare'),
  ('dolphin', 'rare'),
  ('dolphin_l', 'legendary'),
  ('dolphin_m', 'rare'),
  ('donut_block', 'uncommon'),
  ('donut_block_seed', 'uncommon'),
  ('door', 'common'),
  ('door_mover', 'rare'),
  ('door_seed', 'common'),
  ('dragon_hand', 'legendary'),
  ('dragon_hand_seed', 'legendary'),
  ('dragon_wings', 'legendary'),
  ('dreamstone_block', 'uncommon'),
  ('dreamstone_block_seed', 'uncommon'),
  ('dresser', 'common'),
  ('dresser_seed', 'common'),
  ('drum_note', 'common'),
  ('drum_note_seed', 'common'),
  ('drum_set', 'rare'),
  ('drum_set_seed', 'rare'),
  ('dungeon_door', 'uncommon'),
  ('dungeon_door_seed', 'uncommon'),
  ('dusk_brick_bg', 'rare'),
  ('dusk_brick_bg_seed', 'rare'),
  ('dye_blue', 'basic'),
  ('dye_blue_seed', 'basic'),
  ('dye_fire', 'basic'),
  ('dye_fire_seed', 'basic'),
  ('dye_frost', 'basic'),
  ('dye_frost_seed', 'basic'),
  ('dye_galaxy', 'basic'),
  ('dye_galaxy_seed', 'basic'),
  ('dye_gold', 'basic'),
  ('dye_gold_seed', 'basic'),
  ('dye_lavender', 'basic'),
  ('dye_lavender_seed', 'basic'),
  ('dye_mint', 'basic'),
  ('dye_mint_seed', 'basic'),
  ('dye_pink', 'basic'),
  ('dye_pink_seed', 'basic'),
  ('dye_purple', 'basic'),
  ('dye_purple_seed', 'basic'),
  ('dye_rainbow', 'basic'),
  ('dye_rainbow_seed', 'basic'),
  ('dye_red', 'basic'),
  ('dye_red_seed', 'basic'),
  ('dye_silver', 'basic'),
  ('dye_silver_seed', 'basic'),
  ('easel', 'uncommon'),
  ('easel_seed', 'uncommon'),
  ('electric_fan', 'uncommon'),
  ('electric_fan_seed', 'uncommon'),
  ('elevator', 'rare'),
  ('elevator_exit', 'basic'),
  ('elevator_seed', 'rare'),
  ('emerald_block', 'rare'),
  ('emerald_block_seed', 'rare'),
  ('empty_bottle', 'common'),
  ('empty_can', 'common'),
  ('evil_brick_background', 'rare'),
  ('evil_brick_background_seed', 'rare'),
  ('evil_bricks', 'rare'),
  ('evil_bricks_seed', 'rare'),
  ('faceless_head', 'rare'),
  ('factory_button', 'uncommon'),
  ('factory_button_seed', 'uncommon'),
  ('factory_core', 'epic'),
  ('factory_core_seed', 'epic'),
  ('factory_cutter', 'epic'),
  ('factory_cutter_seed', 'epic'),
  ('factory_gate', 'rare'),
  ('factory_gate_seed', 'rare'),
  ('factory_plate', 'uncommon'),
  ('factory_plate_seed', 'uncommon'),
  ('factory_wall', 'uncommon'),
  ('factory_wall_seed', 'uncommon'),
  ('fairy_wings', 'epic'),
  ('fall_weather_machine', 'legendary'),
  ('fire_hydrant', 'uncommon'),
  ('fire_hydrant_seed', 'uncommon'),
  ('fire_quiff', 'rare'),
  ('fire_sword', 'epic'),
  ('fire_sword_seed', 'epic'),
  ('fire_wand', 'epic'),
  ('fire_wand_seed', 'epic'),
  ('firefly_jar', 'rare'),
  ('firefly_jar_seed', 'rare'),
  ('fireplace', 'rare'),
  ('fireplace_seed', 'rare'),
  ('fish_fossil', 'rare'),
  ('fish_tank', 'rare'),
  ('fish_tank_seed', 'rare'),
  ('fishbowl', 'rare'),
  ('fishbowl_seed', 'rare'),
  ('fishing_rod', 'rare'),
  ('fishing_rod_seed', 'rare'),
  ('flame_scythe', 'epic'),
  ('flame_scythe_seed', 'epic'),
  ('flashlight', 'common'),
  ('flashlight_seed', 'common'),
  ('floor_lamp', 'uncommon'),
  ('floor_lamp_seed', 'uncommon'),
  ('flounder', 'common'),
  ('flounder_l', 'uncommon'),
  ('flounder_m', 'common'),
  ('flower_dress', 'uncommon'),
  ('flower_pot', 'common'),
  ('flower_pot_seed', 'common'),
  ('flower_shirt', 'uncommon'),
  ('flowery_wallpaper', 'common'),
  ('flowery_wallpaper_seed', 'common'),
  ('flute_note', 'common'),
  ('flute_note_seed', 'common'),
  ('foliage', 'common'),
  ('foliage_seed', 'common'),
  ('forest_cape', 'rare'),
  ('fountain', 'rare'),
  ('fountain_seed', 'rare'),
  ('fridge', 'rare'),
  ('fridge_seed', 'rare'),
  ('froghat', 'common'),
  ('froghat_seed', 'common'),
  ('frost_block', 'uncommon'),
  ('frost_block_seed', 'uncommon'),
  ('frosted_quiff', 'rare'),
  ('fruit_basket', 'common'),
  ('fruit_basket_seed', 'common'),
  ('fuel_can', 'uncommon'),
  ('fuel_can_seed', 'uncommon'),
  ('fuel_jar', 'rare'),
  ('fuel_tank', 'rare'),
  ('fuel_tank_seed', 'rare'),
  ('furious_scythe', 'legendary'),
  ('furious_scythe_seed', 'legendary'),
  ('galaxy_block', 'epic'),
  ('galaxy_block_seed', 'epic'),
  ('galaxy_bun', 'epic'),
  ('galaxy_cape', 'legendary'),
  ('galaxy_spikes', 'epic'),
  ('galaxy_wings', 'legendary'),
  ('gamblers_visor', 'common'),
  ('gamblers_visor_seed', 'common'),
  ('gaming_pc', 'rare'),
  ('gaming_pc_seed', 'rare'),
  ('garden_scythe', 'rare'),
  ('garden_scythe_seed', 'rare'),
  ('generator', 'epic'),
  ('generator_seed', 'epic'),
  ('genie_teapot', 'rare'),
  ('gift_box', 'uncommon'),
  ('gift_box_seed', 'uncommon'),
  ('gingerbread_block', 'uncommon'),
  ('gingerbread_block_seed', 'uncommon'),
  ('glass_block', 'common'),
  ('glass_block_seed', 'common'),
  ('glass_jar', 'uncommon'),
  ('glass_jar_seed', 'uncommon'),
  ('glass_pane', 'common'),
  ('glass_pane_seed', 'common'),
  ('globe', 'rare'),
  ('globe_seed', 'rare'),
  ('glow_block', 'rare'),
  ('glow_block_seed', 'rare'),
  ('glowing_black_crystal', 'legendary'),
  ('glowing_black_crystal_wings', 'legendary'),
  ('glowing_blue_crystal', 'legendary'),
  ('glowing_crystal_wings', 'legendary'),
  ('glowing_green_crystal', 'epic'),
  ('glowing_green_crystal_wings', 'legendary'),
  ('glowing_red_crystal', 'epic'),
  ('glowing_red_crystal_wings', 'legendary'),
  ('glowing_stone', 'rare'),
  ('glowing_white_crystal', 'legendary'),
  ('glowing_white_crystal_wings', 'legendary'),
  ('gold_bracelet', 'rare'),
  ('gold_bricks', 'rare'),
  ('gold_bricks_seed', 'rare'),
  ('gold_coins_block', 'epic'),
  ('gold_coins_block_seed', 'epic'),
  ('gold_rimmed_glasses', 'common'),
  ('gold_rimmed_glasses_seed', 'common'),
  ('gold_slippers', 'rare'),
  ('gold_sneakers', 'rare'),
  ('gold_tip_top_bun', 'rare'),
  ('gold_vein', 'legendary'), -- (build p: Legendary now)
  ('gold_vein_seed', 'legendary'),
  ('gold_watch', 'rare'),
  ('golden_aura', 'legendary'),
  ('golden_block', 'rare'),
  ('golden_block_seed', 'rare'),
  ('golden_cape', 'legendary'),
  ('golden_diaper', 'epic'),
  ('golden_kraken_beard', 'legendary'),
  ('golden_pickaxe', 'epic'),
  ('golden_platform', 'rare'),
  ('golden_platform_seed', 'rare'),
  ('golden_rod', 'epic'),
  ('golden_rod_seed', 'epic'),
  ('golden_scythe', 'epic'),
  ('golden_scythe_seed', 'epic'),
  ('golden_shipwreck', 'basic'),
  ('golden_shrimp', 'epic'),
  ('golden_sword', 'epic'),
  ('golden_sword_seed', 'epic'),
  ('golden_trophy', 'rare'),
  ('golden_trophy_seed', 'rare'),
  ('golden_wings', 'legendary'),
  ('grandfather_clock', 'rare'),
  ('grandfather_clock_seed', 'rare'),
  ('granite_block', 'uncommon'),
  ('granite_block_seed', 'uncommon'),
  ('grass', 'common'),
  ('grass_seed', 'common'),
  ('green_acid', 'uncommon'),
  ('green_block', 'common'),
  ('green_block_seed', 'common'),
  ('green_blouse', 'common'),
  ('green_blouse_seed', 'common'),
  ('green_crystal', 'rare'),
  ('green_crystal_block', 'epic'),
  ('green_crystal_wall', 'rare'),
  ('green_crystal_wings', 'legendary'),
  ('green_laser_gate', 'rare'),
  ('green_laser_gate_seed', 'rare'),
  ('green_plaid_scarf', 'uncommon'),
  ('green_polo', 'uncommon'),
  ('green_shirt', 'common'),
  ('green_shirt_seed', 'common'),
  ('green_skirt', 'common'),
  ('green_skirt_seed', 'common'),
  ('green_slippers', 'common'),
  ('green_tee', 'common'),
  ('green_wallpaper', 'common'),
  ('green_wallpaper_seed', 'common'),
  ('grey_block', 'common'),
  ('grey_block_seed', 'common'),
  ('grey_hair_bun', 'common'),
  ('grey_hair_bun_seed', 'common'),
  ('grey_wallpaper', 'common'),
  ('grey_wallpaper_seed', 'common'),
  ('grimstone', 'uncommon'),
  ('grimstone_seed', 'uncommon'),
  ('guard_glass', 'rare'),
  ('guard_glass_seed', 'rare'),
  ('guitar', 'rare'),
  ('guitar_seed', 'rare'),
  ('hair_spiky_black', 'common'),
  ('halloween_weather_machine', 'epic'),
  ('halo', 'epic'),
  ('halo_halo', 'uncommon'),
  ('halo_halo_seed', 'uncommon'),
  ('hammock', 'uncommon'),
  ('hammock_seed', 'uncommon'),
  ('hand_scythe', 'uncommon'),
  ('hand_scythe_seed', 'uncommon'),
  ('hanging_guytrap', 'uncommon'),
  ('hanging_guytrap_seed', 'uncommon'),
  ('hanging_vines', 'uncommon'),
  ('hanging_vines_seed', 'uncommon'),
  ('happy_joy_plaque', 'uncommon'),
  ('happy_joy_plaque_seed', 'uncommon'),
  ('hawaiian_polo', 'epic'),
  ('hawaiian_polo_red', 'epic'),
  ('hay_bale', 'common'),
  ('hay_bale_seed', 'common'),
  ('heart_bow', 'epic'),
  ('heart_bow_seed', 'epic'),
  ('heart_tee', 'common'),
  ('heart_wall_bg', 'rare'),
  ('heart_wall_bg_seed', 'rare'),
  ('hero_cape', 'rare'),
  ('hex_tiles', 'uncommon'),
  ('hex_tiles_seed', 'uncommon'),
  ('high_chair', 'uncommon'),
  ('high_chair_seed', 'uncommon'),
  ('holey_pants', 'common'),
  ('hologram_board', 'epic'),
  ('hologram_sign', 'rare'),
  ('honey_jar', 'rare'),
  ('honey_jar_seed', 'rare'),
  ('honeycomb_block', 'uncommon'),
  ('honeycomb_block_seed', 'uncommon'),
  ('hospital_bed', 'uncommon'),
  ('hospital_bed_seed', 'uncommon'),
  ('hot_head', 'rare'),
  ('hot_head_seed', 'rare'),
  ('hot_pink_highlights', 'common'),
  ('hot_pink_highlights_seed', 'common'),
  ('house_entrance', 'uncommon'),
  ('house_entrance_seed', 'uncommon'),
  ('ice', 'uncommon'),
  ('ice_bricks', 'uncommon'),
  ('ice_bricks_seed', 'uncommon'),
  ('ice_cream_block', 'uncommon'),
  ('ice_cream_block_seed', 'uncommon'),
  ('ice_cream_cart', 'rare'),
  ('ice_cream_cart_seed', 'rare'),
  ('ice_crust_block', 'uncommon'),
  ('ice_crust_block_seed', 'uncommon'),
  ('ice_platform', 'uncommon'),
  ('ice_platform_seed', 'uncommon'),
  ('ice_sculptures', 'uncommon'),
  ('ice_sculptures_seed', 'uncommon'),
  ('ice_seed', 'uncommon'),
  ('ice_sword', 'epic'),
  ('ice_sword_seed', 'epic'),
  ('ice_wand', 'epic'),
  ('ice_wand_seed', 'epic'),
  ('iron_bars', 'uncommon'),
  ('iron_bars_seed', 'uncommon'),
  ('item_vacuum', 'epic'),
  ('jack_o_lantern', 'uncommon'),
  ('jack_o_lantern_seed', 'uncommon'),
  ('jade_block', 'uncommon'),
  ('jade_block_seed', 'uncommon'),
  ('jam_jar', 'rare'),
  ('jam_jar_seed', 'rare'),
  ('jeans', 'common'),
  ('jeans_seed', 'common'),
  ('jelly_block', 'uncommon'),
  ('jelly_block_seed', 'uncommon'),
  ('jellyfish', 'common'),
  ('jellyfish_l', 'uncommon'),
  ('jellyfish_m', 'common'),
  ('jetpack', 'rare'),
  ('jetpack_seed', 'rare'),
  ('just_one_boxing_glove', 'common'),
  ('just_one_boxing_glove_seed', 'common'),
  ('karaoke_machine', 'rare'),
  ('karaoke_machine_seed', 'rare'),
  ('katana', 'rare'),
  ('katana_seed', 'rare'),
  ('kraken_beard', 'rare'),
  ('lantern', 'uncommon'),
  ('lantern_seed', 'uncommon'),
  ('laser_eyes', 'epic'),
  ('laser_eyes_seed', 'epic'),
  ('laser_gun', 'epic'),
  ('lattice_background', 'common'),
  ('lattice_background_seed', 'common'),
  ('lava', 'uncommon'),
  ('lava_lamp', 'rare'),
  ('lava_lamp_seed', 'rare'),
  ('lava_rock', 'uncommon'),
  ('lava_rock_seed', 'uncommon'),
  ('lava_seed', 'uncommon'),
  ('lavender_gown', 'epic'),
  ('lavender_swept_hair', 'rare'),
  ('leaf_block', 'common'),
  ('leaf_block_seed', 'common'),
  ('leaf_blower', 'rare'),
  ('leaf_blower_seed', 'rare'),
  ('leaf_crown', 'epic'),
  ('leaf_platform', 'uncommon'),
  ('leaf_platform_seed', 'uncommon'),
  ('leaf_wings', 'epic'),
  ('legendary_stone', 'legendary'),
  ('letter_a', 'basic'),
  ('letter_a_seed', 'basic'),
  ('letter_b', 'basic'),
  ('letter_b_seed', 'basic'),
  ('letter_c', 'basic'),
  ('letter_c_seed', 'basic'),
  ('letter_d', 'basic'),
  ('letter_d_seed', 'basic'),
  ('letter_e', 'basic'),
  ('letter_e_seed', 'basic'),
  ('letter_f', 'basic'),
  ('letter_f_seed', 'basic'),
  ('letter_g', 'basic'),
  ('letter_g_seed', 'basic'),
  ('letter_h', 'basic'),
  ('letter_h_seed', 'basic'),
  ('letter_i', 'basic'),
  ('letter_i_seed', 'basic'),
  ('letter_j', 'basic'),
  ('letter_j_seed', 'basic'),
  ('letter_k', 'basic'),
  ('letter_k_seed', 'basic'),
  ('letter_l', 'basic'),
  ('letter_l_seed', 'basic'),
  ('letter_m', 'basic'),
  ('letter_m_seed', 'basic'),
  ('letter_n', 'basic'),
  ('letter_n_seed', 'basic'),
  ('letter_o', 'basic'),
  ('letter_o_seed', 'basic'),
  ('letter_p', 'basic'),
  ('letter_p_seed', 'basic'),
  ('letter_q', 'basic'),
  ('letter_q_seed', 'basic'),
  ('letter_r', 'basic'),
  ('letter_r_seed', 'basic'),
  ('letter_s', 'basic'),
  ('letter_s_seed', 'basic'),
  ('letter_t', 'basic'),
  ('letter_t_seed', 'basic'),
  ('letter_u', 'basic'),
  ('letter_u_seed', 'basic'),
  ('letter_v', 'basic'),
  ('letter_v_seed', 'basic'),
  ('letter_w', 'basic'),
  ('letter_w_seed', 'basic'),
  ('letter_x', 'basic'),
  ('letter_x_seed', 'basic'),
  ('letter_y', 'basic'),
  ('letter_y_seed', 'basic'),
  ('letter_z', 'basic'),
  ('letter_z_seed', 'basic'),
  ('lift_gate', 'rare'),
  ('lift_gate_seed', 'rare'),
  ('lilac_slippers', 'common'),
  ('lollipop', 'uncommon'),
  ('lollipop_seed', 'uncommon'),
  ('long_black_hair', 'common'),
  ('long_black_hair_seed', 'common'),
  ('lucky_cat', 'rare'),
  ('lucky_cat_seed', 'rare'),
  ('magic_bacon_wallpaper', 'rare'),
  ('magic_bacon_wallpaper_seed', 'rare'),
  ('magic_mushroom', 'rare'),
  ('magic_mushroom_seed', 'rare'),
  ('magma_block', 'rare'),
  ('magma_block_seed', 'rare'),
  ('mailbox', 'basic'),
  ('mailbox_seed', 'basic'),
  ('mannequin', 'uncommon'),
  ('mannequin_seed', 'uncommon'),
  ('maple_plank_block', 'uncommon'),
  ('marble_block', 'uncommon'),
  ('marble_block_seed', 'uncommon'),
  ('marble_pillar', 'uncommon'),
  ('marble_pillar_seed', 'uncommon'),
  ('marlin', 'rare'),
  ('marlin_l', 'legendary'),
  ('marlin_m', 'rare'),
  ('messy_auburn_tresses', 'common'),
  ('messy_auburn_tresses_seed', 'common'),
  ('mic_stand', 'uncommon'),
  ('mic_stand_seed', 'uncommon'),
  ('microphone', 'rare'),
  ('mint_ponytail', 'rare'),
  ('mint_top_bun', 'rare'),
  ('moon_rock', 'uncommon'),
  ('moon_rock_seed', 'uncommon'),
  ('moon_rock_wall', 'common'),
  ('moon_rock_wall_seed', 'common'),
  ('moon_sand', 'uncommon'),
  ('moon_sand_seed', 'uncommon'),
  ('moon_sand_wall', 'common'),
  ('moon_sand_wall_seed', 'common'),
  ('mosaic_tiles', 'uncommon'),
  ('mosaic_tiles_seed', 'uncommon'),
  ('mossy_bricks', 'common'),
  ('mossy_bricks_seed', 'common'),
  ('mossy_cobblestone', 'uncommon'),
  ('mossy_cobblestone_seed', 'uncommon'),
  ('mud_glob', 'common'),
  ('mud_glob_seed', 'common'),
  ('mushroom', 'common'),
  ('mushroom_block', 'uncommon'),
  ('mushroom_block_seed', 'uncommon'),
  ('mushroom_seed', 'common'),
  ('music_tee', 'rare'),
  ('name_changer', 'epic'),
  ('navy_polo', 'uncommon'),
  ('needle_trap', 'rare'),
  ('needle_trap_seed', 'rare'),
  ('neon_blue', 'rare'),
  ('neon_blue_seed', 'rare'),
  ('neon_gray', 'rare'),
  ('neon_gray_seed', 'rare'),
  ('neon_green', 'rare'),
  ('neon_green_seed', 'rare'),
  ('neon_lights', 'rare'),
  ('neon_lights_seed', 'rare'),
  ('neon_off', 'rare'),
  ('neon_off_seed', 'rare'),
  ('neon_orange', 'rare'),
  ('neon_orange_seed', 'rare'),
  ('neon_platform', 'rare'),
  ('neon_platform_seed', 'rare'),
  ('neon_purple', 'rare'),
  ('neon_purple_seed', 'rare'),
  ('neon_red', 'rare'),
  ('neon_red_seed', 'rare'),
  ('neon_white', 'rare'),
  ('neon_white_seed', 'rare'),
  ('neon_yellow', 'rare'),
  ('neon_yellow_seed', 'rare'),
  ('night_weather_machine', 'epic'),
  ('nipa_thatch', 'common'),
  ('nipa_thatch_seed', 'common'),
  ('noah_rod', 'legendary'),
  ('noah_rod_seed', 'legendary'),
  ('note_block', 'uncommon'),
  ('note_block_seed', 'uncommon'),
  ('notice_board', 'uncommon'),
  ('notice_board_seed', 'uncommon'),
  ('number_0', 'basic'),
  ('number_0_seed', 'basic'),
  ('number_1', 'basic'),
  ('number_1_seed', 'basic'),
  ('number_2', 'basic'),
  ('number_2_seed', 'basic'),
  ('number_3', 'basic'),
  ('number_3_seed', 'basic'),
  ('number_4', 'basic'),
  ('number_4_seed', 'basic'),
  ('number_5', 'basic'),
  ('number_5_seed', 'basic'),
  ('number_6', 'basic'),
  ('number_6_seed', 'basic'),
  ('number_7', 'basic'),
  ('number_7_seed', 'basic'),
  ('number_8', 'basic'),
  ('number_8_seed', 'basic'),
  ('number_9', 'basic'),
  ('number_9_seed', 'basic'),
  ('obsidian_block', 'rare'),
  ('obsidian_block_seed', 'rare'),
  ('octagon_wall_sign', 'rare'),
  ('octagon_wall_sign_seed', 'rare'),
  ('octopus', 'uncommon'),
  ('octopus_l', 'rare'),
  ('octopus_m', 'uncommon'),
  ('oil_drum', 'rare'),
  ('oil_drum_seed', 'rare'),
  ('old_shoe', 'basic'),
  ('old_timey_hat', 'common'),
  ('old_timey_hat_seed', 'common'),
  ('olde_timey_radio', 'uncommon'),
  ('olde_timey_radio_seed', 'uncommon'),
  ('onyx_block', 'rare'),
  ('onyx_block_seed', 'rare'),
  ('orange', 'common'),
  ('orange_block', 'common'),
  ('orange_block_seed', 'common'),
  ('orange_seed', 'common'),
  ('orange_wallpaper', 'common'),
  ('orange_wallpaper_seed', 'common'),
  ('painting_dink_duck', 'common'),
  ('painting_dink_duck_seed', 'common'),
  ('painting_yerfdog', 'common'),
  ('painting_yerfdog_seed', 'common'),
  ('paper_umbrella', 'rare'),
  ('paper_umbrella_seed', 'rare'),
  ('park_bench', 'uncommon'),
  ('park_bench_seed', 'uncommon'),
  ('parol', 'rare'),
  ('parol_seed', 'rare'),
  ('password_door', 'rare'),
  ('password_door_seed', 'rare'),
  ('pastel_aqua_bg', 'common'),
  ('pastel_aqua_bg_seed', 'common'),
  ('pastel_blue_bg', 'common'),
  ('pastel_blue_bg_seed', 'common'),
  ('pastel_check_bg', 'rare'),
  ('pastel_check_bg_seed', 'rare'),
  ('pastel_cream_bg', 'common'),
  ('pastel_cream_bg_seed', 'common'),
  ('pastel_lavender_bg', 'common'),
  ('pastel_lavender_bg_seed', 'common'),
  ('pastel_mint_bg', 'common'),
  ('pastel_mint_bg_seed', 'common'),
  ('pastel_peach_bg', 'common'),
  ('pastel_peach_bg_seed', 'common'),
  ('pastel_pink_bg', 'common'),
  ('pastel_pink_bg_seed', 'common'),
  ('pastel_tiles', 'uncommon'),
  ('pastel_tiles_seed', 'uncommon'),
  ('pastel_yellow_bg', 'common'),
  ('pastel_yellow_bg_seed', 'common'),
  ('patent_leather_shoes', 'common'),
  ('patent_leather_shoes_seed', 'common'),
  ('pearl_block', 'rare'),
  ('pearl_block_seed', 'rare'),
  ('pencil', 'common'),
  ('pencil_seed', 'common'),
  ('pet_arctic_fox', 'rare'),
  ('pet_bat', 'rare'),
  ('pet_bee', 'common'),
  ('pet_bone_dragon', 'legendary'),
  ('pet_bunny', 'common'),
  ('pet_chick', 'common'),
  ('pet_cyborg', 'legendary'),
  ('pet_farmer_cat', 'rare'),
  ('pet_fox', 'rare'),
  ('pet_glacier_dragon', 'legendary'),
  ('pet_green_dragon', 'legendary'),
  ('pet_husky', 'rare'),
  ('pet_ice_dragon', 'legendary'),
  ('pet_jade_dragon', 'legendary'),
  ('pet_jellyfish', 'rare'),
  ('pet_kitten', 'common'),
  ('pet_lion', 'rare'),
  ('pet_panda', 'rare'),
  ('pet_parrot', 'rare'),
  ('pet_pearl_dragon', 'legendary'),
  ('pet_penguin', 'rare'),
  ('pet_phoenix', 'legendary'),
  ('pet_piglet', 'common'),
  ('pet_puppy', 'common'),
  ('pet_raptor', 'legendary'),
  ('pet_shadow_dragon', 'legendary'),
  ('pet_shark', 'rare'),
  ('pet_snow_owl', 'rare'),
  ('pet_sprout_slime', 'common'),
  ('pet_trex', 'legendary'),
  ('pet_turtle', 'common'),
  ('pet_unicorn', 'legendary'),
  ('phoenix_wings', 'legendary'),
  ('piano', 'uncommon'),
  ('piano_note', 'common'),
  ('piano_note_seed', 'common'),
  ('piano_seed', 'uncommon'),
  ('pickaxe', 'rare'),
  ('pickaxe_seed', 'rare'),
  ('picket_fence', 'common'),
  ('picket_fence_seed', 'common'),
  ('piggy_bank', 'rare'),
  ('piggy_bank_seed', 'rare'),
  ('pigtails', 'common'),
  ('pigtails_seed', 'common'),
  ('pink_flats', 'common'),
  ('pink_fluffy_scarf', 'rare'),
  ('pink_ombre_long_hair', 'rare'),
  ('pink_polo', 'uncommon'),
  ('pink_skirt', 'common'),
  ('pink_slippers', 'common'),
  ('pink_sundress', 'uncommon'),
  ('pirate_beard', 'rare'),
  ('pirate_flag', 'rare'),
  ('pirate_flag_seed', 'rare'),
  ('pirate_hat', 'rare'),
  ('plaid_skirt', 'uncommon'),
  ('plain_apricot_bg', 'rare'),
  ('plain_apricot_bg_seed', 'rare'),
  ('plain_ash_gray_bg', 'rare'),
  ('plain_ash_gray_bg_seed', 'rare'),
  ('plain_blue_gray_bg', 'epic'),
  ('plain_blue_gray_bg_seed', 'epic'),
  ('plain_butter_bg', 'rare'),
  ('plain_butter_bg_seed', 'rare'),
  ('plain_charcoal_bg', 'rare'),
  ('plain_charcoal_bg_seed', 'rare'),
  ('plain_coral_bg', 'rare'),
  ('plain_coral_bg_seed', 'rare'),
  ('plain_dark_gray_bg', 'rare'),
  ('plain_dark_gray_bg_seed', 'rare'),
  ('plain_graphite_bg', 'uncommon'),
  ('plain_graphite_bg_seed', 'uncommon'),
  ('plain_gray_bg', 'rare'),
  ('plain_gray_bg_seed', 'rare'),
  ('plain_iron_gray_bg', 'rare'),
  ('plain_iron_gray_bg_seed', 'rare'),
  ('plain_lilac_bg', 'epic'),
  ('plain_lilac_bg_seed', 'epic'),
  ('plain_mauve_bg', 'epic'),
  ('plain_mauve_bg_seed', 'epic'),
  ('plain_periwinkle_bg', 'rare'),
  ('plain_periwinkle_bg_seed', 'rare'),
  ('plain_portal', 'rare'),
  ('plain_portal_seed', 'rare'),
  ('plain_rose_bg', 'rare'),
  ('plain_rose_bg_seed', 'rare'),
  ('plain_sage_bg', 'rare'),
  ('plain_sage_bg_seed', 'rare'),
  ('plain_sand_bg', 'uncommon'),
  ('plain_sand_bg_seed', 'uncommon'),
  ('plain_sky_bg', 'rare'),
  ('plain_sky_bg_seed', 'rare'),
  ('plain_slate_bg', 'rare'),
  ('plain_slate_bg_seed', 'rare'),
  ('plain_teal_bg', 'rare'),
  ('plain_teal_bg_seed', 'rare'),
  ('plain_warm_gray_bg', 'uncommon'),
  ('plain_warm_gray_bg_seed', 'uncommon'),
  ('plain_white_tee', 'common'),
  ('plain_white_tee_seed', 'common'),
  ('plasma_sword', 'legendary'),
  ('plasma_sword_seed', 'legendary'),
  ('plumbing', 'common'),
  ('plumbing_seed', 'common'),
  ('pointy_sign', 'common'),
  ('pointy_sign_seed', 'common'),
  ('polka_dot_bg', 'rare'),
  ('polka_dot_bg_seed', 'rare'),
  ('polka_dot_block', 'common'),
  ('polka_dot_block_seed', 'common'),
  ('pool_tiles', 'common'),
  ('pool_tiles_seed', 'common'),
  ('poppy', 'common'),
  ('poppy_seed', 'common'),
  ('portal', 'rare'),
  ('portal_seed', 'rare'),
  ('portcullis', 'uncommon'),
  ('portcullis_seed', 'uncommon'),
  ('pot_of_gold', 'none'), -- (build p: taken out of the game)
  ('pot_of_gold_seed', 'none'),
  ('potted_fern', 'common'),
  ('potted_fern_seed', 'common'),
  ('potted_monstera', 'uncommon'),
  ('potted_monstera_seed', 'uncommon'),
  ('potted_tulips', 'common'),
  ('potted_tulips_seed', 'common'),
  ('pressure_booster', 'rare'),
  ('pressure_booster_seed', 'rare'),
  ('pressure_plate', 'uncommon'),
  ('pressure_plate_seed', 'uncommon'),
  ('prism_ring', 'legendary'),
  ('punch_jammer', 'rare'),
  ('purple_block', 'common'),
  ('purple_block_seed', 'common'),
  ('purple_mohawk', 'common'),
  ('purple_mohawk_seed', 'common'),
  ('purple_ombre_long_hair', 'rare'),
  ('purple_thong', 'common'),
  ('purple_thong_seed', 'common'),
  ('purple_wallpaper', 'common'),
  ('purple_wallpaper_seed', 'common'),
  ('question_door', 'rare'),
  ('question_door_seed', 'rare'),
  ('quilt_block', 'uncommon'),
  ('quilt_block_seed', 'uncommon'),
  ('rain_weather_machine', 'epic'),
  ('rainbow_afro', 'epic'),
  ('silver_wild_hair', 'rare'),
  ('silver_full_beard', 'rare'),
  ('boss_shades', 'rare'),
  ('rainbow_arch', 'rare'),
  ('rainbow_arch_seed', 'rare'),
  ('rainbow_block', 'rare'),
  ('rainbow_block_seed', 'rare'),
  ('rainbow_long_hair', 'epic'),
  ('rainbow_scarf', 'rare'),
  ('rainbow_shift_block', 'rare'),
  ('rainbow_shift_block_seed', 'rare'),
  ('rainbow_wristband', 'uncommon'),
  ('reaper_scythe', 'legendary'),
  ('red_aura', 'legendary'),
  ('red_bandana', 'common'),
  ('red_block', 'common'),
  ('red_block_seed', 'common'),
  ('red_bricks', 'common'),
  ('red_bricks_seed', 'common'),
  ('red_coat', 'common'),
  ('red_coat_seed', 'common'),
  ('red_crystal', 'rare'),
  ('red_crystal_block', 'epic'),
  ('red_crystal_gate', 'epic'),
  ('red_crystal_wall', 'rare'),
  ('red_crystal_wings', 'legendary'),
  ('red_curtain', 'basic'),
  ('red_fire_eyes', 'legendary'),
  ('red_flannel', 'uncommon'),
  ('red_flats', 'common'),
  ('red_glass_block', 'uncommon'),
  ('red_glass_block_seed', 'uncommon'),
  ('red_hair', 'uncommon'),
  ('red_hair_seed', 'uncommon'),
  ('red_knit_scarf', 'common'),
  ('red_laser_gate', 'rare'),
  ('red_laser_gate_seed', 'rare'),
  ('red_lock', 'uncommon'),
  ('red_party_dress', 'rare'),
  ('red_polo', 'uncommon'),
  ('red_riding_hood', 'common'),
  ('red_riding_hood_seed', 'common'),
  ('red_sneakers', 'uncommon'),
  ('red_streak_bob', 'rare'),
  ('red_tee', 'common'),
  ('red_wallpaper', 'common'),
  ('red_wallpaper_seed', 'common'),
  ('red_wood_wall', 'common'),
  ('red_wood_wall_seed', 'common'),
  ('red_wristband', 'common'),
  ('referee_shirt', 'common'),
  ('referee_shirt_seed', 'common'),
  ('retro_tv', 'rare'),
  ('retro_tv_seed', 'rare'),
  ('rice_cooker', 'uncommon'),
  ('rice_cooker_seed', 'uncommon'),
  ('ride_car', 'epic'),
  ('ride_carpet', 'legendary'),
  ('ride_cloud', 'legendary'),
  ('ride_harvester', 'legendary'),
  ('ride_horse', 'epic'),
  ('ride_leaf', 'legendary'),
  ('ride_leaf_green', 'legendary'),
  ('ride_leaf_yellow', 'legendary'),
  ('ride_truck', 'legendary'),
  ('ringer_tee', 'uncommon'),
  ('rock', 'common'),
  ('rock_background', 'common'),
  ('rock_background_seed', 'common'),
  ('rock_seed', 'common'),
  ('rocker_jeans', 'rare'),
  ('rocker_sneakers', 'rare'),
  ('rocket_ship', 'epic'),
  ('rocket_ship_seed', 'epic'),
  ('rocking_horse', 'rare'),
  ('rocking_horse_seed', 'rare'),
  ('romantic_bush_block', 'uncommon'),
  ('romantic_bush_block_seed', 'uncommon'),
  ('romantic_bushes', 'uncommon'),
  ('romantic_bushes_seed', 'uncommon'),
  ('rooster_hat', 'common'),
  ('rooster_hat_seed', 'common'),
  ('rose', 'common'),
  ('rose_quartz_block', 'rare'),
  ('rose_quartz_block_seed', 'rare'),
  ('rose_seed', 'common'),
  ('roulette_block', 'rare'),
  ('roulette_block_seed', 'rare'),
  ('royal_cape', 'epic'),
  ('royal_silk_scarf', 'epic'),
  ('royal_velvet', 'rare'),
  ('royal_velvet_seed', 'rare'),
  ('rubber_duck', 'uncommon'),
  ('rubber_duck_seed', 'uncommon'),
  ('ruby_block', 'rare'),
  ('ruby_block_seed', 'rare'),
  ('ruffle_blouse', 'uncommon'),
  ('ruin_bricks', 'uncommon'),
  ('ruin_bricks_seed', 'uncommon'),
  ('rustic_fence', 'common'),
  ('rustic_fence_seed', 'common'),
  ('rusty_metal', 'uncommon'),
  ('rusty_metal_seed', 'uncommon'),
  ('rvb_console', 'none'),
  ('sailor_dress', 'uncommon'),
  ('sailor_shirt', 'uncommon'),
  ('sakura_leaves', 'uncommon'),
  ('sakura_leaves_seed', 'uncommon'),
  ('sand', 'common'),
  ('sand_castle', 'rare'),
  ('sand_castle_seed', 'rare'),
  ('sand_seed', 'common'),
  ('sandstone', 'uncommon'),
  ('sandstone_bricks', 'common'),
  ('sandstone_bricks_seed', 'common'),
  ('sandstone_seed', 'uncommon'),
  ('santa_hat', 'common'),
  ('santa_hat_seed', 'common'),
  ('santa_pants', 'common'),
  ('santa_pants_seed', 'common'),
  ('santa_vest', 'common'),
  ('santa_vest_seed', 'common'),
  ('sapphire_block', 'rare'),
  ('sapphire_block_seed', 'rare'),
  ('saw_blade', 'rare'),
  ('saw_blade_seed', 'rare'),
  ('scarecrow', 'uncommon'),
  ('scarecrow_seed', 'uncommon'),
  ('school_desk', 'common'),
  ('school_desk_seed', 'common'),
  ('screen_door', 'common'),
  ('screen_door_seed', 'common'),
  ('sea_turtle', 'uncommon'),
  ('sea_turtle_l', 'rare'),
  ('sea_turtle_m', 'uncommon'),
  ('seahorse', 'common'),
  ('seahorse_l', 'uncommon'),
  ('seahorse_m', 'common'),
  ('seashell', 'uncommon'),
  ('seashell_seed', 'uncommon'),
  ('seaweed', 'common'),
  ('seaweed_seed', 'common'),
  ('secret_passage', 'rare'),
  ('secret_passage_seed', 'rare'),
  ('seraph_wings', 'epic'),
  ('set_astronaut', 'none'),
  ('set_autumn_red', 'none'),
  ('set_biker', 'none'),
  ('set_cat_hoodie', 'none'),
  ('set_chill_guy', 'none'),
  ('set_cozy_night', 'none'),
  ('set_factory', 'none'),
  ('set_fishing', 'none'),
  ('set_gentleman', 'none'),
  ('set_lady_green', 'none'),
  ('set_lolo', 'none'),
  ('set_music', 'none'),
  ('set_pastel_pop', 'none'),
  ('set_pink_rock', 'none'),
  ('set_rvb', 'none'),
  ('set_skull_beanie', 'none'),
  ('set_sporty', 'none'),
  ('set_stage', 'none'),
  ('set_sunshine', 'none'),
  ('sexy_boxers', 'common'),
  ('sexy_boxers_seed', 'common'),
  ('shades', 'common'),
  ('shades_seed', 'common'),
  ('shadow_wings', 'legendary'),
  ('shallot_mustache', 'common'),
  ('shallot_mustache_seed', 'common'),
  ('shark', 'rare'),
  ('shark_l', 'legendary'),
  ('shark_m', 'rare'),
  ('ship_flag', 'basic'),
  ('shipwreck', 'basic'),
  ('shovel', 'uncommon'),
  ('shrimp', 'rare'),
  ('sidewalk', 'common'),
  ('sidewalk_seed', 'common'),
  ('sign', 'common'),
  ('sign_seed', 'common'),
  ('signal_jammer', 'rare'),
  ('silver_streak_long_hair', 'rare'),
  ('silver_watch', 'uncommon'),
  ('skeleton', 'epic'),
  ('skeleton_seed', 'epic'),
  ('ski_cap', 'common'),
  ('ski_cap_seed', 'common'),
  ('skull_sign', 'uncommon'),
  ('skull_sign_seed', 'uncommon'),
  ('skull_tee', 'rare'),
  ('sky_polo', 'uncommon'),
  ('slate_tiles', 'common'),
  ('slate_tiles_seed', 'common'),
  ('slide_ice', 'uncommon'),
  ('slide_ice_seed', 'uncommon'),
  ('smarty_pants', 'uncommon'),
  ('smarty_pants_seed', 'uncommon'),
  ('smores_staff', 'rare'),
  ('smores_staff_seed', 'rare'),
  ('snail', 'uncommon'),
  ('snow_block', 'common'),
  ('snow_block_seed', 'common'),
  ('snow_globe', 'rare'),
  ('snow_globe_seed', 'rare'),
  ('snow_weather_machine', 'epic'),
  ('snowflake_scarf', 'uncommon'),
  ('snowman', 'uncommon'),
  ('snowman_seed', 'uncommon'),
  ('snowy_rocks', 'rare'),
  ('snowy_rocks_seed', 'rare'),
  ('solar_panel', 'rare'),
  ('solar_panel_seed', 'rare'),
  ('space_boots', 'epic'),
  ('space_helmet', 'epic'),
  ('space_suit', 'epic'),
  ('spear', 'uncommon'),
  ('spear_seed', 'uncommon'),
  ('spike_gate', 'rare'),
  ('spike_gate_seed', 'rare'),
  ('spikey_hair', 'common'),
  ('spikey_hair_seed', 'common'),
  ('spin_trigger', 'rare'),
  ('spin_trigger_seed', 'rare'),
  ('splash_ticket', 'none'),
  ('sponge', 'uncommon'),
  ('sponge_seed', 'uncommon'),
  ('spotlight', 'rare'),
  ('spotlight_seed', 'rare'),
  ('spring', 'rare'),
  ('spring_seed', 'rare'),
  ('squid', 'uncommon'),
  ('squid_l', 'rare'),
  ('squid_m', 'uncommon'),
  ('stage_block', 'basic'),
  ('stage_platform', 'basic'),
  ('stage_truss', 'basic'),
  ('stained_glass', 'rare'),
  ('stained_glass_seed', 'rare'),
  ('staircase', 'common'),
  ('staircase_seed', 'common'),
  ('stalactite', 'common'),
  ('stalactite_seed', 'common'),
  ('star_tee', 'uncommon'),
  ('starfish', 'uncommon'),
  ('starfish_seed', 'uncommon'),
  ('starry_block', 'rare'),
  ('starry_block_seed', 'rare'),
  ('starry_wall_bg', 'epic'),
  ('starry_wall_bg_seed', 'epic'),
  ('starter_pack', 'none'),
  ('steam_pipe', 'uncommon'),
  ('steam_pipe_seed', 'uncommon'),
  ('steel_beam', 'uncommon'),
  ('steel_beam_seed', 'uncommon'),
  ('steel_block', 'uncommon'),
  ('steel_block_seed', 'uncommon'),
  ('steel_bridge', 'rare'),
  ('steel_bridge_seed', 'rare'),
  ('steel_grate', 'uncommon'),
  ('steel_grate_seed', 'uncommon'),
  ('steel_screen_door', 'uncommon'),
  ('steel_screen_door_seed', 'uncommon'),
  ('stingray', 'rare'),
  ('stingray_l', 'legendary'),
  ('stingray_m', 'rare'),
  ('stinky_socks', 'common'),
  ('stinky_socks_seed', 'common'),
  ('stone_pusher_down', 'rare'),
  ('stone_pusher_down_seed', 'rare'),
  ('stone_pusher_left', 'rare'),
  ('stone_pusher_left_seed', 'rare'),
  ('stone_pusher_right', 'rare'),
  ('stone_pusher_right_seed', 'rare'),
  ('stone_pusher_up', 'rare'),
  ('stone_pusher_up_seed', 'rare'),
  ('stone_wall', 'common'),
  ('stone_wall_seed', 'common'),
  ('storage_chest', 'uncommon'),
  ('storage_chest_seed', 'uncommon'),
  ('stove', 'rare'),
  ('stove_seed', 'rare'),
  ('street_sign', 'uncommon'),
  ('street_sign_seed', 'uncommon'),
  ('streetlamp', 'uncommon'),
  ('streetlamp_seed', 'uncommon'),
  ('striped_polo', 'rare'),
  ('striped_tee', 'uncommon'),
  ('stripey_wallpaper', 'common'),
  ('stripey_wallpaper_seed', 'common'),
  ('suction_hose', 'rare'),
  ('suction_hose_seed', 'rare'),
  ('suction_intake', 'rare'),
  ('suction_intake_seed', 'rare'),
  ('sugar_cane', 'uncommon'),
  ('sugar_cane_seed', 'uncommon'),
  ('sunflower', 'uncommon'),
  ('sunflower_seed', 'uncommon'),
  ('sunny_weather_machine', 'epic'),
  ('sunset_ponytail', 'rare'),
  ('sunset_tee', 'rare'),
  ('super_bounce', 'rare'),
  ('super_bounce_seed', 'rare'),
  ('super_crate_box', 'uncommon'),
  ('super_crate_box_seed', 'uncommon'),
  ('super_saiyan_hair', 'legendary'),
  ('sword', 'uncommon'),
  ('sword_seed', 'uncommon'),
  ('tan_shirt', 'common'),
  ('tan_shirt_seed', 'common'),
  ('tank_lid', 'uncommon'),
  ('tank_lid_seed', 'uncommon'),
  ('teddy_bear', 'rare'),
  ('teddy_bear_seed', 'rare'),
  ('telescope', 'rare'),
  ('telescope_seed', 'rare'),
  ('terracotta_block', 'common'),
  ('terracotta_block_seed', 'common'),
  ('thunder_hammer', 'legendary'),
  ('thunder_hammer_seed', 'legendary'),
  ('ticket_master', 'none'),
  ('tie_dyed_shirt', 'uncommon'),
  ('tie_dyed_shirt_seed', 'uncommon'),
  ('tiger_block', 'uncommon'),
  ('tiger_block_seed', 'uncommon'),
  ('tiny_angel_wings', 'epic'),
  ('tiny_devil_wings', 'epic'),
  ('tiny_vampire_wings', 'epic'),
  ('tire_stack', 'rare'),
  ('tire_stack_seed', 'rare'),
  ('toilet', 'uncommon'),
  ('toilet_seed', 'uncommon'),
  ('tomato', 'common'),
  ('tomato_seed', 'common'),
  ('tombstone', 'uncommon'),
  ('tombstone_seed', 'uncommon'),
  ('top_hat', 'uncommon'),
  ('top_hat_seed', 'uncommon'),
  ('topaz_block', 'rare'),
  ('topaz_block_seed', 'rare'),
  ('torch', 'uncommon'),
  ('torch_seed', 'uncommon'),
  ('toy_block', 'uncommon'),
  ('toy_block_seed', 'uncommon'),
  ('toy_bricks', 'uncommon'),
  ('toy_bricks_seed', 'uncommon'),
  ('toy_car', 'uncommon'),
  ('toy_car_seed', 'uncommon'),
  ('toy_robot', 'rare'),
  ('toy_robot_seed', 'rare'),
  ('toy_rocket', 'rare'),
  ('toy_rocket_seed', 'rare'),
  ('track_shorts', 'uncommon'),
  ('traffic_cone', 'common'),
  ('traffic_cone_seed', 'common'),
  ('treasure_chest', 'epic'),
  ('treasure_chest_seed', 'epic'),
  ('tuxedo', 'rare'),
  ('tuxedo_seed', 'rare'),
  ('tv_head', 'rare'),
  ('tv_head_seed', 'rare'),
  ('unicorn_hair', 'rare'),
  ('unicorn_hair_seed', 'rare'),
  ('unicorn_plush', 'rare'),
  ('unicorn_plush_seed', 'rare'),
  ('vampire_cape', 'epic'),
  ('vampire_eyes', 'epic'),
  ('vampire_face', 'epic'),
  ('vampire_wings', 'legendary'),
  ('vending_machine', 'rare'),
  ('venus_guytrap', 'uncommon'),
  ('venus_guytrap_seed', 'uncommon'),
  ('vine_wall', 'common'),
  ('vine_wall_seed', 'common'),
  ('viney_block', 'common'),
  ('viney_block_seed', 'common'),
  ('viney_wallpaper', 'common'),
  ('viney_wallpaper_seed', 'common'),
  ('war_hammer', 'rare'),
  ('war_hammer_seed', 'rare'),
  ('water_bucket', 'common'),
  ('water_bucket_seed', 'common'),
  ('water_dispenser', 'uncommon'),
  ('water_dispenser_seed', 'uncommon'),
  ('water_gun', 'uncommon'),
  ('water_gun_seed', 'uncommon'),
  ('watermelon_block', 'uncommon'),
  ('watermelon_block_seed', 'uncommon'),
  ('wave_wall_bg', 'rare'),
  ('wave_wall_bg_seed', 'rare'),
  ('wedding_dress', 'rare'),
  ('wedding_dress_seed', 'rare'),
  ('wet_sponge', 'uncommon'),
  ('whale', 'legendary'),
  ('whale_l', 'legendary'),
  ('whale_m', 'legendary'),
  ('white_aura', 'legendary'),
  ('white_beard', 'common'),
  ('white_beard_seed', 'common'),
  ('white_block', 'common'),
  ('white_block_seed', 'common'),
  ('white_bricks', 'common'),
  ('white_bricks_seed', 'common'),
  ('white_crystal', 'epic'),
  ('white_crystal_block', 'epic'),
  ('white_crystal_wall', 'rare'),
  ('white_crystal_wings', 'legendary'),
  ('white_flats', 'common'),
  ('white_polo', 'uncommon'),
  ('white_sneakers', 'common'),
  ('white_sneakers_seed', 'common'),
  ('white_tee', 'common'),
  ('white_wallpaper', 'common'),
  ('white_wallpaper_seed', 'common'),
  ('white_wristband', 'common'),
  ('window', 'common'),
  ('window_seed', 'common'),
  ('wisdom_owl', 'epic'),
  ('wisdom_owl_seed', 'epic'),
  ('wishing_well', 'rare'),
  ('wishing_well_seed', 'rare'),
  ('wood_block', 'common'),
  ('wood_block_seed', 'common'),
  ('wood_wall_sign', 'uncommon'),
  ('wood_wall_sign_seed', 'uncommon'),
  ('wooden_background', 'common'),
  ('wooden_background_seed', 'common'),
  ('wooden_chair', 'common'),
  ('wooden_chair_seed', 'common'),
  ('wooden_crate', 'common'),
  ('wooden_crate_seed', 'common'),
  ('wooden_platform', 'common'),
  ('wooden_platform_seed', 'common'),
  ('wooden_table', 'common'),
  ('wooden_table_seed', 'common'),
  ('wooden_window', 'common'),
  ('wooden_window_seed', 'common'),
  ('wool_block', 'common'),
  ('wool_block_seed', 'common'),
  ('world_lock', 'lock1'),
  ('world_transfer', 'epic'),
  ('worm', 'uncommon'),
  ('wrench', 'basic'),
  ('x_ray_specs', 'common'),
  ('x_ray_specs_seed', 'common'),
  ('yellow_block', 'common'),
  ('yellow_block_seed', 'common'),
  ('yellow_polo', 'uncommon'),
  ('yellow_tee', 'common'),
  ('yellow_wallpaper', 'common'),
  ('yellow_wallpaper_seed', 'common')
on conflict (item) do update set cls = excluded.cls;

-- how many of one class a player may GET from play in an hour
create or replace function public.bag_cap(p_cls text)
returns bigint language sql immutable as $$
  select case p_cls when 'basic' then 20000 when 'common' then 8000 when 'uncommon' then 3000 when 'rare' then 800
    when 'epic' then 200 when 'legendary' then 50 when 'lock1' then 300 when 'lock2' then 5 when 'lock3' then 1 else 0 end
$$;
create or replace function public.bag_cls(p_item text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select cls from public.item_info where item = p_item), 'legendary')
$$;
create or replace function public.bag_qty(p_user uuid, p_item text)
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce((select qty from public.bag where user_id = p_user and item = p_item), 0)
$$;
-- add (or take, q < 0; never below 0) n of an item
create or replace function public.bag_add(p_user uuid, p_item text, p_qty bigint)
returns void language plpgsql security definer set search_path = public as $$
declare cur bigint;
begin
  if p_user is null or p_qty is null or p_qty = 0 or p_item is null or p_item = 'gold' or p_item like 'wkey\_%' then return; end if;
  if p_item !~ '^[a-z0-9_]{1,40}$' then return; end if;
  select qty into cur from public.bag where user_id = p_user and item = p_item for update;
  if cur is null then
    if p_qty > 0 then insert into public.bag (user_id, item, qty) values (p_user, p_item, p_qty) on conflict (user_id, item) do update set qty = public.bag.qty + excluded.qty; end if;
  elsif cur + p_qty <= 0 then
    delete from public.bag where user_id = p_user and item = p_item;
  else
    update public.bag set qty = cur + p_qty where user_id = p_user and item = p_item;
  end if;
end $$;
-- a player's first bag: copied once from his save (bag + hotbar + worn)
create or replace function public.bag_init(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare d jsonb; e jsonb; k text; v jsonb; tot bigint := 0; nm text;
begin
  if p_user is null or exists (select 1 from public.bag_meta where user_id = p_user) then return; end if;
  insert into public.bag_meta (user_id) values (p_user) on conflict do nothing;
  select data, username into d, nm from public.players where id = p_user;
  if d is null then return; end if;
  if jsonb_typeof(d -> 'inv') = 'array' then
    for e in select * from jsonb_array_elements(d -> 'inv') loop
      if jsonb_typeof(e) = 'object' and coalesce(e ->> 'id', '') ~ '^[a-z0-9_]{1,40}$' and jsonb_typeof(e -> 'qty') = 'number'
         and (e ->> 'qty')::numeric between 1 and 1000000 then
        perform public.bag_add(p_user, e ->> 'id', floor((e ->> 'qty')::numeric)::bigint);
        tot := tot + floor((e ->> 'qty')::numeric)::bigint;
      end if;
    end loop;
  end if;
  if jsonb_typeof(d -> 'equipped') = 'object' then
    for k, v in select key, value from jsonb_each(d -> 'equipped') loop
      if jsonb_typeof(v) = 'string' and (v #>> '{}') ~ '^[a-z0-9_]{1,40}$' then perform public.bag_add(p_user, v #>> '{}', 1); end if;
    end loop;
  end if;
  if tot > 3000 then
    insert into public.cheat_log (player_id, name, what, before_value, after_value) values (p_user, nm, 'bag start', 0, tot);
  end if;
end $$;
-- the bag as { item: qty } and what waits as { item: qty }
create or replace function public.bag_of(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'items', coalesce((select jsonb_object_agg(item, qty) from public.bag where user_id = p_user), '{}'::jsonb),
    'held', coalesce((select jsonb_object_agg(item, qty) from public.bag_held where user_id = p_user), '{}'::jsonb))
$$;
create or replace function public.bag_get()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  if auth.uid() is null or public.my_name() is null then raise exception 'Log in first'; end if;
  perform public.bag_init(auth.uid());
  return public.bag_of(auth.uid());
end $$;
-- GET n of an item from play (the hourly limit, the pool for Shop-only items); returns what was given now
create or replace function public.bag_earn(p_user uuid, p_item text, p_qty bigint, p_hold boolean)
returns bigint language plpgsql volatile security definer set search_path = public as $$
declare c text := public.bag_cls(p_item); r public.bag_rate; g bigint; pool bigint; nm text;
begin
  if p_qty <= 0 then return 0; end if;
  if public.is_gm() then perform public.bag_add(p_user, p_item, p_qty); return p_qty; end if;
  if c = 'none' then return 0; end if;
  if public.is_tracked(p_item) then
    -- Shop-only: only what players lost of it can be picked up again
    select qty into pool from public.bag_pool where item = p_item for update;
    g := least(p_qty, coalesce(pool, 0));
    if g > 0 then
      update public.bag_pool set qty = qty - g where item = p_item;
      perform public.bag_add(p_user, p_item, g);
    end if;
    return g;
  end if;
  insert into public.bag_rate (user_id, cls) values (p_user, c) on conflict do nothing;
  select * into r from public.bag_rate where user_id = p_user and cls = c for update;
  if r.hour_start < now() - interval '1 hour' then
    update public.bag_rate set hour_start = now(), n = 0 where user_id = p_user and cls = c returning * into r;
  end if;
  g := least(p_qty, greatest(public.bag_cap(c) - r.n, 0));
  if g > 0 then
    update public.bag_rate set n = n + g where user_id = p_user and cls = c;
    perform public.bag_add(p_user, p_item, g);
  end if;
  if g < p_qty and p_hold then
    insert into public.bag_held (user_id, item, qty) values (p_user, p_item, p_qty - g)
    on conflict (user_id, item) do update set qty = public.bag_held.qty + excluded.qty;
    if not exists (select 1 from public.cheat_log where player_id = p_user and what = 'bag held: ' || c and created_at > now() - interval '1 hour') then
      select name into nm from public.usernames where id = p_user;
      insert into public.cheat_log (player_id, name, what, before_value, after_value) values (p_user, nm, 'bag held: ' || c, public.bag_cap(c), p_qty - g);
    end if;
  end if;
  return g;
end $$;
-- what the game noticed changed in its bag since the server's last answer: { item: +n / -n } (at most 200 items)
create or replace function public.bag_sync(p_delta jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare me uuid := auth.uid(); k text; v jsonb; q bigint; have bigint; refused jsonb := '{}'::jsonb; g bigint; h public.bag_held;
begin
  if me is null or public.my_name() is null then raise exception 'Log in first'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  perform public.bag_init(me);
  perform 1 from public.bag_meta where user_id = me for update; -- one change at a time per player
  if jsonb_typeof(p_delta) = 'object' then
    if (select count(*) from jsonb_object_keys(p_delta)) > 200 then raise exception 'Too many changes at once'; end if;
    -- losses first (so a swap in one go works), then gains
    for k, v in select key, value from jsonb_each(p_delta) loop
      if k !~ '^[a-z0-9_]{1,40}$' or k = 'gold' or k like 'wkey\_%' or jsonb_typeof(v) <> 'number' then continue; end if;
      q := floor((v #>> '{}')::numeric);
      if q >= 0 or q < -1000000 then continue; end if;
      have := public.bag_qty(me, k);
      perform public.bag_add(me, k, -least(-q, have));
      if public.is_tracked(k) and least(-q, have) > 0 then
        insert into public.bag_pool (item, qty) values (k, least(-q, have)) on conflict (item) do update set qty = public.bag_pool.qty + excluded.qty;
      end if;
    end loop;
    for k, v in select key, value from jsonb_each(p_delta) loop
      if k !~ '^[a-z0-9_]{1,40}$' or k = 'gold' or k like 'wkey\_%' or jsonb_typeof(v) <> 'number' then continue; end if;
      q := floor((v #>> '{}')::numeric);
      if q <= 0 or q > 1000000 then continue; end if;
      g := public.bag_earn(me, k, q, true);
      if g < q and (public.bag_cls(k) = 'none' or public.is_tracked(k)) then refused := jsonb_set(refused, array[k], to_jsonb(q - g)); end if;
    end loop;
  end if;
  -- what waited: as much as the hour allows now
  for h in select * from public.bag_held where user_id = me loop
    g := public.bag_earn(me, h.item, h.qty, false);
    if g >= h.qty then delete from public.bag_held where user_id = me and item = h.item;
    elsif g > 0 then update public.bag_held set qty = qty - g where user_id = me and item = h.item;
    end if;
  end loop;
  return public.bag_of(me) || jsonb_build_object('refused', refused);
end $$;
-- 100 of a lock -> 1 of the next (p_up), or 1 -> 100 of the one below
create or replace function public.bag_lock_convert(p_item text, p_up boolean)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare me uuid := auth.uid(); tiers text[] := array['world_lock', 'diamond_lock', 'black_diamond_lock']; i integer; other text; gm boolean := public.is_gm();
begin
  if me is null or public.my_name() is null then raise exception 'Log in first'; end if;
  perform public.bag_init(me);
  perform 1 from public.bag_meta where user_id = me for update;
  i := array_position(tiers, p_item);
  if i is null then raise exception 'That isn''t a lock'; end if;
  other := tiers[i + case when p_up then 1 else -1 end];
  if other is null then raise exception 'There is no lock that way' using errcode = 'P0001'; end if;
  if p_up then
    if public.bag_qty(me, p_item) < 100 and not gm then raise exception 'You need 100' using errcode = 'P0001'; end if;
    perform public.bag_add(me, p_item, -100);
    perform public.bag_add(me, other, 1);
  else
    if public.bag_qty(me, p_item) < 1 and not gm then raise exception 'You have none' using errcode = 'P0001'; end if;
    perform public.bag_add(me, p_item, -1);
    perform public.bag_add(me, other, 100);
  end if;
  return public.bag_of(me);
end $$;

-- ---------- the trades, gifts, Mailbox, Shop and rewards move the bag too ----------
create or replace function public.trade_lack(p_id uuid, p_give jsonb)
returns text language plpgsql volatile security definer set search_path = public as $$
declare k text; q bigint; have bigint;
begin
  perform public.bag_init(p_id);
  for k, q in select key, public.jnum(value) from jsonb_each(p_give) loop
    if k = 'gold' then
      select gold into have from public.wallets where id = p_id;
      if coalesce(have, 0) < q then return 'Not enough gold for this trade'; end if;
    elsif k like 'wkey\_%' then
      null; -- World Keys: world_keys (give_world_key)
    else
      if public.is_tracked(k) then
        select qty into have from public.owned_items where player_id = p_id and item = k;
        if coalesce(have, 0) < q then return 'Not enough ' || k || ' for this trade'; end if;
      end if;
      if public.bag_qty(p_id, k) < q then return 'Not enough ' || k || ' for this trade'; end if;
    end if;
    have := null;
  end loop;
  return null;
end $$;
create or replace function public.trade_move(a uuid, b uuid, p_give jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare k text; q bigint;
begin
  perform public.bag_init(a);
  perform public.bag_init(b);
  for k, q in select key, public.jnum(value) from jsonb_each(p_give) loop
    if k = 'gold' then
      update public.wallets set gold = gold - q where id = a;
      update public.wallets set gold = gold + q where id = b;
    elsif k not like 'wkey\_%' then
      if public.is_tracked(k) then
        perform public.add_owned(a, k, -q);
        perform public.add_owned(b, k, q);
      end if;
      q := least(q, greatest(public.bag_qty(a, k), case when public.is_gm() then q else 0 end));
      perform public.bag_add(a, k, -q);
      perform public.bag_add(b, k, q);
    end if;
  end loop;
end $$;
revoke execute on function public.trade_lack(uuid, jsonb), public.trade_move(uuid, uuid, jsonb) from public, anon, authenticated;

create or replace function public.give_item(p_to uuid, p_item text, p_qty bigint)
returns text language plpgsql security definer set search_path = public as $$
declare had bigint; n bigint;
begin
  if public.is_banned() or p_to = auth.uid() or not exists (select 1 from public.usernames where id = p_to) then
    raise exception 'Can''t give that player items';
  end if;
  if p_qty is null or p_qty <= 0 or coalesce(p_item, '') !~ '^[a-z0-9_]{1,40}$' or p_item like 'wkey\_%' then return 'no'; end if;
  perform public.bag_init(auth.uid());
  perform public.bag_init(p_to);
  n := least(p_qty, case when public.is_gm() then p_qty else public.bag_qty(auth.uid(), p_item) end);
  if public.is_tracked(p_item) then
    select qty into had from public.owned_items where player_id = auth.uid() and item = p_item for update;
    had := coalesce(had, 0);
    if public.is_gm() then had := greatest(had, p_qty); end if;
    n := least(n, had);
    perform public.add_owned(auth.uid(), p_item, -n);
    perform public.add_owned(p_to, p_item, n);
  end if;
  if not public.is_gm() then perform public.bag_add(auth.uid(), p_item, -n); end if;
  perform public.bag_add(p_to, p_item, n);
  return 'ok';
end $$;

create or replace function public.gift_send(p_to uuid, p_item text, p_qty bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare had bigint; nid bigint; gm boolean := public.is_gm();
begin
  if auth.uid() is null or public.is_banned() or p_to = auth.uid() or not exists (select 1 from public.usernames where id = p_to) then
    raise exception 'Can''t give that player items';
  end if;
  if coalesce(p_item, '') like 'wkey\_%' or coalesce(p_item, '') !~ '^[a-z0-9_]{1,40}$' then return null; end if; -- keys: give_world_key
  if p_qty is null or p_qty < 1 or p_qty > 100000 then raise exception 'Bad amount'; end if;
  if (select count(*) from public.gift_escrow where from_id = auth.uid() and created_at > now() - interval '10 seconds') >= 5 then
    raise exception 'Too many gifts, wait a moment' using errcode = 'P0001';
  end if;
  perform public.bag_init(auth.uid());
  perform 1 from public.bag_meta where user_id = auth.uid() for update;
  if public.bag_qty(auth.uid(), p_item) < p_qty and not gm then raise exception 'You don''t have that many' using errcode = 'P0001'; end if;
  if public.is_tracked(p_item) then
    select qty into had from public.owned_items where player_id = auth.uid() and item = p_item for update;
    if coalesce(had, 0) < p_qty and not gm then raise exception 'You don''t have that many' using errcode = 'P0001'; end if;
    if not gm then perform public.add_owned(auth.uid(), p_item, -p_qty); end if;
  end if;
  if not gm then perform public.bag_add(auth.uid(), p_item, -p_qty); end if;
  insert into public.gift_escrow (from_id, to_id, item, qty) values (auth.uid(), p_to, p_item, p_qty) returning id into nid;
  return nid;
end $$;
create or replace function public.gift_take(p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.gift_escrow;
begin
  delete from public.gift_escrow where id = p_id and to_id = auth.uid() returning * into g;
  if not found then return null; end if;
  if public.is_tracked(g.item) then perform public.add_owned(auth.uid(), g.item, g.qty); end if;
  perform public.bag_init(auth.uid());
  perform public.bag_add(auth.uid(), g.item, g.qty);
  return jsonb_build_object('item', g.item, 'qty', g.qty, 'from', g.from_id);
end $$;
create or replace function public.gift_back(p_id bigint)
returns text language plpgsql security definer set search_path = public as $$
declare g public.gift_escrow;
begin
  delete from public.gift_escrow where id = p_id and (to_id = auth.uid() or from_id = auth.uid()) returning * into g;
  if not found then return 'gone'; end if;
  if public.is_tracked(g.item) then perform public.add_owned(g.from_id, g.item, g.qty); end if;
  perform public.bag_init(g.from_id);
  perform public.bag_add(g.from_id, g.item, g.qty);
  return 'back';
end $$;
grant execute on function public.gift_send(uuid, text, bigint), public.gift_take(bigint), public.gift_back(bigint) to authenticated;

create or replace function public.mailbox_send(p_world text, p_tile integer, p_subject text, p_body text, p_items jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); w public.worlds; t integer; s text; b text; e jsonb; clean jsonb := '[]'::jsonb;
  n integer; nid bigint; have bigint; gm boolean := public.is_gm();
begin
  if me is null or public.is_banned() then raise exception 'You can''t send mail' using errcode = '42501'; end if;
  select * into w from public.worlds where name = p_world;
  if not found then raise exception 'This world isn''t saved yet' using errcode = 'P0001'; end if;
  if w.owner is null then raise exception 'Nobody gets mail here: the world isn''t locked' using errcode = 'P0001'; end if;
  begin
    t := get_byte(decode(w.data ->> 'fg', 'base64'), p_tile);
  exception when others then t := -1;
  end;
  if t <> 208 then raise exception 'There is no Mailbox there' using errcode = 'P0001'; end if;
  s := left(btrim(regexp_replace(coalesce(p_subject, ''), '[[:cntrl:]]', ' ', 'g')), 40);
  b := left(btrim(coalesce(p_body, '')), 300);
  if s = '' then raise exception 'Write a subject first' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_items) = 'array' then
    if jsonb_array_length(p_items) > 5 then raise exception 'At most 5 items' using errcode = 'P0001'; end if;
    for e in select * from jsonb_array_elements(p_items) loop
      if jsonb_typeof(e) <> 'array' or coalesce(e ->> 0, '') !~ '^[a-z0-9_]{1,40}$' or (e ->> 0) like 'wkey\_%'
        or jsonb_typeof(e -> 1) <> 'number' or (e ->> 1)::numeric < 1 or (e ->> 1)::numeric > 200 then
        raise exception 'Bad item' using errcode = 'P0001';
      end if;
      clean := clean || jsonb_build_array(jsonb_build_array(e ->> 0, floor((e ->> 1)::numeric)::integer));
    end loop;
  end if;
  select count(*) into n from public.mailbox_letters where from_id = auth.uid() and created_at > now() - interval '5 seconds';
  if n > 0 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  select count(*) into n from public.mailbox_letters where world = p_world and tile = p_tile;
  if n >= 50 then raise exception 'This Mailbox is full' using errcode = 'P0001'; end if;
  -- (build m) every item leaves the sender's bag on the server (Shop-only ones also his owned count)
  perform public.bag_init(auth.uid());
  perform 1 from public.bag_meta where user_id = auth.uid() for update;
  for e in select * from jsonb_array_elements(clean) loop
    if not gm and public.bag_qty(auth.uid(), e ->> 0) < (e ->> 1)::bigint then
      raise exception 'You don''t have that many %', e ->> 0 using errcode = 'P0001';
    end if;
    if public.is_tracked(e ->> 0) and not gm then
      select qty into have from public.owned_items where player_id = auth.uid() and item = e ->> 0 for update;
      if coalesce(have, 0) < (e ->> 1)::bigint then raise exception 'You don''t have that many %', e ->> 0 using errcode = 'P0001'; end if;
      perform public.add_owned(auth.uid(), e ->> 0, -((e ->> 1)::bigint));
      have := null;
    end if;
    if not gm then perform public.bag_add(auth.uid(), e ->> 0, -((e ->> 1)::bigint)); end if;
  end loop;
  insert into public.mailbox_letters (world, tile, from_id, from_name, subject, body, items)
    values (p_world, p_tile, auth.uid(), me, s, b, clean) returning id into nid;
  return nid;
end $$;
create or replace function public.mailbox_claim(p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare l public.mailbox_letters; e jsonb;
begin
  select * into l from public.mailbox_letters where id = p_id for update;
  if not found then raise exception 'That letter is gone' using errcode = 'P0001'; end if;
  if not public.mailbox_mine(l.world) then raise exception 'This mail isn''t yours' using errcode = '42501'; end if;
  update public.mailbox_letters set items = '[]'::jsonb, is_read = true where id = p_id;
  perform public.bag_init(auth.uid());
  for e in select * from jsonb_array_elements(l.items) loop
    if public.is_tracked(e ->> 0) then perform public.add_owned(auth.uid(), e ->> 0, (e ->> 1)::bigint); end if;
    perform public.bag_add(auth.uid(), e ->> 0, (e ->> 1)::bigint);
  end loop;
  return l.items;
end $$;

create or replace function public.shop_buy(p_item text, p_qty integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr public.shop_prices; w public.wallets; gm boolean := public.is_gm();
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  select * into pr from public.shop_prices where item = p_item and qty = p_qty;
  if not found then raise exception 'That isn''t sold in the Shop' using errcode = 'P0001'; end if;
  if p_item in ('autumn_chest', 'ride_leaf', 'ride_leaf_green', 'ride_leaf_yellow') and not gm
     and not (now() >= timestamptz '2026-11-04 00:00:00+08' and now() < timestamptz '2026-12-05 00:00:00+08') then
    raise exception 'The Autumn event is over' using errcode = 'P0001';
  end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if not gm then
    if pr.bc > 0 then
      if w.bc < pr.bc then raise exception 'Not enough Balb Coins' using errcode = 'P0001'; end if;
      update public.wallets set bc = bc - pr.bc where id = auth.uid() returning * into w;
    else
      if w.gold < pr.gold then raise exception 'Not enough gold' using errcode = 'P0001'; end if;
      update public.wallets set gold = gold - pr.gold where id = auth.uid() returning * into w;
    end if;
  end if;
  if pr.tracked then perform public.add_owned(auth.uid(), p_item, p_qty); end if;
  -- (build m) into the bag (a pack's pieces come through play: bag_sync)
  if public.bag_cls(p_item) <> 'none' then
    perform public.bag_init(auth.uid());
    perform public.bag_add(auth.uid(), p_item, p_qty);
  end if;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc, 'bag', public.bag_cls(p_item) <> 'none');
end $$;

create or replace function public.claim_level_reward(p_lv integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w public.wallets; have integer; it text;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if p_lv is null or p_lv not in (50, 70, 80, 90, 100) then raise exception 'No reward for that level' using errcode = 'P0001'; end if;
  select public.xp_level(total) into have from public.xp_track where player_id = auth.uid();
  if coalesce(have, 1) < p_lv then
    raise exception 'The server has you at level % so far. Keep breaking blocks and try again later', coalesce(have, 1)
      using errcode = 'P0001';
  end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  begin
    insert into public.level_rewards (player_id, lv) values (auth.uid(), p_lv);
  exception when unique_violation then
    raise exception 'You already claimed the level % reward', p_lv using errcode = 'P0001';
  end;
  if p_lv = 70 then update public.wallets set gold = gold + 10000 where id = auth.uid() returning * into w;
  elsif p_lv = 80 then update public.wallets set gold = gold + 20000 where id = auth.uid() returning * into w;
  elsif p_lv = 90 then update public.wallets set bc = bc + 50 where id = auth.uid() returning * into w;
  else
    it := case p_lv when 50 then 'cat_ear_hoodie' else 'golden_pickaxe' end;
    perform public.add_owned(auth.uid(), it, 1);
    perform public.bag_init(auth.uid());
    perform public.bag_add(auth.uid(), it, 1);
  end if;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc, 'lv', p_lv);
end $$;
grant execute on function public.claim_level_reward(integer) to authenticated;

revoke execute on function public.bag_cap(text), public.bag_cls(text), public.bag_qty(uuid, text), public.bag_add(uuid, text, bigint),
  public.bag_init(uuid), public.bag_of(uuid), public.bag_earn(uuid, text, bigint, boolean) from public, anon, authenticated;
revoke execute on function public.bag_get(), public.bag_sync(jsonb), public.bag_lock_convert(text, boolean) from public, anon;
grant execute on function public.bag_get(), public.bag_sync(jsonb), public.bag_lock_convert(text, boolean) to authenticated;

-- ---------- PRIVACY: who sees where you are ----------
create table if not exists public.friends (
  a uuid not null references auth.users (id) on delete cascade,
  b uuid not null references auth.users (id) on delete cascade,
  primary key (a, b)
);
create table if not exists public.friend_asks (
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now(),
  primary key (from_id, to_id)
);
alter table public.friends enable row level security;
alter table public.friend_asks enable row level security;
revoke all on public.friends, public.friend_asks from anon, authenticated;
-- friends both saves already list (made once; mutual only)
insert into public.friends (a, b)
select p.id, (f ->> 'id')::uuid from public.players p, jsonb_array_elements(case when jsonb_typeof(p.data -> 'friends') = 'array' then p.data -> 'friends' else '[]'::jsonb end) f
where coalesce(f ->> 'id', '') ~ '^[0-9a-f-]{36}$'
  and exists (select 1 from public.players q, jsonb_array_elements(case when jsonb_typeof(q.data -> 'friends') = 'array' then q.data -> 'friends' else '[]'::jsonb end) g
              where q.id = (f ->> 'id')::uuid and g ->> 'id' = p.id::text)
  and exists (select 1 from auth.users u where u.id = (f ->> 'id')::uuid)
on conflict do nothing;
create or replace function public.friend_remove(p_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.friends where (a = auth.uid() and b = p_id) or (a = p_id and b = auth.uid());
$$;
revoke execute on function public.friend_remove(uuid) from public, anon;
grant execute on function public.friend_remove(uuid) to authenticated;

-- lobby_send (the inbox messages) also keeps the friendships: a request is remembered; an OK to someone who asked you
-- makes you friends both ways
create or replace function public.lobby_send(p_event text, p_to uuid, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); d jsonb; n integer;
begin
  if me is null or public.is_banned() then raise exception 'You can''t send messages' using errcode = '42501'; end if;
  if p_event is null or p_event not in ('dm', 'friend_req', 'friend_ok', 'friend_no', 'gift', 'gift_ok', 'gift_no',
      'trade_req', 'trade_yes', 'trade_no', 'trade_offer', 'trade_accept', 'trade_cancel', 'mail_ping', 'gold_done') then
    raise exception 'Unknown message' using errcode = 'P0001';
  end if;
  if p_to is null or p_to = auth.uid() or not exists (select 1 from public.usernames where id = p_to) then
    raise exception 'No such player' using errcode = 'P0001';
  end if;
  d := case when jsonb_typeof(p_data) = 'object' then p_data else '{}'::jsonb end;
  if length(d::text) > 4000 then raise exception 'Message too big' using errcode = 'P0001'; end if;
  if p_event = 'dm' then
    d := jsonb_set(d, '{text}', to_jsonb(left(btrim(regexp_replace(coalesce(d ->> 'text', ''), '[[:cntrl:]]', ' ', 'g')), 120)));
    if d ->> 'text' = '' then raise exception 'Write something first' using errcode = 'P0001'; end if;
  end if;
  select count(*) into n from public.lobby_sent where from_id = auth.uid() and created_at > now() - interval '10 seconds';
  if n >= 40 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  insert into public.lobby_sent (from_id) values (auth.uid());
  delete from public.lobby_sent where created_at < now() - interval '1 minute';
  if p_event = 'friend_req' then
    insert into public.friend_asks (from_id, to_id) values (auth.uid(), p_to) on conflict (from_id, to_id) do update set at = now();
  elsif p_event = 'friend_ok' then
    if exists (select 1 from public.friend_asks where from_id = p_to and to_id = auth.uid())
       or exists (select 1 from public.friends where a = auth.uid() and b = p_to) then
      insert into public.friends (a, b) values (auth.uid(), p_to), (p_to, auth.uid()) on conflict do nothing;
      delete from public.friend_asks where from_id = p_to and to_id = auth.uid();
    end if;
  elsif p_event = 'friend_no' then
    delete from public.friend_asks where from_id = p_to and to_id = auth.uid();
  end if;
  d := (d - 'to' - 'from' - 'fn') || jsonb_build_object('to', p_to, 'from', auth.uid(), 'fn', me);
  perform realtime.send(d, p_event, 'inbox:' || p_to::text, true);
end $$;
revoke all on function public.lobby_send(text, uuid, jsonb) from public, anon;
grant execute on function public.lobby_send(text, uuid, jsonb) to authenticated;

-- everyone online; the world only for yourself, your friends, players in your own world (and GMs)
create or replace function public.online_people()
returns table (id uuid, name text, world text) language sql stable security definer set search_path = public as $$
  with me as (select coalesce((select world from public.world_here where player_id = auth.uid() and at > now() - interval '75 seconds'), '') as w)
  select u.id, u.name,
    case when h.player_id = auth.uid() or public.is_gm()
           or (h.world <> '' and h.world = (select w from me))
           or exists (select 1 from public.friends f where f.a = auth.uid() and f.b = h.player_id)
         then h.world else '' end
  from public.world_here h join public.usernames u on u.id = h.player_id
  where h.at > now() - interval '75 seconds' and auth.uid() is not null
  order by h.at desc
  limit 2000
$$;
-- how many players are in each world now (no names)
create or replace function public.world_counts()
returns table (world text, n bigint) language sql stable security definer set search_path = public as $$
  select h.world, count(*) from public.world_here h
  where h.at > now() - interval '75 seconds' and h.world <> '' and auth.uid() is not null
  group by h.world
$$;
revoke all on function public.online_people(), public.world_counts() from public, anon;
grant execute on function public.online_people(), public.world_counts() to authenticated;

create or replace function public.board_list(p_world text, p_tile integer)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then '[]'::jsonb else
    coalesce((select jsonb_agg(jsonb_build_object('id', id, 'n', from_name, 't', body,
      'at', (extract(epoch from created_at) * 1000)::bigint) order by id)
      from (select * from public.board_posts where world = p_world and tile = p_tile order by id desc limit 100) p), '[]'::jsonb) end
$$;
revoke execute on function public.board_list(text, integer) from public, anon;
grant execute on function public.board_list(text, integer) to authenticated;

-- =====================================================================================================
-- SPLASH WARS TICKET EXCHANGE (Nov 12 2026, owner, build p): the swim rings (cow / duck 500 tickets, glowing 2,000),
-- Silver Wild Hair 700, Silver Full Beard 500, Boss Shades 400 (price picked by Claude), Hawaiian Polos 300, Cargo
-- Shorts 200, Penguin pet 1,500 (spw_shop above, in the SPLASH WARS part). The game: rvb.js (the booth in SPLASHWARS), floaties.js.
-- Safe to run more than once.
-- The rings are given only here (spw_shop.excl): they count as Shop-only items from now on (owned_items, the bag pool),
-- so they can't be made by play or a faked save.
create or replace function public.is_tracked(p_item text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shop_prices where item = p_item and tracked)
      or exists (select 1 from public.spw_shop where item = p_item and excl)
$$;
insert into public.item_info (item, cls) values
  ('cow_swim_ring', 'epic'), ('duck_swim_ring', 'epic'), ('glow_cow_swim_ring', 'legendary'), ('glow_duck_swim_ring', 'legendary'),
  ('mega_water_gun', 'legendary')
on conflict (item) do update set cls = excluded.cls;
-- one prize for its tickets: { got, ...spw_status }
create or replace function public.spw_exchange(p_item text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  nm text := public.my_name();
  pr public.spw_shop;
  have bigint;
begin
  if me is null or nm is null then raise exception 'Log in first'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  select * into pr from public.spw_shop where item = p_item;
  if not found then raise exception 'That isn''t exchanged here' using errcode = 'P0001'; end if;
  select tickets into have from public.spw_tickets where user_id = me for update;
  if coalesce(have, 0) < pr.tickets then raise exception 'Not enough tickets' using errcode = 'P0001'; end if;
  update public.spw_tickets set tickets = tickets - pr.tickets where user_id = me;
  perform public.bag_init(me);
  if public.is_tracked(p_item) then perform public.add_owned(me, p_item, pr.qty); end if;
  perform public.bag_add(me, p_item, pr.qty);
  return public.spw_status() || jsonb_build_object('got', p_item);
end $$;
revoke execute on function public.spw_exchange(text) from public, anon;
grant execute on function public.spw_exchange(text) to authenticated;

-- =====================================================================================================
-- (Nov 12 2026, owner, build p) "take Pot of Gold, Coin Fountain and Lucky Cat out of the game, the database too; the
-- Gold Vein drops coins a little less often and is Legendary". Safe to run more than once.
-- Pot of Gold and Coin Fountain (and their seeds) are gone: out of every bag, waiting gift / hold list and the pool, and
-- they can't be got from play any more (class 'none'). The money Lucky Cat used the id `lucky_cat` of the older Lucky
-- Cat block, which stays (so `lucky_cat` is not touched). The Gold Vein counts as Legendary.
delete from public.bag where item in ('pot_of_gold', 'pot_of_gold_seed', 'coin_fountain', 'coin_fountain_seed');
delete from public.bag_held where item in ('pot_of_gold', 'pot_of_gold_seed', 'coin_fountain', 'coin_fountain_seed');
delete from public.bag_pool where item in ('pot_of_gold', 'pot_of_gold_seed', 'coin_fountain', 'coin_fountain_seed');
insert into public.item_info (item, cls) values
  ('pot_of_gold', 'none'), ('pot_of_gold_seed', 'none'), ('coin_fountain', 'none'), ('coin_fountain_seed', 'none'),
  ('gold_vein', 'legendary'), ('gold_vein_seed', 'legendary')
on conflict (item) do update set cls = excluded.cls;
