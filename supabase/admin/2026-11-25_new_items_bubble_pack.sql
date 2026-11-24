-- One-off (Nov 25 2026): run this in the Supabase SQL editor (or re-run schema.sql, which has the same).
-- 1) Bubble Gum is sold as a pack of 10 (each bubble uses one; bubblegum.js), not one forever.
-- 2) The owner's new.zip items: 3 jackets, a caveman fur, a messy hair (pixelwear.js) and 3 swords (pxswords.js).
-- 3) White Sando + Navy Shorts: the default character is bare now (pixelwear.js), these are the old look as items.
insert into public.shop_prices (item, qty, gold, tracked, bc) values
  ('bubble_gum', 10, 6000, true, 0),
  ('gold_trim_jacket', 1, 6000, true, 0),
  ('crimson_trim_jacket', 1, 6000, true, 0),
  ('silver_trim_jacket', 1, 6000, true, 0),
  ('caveman_fur', 1, 3000, true, 0),
  ('messy_mop', 1, 5000, true, 0),
  ('white_sando', 1, 200, true, 0), -- (Nov 25 2026) the old default look, now items
  ('navy_shorts', 1, 200, true, 0),
  ('silver_blade', 1, 8000, true, 0),
  ('prism_blade', 1, 25000, true, 0),
  ('void_cleaver', 1, 60000, true, 0)
on conflict (item, qty) do update set gold = excluded.gold, tracked = excluded.tracked, bc = excluded.bc;
delete from public.shop_prices where item = 'bubble_gum' and qty = 1;
insert into public.item_info (item, cls) values
  ('gold_trim_jacket', 'rare'),
  ('crimson_trim_jacket', 'rare'),
  ('silver_trim_jacket', 'rare'),
  ('caveman_fur', 'uncommon'),
  ('messy_mop', 'rare'),
  ('white_sando', 'common'),
  ('navy_shorts', 'common'),
  ('silver_blade', 'rare'),
  ('prism_blade', 'epic'),
  ('void_cleaver', 'legendary')
on conflict (item) do update set cls = excluded.cls;
