-- RUN ONCE in the Supabase SQL editor (also at the end of schema.sql). Nov 28 2026: a GM's items in a trade.

-- ---------- (Nov 28 2026) a GM's items in a TRADE (owner: "kapag may pahintulot ng gm at binigay ... kahit sa trade") ----------
-- A GM's bag isn't kept on the server, but trade_lack / trade_move asked is_gm() = the player who CONFIRMED last: when
-- the player confirmed last, the GM "didn't have" the items (trade failed) or 0 of them moved. Now they ask whether
-- the GIVING side is a GM (`is_gm_id`): a GM always has enough ITEMS, and the items a GM gives aren't taken from his
-- (unkept) bag or Shop count; the player gets all of them. Gold is checked and moved as before. (give_item / gift_send already let a GM give anything.)
create or replace function public.is_gm_id(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.gms g join public.usernames u on lower(u.name) = lower(g.name) where u.id = p_id)
$$;
revoke execute on function public.is_gm_id(uuid) from public, anon, authenticated;
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
    elsif not public.is_gm_id(p_id) then -- (a GM always has enough ITEMS; gold is counted as before)
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
declare k text; q bigint; gm boolean := public.is_gm_id(a);
begin
  perform public.bag_init(a);
  perform public.bag_init(b);
  for k, q in select key, public.jnum(value) from jsonb_each(p_give) loop
    if k = 'gold' then
      update public.wallets set gold = gold - q where id = a;
      update public.wallets set gold = gold + q where id = b;
    elsif k not like 'wkey\_%' then
      if public.is_tracked(k) then
        if not gm then perform public.add_owned(a, k, -q); end if;
        perform public.add_owned(b, k, q);
      end if;
      if not gm then
        q := least(q, public.bag_qty(a, k));
        perform public.bag_add(a, k, -q);
      end if;
      perform public.bag_add(b, k, q);
    end if;
  end loop;
end $$;
revoke execute on function public.trade_lack(uuid, jsonb), public.trade_move(uuid, uuid, jsonb) from public, anon, authenticated;
