-- Rename the GM account tae123 -> anTz (owner, Oct 27 2026). Run ONCE in Supabase -> SQL Editor (all of it).
-- Does what Change Name does (change_name refuses GM accounts on purpose), plus the GM list.
-- Logging in: type anTz (the login e-mail stays tae123@players.balbtopia.app; login_email finds it by the new name).
do $$
declare
  old text := 'tae123';
  p_new text := 'anTz';
  me uuid; w record; d jsonb; al jsonb; e jsonb; changed boolean;
begin
  select id into me from public.usernames where lower(name) = lower(old);
  if me is null then raise exception 'No account called %', old; end if;
  if exists (select 1 from public.usernames where lower(name) = lower(p_new) and id <> me)
     or exists (select 1 from auth.users where lower(split_part(email, '@', 1)) = lower(p_new) and id <> me) then
    raise exception 'The name % is already taken', p_new;
  end if;

  -- GM list: the new name is the GM now
  insert into public.gms (name) values (p_new) on conflict do nothing;
  delete from public.gms where lower(name) = lower(old);

  update public.usernames set name = p_new where id = me;
  update public.players set username = p_new, data = jsonb_set(data, '{name}', to_jsonb(p_new)) where id = me;

  -- worlds: owner, Gold Lock access, Red / Blue Lock owner and list
  for w in select name, data, owner from public.worlds
           where lower(owner) = lower(old) or position(lower(old) in lower(data::text)) > 0 for update loop
    d := w.data; changed := false;
    if lower(w.owner) = lower(old) or lower(d ->> 'owner') = lower(old) then
      d := jsonb_set(d, '{owner}', to_jsonb(p_new)); changed := true;
    end if;
    if jsonb_typeof(d -> 'lock' -> 'access') = 'array' and (d -> 'lock' -> 'access') ? lower(old) then
      d := jsonb_set(d, '{lock,access}', public.rename_in_list(d -> 'lock' -> 'access', old, p_new)); changed := true;
    end if;
    if jsonb_typeof(d -> 'al') = 'array' then
      al := '[]'::jsonb;
      for e in select * from jsonb_array_elements(d -> 'al') loop
        if jsonb_typeof(e -> 1) = 'object' then
          if lower(e -> 1 ->> 'o') = lower(old) then e := jsonb_set(e, '{1,o}', to_jsonb(p_new)); changed := true; end if;
          if jsonb_typeof(e -> 1 -> 'acc') = 'array' and (e -> 1 -> 'acc') ? lower(old) then
            e := jsonb_set(e, '{1,acc}', public.rename_in_list(e -> 1 -> 'acc', old, p_new)); changed := true;
          end if;
        end if;
        al := al || jsonb_build_array(e);
      end loop;
      d := jsonb_set(d, '{al}', al);
    end if;
    if changed then
      update public.worlds set data = d, owner = case when lower(owner) = lower(old) then p_new else owner end,
        lockv = lockv + 1, updated_at = now() where name = w.name;
    end if;
  end loop;
  update public.world_keys set owner_name = p_new where lower(owner_name) = lower(old);
  update public.world_bans set by_name = p_new where lower(by_name) = lower(old);
  update public.mail set to_name = p_new where to_id = me;
  update public.mail set from_name = p_new where from_id = me;
  update public.bans set by_name = p_new where lower(by_name) = lower(old);
  raise notice 'Renamed % to %', old, p_new;
end $$;
