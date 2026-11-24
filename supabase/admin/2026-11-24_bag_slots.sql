-- Run once in the Supabase SQL editor (Nov 24 2026): Extra Bag Slots sold in the Shop. Also in schema.sql.

-- ===== bag slots bought in the Shop (bagslots.js; owner, Nov 24 2026) =====
-- The bag starts with 74 slots (config.js BAG_FREE); each "Extra Bag Slot" adds 1, up to 130 (BAG_MAX), so at most
-- 56 bought. The next one costs 2000 + 500 x slots bought so far (bagslots.js BSLOT_BASE / BSLOT_STEP: keep them the
-- same). A player's first visit counts the slots their level had already opened (2 a level from level 10) as bought.
create table if not exists public.bag_slots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  bought integer not null default 0 check (bought between 0 and 56)
);
alter table public.bag_slots enable row level security;
revoke all on public.bag_slots from anon, authenticated;
create or replace function public.my_bag_slots()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer; lv integer;
begin
  if auth.uid() is null then return 0; end if;
  select bought into n from public.bag_slots where user_id = auth.uid();
  if found then return n; end if;
  select coalesce(floor(nullif(data->>'level', '')::numeric)::integer, 1) into lv from public.players where id = auth.uid();
  n := least(56, greatest(0, 2 * (coalesce(lv, 1) - 10 + 1)));
  insert into public.bag_slots (user_id, bought) values (auth.uid(), n) on conflict (user_id) do nothing;
  select bought into n from public.bag_slots where user_id = auth.uid();
  return n;
end $$;
create or replace function public.buy_bag_slot()
returns jsonb language plpgsql security definer set search_path = public as $$
declare n integer; price bigint; w public.wallets; gm boolean := public.is_gm();
begin
  if public.is_banned() then raise exception 'This account is banned' using errcode = '42501'; end if;
  perform public.my_bag_slots();
  select bought into n from public.bag_slots where user_id = auth.uid() for update;
  if n >= 56 then raise exception 'Your bag has all its slots' using errcode = 'P0001'; end if;
  price := 2000 + 500 * n;
  perform public.my_wallet();
  select * into w from public.wallets where id = auth.uid() for update;
  if not gm then
    if w.gold < price then raise exception 'Not enough gold' using errcode = 'P0001'; end if;
    update public.wallets set gold = gold - price where id = auth.uid() returning * into w;
  end if;
  update public.bag_slots set bought = bought + 1 where user_id = auth.uid() returning bought into n;
  return jsonb_build_object('gold', w.gold, 'held', w.held, 'bc', w.bc, 'slots', n);
end $$;
revoke execute on function public.my_bag_slots(), public.buy_bag_slot() from public, anon;
grant execute on function public.my_bag_slots(), public.buy_bag_slot() to authenticated;
