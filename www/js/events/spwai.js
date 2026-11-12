// TEMPORARY TEST (owner, Nov 12 2026, build p: "just put a button for now, I'll have it deleted later once I've tried
// the game: a PLAY WITH AI button so I can test how it works"). DELETE THIS FILE (and its <script> tag in index.html)
// when he says so; nothing else depends on it.
// - The SPLASH WARS desk (rvb.js openSpwDesk) gets a PLAY WITH AI button: you go to your own test world
//   (SPLASHAI + 4 letters, never saved, never listed, built with the match template) and play a full 10 v 10 match on
//   the RED team with 19 AI players: same arena, 3-2-1 respawn, Water Gun, paint, result. The match runs in your own
//   game (the old Red vs Blue engine, you as the "owner"), so the SERVER is not asked: no queue, no tickets.
// - The AI players (`SPWAI.bots`, put in Net.remotes so the game draws them like other players): walk / jump to
//   spots with tiles to paint, paint the tiles they stand on, shoot the nearest enemy they can see (the shot stops at
//   blocks), are out when hit and come back at their base after 3 s. Your shots hit them through the game's own
//   Water Gun (shotHit -> Net.sendRvb 'out', caught here).
// - Click the console in the test world for PLAY AGAIN / LEAVE.
// Loaded after rvb.js.
// ===== play with AI (test) =====
const SPWAI_RE = /^SPLASHAI[A-Z0-9]{4}$/;
const SPWAI = { on: false, bots: [], feed: [], sendPrev: null };
const spwAiWorld = () => inWorld && SPWAI_RE.test(worldName || '');
const SPWAI_RED = ['Kidlat', 'Bagwis', 'Maya', 'Tikbalang', 'Alon', 'Bituin', 'Agila', 'Bulalakaw', 'Habagat'];
const SPWAI_BLUE = ['Asul', 'Dagat', 'Ulap', 'Yelo', 'Langit', 'Banog', 'Tala', 'Amihan', 'Ulan', 'Bagyo'];
let spwAiSeed = 12345;
const spwAiRnd = () => (spwAiSeed = (spwAiSeed * 16807) % 2147483647) / 2147483647;
function spwAiMakeBots() {
  const has = (id) => !!WEAR_BY_ID[id],
    pick = (a, k) => {
      const l = a.filter(has);
      return l.length ? l[k % l.length] : null;
    };
  const HAIRS = ['spikey_hair', 'brown_hair', 'purple_mohawk', 'long_black_hair', 'fire_quiff', 'blue_streak_spikes', 'mint_ponytail', 'red_streak_bob', 'blue_tip_bob', 'frosted_quiff', 'pigtails', 'galaxy_spikes'],
    SHIRT = { r: ['red_tee', 'red_flannel', 'red_polo'], b: ['blue_tee', 'navy_polo', 'sky_polo'] },
    PANTS = ['jeans', 'black_pants', 'cargo_shorts', 'denim_shorts', 'track_shorts', 'black_shorts', 'board_shorts'],
    FEET = { r: ['red_sneakers', 'white_sneakers'], b: ['blue_sneakers', 'white_sneakers'] },
    SK = ['tan', 'peach', 'honey', 'brown', 'porcelain', 'deep'];
  const mk = (name, t, k) => ({
    id: 'spwai_' + name,
    name,
    team: t,
    x: 0, y: 0, w: P.w, h: P.h, tx: 0, ty: 0, vx: 0, vy: 0,
    face: t === 'r' ? 1 : -1, walking: false, ground: true, walkPh: 0, punch: null, hurt: 0, blink: spwAiRnd() * 6000,
    skin: SK[k % SK.length], style: 'stride',
    equipped: { hair: pick(HAIRS, k * 3 + (t === 'b' ? 5 : 0)), shirt: pick(SHIRT[t], k), pants: pick(PANTS, k + (t === 'b' ? 2 : 0)), feet: pick(FEET[t], k) },
    hand: 'water_gun', flag: null, rest: null, typing: false, joke: false, dance: false, emo: null, seen: now,
    dead: null, spawnT: 0,
    ai: { wp: null, wpT: 0, think: 0, shootT: 0, jumpT: 0, aim: null, skill: 0.5 + spwAiRnd() * 0.35 },
  });
  SPWAI.bots = [...SPWAI_RED.map((n, k) => mk(n, 'r', k)), ...SPWAI_BLUE.map((n, k) => mk(n, 'b', k + 9))];
  for (const b of SPWAI.bots) Net.remotes.set(b.id, b);
}
function spwAiClear() {
  for (const b of SPWAI.bots) Net.remotes.delete(b.id);
  SPWAI.bots = [];
  SPWAI.feed = [];
  if (SPWAI.on && SPWAI.sendPrev !== null) Net.sendRvb = SPWAI.sendPrev || undefined;
  SPWAI.on = false;
  SPWAI.sendPrev = null;
  spwAiFeedEl.hidden = true;
}
// ---------- helpers ----------
const spwAiCx = (c) => c.x + c.w / 2,
  spwAiCy = (c) => c.y + c.h / 2;
function spwAiHits(x, y, w, h) {
  for (let ty = Math.floor(y / TS); ty <= Math.floor((y + h - 0.01) / TS); ty++)
    for (let tx = Math.floor(x / TS); tx <= Math.floor((x + w - 0.01) / TS); tx++) if (solidAt(tx, ty)) return true;
  return false;
}
function spwAiPut(b, x, y) {
  b.x = b.tx = x * TS + TS / 2 - b.w / 2;
  b.y = b.ty = (y + 1) * TS - b.h;
  b.vx = b.vy = 0;
}
const spwAiPlayers = () => [...SPWAI.bots.map((b) => ({ c: b, name: b.name, team: b.team, me: false })), { c: P, name: playerName, team: 'r', me: true }];
const spwAiAlive = (o) => !o.c.dead && !(o.c.spawnT > 0);
function spwAiSees(a, b) {
  const h = handPoint(a);
  return [b.y + 4, b.y + b.h / 2, b.y + b.h - 4].some((y) => rvbClearLine(h.x, h.y, spwAiCx(b), y));
}
function spwAiEnemy(c, team, range) {
  let best = null,
    bd = range * TS;
  for (const o of spwAiPlayers()) {
    if (o.team === team || !spwAiAlive(o)) continue;
    const d = Math.hypot(spwAiCx(o.c) - spwAiCx(c), spwAiCy(o.c) - spwAiCy(c));
    if (d < bd && spwAiSees(c, o.c)) (best = o), (bd = d);
  }
  return best;
}
// somewhere in the arena with tiles to paint, leaning to the other team's half
function spwAiWaypoint(team) {
  let best = null,
    bs = -1;
  const mine = team === 'r' ? 1 : 2;
  for (let k = 0; k < 14; k++) {
    const lean = team === 'r' ? 0.62 : 0.38,
      x = Math.max(12, Math.min(WW - 13, Math.round((lean + (spwAiRnd() - 0.5) * 0.9) * WW))),
      y = 6 + Math.floor(spwAiRnd() * 46);
    if (solidAt(x, y)) continue;
    let s = spwAiRnd() * 6;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) if (inW(x + dx, y + dy) && rvbPaintable(x + dx, y + dy) && rvbPaintMap[at(x + dx, y + dy)] !== mine) s++;
    if (s > bs) (bs = s), (best = { x, y });
  }
  return best || { x: WW / 2, y: 30 };
}
function spwAiOut(by, victim) {
  SPWAI.feed.push({ by, victim, t: now });
}
function spwAiKill(b, by) {
  if (b.dead || b.spawnT > 0) return false;
  b.dead = { t: 0 };
  b.vx = b.vy = 0;
  b.punch = null;
  spwAiOut(by, b.name);
  Sfx.play('ouch', 0.3);
  return true;
}
// ---------- one AI player, each game step ----------
function spwAiStep(b, dt) {
  if (b.punch && (b.punch.t += dt) >= PUNCH_TIME) b.punch = null;
  if (b.spawnT > 0) b.spawnT -= dt;
  if (b.dead) {
    if ((b.dead.t += dt) >= RVB_RESPAWN / 1000) {
      b.dead = null;
      spwAiPut(b, ...RVB_CP[b.team]);
      b.spawnT = SPAWN_FADE + 1.2;
      b.ai.wp = null;
    }
    return;
  }
  const ph = rvb.ph,
    ai = b.ai;
  let dir = 0,
    jump = false;
  if (ph === 'play') {
    ai.think -= dt;
    ai.wpT -= dt;
    if (ai.think <= 0) {
      ai.think = 0.12 + spwAiRnd() * 0.1;
      ai.aim = spwAiEnemy(b, b.team, 8.5);
      if (!ai.wp || ai.wpT <= 0 || Math.hypot(ai.wp.x * TS - b.x, ai.wp.y * TS - b.y) < TS * 1.2) {
        ai.wp = spwAiWaypoint(b.team);
        ai.wpT = 4 + spwAiRnd() * 4;
      }
    }
    if (!ai.wp) ai.wp = spwAiWaypoint(b.team);
    const e = ai.aim;
    if (e && spwAiAlive(e)) {
      b.face = spwAiCx(e.c) > spwAiCx(b) ? 1 : -1;
      ai.shootT -= dt;
      if (ai.shootT <= 0 && spwAiSees(b, e.c)) {
        ai.shootT = 0.3 + spwAiRnd() * 0.3;
        const hp = handPoint(b),
          miss = (1 - ai.skill) * 26,
          tx = spwAiCx(e.c) + (e.c.vx || 0) * 0.12 + (spwAiRnd() - 0.5) * miss,
          ty = spwAiCy(e.c) + (spwAiRnd() - 0.5) * miss,
          n0 = SHOTS.length;
        addShot('water', hp.x, hp.y, tx, ty, false);
        for (let k = n0; k < SHOTS.length; k++) Object.assign(SHOTS[k], { aiBy: b, who: b.name, born: now, tgx: tx, tgy: ty }); // (from the gun's tip)
        b.punch = { t: 0, x: tx, y: ty };
        Sfx.play('water', 0.12);
      }
    }
    const dx = ai.wp.x * TS + TS / 2 - spwAiCx(b);
    dir = Math.abs(dx) > 10 ? Math.sign(dx) : 0;
    if (e && Math.hypot(spwAiCx(e.c) - spwAiCx(b), spwAiCy(e.c) - spwAiCy(b)) < 4 * TS && spwAiRnd() < 0.5) dir = -dir || (spwAiRnd() < 0.5 ? 1 : -1);
    if (ai.wp.y * TS < b.y - TS * 0.6) jump = true;
    if (dir && spwAiHits(b.x + dir * 3, b.y, b.w, b.h)) jump = true;
    ai.jumpT -= dt;
  }
  // physics (the arena's space jump: low gravity, every press jumps again)
  const target = dir * 160,
    acc = b.ground ? 14 : 8;
  b.vx += (target - b.vx) * Math.min(1, acc * dt);
  if (Math.abs(b.vx) < 2 && !dir) b.vx = 0;
  if (dir && !(ai.aim && spwAiAlive(ai.aim))) b.face = dir;
  if (jump && ai.jumpT <= 0 && (b.ground || b.vy > -60)) {
    b.vy = b.ground ? -JUMP_V * MOON_JUMP : -WING_JUMP_V * MOON_JUMP;
    ai.jumpT = 0.28 + spwAiRnd() * 0.15;
    b.ground = false;
  }
  b.vy = Math.min(MOON_MAX_FALL, b.vy + (b.vy < 0 ? RISE_GRAVITY * MOON_G : GRAVITY * MOON_G) * dt);
  const nx = b.x + b.vx * dt;
  if (!spwAiHits(nx, b.y, b.w, b.h)) b.x = nx;
  else b.vx = 0;
  const prevBottom = b.y + b.h;
  let ny = b.y + b.vy * dt;
  b.ground = false;
  if (b.vy > 0) {
    const fy = Math.floor((ny + b.h) / TS),
      x0 = Math.floor(b.x / TS),
      x1 = Math.floor((b.x + b.w - 0.01) / TS);
    let land = false;
    for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, fy) || (isPlat(tx, fy) && prevBottom <= fy * TS + 0.5)) land = true;
    if (land) {
      ny = fy * TS - b.h;
      b.vy = 0;
      b.ground = true;
    }
  } else if (b.vy < 0 && spwAiHits(b.x, ny, b.w, b.h)) {
    ny = Math.floor(ny / TS + 1) * TS;
    b.vy = 0;
  }
  if (!spwAiHits(b.x, ny, b.w, b.h)) b.y = ny;
  else (b.vy = 0), (b.ground = true);
  if (ph === 'ready') {
    const [a, z] = RVB_BASE_X[b.team];
    b.x = Math.max(a * TS, Math.min(z * TS - b.w, b.x));
  }
  b.tx = b.x;
  b.ty = b.y;
  b.walking = Math.abs(b.vx) > 20 && b.ground;
  b.walkPh = b.walking ? b.walkPh + dt * walkRate(b.vx) : 0;
  b.seen = now;
  if (ph === 'play') {
    const c = b.team === 'r' ? 1 : 2;
    for (let y = Math.floor(b.y / TS); y <= Math.floor((b.y + b.h - 0.01) / TS); y++)
      for (let x = Math.floor(b.x / TS); x <= Math.floor((b.x + b.w - 0.01) / TS); x++) if (rvbPaintable(x, y)) rvbPaintMap[at(x, y)] = c;
  }
}
// the AI's shots: the same flight as yours (stop at blocks), they hit the other team
stepShots = ((prev) =>
  function (dt) {
    if (!SPWAI.on) return prev(dt);
    const ai = SHOTS.filter((s) => s.aiBy);
    for (let i = SHOTS.length - 1; i >= 0; i--) if (SHOTS[i].aiBy) SHOTS.splice(i, 1);
    prev(dt);
    const keep = [];
    for (const s of ai) {
      if (s.who) waterFromTip(s);
      s.t += dt;
      const steps = Math.max(1, Math.ceil((Math.hypot(s.vx, s.vy) * dt) / 4));
      let gone = s.t > s.life;
      for (let n = 0; n < steps && !gone; n++) {
        s.x += (s.vx * dt) / steps;
        s.y += (s.vy * dt) / steps;
        s.left -= (Math.hypot(s.vx, s.vy) * dt) / steps;
        s.vy += ((SHOT.water.grav || 0) * dt) / steps;
        const tx = Math.floor(s.x / TS),
          ty = Math.floor(s.y / TS);
        if (!inW(tx, ty) || solidAt(tx, ty)) {
          splash(s.x, s.y, 'water');
          gone = true;
          break;
        }
        for (const o of spwAiPlayers()) {
          if (o.team === s.aiBy.team || o.c.dead) continue;
          const c = o.c;
          if (s.x > c.x - 3 && s.x < c.x + c.w + 3 && s.y > c.y - 2 && s.y < c.y + c.h + 2) {
            splash(s.x, s.y, 'water');
            gone = true;
            if (s.lead && rvbPlaying()) {
              if (o.me) {
                if (!(P.spawnT > 0) && !P.dead) {
                  die('water');
                  spwAiOut(s.aiBy.name, playerName);
                }
              } else spwAiKill(c, s.aiBy.name);
            }
            break;
          }
        }
        if (!gone && s.left <= 0) {
          splash(s.x, s.y, 'water');
          gone = true;
        }
      }
      if (!gone) keep.push(s);
    }
    SHOTS.push(...keep);
  })(stepShots);
step = ((prev) =>
  function (dt) {
    const r = prev(dt);
    if (SPWAI.on && spwAiWorld())
      for (const b of SPWAI.bots) {
        if (Net.remotes.get(b.id) !== b) Net.remotes.set(b.id, b); // (online, the player list may drop them)
        spwAiStep(b, dt);
      }
    return r;
  })(step);
// the AI players go where the game puts the players at each phase
rvbEnter = ((prev) =>
  function (ph, left) {
    const was = rvb.ph;
    prev(ph, left);
    if (!SPWAI.on || ph === was) return;
    SPWAI.bots.forEach((b) => {
      const list = b.team === 'r' ? SPWAI_RED : SPWAI_BLUE,
        k = list.indexOf(b.name) + (b.team === 'r' ? 1 : 0);
      if (ph === 'wait') spwAiPut(b, ...RVB_SPOTS.room[b.team][k % RVB_SPOTS.room[b.team].length]);
      else if (ph === 'ready') spwAiPut(b, ...RVB_SPOTS.base[b.team][k % RVB_SPOTS.base[b.team].length]);
      else if (ph === 'end' || ph === 'idle') {
        b.dead = null;
        spwAiPut(b, ...RVB_SPOTS.room[b.team][k % RVB_SPOTS.room[b.team].length]);
      }
      if (ph === 'ready' || ph === 'end') b.face = b.team === 'r' ? 1 : -1;
    });
  })(rvbEnter);
// ---------- the test world ----------
moonWorldsFix = ((prev) =>
  function (name) {
    prev(name);
    if (SPWAI_RE.test(name || '')) {
      buildRvbWorld();
      worldOwner = playerName; // (you run this match yourself)
      if (typeof setLockCfg === 'function') setLockCfg({ desc: 'SPLASH WARS test match with AI players' });
      worldRV = 'SPWAI';
    }
  })(moonWorldsFix);
saveWorld = ((prev) =>
  function (force) {
    if (spwAiWorld()) return;
    return prev(force);
  })(saveWorld);
worldHidden = ((prev) =>
  function (name) {
    return prev(name) || SPWAI_RE.test(name || '');
  })(worldHidden);
listWorlds = ((prev) =>
  function () {
    return prev().filter((w) => !SPWAI_RE.test(w.name));
  })(listWorlds);
enterWorldNow = ((prev) =>
  async function (name) {
    if (SPWAI.bots.length && !SPWAI_RE.test(name || '')) spwAiClear(); // (leaving the test world)
    return prev(name);
  })(enterWorldNow);
async function spwAiStart() {
  if (!$('dlg').hidden) closeDialog();
  let name = worldName;
  if (!spwAiWorld()) {
    name = 'SPLASHAI' + Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0').replace(/[^A-Z0-9]/g, '0');
    const ok = await enterWorld(name);
    if (!ok && !spwAiWorld()) return toast("Couldn't open the test world");
  }
  spwAiClear();
  rvbPaintClear();
  spwAiMakeBots();
  SPWAI.on = true;
  SPWAI.sendPrev = Net.sendRvb || false;
  const send = SPWAI.sendPrev;
  // your Water Gun hits on an AI player: out (the game sends 'out' to the player it hit)
  Net.sendRvb = (m) => {
    if (m && m.t === 'out') {
      const b = SPWAI.bots.find((x) => x.name === m.to);
      if (b) {
        if (rvbPlaying() && spwAiSees(P, b)) spwAiKill(b, playerName);
        return;
      }
    }
    if (send) return send(m);
  };
  rvbW.red = [playerName, ...SPWAI_RED];
  rvbW.blue = SPWAI_BLUE.slice();
  Object.assign(rvb, { ph: 'idle', res: null, g: '' });
  spwAiFeedEl.hidden = false;
  rvbStart();
  rvb.end = now + 3000; // (3 s in the team rooms, then the 10 s READY at the bases)
  toast('TEST: 10 v 10 with AI players. You are on the RED team!');
}
// the console in the test world: PLAY AGAIN / LEAVE
openRvbConsole = ((prev) =>
  function (tab) {
    if (!spwAiWorld()) return prev(tab);
    if (rvbRunning()) return toast('Play the match first!');
    dialog('PLAY WITH AI (TEST)', `<p class="dmsg">A SPLASH WARS test match: you and 9 AI players on RED, 10 AI players on BLUE. No tickets in a test.</p>`, [
      { label: 'LEAVE', cls: 'ghost', run: () => void setTimeout(() => enterWorld(SPW_WORLD), 0) },
      { label: 'PLAY AGAIN', run: () => void setTimeout(spwAiStart, 0) },
    ]);
  })(openRvbConsole);
// the SPLASH WARS desk: + PLAY WITH AI
openSpwDesk = ((prev) =>
  function () {
    const body = prev();
    if (!body) return body;
    const row = $('dlgBtns'),
      b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ghost';
    b.textContent = 'PLAY WITH AI';
    b.onclick = () => void spwAiStart();
    row.insertBefore(b, row.firstChild ? row.firstChild.nextSibling : null);
    return body;
  })(openSpwDesk);
// who splashed whom (top right) while the test match is on
const spwAiFeedEl = document.createElement('div');
spwAiFeedEl.id = 'spwAiFeed';
spwAiFeedEl.hidden = true;
document.body.appendChild(spwAiFeedEl);
{
  const st = document.createElement('style');
  st.textContent = `
#spwAiFeed{position:fixed;right:12px;top:calc(64px + env(safe-area-inset-top));z-index:30;display:flex;flex-direction:column;gap:4px;align-items:flex-end;pointer-events:none;font:8px var(--pixel)}
#spwAiFeed[hidden]{display:none}
#spwAiFeed span{background:rgba(20,8,26,.8);padding:5px 8px;border-radius:4px;border:2px solid #14081a;color:#fff}
`;
  document.head.appendChild(st);
}
setInterval(() => {
  if (!SPWAI.on) return;
  if (!spwAiWorld()) return spwAiClear();
  SPWAI.feed = SPWAI.feed.filter((f) => now - f.t < 4500).slice(-5);
  const col = (n) => (n === playerName || SPWAI_RED.includes(n) ? '#ff7a84' : '#7ab0ff'),
    h = SPWAI.feed.map((f) => `<span><b style="color:${col(f.by)}">${esc(f.by)}</b> splashed <b style="color:${col(f.victim)}">${esc(f.victim)}</b></span>`).join('');
  if (spwAiFeedEl.innerHTML !== h) spwAiFeedEl.innerHTML = h;
}, 150);
