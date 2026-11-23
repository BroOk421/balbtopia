-- Server maintenance by hand (Supabase dashboard -> SQL editor). The GM can also type in the game's chat:
--   /maint on            maintenance in 5 minutes (a countdown shows for everyone first)
--   /maint on 0          maintenance now
--   /maint on 10 New hairs coming!     in 10 minutes, with a message
--   /maint off           over: players can log in again (the game downloads the update by itself first)
--
-- Usual order for an update: /maint on 5 -> wait for it to start -> push to GitHub -> wait until the "Web version
-- (GitHub Pages)" build is green -> /maint off.

-- start now, message shown on the loading screen, back in about 30 minutes:
update public.app_status set on_ = true, msg = 'Updating the game, be right back!', starts_at = now(),
  ends_at = now() + interval '30 minutes', by_name = 'dashboard', updated_at = now() where id = 1;

-- end it:
-- update public.app_status set on_ = false, starts_at = null, ends_at = null, updated_at = now() where id = 1;

select public.app_status();
