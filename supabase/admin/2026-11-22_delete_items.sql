-- (Nov 22 2026 build l: the capes came back too.)
-- (Nov 22 2026 build j: the scythes came back; they were taken out of this list, so running it again keeps them.)
-- Deleted items, everywhere in the database (owner, Nov 22 2026: "remove the wearables made in code, keep only the
-- rings; the raptor too; the code-made weapon tools; delete them everywhere in the database; the pacifier, the diapers
-- and the Faceless Head"). The list = the game's www/js/core/gone.js, plus every item's seed.
-- What this does (STEP 2, one transaction: nothing changes if something fails):
--   - every player save (players.data): out of the bag list (inv), out of every worn slot (equipped), out of the hand;
--   - every world (worlds.data): floating drops, Display Boxes, Mannequin slots and trees of them are taken out;
--     a Vending Machine selling one is emptied (its World Locks earned stay in it);
--   - server bag / hold list / pool / tracked counts / gifts waiting / vending counts, Shop prices, the Splash Wars
--     exchange; item_info class 'none' so the server never adds them again (schema.sql has the same block at the end);
--   - trade offers that give or ask for one are deleted.
-- THIS CAN'T BE UNDONE. Run STEP 1 (changes nothing) to see how much is affected, then STEP 2.
-- (The game itself also cleans what it loads: bags / worn items by cleanInv, worlds by core/gone.js.)

-- ============ STEP 1: LOOK FIRST (changes nothing) ============
with gone as (select unnest(array[
    'cyclopean_visor', 'backpack', 'jetpack', 'angel_wings', 'golden_wings',
    'tiny_angel_wings', 'tiny_devil_wings', 'vampire_wings', 'tiny_vampire_wings', 'dark_diamond_aura',
    'diamond_aura', 'white_aura', 'red_aura', 'golden_aura', 'seraph_wings',
    'demon_wings', 'phoenix_wings', 'crystal_wings', 'fairy_wings', 'shadow_wings',
    'celestial_wings', 'dragon_wings', 'leaf_wings', 'galaxy_wings', 'laser_eyes',
    'red_fire_eyes', 'blue_fire_eyes', 'blue_pacifier', 'vampire_face', 'vampire_eyes', 'faceless_head', 'autumn_wings', 'red_crystal_wings',
    'green_crystal_wings', 'white_crystal_wings', 'black_crystal_wings', 'glowing_crystal_wings', 'glowing_red_crystal_wings',
    'glowing_green_crystal_wings', 'glowing_white_crystal_wings', 'glowing_black_crystal_wings', 'boss_shades', 'gold_watch',
    'silver_watch', 'diamond_watch', 'black_watch', 'red_wristband', 'blue_wristband',
    'black_wristband', 'white_wristband', 'rainbow_wristband', 'gold_bracelet', 'diamond_diaper',
    'golden_diaper', 'pet_raptor', 'katana', 'fire_sword', 'ice_sword',
    'golden_sword', 'plasma_sword', 'battle_axe', 'war_hammer', 'spear',
    'bolo', 'arnis_stick', 'leaf_blower', 'smores_staff', 'heart_bow', 'fire_wand', 'ice_wand', 'chainsaw', 'dragon_hand',
    'thunder_hammer', 'paper_umbrella', 'autumn_cape', 'cyclopean_visor_seed',
    'backpack_seed', 'jetpack_seed', 'angel_wings_seed', 'golden_wings_seed', 'tiny_angel_wings_seed',
    'tiny_devil_wings_seed', 'vampire_wings_seed', 'tiny_vampire_wings_seed', 'dark_diamond_aura_seed', 'diamond_aura_seed',
    'white_aura_seed', 'red_aura_seed', 'golden_aura_seed', 'seraph_wings_seed', 'demon_wings_seed',
    'phoenix_wings_seed', 'crystal_wings_seed', 'fairy_wings_seed', 'shadow_wings_seed', 'celestial_wings_seed',
    'dragon_wings_seed', 'leaf_wings_seed', 'galaxy_wings_seed', 'laser_eyes_seed', 'red_fire_eyes_seed',
    'blue_fire_eyes_seed', 'blue_pacifier_seed', 'vampire_face_seed',
    'vampire_eyes_seed', 'faceless_head_seed', 'autumn_wings_seed', 'red_crystal_wings_seed', 'green_crystal_wings_seed',
    'white_crystal_wings_seed', 'black_crystal_wings_seed', 'glowing_crystal_wings_seed', 'glowing_red_crystal_wings_seed', 'glowing_green_crystal_wings_seed',
    'glowing_white_crystal_wings_seed', 'glowing_black_crystal_wings_seed', 'boss_shades_seed', 'gold_watch_seed', 'silver_watch_seed',
    'diamond_watch_seed', 'black_watch_seed', 'red_wristband_seed', 'blue_wristband_seed', 'black_wristband_seed',
    'white_wristband_seed', 'rainbow_wristband_seed', 'gold_bracelet_seed', 'diamond_diaper_seed', 'golden_diaper_seed',
    'pet_raptor_seed', 'katana_seed', 'fire_sword_seed', 'ice_sword_seed', 'golden_sword_seed',
    'plasma_sword_seed', 'battle_axe_seed', 'war_hammer_seed', 'spear_seed', 'bolo_seed',
    'arnis_stick_seed', 'leaf_blower_seed', 'smores_staff_seed', 'heart_bow_seed',
    'fire_wand_seed', 'ice_wand_seed', 'chainsaw_seed', 'dragon_hand_seed', 'thunder_hammer_seed',
    'paper_umbrella_seed', 'autumn_cape_seed'
  ]) as item)
select 'server bags' as what, count(*) as rows_ from public.bag where item in (select item from gone)
union all select 'player saves (bag list)', count(*) from public.players p
  where exists (select 1 from jsonb_array_elements(case when jsonb_typeof(p.data -> 'inv') = 'array' then p.data -> 'inv' else '[]' end) e
                where e ->> 'id' in (select item from gone))
union all select 'player saves (worn / hand)', count(*) from public.players p
  where p.data ->> 'hand' in (select item from gone)
     or exists (select 1 from jsonb_each_text(case when jsonb_typeof(p.data -> 'equipped') = 'object' then p.data -> 'equipped' else '{}' end) w
                where w.value in (select item from gone))
union all select 'worlds', count(*) from public.worlds w
  where exists (select 1 from jsonb_array_elements(case when jsonb_typeof(w.data -> 'drops') = 'array' then w.data -> 'drops' else '[]' end) e where e ->> 1 in (select item from gone))
     or exists (select 1 from jsonb_array_elements(case when jsonb_typeof(w.data -> 'disp') = 'array' then w.data -> 'disp' else '[]' end) e where e ->> 1 in (select item from gone))
     or exists (select 1 from jsonb_array_elements(case when jsonb_typeof(w.data -> 'trees') = 'array' then w.data -> 'trees' else '[]' end) e where e ->> 1 in (select item from gone))
     or exists (select 1 from jsonb_array_elements(case when jsonb_typeof(w.data -> 'vends') = 'array' then w.data -> 'vends' else '[]' end) e where e -> 1 ->> 'id' in (select item from gone))
     or exists (select 1 from jsonb_array_elements(case when jsonb_typeof(w.data -> 'mann') = 'array' then w.data -> 'mann' else '[]' end) e,
                jsonb_each_text(case when jsonb_typeof(e -> 1) = 'object' then e -> 1 else '{}' end) s where s.value in (select item from gone))
union all select 'trade offers', count(*) from public.trade_offers t
  where t.give::text ~ ('"(' || (select string_agg(item, '|') from gone) || ')"') or t.get::text ~ ('"(' || (select string_agg(item, '|') from gone) || ')"');


-- ============ STEP 2: DELETE ============
do $$
declare
  gone text[] := array[
    'cyclopean_visor', 'backpack', 'jetpack', 'angel_wings', 'golden_wings',
    'tiny_angel_wings', 'tiny_devil_wings', 'vampire_wings', 'tiny_vampire_wings', 'dark_diamond_aura',
    'diamond_aura', 'white_aura', 'red_aura', 'golden_aura', 'seraph_wings',
    'demon_wings', 'phoenix_wings', 'crystal_wings', 'fairy_wings', 'shadow_wings',
    'celestial_wings', 'dragon_wings', 'leaf_wings', 'galaxy_wings', 'laser_eyes',
    'red_fire_eyes', 'blue_fire_eyes', 'blue_pacifier', 'vampire_face', 'vampire_eyes', 'faceless_head', 'autumn_wings', 'red_crystal_wings',
    'green_crystal_wings', 'white_crystal_wings', 'black_crystal_wings', 'glowing_crystal_wings', 'glowing_red_crystal_wings',
    'glowing_green_crystal_wings', 'glowing_white_crystal_wings', 'glowing_black_crystal_wings', 'boss_shades', 'gold_watch',
    'silver_watch', 'diamond_watch', 'black_watch', 'red_wristband', 'blue_wristband',
    'black_wristband', 'white_wristband', 'rainbow_wristband', 'gold_bracelet', 'diamond_diaper',
    'golden_diaper', 'pet_raptor', 'katana', 'fire_sword', 'ice_sword',
    'golden_sword', 'plasma_sword', 'battle_axe', 'war_hammer', 'spear',
    'bolo', 'arnis_stick', 'leaf_blower', 'smores_staff', 'heart_bow', 'fire_wand', 'ice_wand', 'chainsaw', 'dragon_hand',
    'thunder_hammer', 'paper_umbrella', 'autumn_cape', 'cyclopean_visor_seed',
    'backpack_seed', 'jetpack_seed', 'angel_wings_seed', 'golden_wings_seed', 'tiny_angel_wings_seed',
    'tiny_devil_wings_seed', 'vampire_wings_seed', 'tiny_vampire_wings_seed', 'dark_diamond_aura_seed', 'diamond_aura_seed',
    'white_aura_seed', 'red_aura_seed', 'golden_aura_seed', 'seraph_wings_seed', 'demon_wings_seed',
    'phoenix_wings_seed', 'crystal_wings_seed', 'fairy_wings_seed', 'shadow_wings_seed', 'celestial_wings_seed',
    'dragon_wings_seed', 'leaf_wings_seed', 'galaxy_wings_seed', 'laser_eyes_seed', 'red_fire_eyes_seed',
    'blue_fire_eyes_seed', 'blue_pacifier_seed', 'vampire_face_seed',
    'vampire_eyes_seed', 'faceless_head_seed', 'autumn_wings_seed', 'red_crystal_wings_seed', 'green_crystal_wings_seed',
    'white_crystal_wings_seed', 'black_crystal_wings_seed', 'glowing_crystal_wings_seed', 'glowing_red_crystal_wings_seed', 'glowing_green_crystal_wings_seed',
    'glowing_white_crystal_wings_seed', 'glowing_black_crystal_wings_seed', 'boss_shades_seed', 'gold_watch_seed', 'silver_watch_seed',
    'diamond_watch_seed', 'black_watch_seed', 'red_wristband_seed', 'blue_wristband_seed', 'black_wristband_seed',
    'white_wristband_seed', 'rainbow_wristband_seed', 'gold_bracelet_seed', 'diamond_diaper_seed', 'golden_diaper_seed',
    'pet_raptor_seed', 'katana_seed', 'fire_sword_seed', 'ice_sword_seed', 'golden_sword_seed',
    'plasma_sword_seed', 'battle_axe_seed', 'war_hammer_seed', 'spear_seed', 'bolo_seed',
    'arnis_stick_seed', 'leaf_blower_seed', 'smores_staff_seed', 'heart_bow_seed',
    'fire_wand_seed', 'ice_wand_seed', 'chainsaw_seed', 'dragon_hand_seed', 'thunder_hammer_seed',
    'paper_umbrella_seed', 'autumn_cape_seed'
  ];
  pat text;
begin
  pat := '"(' || array_to_string(gone, '|') || ')"';

  -- player saves: the bag list, every worn slot, the hand
  update public.players p set data = jsonb_set(p.data, '{inv}', coalesce((
      select jsonb_agg(e) from jsonb_array_elements(p.data -> 'inv') e where not (e ->> 'id' = any (gone))), '[]'::jsonb))
    where jsonb_typeof(p.data -> 'inv') = 'array'
      and exists (select 1 from jsonb_array_elements(p.data -> 'inv') e where e ->> 'id' = any (gone));
  update public.players p set data = jsonb_set(p.data, '{equipped}', (
      select jsonb_object_agg(w.key, case when w.value #>> '{}' = any (gone) then 'null'::jsonb else w.value end)
      from jsonb_each(p.data -> 'equipped') w))
    where jsonb_typeof(p.data -> 'equipped') = 'object'
      and exists (select 1 from jsonb_each_text(p.data -> 'equipped') w where w.value = any (gone));
  update public.players p set data = jsonb_set(p.data, '{hand}', 'null'::jsonb) where p.data ->> 'hand' = any (gone);

  -- worlds: drops [uid, item, ...], Display Boxes [tile, item], trees [tile, seed, ...], Vending Machines [tile, {id, n, ...}],
  -- Mannequins [tile, {slot: item}]
  update public.worlds w set data = jsonb_set(w.data, '{drops}', coalesce((
      select jsonb_agg(e) from jsonb_array_elements(w.data -> 'drops') e where not (e ->> 1 = any (gone))), '[]'::jsonb))
    where jsonb_typeof(w.data -> 'drops') = 'array'
      and exists (select 1 from jsonb_array_elements(w.data -> 'drops') e where e ->> 1 = any (gone));
  update public.worlds w set data = jsonb_set(w.data, '{disp}', coalesce((
      select jsonb_agg(e) from jsonb_array_elements(w.data -> 'disp') e where not (e ->> 1 = any (gone))), '[]'::jsonb))
    where jsonb_typeof(w.data -> 'disp') = 'array'
      and exists (select 1 from jsonb_array_elements(w.data -> 'disp') e where e ->> 1 = any (gone));
  update public.worlds w set data = jsonb_set(w.data, '{trees}', coalesce((
      select jsonb_agg(e) from jsonb_array_elements(w.data -> 'trees') e where not (e ->> 1 = any (gone))), '[]'::jsonb))
    where jsonb_typeof(w.data -> 'trees') = 'array'
      and exists (select 1 from jsonb_array_elements(w.data -> 'trees') e where e ->> 1 = any (gone));
  update public.worlds w set data = jsonb_set(w.data, '{vends}', (
      select jsonb_agg(case when e -> 1 ->> 'id' = any (gone)
                            then jsonb_build_array(e -> 0, (e -> 1) || '{"id": null, "n": 0}'::jsonb) else e end)
      from jsonb_array_elements(w.data -> 'vends') e))
    where jsonb_typeof(w.data -> 'vends') = 'array'
      and exists (select 1 from jsonb_array_elements(w.data -> 'vends') e where e -> 1 ->> 'id' = any (gone));
  update public.worlds w set data = jsonb_set(w.data, '{mann}', (
      select jsonb_agg(case when jsonb_typeof(e -> 1) = 'object'
                            then jsonb_build_array(e -> 0, coalesce((select jsonb_object_agg(s.key, s.value) from jsonb_each(e -> 1) s
                                                                      where not (s.value #>> '{}' = any (gone))), '{}'::jsonb))
                            else e end)
      from jsonb_array_elements(w.data -> 'mann') e))
    where jsonb_typeof(w.data -> 'mann') = 'array'
      and exists (select 1 from jsonb_array_elements(w.data -> 'mann') e,
                  jsonb_each_text(case when jsonb_typeof(e -> 1) = 'object' then e -> 1 else '{}' end) s where s.value = any (gone));

  -- trades that give or ask for one of them
  delete from public.trade_offers t where t.give::text ~ pat or t.get::text ~ pat;

  -- the server's own lists (the same as the block at the end of schema.sql)
  delete from public.bag where item = any (gone);
  delete from public.bag_held where item = any (gone);
  delete from public.bag_pool where item = any (gone);
  delete from public.owned_items where item = any (gone);
  delete from public.gift_escrow where item = any (gone);
  delete from public.vend_backed where item = any (gone);
  delete from public.shop_prices where item = any (gone);
  delete from public.spw_shop where item = any (gone);
  insert into public.item_info (item, cls) select unnest(gone), 'none' on conflict (item) do update set cls = 'none';
end $$;
