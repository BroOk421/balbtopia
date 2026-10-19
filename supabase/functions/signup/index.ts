// Balbtopia sign-up with a limit of accounts per IP address (against spam accounts).
// The game calls this instead of making the account itself. It looks at the caller's IP address, counts the
// accounts already made from it (table signup_ips, only a hash of the IP is kept), and when there are fewer than
// MAX_PER_IP it makes the account with the service role key (which never leaves the server).
// Deploy:  supabase functions deploy signup --no-verify-jwt
// Then turn OFF "Allow new users to sign up" in Supabase (Authentication -> Sign In / Providers), so this
// function is the only way to make an account.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const MAX_PER_IP = 3;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function sha256(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return reply(200, { ok: true });
  if (req.method !== 'POST') return reply(405, { error: 'POST only' });
  let user = '',
    pass = '';
  try {
    const b = await req.json();
    user = String(b.username || '').trim();
    pass = String(b.password || '');
  } catch {
    return reply(400, { error: 'Bad request' });
  }
  // same rules as the game's register form
  if (!/^[A-Za-z0-9_]{3,16}$/.test(user)) return reply(400, { error: 'Username: 3-16 letters, numbers or _' });
  if (pass.length < 6) return reply(400, { error: 'Password needs at least 6 characters' });

  // the caller's IP: the first address in x-forwarded-for (set by Supabase's gateway)
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '').split(',')[0].trim();
  if (!ip) return reply(400, { error: "Can't tell where you are connecting from" });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const ipHash = await sha256('balbtopia:' + ip);
  const { count, error: cErr } = await db.from('signup_ips').select('ip_hash', { count: 'exact', head: true }).eq('ip_hash', ipHash);
  if (cErr) return reply(500, { error: 'Server error (signup_ips table missing? run supabase/schema.sql)' });
  if ((count || 0) >= MAX_PER_IP)
    return reply(429, { error: `Only ${MAX_PER_IP} accounts can be made from one connection` });

  const { data, error } = await db.auth.admin.createUser({
    email: user.toLowerCase() + '@players.balbtopia.app',
    password: pass,
    email_confirm: true,
    user_metadata: { username: user },
  });
  if (error) {
    const m = String(error.message || error);
    if (/already|registered|exists/i.test(m)) return reply(409, { error: 'That name is taken' });
    return reply(400, { error: m });
  }
  await db.from('signup_ips').insert({ ip_hash: ipHash, user_id: data.user?.id });
  return reply(200, { ok: true });
});
