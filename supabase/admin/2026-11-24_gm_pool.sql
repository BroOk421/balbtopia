-- One-off (Nov 24 2026): run this in the Supabase SQL editor (or re-run schema.sql, which has it too).
-- 1) bag_gm_lost (a GM's Shop items put into a world can be taken by players with access); 2) the new blocks' classes.
-- Lets a GM's game put the Shop-only items the GM puts into a world (Display Box, Mannequin, Vending, placed,
-- dropped) into bag_pool, so a player with access can take them into his bag.
-- (Nov 24 2026, owner) A GM's bag is not kept on the server (no limits), so what a GM PUTS INTO THE WORLD (a Display
-- Box, a Mannequin, a Vending Machine, placed, dropped) never went into `bag_pool`: a player with access who took a
-- Shop-only item of the GM's out of it had it refused and it vanished from his bag. The GM's game now sends what it
-- lost here (online/bag.js, GM mode): the Shop-only ones go into the pool, so they can be picked up again.
create or replace function public.bag_gm_lost(p_delta jsonb)
returns void language plpgsql volatile security definer set search_path = public as $$
declare k text; v jsonb; q bigint;
begin
  if not public.is_gm() then raise exception 'GM only' using errcode = '42501'; end if;
  if jsonb_typeof(p_delta) <> 'object' then return; end if;
  if (select count(*) from jsonb_object_keys(p_delta)) > 200 then raise exception 'Too many changes at once'; end if;
  for k, v in select key, value from jsonb_each(p_delta) loop
    if k !~ '^[a-z0-9_]{1,40}$' or k = 'gold' or k like 'wkey\_%' or jsonb_typeof(v) <> 'number' then continue; end if;
    q := floor((v #>> '{}')::numeric);
    if q <= 0 or q > 1000000 then continue; end if;
    if public.is_tracked(k) then
      insert into public.bag_pool (item, qty) values (k, q) on conflict (item) do update set qty = public.bag_pool.qty + excluded.qty;
    end if;
  end loop;
end $$;
revoke execute on function public.bag_gm_lost(jsonb) from public, anon;
grant execute on function public.bag_gm_lost(jsonb) to authenticated;

-- (Nov 24 2026, owner) Zigzag Stairs (block 468, blocks/zigzagstairs.js): a Common splice block.
-- (and Chain, block 469, and Iron Lantern, block 470: Uncommon)
insert into public.item_info (item, cls) values ('zigzag_stairs', 'common'), ('zigzag_stairs_seed', 'common'),
  ('chain', 'uncommon'), ('chain_seed', 'uncommon'), ('iron_lantern', 'uncommon'), ('iron_lantern_seed', 'uncommon')
on conflict (item) do update set cls = excluded.cls;
