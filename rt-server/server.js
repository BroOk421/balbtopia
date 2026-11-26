// Balbtopia's own realtime server (owner, Nov 26 2026: "to save money, run the realtime on my own PC").
// It does what Supabase Realtime did for the busy channels: world:NAME (positions, punches, drops, vend, die...),
// build:NAME:LOCKV (tiles, signs, sync...) and lobby (who is online). chat:NAME and inbox:UID stay on Supabase.
// The game (www/js/online/rt.js) connects here when it can and falls back to Supabase Realtime when it can't.
//
// Who may do what is still decided by the database: on connecting the player's Supabase login is checked
// (auth/v1/user), and on joining a topic the server asks rt_check (schema.sql) WITH THAT LOGIN, the same rules as
// the realtime.messages policies (banned, world bans, who may build).
//
// Its address: with "tunnel": "quick" it starts a Cloudflare quick tunnel (cloudflared, free, no domain needed; the
// address changes every start) and writes the address into Supabase (rt_set_url) every minute, so the game finds
// it. With "publicUrl" set (your own domain / named tunnel) it writes that one instead.
//
// Messages (JSON text), game -> server:
//   {t:'auth', token}                        first; the answer is {t:'auth', ok, id}
//   {t:'join', topic, ref}                   -> {t:'joined', ref, topic, ok, send} then {t:'ps', topic, state}
//   {t:'leave', topic}
//   {t:'b', topic, e, p}                     broadcast to the others there -> {t:'b', topic, e, p}
//   {t:'track', topic, s} / {t:'untrack', topic}
// server -> game: presence {t:'pj', topic, k, r, s} (joined / changed) and {t:'pl', topic, k, r} (left);
// k = the player's id (from the login, can't be faked), r = this connection's number.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { WebSocketServer } = require('ws');

const cfgFile = path.join(__dirname, 'config.json');
if (!fs.existsSync(cfgFile)) {
  console.error('No config.json. Copy config.example.json to config.json and fill it in (see README.md).');
  process.exit(1);
}
const CFG = JSON.parse(fs.readFileSync(cfgFile, 'utf8').replace(/^﻿/, ''));
const SB = String(CFG.supabaseUrl || '').replace(/\/$/, '');
const KEY = String(CFG.supabaseAnonKey || '');
const PORT = +CFG.port || 8787;
if (!/^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)/.test(SB) || !KEY) {
  console.error('config.json: fill in supabaseUrl and supabaseAnonKey.');
  process.exit(1);
}
const LIMITS = {
  maxPayload: 512 * 1024, // one message (a world sync can be big)
  perSec: 80, // messages a second per connection (more are dropped)
  topics: 8, // topics one connection may be in
  authMs: 10000, // time to log in after connecting
};

// ---------- Supabase ----------
async function sbFetch(p, token, body) {
  const r = await fetch(SB + p, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + (token || KEY), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {}
  if (!r.ok) throw new Error((data && (data.message || data.msg)) || 'HTTP ' + r.status);
  return data;
}
// (owner, Nov 26 2026: "other characters show up late") every login and every topic join used to wait for a trip to
// Supabase. The answers are kept for a short while (CACHE_MS), so re-joining a world, or a second topic of the same
// world, answers at once. A ban still takes effect within CACHE_MS.
const CACHE_MS = { who: 5 * 60000, check: 60000 };
const cache = new Map(); // key -> { v, at }
async function cached(key, ms, get) {
  const c = cache.get(key);
  if (c && Date.now() - c.at < ms) return c.v;
  const v = await get();
  cache.set(key, { v, at: Date.now() });
  return v;
}
setInterval(() => {
  const t = Date.now();
  for (const [k, c] of cache) if (t - c.at > CACHE_MS.who) cache.delete(k);
}, 60000);
const whoIs = (token) => cached('u:' + token, CACHE_MS.who, () => sbFetch('/auth/v1/user', token));
const rtCheck = (token, topic) => cached('c:' + token + ':' + topic, CACHE_MS.check, () => sbFetch('/rest/v1/rpc/rt_check', token, { p_topic: topic }));

// ---------- topics ----------
const topics = new Map(); // topic -> Map(conn -> { send })
const pres = new Map(); // topic -> Map(connNo -> { k, s })
let connNo = 0;
const okTopic = (t) => typeof t === 'string' && t.length <= 80 && (/^(world|build):/.test(t) || t === 'lobby');

function out(ws, msg) {
  if (ws.readyState === 1) ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
}
function toTopic(topic, msg, except) {
  const m = topics.get(topic);
  if (!m) return;
  const s = JSON.stringify(msg);
  for (const ws of m.keys()) if (ws !== except) out(ws, s);
}
function leave(ws, topic) {
  const m = topics.get(topic);
  if (!m || !m.has(ws)) return;
  m.delete(ws);
  if (!m.size) topics.delete(topic);
  untrack(ws, topic);
  ws.topics.delete(topic);
}
function untrack(ws, topic) {
  const p = pres.get(topic);
  if (!p || !p.has(ws.no)) return;
  const k = p.get(ws.no).k;
  p.delete(ws.no);
  if (!p.size) pres.delete(topic);
  toTopic(topic, { t: 'pl', topic, k, r: ws.no });
}

// ---------- connections ----------
const httpSrv = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Balbtopia realtime server: ' + wss.clients.size + ' connected, ' + topics.size + ' topics\n');
});
const wss = new WebSocketServer({ server: httpSrv, maxPayload: LIMITS.maxPayload });
wss.on('connection', (ws) => {
  ws.no = ++connNo;
  ws.id = null;
  ws.token = null;
  ws.topics = new Set();
  ws.alive = true;
  ws.win = { t: Date.now(), n: 0 };
  const authTimer = setTimeout(() => !ws.id && ws.close(4001, 'login first'), LIMITS.authMs);
  ws.on('pong', () => (ws.alive = true));
  ws.on('message', async (raw, isBinary) => {
    if (isBinary) return;
    const t = Date.now();
    if (t - ws.win.t > 1000) ws.win = { t, n: 0 };
    if (++ws.win.n > LIMITS.perSec) return;
    let m;
    try {
      m = JSON.parse(raw.toString());
    } catch (e) {
      return;
    }
    if (!m || typeof m !== 'object') return;
    try {
      if (m.t === 'auth') {
        const u = await whoIs(String(m.token || ''));
        if (!u || !u.id) throw new Error('no user');
        if (ws.id && ws.id !== u.id) return ws.close(4003, 'other user');
        ws.id = u.id;
        ws.token = String(m.token);
        clearTimeout(authTimer);
        return out(ws, { t: 'auth', ok: true, id: ws.id });
      }
      if (!ws.id) return out(ws, { t: 'auth', ok: false });
      const topic = m.topic;
      if (!okTopic(topic)) return;
      const here = topics.get(topic);
      switch (m.t) {
        case 'join': {
          if (ws.topics.size >= LIMITS.topics && !ws.topics.has(topic)) return out(ws, { t: 'joined', ref: m.ref, topic, ok: false, err: 'too many topics' });
          const r = await rtCheck(ws.token, topic);
          if (!r || !r.recv) return out(ws, { t: 'joined', ref: m.ref, topic, ok: false, err: 'not allowed' });
          if (!topics.has(topic)) topics.set(topic, new Map());
          topics.get(topic).set(ws, { send: !!r.send });
          ws.topics.add(topic);
          out(ws, { t: 'joined', ref: m.ref, topic, ok: true, send: !!r.send });
          const p = pres.get(topic),
            state = {};
          if (p) for (const [no, v] of p) state[no] = v;
          return out(ws, { t: 'ps', topic, state });
        }
        case 'leave':
          return leave(ws, topic);
        case 'b': {
          const me = here && here.get(ws);
          if (!me || !me.send || typeof m.e !== 'string' || m.e.length > 40) return;
          return toTopic(topic, { t: 'b', topic, e: m.e, p: m.p }, ws);
        }
        case 'track': {
          if (!here || !here.has(ws) || !m.s || typeof m.s !== 'object') return;
          if (!pres.has(topic)) pres.set(topic, new Map());
          pres.get(topic).set(ws.no, { k: ws.id, s: m.s });
          return toTopic(topic, { t: 'pj', topic, k: ws.id, r: ws.no, s: m.s });
        }
        case 'untrack':
          return untrack(ws, topic);
      }
    } catch (e) {
      if (m.t === 'auth') return out(ws, { t: 'auth', ok: false, err: String(e.message || e) });
      if (m.t === 'join') return out(ws, { t: 'joined', ref: m.ref, topic: m.topic, ok: false, err: String(e.message || e) });
    }
  });
  ws.on('close', () => {
    clearTimeout(authTimer);
    for (const topic of [...ws.topics]) leave(ws, topic);
  });
  ws.on('error', () => {});
});
// dead connections (a phone that lost signal): ping every 25 s, gone if no answer by the next one
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) {
      ws.terminate();
      continue;
    }
    ws.alive = false;
    try {
      ws.ping();
    } catch (e) {}
  }
}, 25000);

// ---------- the address in Supabase ----------
let publicUrl = String(CFG.publicUrl || '').replace(/^http/, 'ws').replace(/\/$/, '');
async function checkIn(url) {
  if (!CFG.secret) return console.warn('! config.json has no "secret": the game cannot find this server.');
  try {
    await sbFetch('/rest/v1/rpc/rt_set_url', null, { p_secret: CFG.secret, p_url: url });
    return true;
  } catch (e) {
    console.warn('! Could not write the address to Supabase: ' + e.message + ' (did you run schema.sql and set the secret?)');
    return false;
  }
}
setInterval(() => publicUrl && checkIn(publicUrl), 60000);
function startQuickTunnel() {
  console.log('Starting the Cloudflare quick tunnel...');
  let cf;
  try {
    // (Nov 26 2026) Windows hides extensions, so a download saved as "cloudflared.exe" can really be cloudflared.exe.exe
    const names = process.platform === 'win32' ? ['cloudflared.exe', 'cloudflared.exe.exe'] : ['cloudflared'];
    const local = names.map((n) => path.join(__dirname, n)).find((f) => fs.existsSync(f));
    const exe = CFG.cloudflared && CFG.cloudflared !== 'cloudflared' ? CFG.cloudflared : local || 'cloudflared';
    cf = spawn(exe, ['tunnel', '--no-autoupdate', '--url', 'http://localhost:' + PORT]);
  } catch (e) {
    return console.error('! Could not start cloudflared: ' + e.message);
  }
  cf.on('error', (e) => console.error('! Could not start cloudflared (' + e.message + '). Is cloudflared.exe in this folder or installed?'));
  const look = (buf) => {
    const m = String(buf).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m && !publicUrl) {
      publicUrl = m[0].replace(/^https/, 'wss');
      console.log('Public address: ' + publicUrl);
      checkIn(publicUrl).then((ok) => ok && console.log('Address saved in Supabase: players will connect here.'));
    }
  };
  cf.stdout.on('data', look);
  cf.stderr.on('data', look);
  cf.on('exit', (code) => {
    console.error('! cloudflared stopped (' + code + '). Players go back to Supabase Realtime in a few minutes.');
    publicUrl = '';
  });
  process.on('exit', () => cf.kill());
}
async function bye() {
  if (publicUrl) await checkIn(null); // the game stops trying us at once
  process.exit(0);
}
process.on('SIGINT', bye);
process.on('SIGTERM', bye);

httpSrv.listen(PORT, () => {
  console.log('Balbtopia realtime server on port ' + PORT);
  if (publicUrl) {
    console.log('Public address: ' + publicUrl);
    checkIn(publicUrl);
  } else if (CFG.tunnel === 'quick') startQuickTunnel();
  else console.log('No tunnel / publicUrl: only reachable on this network (ws://localhost:' + PORT + ').');
});
