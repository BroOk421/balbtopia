-- Balbtopia online tables. Paste all of this into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

-- one row per account: everything in the player's save (bag, skin, gold, level, ...)
create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- one row per world, shared by every player
create table if not exists public.worlds (
  name text primary key check (name ~ '^[A-Z0-9]{1,16}$'),
  data jsonb not null,
  owner text,
  updated_at timestamptz not null default now()
);
create index if not exists worlds_updated_at on public.worlds (updated_at desc);

-- let logged-in players use the tables through the API (newer projects don't do this by default)
grant usage on schema public to authenticated;
grant select, insert, update on public.players to authenticated;
grant select, insert, update on public.worlds to authenticated;

alter table public.players enable row level security;
alter table public.worlds enable row level security;

-- players: you can only read and write your own save
drop policy if exists "own save: read" on public.players;
drop policy if exists "own save: insert" on public.players;
drop policy if exists "own save: update" on public.players;
create policy "own save: read" on public.players for select to authenticated using (auth.uid() = id);
create policy "own save: insert" on public.players for insert to authenticated with check (auth.uid() = id);
create policy "own save: update" on public.players for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- worlds: any logged-in player can read and build in them
drop policy if exists "worlds: read" on public.worlds;
drop policy if exists "worlds: insert" on public.worlds;
drop policy if exists "worlds: update" on public.worlds;
create policy "worlds: read" on public.worlds for select to authenticated using (true);
create policy "worlds: insert" on public.worlds for insert to authenticated with check (true);
create policy "worlds: update" on public.worlds for update to authenticated using (true) with check (true);

-- email between players: you can send to anyone, and only read / change / delete your own inbox
create table if not exists public.mail (
  id bigint generated always as identity primary key,
  to_id uuid not null references auth.users (id) on delete cascade,
  to_name text not null,
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  from_name text not null,
  subject text not null default '' check (char_length(subject) <= 40),
  body text not null check (char_length(body) <= 500),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists mail_inbox on public.mail (to_id, created_at desc);
grant select, insert, update, delete on public.mail to authenticated;
alter table public.mail enable row level security;
drop policy if exists "mail: read own" on public.mail;
drop policy if exists "mail: send" on public.mail;
drop policy if exists "mail: mark read" on public.mail;
drop policy if exists "mail: delete own" on public.mail;
create policy "mail: read own" on public.mail for select to authenticated using (auth.uid() = to_id or auth.uid() = from_id);
create policy "mail: send" on public.mail for insert to authenticated with check (auth.uid() = from_id);
create policy "mail: mark read" on public.mail for update to authenticated using (auth.uid() = to_id) with check (auth.uid() = to_id);
create policy "mail: delete own" on public.mail for delete to authenticated using (auth.uid() = to_id);

-- sign-up limit: how many accounts were made from each connection (only a hash of the IP address is kept).
-- Only the "signup" Edge Function (service role) uses it; players can't read or write it.
create table if not exists public.signup_ips (
  ip_hash text not null,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists signup_ips_hash on public.signup_ips (ip_hash);
alter table public.signup_ips enable row level security;
