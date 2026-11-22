-- (owner, Nov 22 2026 build za) "Put back the worlds I broke: keep only START (and the special worlds); delete RECIPES
-- too, and BUYGATESPIKE, ATM, those." Every saved world of EVERY player is deleted, except the ones in `keep` below.
-- A deleted world comes back as a brand-new world the next time someone enters it (with the trees, hills and caves of
-- build q-z). Everything that was in those worlds is GONE for good: placed blocks, World Locks / Diamond Locks placed
-- there, Vending Machine stock, Display Box / Mannequin items, drops, signs, songs. Their World Keys, world bans,
-- pending kicks and World Transfer moves go too.
-- Run STEP 1 first and read the list. Then run STEP 2 (one transaction). Running STEP 2 twice does nothing more.
-- KEPT: START, MOONEVENT, SPLASHWARS, SPLASHPRIZE, MOON1-MOON9 (the Moons are rebuilt by the game every event anyway).

-- ===================== STEP 1: what would be deleted (read only) =====================
with keep(name) as (values ('START'), ('MOONEVENT'), ('SPLASHWARS'), ('SPLASHPRIZE'), ('MOON1'), ('MOON2'), ('MOON3'),
  ('MOON4'), ('MOON5'), ('MOON6'), ('MOON7'), ('MOON8'), ('MOON9'))
select w.name, w.owner, w.updated_at
from public.worlds w
where w.name not in (select name from keep)
order by w.updated_at desc;

-- ===================== STEP 2: delete them =====================
begin;
create temporary table reset_gone on commit drop as
  select w.name from public.worlds w
  where w.name not in ('START', 'MOONEVENT', 'SPLASHWARS', 'SPLASHPRIZE', 'MOON1', 'MOON2', 'MOON3', 'MOON4', 'MOON5',
    'MOON6', 'MOON7', 'MOON8', 'MOON9');
delete from public.vend_backed where world in (select name from reset_gone);
delete from public.world_bans where world in (select name from reset_gone);
delete from public.world_kicks where world in (select name from reset_gone);
delete from public.world_moves where old_name in (select name from reset_gone) or new_name in (select name from reset_gone);
delete from public.world_keys where world in (select name from reset_gone); -- (also cascades with the world)
delete from public.worlds where name in (select name from reset_gone);
select count(*) as worlds_deleted from reset_gone;
commit;
