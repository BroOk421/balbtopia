-- Balbtopia, Nov 13 2026 (paste into Supabase -> SQL Editor -> Run; safe to run more than once):
--  * shouts: one every 5 min per player, one every 10 s on the whole server (GMs skip both)
--  * a shout reaches at most 100 online players (the sender's world first, then random; a GM's: everyone);
--    only they can read it back from the table
--  * Microphone costs 20,000 gold
--  * Ceiling Spotlight (Center) item class
--  * the Microphone comes out of the server bag (so dropped / picked up / traded ones work); GMs wait 5 min too
--  * no chatting in the LOBBY (send_chat)
--  * Genie Teapot: harder quests (1 or 2 parts), Balb Coins only (1 per part), quest_parts_for
--  * World Keys can be dropped and picked up (drop_world_key / pick_world_key; use_world_key fixed for a dropped key)
-- (Nov 13 2026) a shout reaches at most SHOUT_REACH online players (send_broadcast picks them): `to_ids` = who got it;
-- only they (and the sender) can read it back from the table. Older rows (to_ids null) stay readable by everyone.
alter table public.global_chat add column if not exists to_ids uuid[];
drop policy if exists "global chat: read" on public.global_chat;
create policy "global chat: read" on public.global_chat for select to authenticated using (
  not public.is_banned() and (to_ids is null or from_id = auth.uid() or auth.uid() = any (to_ids))
);
create or replace function public.send_broadcast(p_text text, p_world text)
returns bigint language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); t text; w text; n integer; nid bigint; ids uuid[]; gm boolean := public.is_gm();
  pl jsonb; r uuid;
  shout_reach constant integer := 100; -- (owner, Nov 13 2026: 100 to save, was 200) at most this many online players get a shout (GMs: everyone)
begin
  if me is null or public.is_banned() then raise exception 'You can''t broadcast' using errcode = '42501'; end if;
  t := left(btrim(regexp_replace(coalesce(p_text, ''), '[[:cntrl:]]', ' ', 'g')), 120);
  if t = '' then raise exception 'Write something first' using errcode = 'P0001'; end if;
  -- (Nov 13 2026, owner) one shout every 5 minutes per player, GMs too. Says how long is left, e.g. "4:12".
  begin
    select ceil(extract(epoch from (max(created_at) + interval '5 minutes' - now())))::integer into n
      from public.global_chat where from_id = auth.uid() and created_at > now() - interval '5 minutes';
    if n > 0 then
      raise exception 'You can shout again in %:%', n / 60, lpad((n % 60)::text, 2, '0') using errcode = 'P0001';
    end if;
  end;
  -- (Nov 13 2026) the whole server: at most one shout every 10 s (GMs skip the line). Checked BEFORE the Microphone
  -- is used, so a refused shout costs nothing. The lock makes two shouts at the same moment take turns.
  if not gm then
    perform pg_advisory_xact_lock(hashtext('balbtopia.global_chat'));
    select count(*) into n from public.global_chat where created_at > now() - interval '10 seconds';
    if n > 0 then raise exception 'Someone just shouted! Try again in a few seconds' using errcode = 'P0001'; end if;
  end if;
  -- one Microphone per shout (GMs: free), taken from the server BAG (Nov 13 2026: Microphones can be dropped / picked
  -- up / traded now, and the bag is where those end up; owned_items only follows along)
  if not gm then
    perform public.bag_init(auth.uid());
    perform 1 from public.bag_meta where user_id = auth.uid() for update;
    if public.bag_qty(auth.uid(), 'microphone') < 1 then
      raise exception 'You need a Microphone to shout (Shop, 20,000 gold)' using errcode = 'P0001';
    end if;
    perform public.bag_add(auth.uid(), 'microphone', -1);
    update public.owned_items set qty = greatest(qty - 1, 0) where player_id = auth.uid() and item = 'microphone';
  end if;
  w := case when coalesce(p_world, '') ~ '^[A-Z0-9]{1,16}$' then p_world else '' end;
  -- who hears it: players online now (said hello in the last 75 s, world_here), the sender's own world first, then
  -- the others in random order; at most shout_reach of them (a GM's shout: everyone online)
  select coalesce(array_agg(player_id), '{}') into ids from (
    select h.player_id from public.world_here h
    where h.at > now() - interval '75 seconds' and h.player_id <> auth.uid()
      and not exists (select 1 from public.bans b where b.id = h.player_id)
    order by (w <> '' and h.world = w) desc, random()
    limit case when gm then 100000 else shout_reach end
  ) x;
  insert into public.global_chat (from_id, from_name, world, body, to_ids)
    values (auth.uid(), me, w, t, ids || auth.uid()) returning id into nid;
  delete from public.global_chat where id < nid - 200;
  -- live: on each listener's own inbox (only they can listen there), the sender too (the game checks it came back)
  pl := jsonb_build_object('id', nid, 'u', auth.uid(), 'n', me, 'w', w, 't', t);
  begin
    foreach r in array (ids || auth.uid()) loop
      perform realtime.send(pl, 'g', 'inbox:' || r::text, true);
    end loop;
  exception when others then null; -- (the game also reads the table now and then)
  end;
  return nid;
end $$;
grant execute on function public.send_broadcast(text, text) to authenticated;

insert into public.shop_prices (item, qty, gold, tracked, bc) values ('microphone', 1, 20000, true, 0)
on conflict (item, qty) do update set gold = excluded.gold, tracked = excluded.tracked, bc = excluded.bc;

insert into public.item_info (item, cls) values ('ceiling_spotlight_center', 'basic')
on conflict (item) do update set cls = excluded.cls;

create or replace function public.send_chat(p_world text, p_text text)
returns text language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); t text; n integer;
begin
  if me is null or public.is_banned() then raise exception 'You can''t chat' using errcode = '42501'; end if;
  if p_world !~ '^[A-Z0-9]{1,16}$' then raise exception 'Bad world name'; end if;
  if public.world_banned(p_world) then raise exception 'You are banned from this world' using errcode = '42501'; end if;
  -- (owner, Nov 13 2026) nobody chats in the LOBBY (only /commands, which never reach the server)
  if p_world = 'LOBBY' then raise exception 'No chatting in the LOBBY (only /commands)' using errcode = 'P0001'; end if;
  t := left(btrim(regexp_replace(coalesce(p_text, ''), '[[:cntrl:]]', ' ', 'g')), 80); -- CHAT_MAX
  if t = '' then return 'empty'; end if;
  select count(*) into n from public.chat_sent where from_id = auth.uid() and created_at > now() - interval '5 seconds';
  if n >= 5 then raise exception 'Too fast! Wait a few seconds' using errcode = 'P0001'; end if;
  delete from public.chat_sent where created_at < now() - interval '1 minute';
  insert into public.chat_sent (from_id) values (auth.uid());
  perform realtime.send(jsonb_build_object('id', auth.uid(), 'n', me, 'text', t), 'chat', 'chat:' || p_world, true);
  return 'ok';
end $$;

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
    -- (Nov 13 2026) a DROPPED key (nobody holds it): the owner takes a new one, the dropped one stops working
    if k.holder_id is not null then raise exception 'The key of this world is already out' using errcode = 'P0001'; end if;
  end if;
  delete from public.world_keys where world = p_world; -- an old key from a former owner
  insert into public.world_keys (world, holder_id, owner_name) values (p_world, auth.uid(), r.owner);
  return 'ok';
end $$;

create or replace function public.use_world_key(p_world text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me text := public.my_name(); k public.world_keys; r public.worlds; lv integer;
begin
  if me is null or public.is_banned() then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into k from public.world_keys where world = p_world for update;
  -- (is distinct from: a dropped key has no holder, and "null <> me" would have let anyone through)
  if not found or k.holder_id is distinct from auth.uid() then raise exception 'This key doesn''t work' using errcode = 'P0001'; end if;
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

-- (owner, Nov 13 2026) World Keys can be DROPPED: the key then lies in that world (holder_id null, dropped_in) and
-- the first player IN that world (world_here) who picks it up holds it (pick_world_key). The owner can GET THE KEY
-- again while it lies somewhere: the dropped one stops working.
alter table public.world_keys alter column holder_id drop not null;
alter table public.world_keys add column if not exists dropped_in text;
alter table public.world_keys add column if not exists dropped_at timestamptz;
create or replace function public.drop_world_key(p_world text, p_in text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if public.my_name() is null or public.is_banned() then raise exception 'Not signed in' using errcode = '42501'; end if;
  if coalesce(p_in, '') !~ '^[A-Z0-9]{1,16}$' or p_in = 'LOBBY'
     or not exists (select 1 from public.world_here where player_id = auth.uid() and world = p_in and at > now() - interval '75 seconds') then
    raise exception 'You can''t drop the key here' using errcode = 'P0001';
  end if;
  update public.world_keys set holder_id = null, dropped_in = p_in, dropped_at = now()
  where world = p_world and holder_id = auth.uid();
  if not found then raise exception 'You don''t hold the key of %', p_world using errcode = 'P0001'; end if;
  return 'ok';
end $$;
create or replace function public.pick_world_key(p_world text)
returns text language plpgsql security definer set search_path = public as $$
declare here text;
begin
  if public.my_name() is null or public.is_banned() then raise exception 'Not signed in' using errcode = '42501'; end if;
  select world into here from public.world_here where player_id = auth.uid() and at > now() - interval '75 seconds';
  update public.world_keys set holder_id = auth.uid(), dropped_in = null, dropped_at = null
  where world = p_world and holder_id is null and dropped_in is not null and dropped_in = here;
  if not found then raise exception 'This key isn''t here any more' using errcode = 'P0001'; end if;
  return 'ok';
end $$;
revoke all on function public.drop_world_key(text, text), public.pick_world_key(text) from public, anon;
grant execute on function public.drop_world_key(text, text), public.pick_world_key(text) to authenticated;

create or replace function public.drop_ok(d jsonb)
returns boolean language sql immutable as $$
  select jsonb_typeof(d) = 'array' and jsonb_array_length(d) between 7 and 8
    and jsonb_typeof(d -> 0) = 'string' and length(d ->> 0) between 1 and 40
    and coalesce(d ->> 1, '') ~ '^([a-z0-9_]{1,40}|wkey_[A-Z0-9]{1,16})$' -- (Nov 13 2026: a dropped World Key too)
    and jsonb_typeof(d -> 2) = 'number' and (d ->> 2)::numeric between 1 and 999999
    and jsonb_typeof(d -> 3) = 'number' and jsonb_typeof(d -> 4) = 'number' and jsonb_typeof(d -> 5) = 'number'
$$;

-- (owner, Nov 13 2026: "no gold reward any more, Balb Coins only; harder quests, sometimes 2 requirements") every
-- quest pays Balb Coins now; quest_parts_for says whether a player's day has 1 or 2 parts (QUEST_TWO_PER_MILLE 350 in
-- 1,000, the same as quests.js), and a quest pays 1 Balb Coin per part.
create or replace function public.quest_kind_for(p_id uuid, p_day date)
returns text language sql immutable as $$
  select 'bc'::text
$$;
revoke all on function public.quest_kind_for(uuid, date) from public, anon, authenticated;
create or replace function public.quest_parts_for(p_id uuid, p_day date)
returns integer language sql immutable as $$
  select case when (('x' || substr(md5(p_day::text || ':parts:' || p_id::text), 1, 8))::bit(32)::bigint % 1000) < 350
              then 2 else 1 end
$$;
revoke all on function public.quest_parts_for(uuid, date) from public, anon, authenticated;
create or replace function public.quest_today()
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; w public.wallets;
begin
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid();
  return jsonb_build_object('day', d, 'done', w.quest_day is not distinct from d, 'bc', w.bc,
                            'kind', 'bc', 'parts', public.quest_parts_for(auth.uid(), d));
end $$;

create or replace function public.claim_daily_quest(p_day date, p_kind text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; w public.wallets; n bigint; parts integer; have integer;
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if p_kind is null or p_kind not in ('bc', 'gold') then raise exception 'Unknown reward' using errcode = 'P0001'; end if;
  if p_day is distinct from d then raise exception 'A new day started: open the teapot again' using errcode = 'P0001'; end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if w.quest_day is not distinct from d then raise exception 'You already did today''s quest' using errcode = 'P0001'; end if;
  -- (Nov 13 2026) Balb Coins only: 1 per part of the server's pick (whatever an old game asks for)
  parts := public.quest_parts_for(auth.uid(), d);
  -- real time online today first (the game counts the quest itself): 15 minutes per part (GMs: not checked)
  if not public.is_gm() then
    execute 'select public.played_today($1)' into have using auth.uid();
    if coalesce(have, 0) < 15 * 60 * parts then
      raise exception 'Play a little longer today first (% more min)', greatest(1, ceil((15 * 60 * parts - coalesce(have, 0)) / 60.0)::integer)
        using errcode = 'P0001';
    end if;
  end if;
  n := parts;
  update public.wallets set bc = bc + n, quest_day = d where id = auth.uid() returning * into w;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc, 'got', n, 'kind', 'bc');
end $$;
