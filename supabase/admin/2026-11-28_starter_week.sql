-- Starter Week (Nov 28 2026): run this once in the Supabase SQL Editor (it is also at the end of schema.sql).

-- ---------- STARTER WEEK (owner, Nov 28 2026; www/js/ui/starterweek.js) ----------
-- 7 gifts for NEW players, one per Manila day they come in: a missed day is never lost (the next gift just waits for
-- the next day they log in). Day 1 Pickaxe, 2 Worm x10, 3 Gold Lock, 4 Fishing Rod, 5 5,000 gold, 6 5,000 gold,
-- 7 1 Balb Coin. Once all 7 are claimed it never shows again. New = an account made on / after starter_since()
-- (change that date to give it to older accounts too); GMs may always claim (to test). Keep the list the same as
-- STARTER_GIFTS in starterweek.js. Items go straight into the server bag (like Shop buys), gold / coins into the wallet.
create table if not exists public.starter_week (
  player_id uuid primary key references auth.users (id) on delete cascade,
  n integer not null default 0,   -- gifts claimed (0-7)
  last_day date,                  -- the Manila day of the last claim
  at timestamptz not null default now()
);
alter table public.starter_week enable row level security;
revoke all on public.starter_week from anon, authenticated;
create or replace function public.starter_since()
returns timestamptz language sql immutable as $$ select timestamptz '2026-11-28 00:00:00+08' $$;
create or replace function public.starter_ok(p_user uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select public.is_gm()
      or exists (select 1 from public.starter_week where player_id = p_user)
      or coalesce((select created_at from auth.users where id = p_user) >= public.starter_since(), false)
$$;
create or replace function public.starter_status()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; s public.starter_week;
begin
  if auth.uid() is null then raise exception 'Log in first'; end if;
  select * into s from public.starter_week where player_id = auth.uid();
  return jsonb_build_object('ok', public.starter_ok(auth.uid()), 'n', coalesce(s.n, 0), 'last', s.last_day, 'today', d);
end $$;
create or replace function public.claim_starter(p_n integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Manila')::date; s public.starter_week; w public.wallets; me uuid := auth.uid();
begin
  if me is null then raise exception 'Log in first'; end if;
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  if not public.starter_ok(me) then raise exception 'The Starter Week is for new players' using errcode = 'P0001'; end if;
  insert into public.starter_week (player_id) values (me) on conflict do nothing;
  select * into s from public.starter_week where player_id = me for update;
  if s.n >= 7 then raise exception 'You already got every Starter Week gift' using errcode = 'P0001'; end if;
  if s.last_day is not distinct from d then raise exception 'Come back tomorrow for your next gift' using errcode = 'P0001'; end if;
  if p_n is distinct from s.n + 1 then raise exception 'Your next gift is day %', s.n + 1 using errcode = 'P0001'; end if;
  perform public.my_wallet();
  select * into w from public.wallets where id = me for update;
  if p_n in (1, 2, 3, 4) then perform public.bag_init(me); end if;
  case p_n
    when 1 then perform public.bag_add(me, 'pickaxe', 1);
    when 2 then perform public.bag_add(me, 'worm', 10);
    when 3 then perform public.bag_add(me, 'world_lock', 1);
    when 4 then perform public.bag_add(me, 'fishing_rod', 1);
    when 5, 6 then update public.wallets set gold = gold + 5000 where id = me returning * into w;
    else update public.wallets set bc = bc + 1 where id = me returning * into w;
  end case;
  update public.starter_week set n = p_n, last_day = d, at = now() where player_id = me;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc, 'n', p_n, 'last', d, 'today', d);
end $$;
revoke execute on function public.starter_ok(uuid) from public, anon, authenticated;
revoke execute on function public.starter_status(), public.claim_starter(integer) from public, anon;
grant execute on function public.starter_status(), public.claim_starter(integer) to authenticated;
