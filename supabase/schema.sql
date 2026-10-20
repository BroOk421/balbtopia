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
    perform public.vend_track(p_name, '[]'::jsonb, outd -> 'vends');
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
    if own is distinct from r.owner then delete from public.world_keys where world = p_name; end if;
    perform public.vend_track(p_name, r.data -> 'vends', p_data -> 'vends');
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
  ('door_mover', 1, 1000, true, 0),
  ('signal_jammer', 1, 2000, true, 0),
  ('punch_jammer', 1, 2000, true, 0),
  ('snow_weather_machine', 1, 5000, true, 0),
  ('sunny_weather_machine', 1, 5000, true, 0),
  ('rain_weather_machine', 1, 5000, true, 0),
  ('clear_world', 1, 1500, true, 0),
  ('vending_machine', 1, 5000, true, 0),
  ('display_box', 1, 1000, true, 0),
  ('mannequin', 1, 2500, true, 0),
  ('shovel', 1, 1500, true, 0),
  ('golden_pickaxe', 1, 50000, true, 0),
  ('diamond_pickaxe', 1, 0, true, 15),
  ('black_diamond_pickaxe', 1, 0, true, 40),
  ('angel_wings', 1, 0, true, 10),
  ('tiny_angel_wings', 1, 0, true, 5),
  ('golden_wings', 1, 0, true, 24),
  ('golden_aura', 1, 0, true, 20),
  ('red_aura', 1, 0, true, 20),
  ('dark_diamond_aura', 1, 0, true, 30),
  ('diamond_aura', 1, 0, true, 24),
  ('white_aura', 1, 0, true, 20),
  ('super_saiyan_hair', 1, 0, true, 16),
  ('seraph_wings', 1, 0, true, 12),
  ('demon_wings', 1, 0, true, 14),
  ('phoenix_wings', 1, 0, true, 24),
  ('crystal_wings', 1, 0, true, 20),
  ('fairy_wings', 1, 0, true, 16),
  ('shadow_wings', 1, 0, true, 18),
  ('celestial_wings', 1, 0, true, 28),
  ('dragon_wings', 1, 0, true, 22),
  ('leaf_wings', 1, 0, true, 12),
  ('galaxy_wings', 1, 0, true, 32),
  ('piano', 1, 3000, true, 0),
  ('piano', 5, 12500, true, 0),
  ('genie_teapot', 1, 1000, true, 0)
on conflict (item, qty) do update set gold = excluded.gold, tracked = excluded.tracked, bc = excluded.bc;
-- anything no longer in the game's Shop list stops being sold
delete from public.shop_prices where (item, qty) not in (values ('world_lock', 1), ('door_mover', 1), ('signal_jammer', 1), ('punch_jammer', 1), ('snow_weather_machine', 1), ('sunny_weather_machine', 1), ('rain_weather_machine', 1), ('clear_world', 1), ('vending_machine', 1), ('display_box', 1), ('mannequin', 1), ('shovel', 1), ('golden_pickaxe', 1), ('diamond_pickaxe', 1), ('black_diamond_pickaxe', 1), ('angel_wings', 1), ('tiny_angel_wings', 1), ('golden_wings', 1), ('golden_aura', 1), ('red_aura', 1), ('dark_diamond_aura', 1), ('diamond_aura', 1), ('white_aura', 1), ('super_saiyan_hair', 1), ('seraph_wings', 1), ('demon_wings', 1), ('phoenix_wings', 1), ('crystal_wings', 1), ('fairy_wings', 1), ('shadow_wings', 1), ('celestial_wings', 1), ('dragon_wings', 1), ('leaf_wings', 1), ('galaxy_wings', 1), ('piano', 1), ('piano', 5), ('genie_teapot', 1));

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
  if public.is_gm() then ok := p_amount; end if;
  over := p_amount - ok;
  update public.wallets
  set gold = gold + ok, held = held + over, hour_start = now(), earned_hour = used + ok
  where id = auth.uid()
  returning * into w;
  if over > 0 and not exists (select 1 from public.cheat_log where player_id = auth.uid() and what like 'gold held%'
                              and created_at > now() - interval '1 hour') then
    insert into public.cheat_log (player_id, name, what, before_value, after_value)
    values (auth.uid(), public.my_name(), 'gold held (over 10,000 an hour)', w.gold, w.held);
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
create or replace function public.quest_today()
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; w public.wallets;
begin
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid();
  return jsonb_build_object('day', d, 'done', w.quest_day is not distinct from d, 'bc', w.bc);
end $$;
create or replace function public.claim_daily_quest(p_day date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; w public.wallets;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if p_day is distinct from d then raise exception 'A new day started: open the teapot again' using errcode = 'P0001'; end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if w.quest_day is not distinct from d then raise exception 'You already did today''s quest' using errcode = 'P0001'; end if;
  update public.wallets set bc = bc + 1, quest_day = d where id = auth.uid() returning * into w;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc);
end $$;
grant execute on function public.quest_today(), public.claim_daily_quest(date) to authenticated;
