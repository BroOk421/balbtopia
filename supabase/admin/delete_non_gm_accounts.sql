-- Delete EVERY account except the GM account(s) (the names in public.gms), and everything they made:
-- their saves, gold, items, mail, e-mails, chats, board posts, mailbox letters, and every world that isn't the
-- GM's (unlocked worlds too), except LOBBY and RECIPES. Owner's request, Oct 27 2026.
-- THIS CAN'T BE UNDONE. Run STEP 1, check it, then STEP 2.

-- ============ STEP 1: LOOK FIRST (changes nothing) ============
select n.name, u.email,
       case when lower(n.name) in (select lower(name) from public.gms) then 'KEEP (GM)' else 'DELETE' end as what
from auth.users u left join public.usernames n on n.id = u.id
order by what desc, u.created_at;

select name, owner,
       case when name in ('LOBBY', 'RECIPES') or lower(coalesce(owner, '')) in (select lower(name) from public.gms)
            then 'KEEP' else 'DELETE' end as what
from public.worlds
order by what desc, name;


-- ============ STEP 2: DELETE (all of it at once; nothing is deleted if something fails) ============
do $$
declare
  gm_ids uuid[];
  gone int;
  -- deletes only when the table is there (older setups may miss some)
  t text;
begin
  select array_agg(n.id) into gm_ids
  from public.usernames n
  where lower(n.name) in (select lower(name) from public.gms);
  if gm_ids is null or array_length(gm_ids, 1) = 0 then
    raise exception 'No GM account found: nothing deleted. Check public.gms (select * from public.gms).';
  end if;

  -- things kept by id or name only (not deleted with the account by themselves)
  if to_regclass('public.global_chat') is not null then
    delete from public.global_chat where from_id is null or not (from_id = any (gm_ids)); end if;
  if to_regclass('public.board_posts') is not null then
    delete from public.board_posts where from_id is null or not (from_id = any (gm_ids)); end if;
  if to_regclass('public.mailbox_letters') is not null then
    delete from public.mailbox_letters where from_id is null or not (from_id = any (gm_ids)); end if;
  if to_regclass('public.chat_sent') is not null then
    delete from public.chat_sent where from_id is null or not (from_id = any (gm_ids)); end if;
  if to_regclass('public.lobby_sent') is not null then
    delete from public.lobby_sent where from_id is null or not (from_id = any (gm_ids)); end if;
  if to_regclass('public.world_kicks') is not null then delete from public.world_kicks; end if;
  if to_regclass('public.world_moves') is not null then delete from public.world_moves; end if;

  -- every world that isn't the GM's (locked or not), except LOBBY and RECIPES
  delete from public.worlds
  where name not in ('LOBBY', 'RECIPES')
    and lower(coalesce(owner, '')) not in (select lower(name) from public.gms);
  if to_regclass('public.vend_backed') is not null then
    delete from public.vend_backed where world not in (select name from public.worlds); end if;
  if to_regclass('public.board_posts') is not null then
    delete from public.board_posts where world not in (select name from public.worlds); end if;
  if to_regclass('public.mailbox_letters') is not null then
    delete from public.mailbox_letters where world not in (select name from public.worlds); end if;

  -- the accounts (their saves, wallets, items, mail, e-mails, bans... go with them)
  delete from auth.users where not (id = any (gm_ids));
  get diagnostics gone = row_count;

  -- fresh sign-up / reset limits
  if to_regclass('public.signup_ips') is not null then delete from public.signup_ips where user_id is null; end if;
  if to_regclass('public.password_reset_log') is not null then delete from public.password_reset_log; end if;
  if to_regclass('public.cheat_log') is not null then delete from public.cheat_log where player_id is null; end if;

  raise notice 'Kept % GM account(s), deleted % account(s)', array_length(gm_ids, 1), gone;
end $$;
