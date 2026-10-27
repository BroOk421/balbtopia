// Balbtopia "Forgot password?" (owner, Oct 27 2026). The game calls this with:
//   { action: 'request', username }                       -> e-mails a 6-digit code (Brevo) to the account's recovery e-mail
//   { action: 'confirm', username, code, password }        -> sets the new password if the code is right
// Codes last CODE_MIN minutes, MAX_TRIES wrong tries per code, one code a minute per account, REQ_PER_HOUR requests
// an hour per connection. Only a hash of the code and of the IP is stored.
// Secrets (Supabase -> Edge Functions -> Secrets): BREVO_API_KEY, BREVO_SENDER_EMAIL (a sender verified in Brevo),
// optional BREVO_SENDER_NAME. Deploy:  supabase functions deploy password-reset --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CODE_MIN = 15,
  MAX_TRIES = 5,
  RESEND_SEC = 60,
  REQ_PER_HOUR = 6;
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
// j***n@g***.com
function mask(e: string) {
  const [u, d] = e.split('@');
  const dm = d.split('.');
  const hide = (s: string) => (s.length <= 2 ? s[0] + '*' : s[0] + '***' + s[s.length - 1]);
  return hide(u) + '@' + hide(dm[0]) + (dm.length > 1 ? '.' + dm.slice(1).join('.') : '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return reply(200, { ok: true });
  if (req.method !== 'POST') return reply(405, { error: 'POST only' });
  let b: Record<string, unknown> = {};
  try {
    b = await req.json();
  } catch {
    return reply(400, { error: 'Bad request' });
  }
  const action = String(b.action || ''),
    user = String(b.username || '').trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(user)) return reply(400, { error: 'Type your username' });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const { data: un } = await db.from('usernames').select('id, name').ilike('name', user).limit(1);
  const id = un && un[0] && un[0].id;
  if (!id) return reply(404, { error: 'No account with that username' });

  if (action === 'request') {
    const xff = (req.headers.get('x-forwarded-for') || '').split(',').map((s) => s.trim()).filter(Boolean);
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || xff[xff.length - 1] || 'unknown';
    const ipHash = await sha256('balbtopia-reset:' + ip);
    const hourAgo = new Date(Date.now() - 3600e3).toISOString();
    const { count } = await db.from('password_reset_log').select('ip_hash', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('at', hourAgo);
    if ((count || 0) >= REQ_PER_HOUR) return reply(429, { error: 'Too many tries. Wait an hour and try again' });

    const { data: em } = await db.from('account_emails').select('email').eq('user_id', id).maybeSingle();
    if (!em || !em.email) return reply(404, { error: 'This account has no e-mail. Ask the GM for help' });
    const { data: old } = await db.from('password_resets').select('sent_at').eq('user_id', id).maybeSingle();
    if (old && Date.now() - new Date(old.sent_at).getTime() < RESEND_SEC * 1000)
      return reply(429, { error: 'A code was just sent. Wait a minute before asking again' });

    const n = new Uint32Array(1);
    crypto.getRandomValues(n);
    const code = String(n[0] % 1000000).padStart(6, '0');
    const key = Deno.env.get('BREVO_API_KEY'),
      from = Deno.env.get('BREVO_SENDER_EMAIL');
    if (!key || !from) return reply(500, { error: 'E-mail is not set up on the server yet' });
    const name = un![0].name;
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: from, name: Deno.env.get('BREVO_SENDER_NAME') || 'Balbtopia' },
        to: [{ email: em.email }],
        subject: 'Your Balbtopia password reset code: ' + code,
        textContent: `Hi ${name},\n\nYour code to reset your Balbtopia password is ${code}\nIt works for ${CODE_MIN} minutes.\n\nIf you didn't ask for this, ignore this e-mail; your password stays the same.`,
        htmlContent: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222"><p>Hi <b>${name}</b>,</p><p>Your code to reset your Balbtopia password is:</p><p style="font-size:30px;font-weight:bold;letter-spacing:6px">${code}</p><p>It works for ${CODE_MIN} minutes.</p><p style="color:#777">If you didn't ask for this, ignore this e-mail; your password stays the same.</p></div>`,
      }),
    });
    if (!res.ok) {
      // Brevo's own reason (shown in the function's Logs, and a short form in the game)
      let why = '';
      try {
        const j = await res.json();
        why = String((j && (j.message || j.code)) || '');
      } catch {}
      console.error('Brevo refused (' + res.status + '): ' + why);
      if (/unrecogni[sz]ed ip|authori[sz]ed ip/i.test(why))
        return reply(502, { error: 'Brevo blocked the server: turn off "Authorised IPs" blocking in Brevo (Security)' });
      if (/sender/i.test(why)) return reply(502, { error: 'Brevo: the sender e-mail is not verified (' + why + ')' });
      if (res.status === 401 || /key/i.test(why)) return reply(502, { error: 'Brevo: the API key is wrong (' + why + ')' });
      return reply(502, { error: "Couldn't send the e-mail (Brevo " + res.status + (why ? ': ' + why : '') + ')' });
    }
    await db.from('password_reset_log').insert({ ip_hash: ipHash });
    await db.from('password_resets').upsert({
      user_id: id,
      code_hash: await sha256(id + ':' + code),
      expires_at: new Date(Date.now() + CODE_MIN * 60e3).toISOString(),
      tries: 0,
      sent_at: new Date().toISOString(),
    });
    return reply(200, { ok: true, to: mask(em.email) });
  }

  if (action === 'confirm') {
    const code = String(b.code || '').trim(),
      pass = String(b.password || '');
    if (!/^\d{6}$/.test(code)) return reply(400, { error: 'The code is 6 numbers' });
    if (pass.length < 6 || pass.length > 64) return reply(400, { error: 'Password needs at least 6 characters' });
    const { data: r } = await db.from('password_resets').select('*').eq('user_id', id).maybeSingle();
    if (!r || new Date(r.expires_at).getTime() < Date.now()) return reply(400, { error: 'The code ran out. Ask for a new one' });
    if (r.tries >= MAX_TRIES) return reply(400, { error: 'Too many wrong codes. Ask for a new one' });
    if ((await sha256(id + ':' + code)) !== r.code_hash) {
      await db.from('password_resets').update({ tries: r.tries + 1 }).eq('user_id', id);
      return reply(400, { error: 'Wrong code (' + (MAX_TRIES - r.tries - 1) + ' tries left)' });
    }
    const { error } = await db.auth.admin.updateUserById(id, { password: pass });
    if (error) return reply(500, { error: "Couldn't change the password. Try again" });
    await db.from('password_resets').delete().eq('user_id', id);
    return reply(200, { ok: true });
  }
  return reply(400, { error: 'Bad request' });
});
