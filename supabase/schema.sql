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
-- does a Red / Blue Lock (data.al, www/js/alocks.js) let this player build somewhere in the world?
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

-- ---------- Red / Blue Lock (area locks, www/js/alocks.js) in a world without an owner ----------
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
create or replace function public.alock_guard(p_old jsonb, p_new jsonb, p_me text)
returns jsonb language plpgsql immutable as $$
declare
  others jsonb := '[]'::jsonb;
  merged jsonb := '[]'::jsonb;
  e jsonb;
  o jsonb;
  ti jsonb;
  t integer;
  ofg bytea; nfg bytea; obg bytea; nbg bytea; ova bytea; nva bytea;
  touched boolean := false;
  outd jsonb := p_new;
begin
  if jsonb_typeof(p_old -> 'al') = 'array' then
    select coalesce(jsonb_agg(x), '[]'::jsonb) into others
    from jsonb_array_elements(p_old -> 'al') x where public.alock_owned_by_other(x, p_me);
  end if;
  merged := others;
  if jsonb_typeof(p_new -> 'al') = 'array' then
    for e in select * from jsonb_array_elements(p_new -> 'al') loop
      if jsonb_typeof(e) <> 'array' or jsonb_typeof(e -> 0) <> 'number' or jsonb_typeof(e -> 1) <> 'object' then continue; end if;
      if exists (select 1 from jsonb_array_elements(others) k where k -> 0 = e -> 0) then continue; end if;
      merged := merged || jsonb_build_array(jsonb_build_array(e -> 0, jsonb_set(e -> 1, '{o}', to_jsonb(p_me))));
    end loop;
  end if;
  outd := jsonb_set(outd, '{al}', merged);
  if jsonb_array_length(others) = 0 then return outd; end if;
  begin
    ofg := decode(p_old ->> 'fg', 'base64'); nfg := decode(p_new ->> 'fg', 'base64');
    obg := decode(p_old ->> 'bg', 'base64'); nbg := decode(p_new ->> 'bg', 'base64');
    ova := decode(p_old ->> 'vari', 'base64'); nva := decode(p_new ->> 'vari', 'base64');
  exception when others then
    return outd; -- not readable: leave the tiles (the world's own checks still apply)
  end;
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
    end loop;
  end loop;
  if touched then
    outd := jsonb_set(outd, '{fg}', to_jsonb(translate(encode(nfg, 'base64'), E'\n', '')));
    outd := jsonb_set(outd, '{bg}', to_jsonb(translate(encode(nbg, 'base64'), E'\n', '')));
    if nva is not null then outd := jsonb_set(outd, '{vari}', to_jsonb(translate(encode(nva, 'base64'), E'\n', ''))); end if;
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
  mine boolean;
begin
  -- floating drops, as for any visitor
  if jsonb_typeof(p_new -> 'drops') = 'array' and jsonb_array_length(p_new -> 'drops') <= 400 then -- MAX_DROPS
    outd := jsonb_set(outd, '{drops}', p_new -> 'drops');
  end if;
  if jsonb_typeof(p_old -> 'al') <> 'array' then return outd; end if;
  begin
    ofg := decode(p_old ->> 'fg', 'base64'); nfg := decode(p_new ->> 'fg', 'base64');
    obg := decode(p_old ->> 'bg', 'base64'); nbg := decode(p_new ->> 'bg', 'base64');
    ova := decode(p_old ->> 'vari', 'base64'); nva := decode(p_new ->> 'vari', 'base64');
  exception when others then
    return outd;
  end;
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
  end loop;
  outd := jsonb_set(outd, '{fg}', to_jsonb(translate(encode(ofg, 'base64'), E'\n', '')));
  outd := jsonb_set(outd, '{bg}', to_jsonb(translate(encode(obg, 'base64'), E'\n', '')));
  if ova is not null then outd := jsonb_set(outd, '{vari}', to_jsonb(translate(encode(ova, 'base64'), E'\n', ''))); end if;
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
  if public.world_banned(p_name) then raise exception 'You are banned from this world' using errcode = '42501'; end if;
  if jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text) > 3000000 then
    raise exception 'Bad world data';
  end if;
  req := nullif(p_data ->> 'owner', '');
  select * into r from public.worlds where name = p_name for update;

  if not found then
    -- a world that was just moved (World Transfer): old games still in it would make it again at the old name
    if exists (select 1 from public.world_moves m where m.old_name = p_name and m.at > now() - interval '10 minutes') then
      raise exception 'This world moved to a new name' using errcode = 'P0001';
    end if;
    -- a new world: you can only lock it for yourself
    own := case when req is not null and (lower(req) = lower(me) or gm) then req end;
    if not gm then p_data := public.alock_guard('{}'::jsonb, p_data, me); end if; -- area locks: only your own
    outd := jsonb_set(p_data, '{owner}', coalesce(to_jsonb(own), 'null'::jsonb));
    insert into public.worlds (name, data, owner, updated_at, lockv) values (p_name, outd, own, now(), 0);
    perform public.vend_track(p_name, '[]'::jsonb, outd -> 'vends');
    return jsonb_build_object('r', 'saved', 'v', 0);
  end if;

  boss := r.owner is null or gm or lower(r.owner) = lower(me);
  if public.world_can_edit(r.owner, r.data, me, gm) then
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
     or not (public.is_gm() or lower(r.owner) = lower(me)) then
    raise exception 'Only the owner of this world can do that' using errcode = '42501';
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
     or not (public.is_gm() or lower(r.owner) = lower(me)) then
    raise exception 'Only the owner of this world can do that' using errcode = '42501';
  end if;
  select name into tn from public.usernames where id = p_to;
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
     or not (public.is_gm() or lower(r.owner) = lower(me)) then
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
  if me is null or not found or r.owner is null or not (public.is_gm() or lower(r.owner) = lower(me)) then
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
--     earn_gold credits at most EARN_PER_HOUR (10,000) per rolling hour; the rest waits in wallets.held (logged).
--     A GM can release it:  update wallets set gold = gold + held, held = 0 where id = (select id from usernames
--     where lower(name) = lower('NAME'));
--   * The gold in a player's save is always set to the wallet's (the save can't add gold).
--   * shop_prices must match the game's SHOP list (www/js/shop.js, music.js): change both together.
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
  ('clear_world', 1, 10000, true, 0),
  ('vending_machine', 1, 5000, true, 0),
  -- (display_box / mannequin: recipes now, not sold; Oct 25 2026)
  ('shovel', 1, 50000, true, 0),
  -- (golden_pickaxe: no longer sold, it is the level 100 reward: claim_level_reward)
  ('name_changer', 1, 30000, true, 0), -- rename.js
  ('world_transfer', 1, 10000, true, 0), -- rename.js
  ('diamond_pickaxe', 1, 0, true, 200),
  ('black_diamond_pickaxe', 1, 0, true, 300),
  ('angel_wings', 1, 0, true, 30),
  ('tiny_angel_wings', 1, 0, true, 16),
  ('golden_wings', 1, 0, true, 120),
  ('golden_aura', 1, 0, true, 200),
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
  ('pet_cosmic_dragon', 1, 100000, true, 0),
  ('pet_fire_dragon', 1, 100000, true, 0),
  ('pet_trex', 1, 80000, true, 0),
  ('pet_raptor', 1, 80000, true, 0)
on conflict (item, qty) do update set gold = excluded.gold, tracked = excluded.tracked, bc = excluded.bc;
-- anything no longer in the game's Shop list stops being sold
delete from public.shop_prices where (item, qty) not in (values ('name_changer', 1), ('world_transfer', 1), ('world_lock', 1), ('red_lock', 1), ('blue_lock', 1), ('atm_machine', 1), ('door_mover', 1), ('signal_jammer', 1), ('punch_jammer', 1), ('snow_weather_machine', 1), ('sunny_weather_machine', 1), ('rain_weather_machine', 1), ('clear_world', 1), ('vending_machine', 1), ('shovel', 1), ('diamond_pickaxe', 1), ('black_diamond_pickaxe', 1), ('angel_wings', 1), ('tiny_angel_wings', 1), ('golden_wings', 1), ('golden_aura', 1), ('red_aura', 1), ('dark_diamond_aura', 1), ('diamond_aura', 1), ('white_aura', 1), ('super_saiyan_hair', 1), ('seraph_wings', 1), ('demon_wings', 1), ('phoenix_wings', 1), ('crystal_wings', 1), ('fairy_wings', 1), ('shadow_wings', 1), ('celestial_wings', 1), ('dragon_wings', 1), ('leaf_wings', 1), ('galaxy_wings', 1), ('piano', 1), ('genie_teapot', 1), ('microphone', 1), ('set_gentleman', 1), ('set_sporty', 1), ('set_biker', 1), ('set_lolo', 1), ('set_chill_guy', 1), ('set_sunshine', 1), ('set_cozy_night', 1), ('set_autumn_red', 1), ('set_pastel_pop', 1), ('set_lady_green', 1), ('set_pink_rock', 1), ('set_skull_beanie', 1), ('set_cat_hoodie', 1), ('pet_puppy', 1), ('pet_kitten', 1), ('pet_bunny', 1), ('pet_chick', 1), ('pet_piglet', 1), ('pet_turtle', 1), ('pet_bee', 1), ('pet_sprout_slime', 1), ('pet_penguin', 1), ('pet_parrot', 1), ('pet_panda', 1), ('pet_fox', 1), ('pet_husky', 1), ('pet_arctic_fox', 1), ('pet_bat', 1), ('pet_jellyfish', 1), ('pet_shark', 1), ('pet_snow_owl', 1), ('pet_farmer_cat', 1), ('pet_lion', 1), ('pet_green_dragon', 1), ('pet_ice_dragon', 1), ('pet_unicorn', 1), ('pet_phoenix', 1), ('pet_cosmic_dragon', 1), ('pet_fire_dragon', 1), ('pet_trex', 1), ('pet_raptor', 1));

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

-- coins picked up from broken blocks and harvested trees: at most 10,000 per rolling hour, the rest held + logged
create or replace function public.earn_gold(p_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w public.wallets; lim constant bigint := 10000; ok bigint; over bigint; used bigint;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('gold', w.gold, 'held', w.held, 'over', 0); end if;
  p_amount := least(p_amount, 100000000);
  -- a rolling hour: what was earned drains away at 10,000 an hour (hour_start = last time it was worked out)
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
    values (auth.uid(), public.my_name(), 'gold held (over 10,000 an hour, or not online)', w.gold, w.held);
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
-- Keep the ranges the same as QUEST_REWARD in www/js/quests.js. The one-argument version above stays for old builds.
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
-- game. Keep the list the same as LEVEL_REWARDS in www/js/levels.js.
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
-- level from this count (`xp_level`), not from the save. GMs are not counted. Formula = xpNeed in www/js/menu.js.
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

-- ---------- CHANGE NAME and WORLD TRANSFER (owner, Oct 24 2026; www/js/rename.js) ----------
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
-- where did a world move to (in the last 10 minutes)? null if it didn't
create or replace function public.world_moved(p_old text)
returns text language sql stable security definer set search_path = public as $$
  select new_name from public.world_moves where old_name = p_old and at > now() - interval '10 minutes'
$$;
grant execute on function public.world_moved(text) to authenticated;

-- ---------- NOTICE BOARD SUGGESTIONS (owner, Oct 25 2026; www/js/board.js) ----------
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

-- ---------- MAILBOX: the GM's updates (owner, Oct 25 2026; www/js/mailbox.js) ----------
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

-- ---------- MAILBOX LETTERS (owner, Oct 25 2026; www/js/mailbox.js) ----------
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

-- ---------- GLOBAL CHAT (owner, Oct 25 2026; www/js/globalchat.js) ----------
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
