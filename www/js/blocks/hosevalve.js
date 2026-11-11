// Hose valves: the Suction Hose and Suction Intake can shut one side, set with the wrench (owner, Nov 11 2026, build v:
// "drop the new block; make the hoses themselves do it, set with the wrench: they detect what is next to them; I want
// it automatic, or it changes place each time; set on the hose whether it auto rotates or not; and show the wrench
// icon on them when the wrench is held". Build u's separate Hose Valve, background 94, is gone: tiles saved with it
// become plain Suction Hoses, and 94 is never used again.)
// - A hose's joined sides (another hose, an intake or the Factory Core: vacuumhose.js vhJoins) are found by itself.
//   With 3 or 4 joined it can SHUT one of them (`hoseCfg` tile -> { s: the shut side 0 up, 1 right, 2 down, 3 left,
//   -1 = none, a: auto rotate }). Shut = drawn with straight arms, a steel valve housing with a yellow wheel in the
//   middle and a hazard-striped cap on the shut side; vhPathFrom lets nothing through it (`hvOpen`).
//   Fewer than 3 joined, or nothing set: a normal hose, everything open (as before).
// - AUTO ROTATE (build y, owner: "not turning by itself all the time: it turns ONCE each time it is triggered"): on =
//   every factory signal that reaches it turns it on by one side; off = it stays on the side you picked, signals or
//   not. (Build v-x turned it every 3 s by the clock: gone.)
// - Any factory signal touching the hose (a Steam Pipe, Spin Trigger, Factory Button or Generator next to it:
//   machines.js machFire 'valve' -> hvTurn) also turns a hose that has a shut side on by one (every game runs the
//   signals itself, so the turn isn't sent).
// - Wrench (builders): a window with the joined sides (pick the shut one, or "All open") and the Auto rotate switch.
//   With the wrench in hand every hose you may set shows the wrench icon (wrenchBlock wrapper: a hose tile with no block
//   on it). Sent with `show` k 'hv' { s, a }; saved with the world as `hv`: [[tile, side, auto 0 / 1], ...].
// - (build w, owner: "the Steam Pipe too") STEAM PIPES work the same way: wrench one (`p: true` in its hoseCfg entry):
//   its joined sides are the pipes / machines next to it (machines.js MACH_NET, blowers, machLink); a shut side passes
//   no SIGNAL (machines.js machFire asks `pipeShutBlocks`); Auto rotate: after a
//   signal goes through, the side it CAME IN BY shuts (build z: see hvTurn); stopped at the shut side = that side opens. Drawn: the pipe without that side, a hazard plate across the channel
//   on the shut edge and the yellow wheel in the middle (drawNewBlock wrapper). Saved as [tile, side, auto, 1].
// Loaded after vacuumhose.js and machines.js.
// ===== hose valves =====
const HV_TURN_MS = 380, // the wheel's quarter turn
  HV_OLD_BG = 94; // (build u's Hose Valve background: turned into plain hoses on load)
const hoseCfg = new Map(), // hose / pipe tile -> { s, a, p: a Steam Pipe }
  hvTurnAt = new Map(); // tile -> when it last turned (the wheel's spin)
const HV_SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]], // up, right, down, left
  HV_SIDE_NAME = ['Up', 'Right', 'Down', 'Left'];
const isPipeV = (i) => fg[i] === PIPE_T;
// the sides with a hose / intake / Core next to it (0-3); pipe: the pipes / machines it joins
function hvJoined(i, pipe) {
  const x = i % WW,
    y = (i / WW) | 0,
    out = [];
  HV_SIDES.forEach(([dx, dy], s) => {
    const nx = x + dx,
      ny = y + dy;
    if (!inW(nx, ny)) return;
    const t = fg[at(nx, ny)];
    if (pipe ? (MACH_NET.has(t) || !!BLOWER_BY_T[t]) && machLink(i, at(nx, ny)) : vhJoins(nx, ny)) out.push(s);
  });
  return out;
}
// the side shut right now, or -1 (pipe: the Steam Pipe's valve, else the hose's)
function hvShut(i, pipe) {
  const c = hoseCfg.get(i);
  if (!c || c.s < 0 || !!c.p !== !!pipe || (pipe ? !isPipeV(i) : !isHoseBg(bg[i]))) return -1;
  const j = hvJoined(i, pipe);
  if (j.length < 3) return -1;
  const base = Math.max(0, j.indexOf(c.s));
  return j[base];
}
const hvOpen = (i, s) => hvShut(i) !== s;
const pipeShut = (i) => hvShut(i, true);
// does a pipe's shut side stop a signal going from tile i to its neighbour j (side s of i)?
const pipeShutBlocks = (i, j, s) => (isPipeV(i) && pipeShut(i) === s) || (isPipeV(j) && pipeShut(j) === (s + 2) % 4);
// a hose a factory signal next to it turns (Auto rotate on; machines.js machFire)
const hvSignalled = (i) => isHoseBg(bg[i]) && !fg[i] && hvShut(i) >= 0 && hoseCfg.get(i).a;
// a Steam Pipe a signal turns when it reaches it (or is stopped by its shut side): Auto rotate on
const pvAuto = (i) => isPipeV(i) && pipeShut(i) >= 0 && hoseCfg.get(i).a;
// a signal reached it (Auto rotate on), from tile `from`.
// Hose: the next joined side shuts. Steam Pipe (build z, owner: "the side the pressure went to stays open, the one that
// got no pressure is switched in, and the side it CAME FROM shuts"): the side the signal came in by shuts, so the
// pressure's way on stays open and the other joined side opens (in from the left going right = left shuts: right +
// bottom / top). A signal stopped at the shut side opens that side (the next joined side shuts instead), so it can
// never stay stuck.
function hvTurn(i, from) {
  const c = hoseCfg.get(i),
    pipe = !!(c && c.p),
    cur = hvShut(i, pipe);
  if (!c || cur < 0 || !c.a) return;
  const j = hvJoined(i, pipe),
    base = j.includes(c.s) ? c.s : j[0];
  const x0 = i % WW,
    y0 = (i / WW) | 0,
    inSide = from === undefined ? -1 : HV_SIDES.findIndex(([dx, dy]) => inW(x0 + dx, y0 + dy) && at(x0 + dx, y0 + dy) === from);
  if (pipe && j.includes(inSide)) c.s = inSide === cur ? j[(j.indexOf(inSide) + 1) % j.length] : inSide;
  else c.s = j[(j.indexOf(base) + 1) % j.length];
  hvTurnAt.set(i, now);
  machSound('clank', i);
  const x = i % WW,
    y = (i / WW) | 0;
  if (onScreenTile(x, y)) smoke(x, y, 2, 0.4);
}

// ---------- picture: straight arms, the valve housing and wheel, a cap on the shut side ----------
// mo = open sides (bits 1 up, 2 right, 4 down, 8 left), cs = the shut side, w = the wheel's turn (0-7)
function hvPaint(mo, cs, lit, w) {
  const H = lit ? HOSE_LIT : HOSE,
    arms = [[1, 0, -1, 0], [2, 1, 0, 1], [4, 0, 1, 2], [8, -1, 0, 3]];
  return machPaint((i, j) => {
    const x = i + 0.5,
      y = j + 0.5;
    let col = null;
    const hose = (a, s) => {
      const u = a / VH_HW;
      if (Math.abs(u) > 1) return null;
      if (Math.abs(u) > 0.86) return MCH.ol;
      const rib = ((s % 6) + 6) % 6 < 1.2;
      return mramp(H, 0.72 - u * 0.45 - u * u * 0.35 - (rib ? 0.28 : 0));
    };
    for (const [bit, ax, ay, side] of arms) {
      const open = mo & bit,
        shut = side === cs;
      if (!open && !shut) continue;
      const along = (x - 32) * ax + (y - 32) * ay,
        across = ax ? y - 32 : x - 32,
        reach = shut ? 24 : 32;
      if (along < 0 || along > reach) continue;
      const c = hose(across, along);
      if (c) col = c;
      if (shut) {
        // the shut side: a steel cap with hazard stripes, a little wider than the hose
        if (Math.abs(across) <= VH_HW + 2.5 && along > reach - 6) {
          if (Math.abs(across) > VH_HW + 1.5 || along > reach - 0.8 || along < reach - 5.2) col = MCH.ol;
          else col = Math.floor((x + y) / 3) % 2 ? MCH.hz[1] : MCH.hz[0];
        }
      } else if (Math.abs(across) <= VH_HW + 1 && along > reach - 3.5)
        col = Math.abs(across) > VH_HW + 0.2 || along > reach - 0.8 ? MCH.ol : MCH.met[3]; // collar at the edge
    }
    const d = Math.hypot(x - 32, y - 32);
    if (d < 16) {
      if (d > 15) col = MCH.ol;
      else if (d > 12) col = mramp(MCH.teal, 0.9 - ((x - 32) + (y - 32)) / 34);
      else if (d > 11) col = MCH.ol;
      else {
        col = lit ? '#1c5a60' : MCH.teal[0];
        const a = Math.atan2(y - 32, x - 32) + (w / 8) * (Math.PI / 2);
        if (d > 7.6 && d < 10.2) col = d > 9.4 || d < 8.2 ? '#8a6a10' : MCH.hz[1]; // the rim
        else if (d < 8 && Math.abs(Math.sin(a * 2)) < 0.22) col = MCH.hz[1]; // 4 spokes
        if (d < 2.6) col = d < 1.4 ? MCH.met[4] : MCH.met[1]; // the hub
      }
      for (const [bx, by] of [[32, 18.5], [45.5, 32], [32, 45.5], [18.5, 32]]) if (Math.hypot(x - bx, y - by) < 1.2) col = MCH.met[0];
    }
    return col;
  });
}
const HV_PICS = {};
const hvPic = (mo, cs, lit, w) => (HV_PICS[mo + ':' + cs + ':' + (lit ? 1 : 0) + ':' + w] ||= hvPaint(mo, cs, lit, w));
// (wraps the hoses' own bgImage, vacuumhose.js; only hoses with a shut side look different)
bgImage = ((prev) =>
  function (v, i) {
    if (i === undefined || !isHoseBg(v)) return prev(v, i);
    const cs = hvShut(i);
    if (cs < 0) return prev(v, i);
    const x = i % WW,
      y = (i / WW) | 0;
    let mo = 0;
    for (const s of hvJoined(i)) if (s !== cs) mo |= 1 << s;
    const ps = vhPulse.get(i),
      sk = vhSuck.get(i),
      lit = (ps !== undefined && now - ps < 260) || (sk !== undefined && now - sk < 600),
      ta = hvTurnAt.get(i),
      w = ta !== undefined && now - ta < HV_TURN_MS ? Math.min(7, Math.floor(((now - ta) / HV_TURN_MS) * 8)) : 0;
    const pic = hvPic(mo, cs, lit, w);
    const under = vhUnder(x, y);
    return under ? vhOver(bgImage(under, i), pic) : pic;
  })(bgImage);
// ---------- a Steam Pipe with a shut side ----------
// the overlay: a hazard plate across the channel on the shut edge, and the yellow wheel in the middle (w: its turn)
const PV_OVER = {};
function pvOver(cs, w) {
  return (PV_OVER[cs + ':' + w] ||= machPaint((i, j) => {
    const x = i + 0.5,
      y = j + 0.5;
    const [ax, ay] = HV_SIDES[cs],
      along = (x - 32) * ax + (y - 32) * ay, // towards the shut edge
      across = ax ? y - 32 : x - 32;
    if (along > 24 && along < 32 && Math.abs(across) < PIPE_CH + 2) {
      if (along < 25 || along > 31 || Math.abs(across) > PIPE_CH + 1) return MCH.ol;
      return Math.floor((x + y) / 3) % 2 ? MCH.hz[1] : MCH.hz[0];
    }
    const d = Math.hypot(x - 32, y - 32);
    if (d < 12) {
      if (d > 11) return MCH.ol;
      const a = Math.atan2(y - 32, x - 32) + (w / 8) * (Math.PI / 2);
      if (d > 7.6) return d > 10.2 || d < 8.2 ? '#8a6a10' : MCH.hz[1]; // the rim
      if (Math.abs(Math.sin(a * 2)) < 0.24) return MCH.hz[1]; // spokes
      if (d < 2.6) return d < 1.4 ? MCH.met[4] : MCH.met[1];
      return null; // (the hose shows between the spokes)
    }
    return null;
  }));
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (!b || b.id !== 'steam_pipe') return prev(b, x, y, px, py, T);
    const i = at(x, y),
      cs = pipeShut(i);
    if (cs < 0) return prev(b, x, y, px, py, T);
    const bit = 1 << cs,
      jn = (xx, yy) => inW(xx, yy) && (MACH_NET.has(fg[at(xx, yy)]) || !!BLOWER_BY_T[fg[at(xx, yy)]]) && machLink(i, at(xx, yy)),
      pp = (xx, yy) => inW(xx, yy) && fg[at(xx, yy)] === PIPE_T,
      m = ((jn(x, y - 1) ? 1 : 0) | (jn(x + 1, y) ? 2 : 0) | (jn(x, y + 1) ? 4 : 0) | (jn(x - 1, y) ? 8 : 0)) & ~bit,
      cm = ((pp(x, y - 1) ? 1 : 0) | (pp(x + 1, y) ? 2 : 0) | (pp(x, y + 1) ? 4 : 0) | (pp(x - 1, y) ? 8 : 0)) & ~bit;
    g.drawImage(pipeArt(m, cm, false), px, py, T, T);
    const t0 = pipeAt.get(i);
    if (t0 !== undefined && now - t0 >= 0 && now - t0 < 520) {
      const e = now - t0;
      g.save();
      g.globalAlpha = e < 70 ? e / 70 : 1 - (e - 70) / 450;
      g.drawImage(pipeArt(m, cm, true), px, py, T, T);
      g.restore();
    }
    const ta = hvTurnAt.get(i),
      w = ta !== undefined && now - ta < HV_TURN_MS ? Math.min(7, Math.floor(((now - ta) / HV_TURN_MS) * 8)) : 0;
    g.drawImage(pvOver(cs, w), px, py, T, T);
  })(drawNewBlock);

// ---------- the wrench ----------
// (build x, owner: "only the hoses with 3 or 4 joined should show the wrench") only junctions can be set
const hoseAt = (x, y) => inW(x, y) && isHoseBg(bg[at(x, y)]) && !fg[at(x, y)] && hvJoined(at(x, y)).length >= 3;
const pipeAtXY = (x, y) => inW(x, y) && isPipeV(at(x, y)) && hvJoined(at(x, y), true).length >= 3;
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || hoseAt(x, y) || pipeAtXY(x, y);
  })(wrenchBlock);
function hvSet(i, c) {
  if (c && (c.s >= 0 || c.a)) hoseCfg.set(i, { s: c.s >= 0 && c.s < 4 ? c.s | 0 : -1, a: !!c.a, ...(c.p ? { p: true } : {}) });
  else hoseCfg.delete(i);
}
function openHoseWin(i, pipe) {
  if (!canEdit(true, i)) return toast("You can't set this " + (pipe ? 'pipe' : 'hose') + ' here');
  const name = pipe ? 'Steam Pipe' : ITEMS[(BGS[bg[i]] || {}).id] ? ITEMS[BGS[bg[i]].id].name : 'Hose',
    what = pipe ? 'pipes or machines' : 'hoses (or a Factory Core)';
  const draw = () => {
    const j = hvJoined(i, pipe),
      c0 = hoseCfg.get(i),
      c = c0 && !!c0.p === !!pipe ? c0 : { s: -1, a: false },
      cur = hvShut(i, pipe);
    const body = dialog(
      name.toUpperCase(),
      j.length < 3
        ? `<p class="dmsg">This ${pipe ? 'pipe' : 'hose'} joins <b>${j.length}</b> ${j.length === 1 ? 'side' : 'sides'}.</p>
           <p class="mnote">Join 3 or 4 ${what} to it, then wrench it again to shut one side.</p>`
        : `<p class="dmsg">Joined: <b>${j.map((s) => HV_SIDE_NAME[s]).join(', ')}</b></p>
           <p class="mlabel">Shut side</p>
           <div class="hvrow">${['<button type="button" class="btn ' + (c.s < 0 ? '' : 'ghost') + '" data-s="-1">All open</button>', ...j.map((s) => `<button type="button" class="btn ${c.s >= 0 && cur === s ? '' : 'ghost'}" data-s="${s}">${HV_SIDE_NAME[s]}</button>`)].join('')}</div>
           <label class="lcheck"><input type="checkbox" id="hvAuto" ${c.a ? 'checked' : ''} ${c.s < 0 ? 'disabled' : ''}/> Auto rotate (${pipe ? 'the side the signal comes from shuts' : 'turns each time a signal reaches it'})</label>
           <p class="mnote">${pipe ? 'No signal goes through the shut side. ' : ''}${pipe ? 'Auto rotate: after a signal goes through, the side it came from shuts and the other side opens.' : 'Auto rotate: a signal next to it (Steam Pipe, Spin Trigger, Factory Button, Generator) turns it once.'} Off: it stays where you set it.</p>`,
      [{ label: 'Close', cls: 'ghost', run: () => {} }],
    );
    const put = (nc) => {
      if (!(pipe ? isPipeV(i) : isHoseBg(bg[i])) || !canEdit(true, i)) return;
      hvSet(i, nc && { ...nc, p: pipe });
      hvTurnAt.set(i, now);
      Net.sendShow(i, 'hv', hoseCfg.get(i) || null);
      saveWorld();
      draw();
    };
    body.querySelectorAll('[data-s]').forEach((b) =>
      b.addEventListener('click', () => {
        const s = +b.dataset.s;
        put(s < 0 ? null : { s, a: c.a }); // (keeps the Auto rotate switch as it is)
      }),
    );
    const au = body.querySelector('#hvAuto');
    // switching auto rotate keeps the side that is shut now
    if (au) au.addEventListener('change', () => put({ s: hvShut(i, pipe) >= 0 ? hvShut(i, pipe) : c.s, a: au.checked }));
  };
  draw();
}
act = ((prev) =>
  function () {
    if (hand !== 'wrench' || P.dead) return prev();
    const t = tileUnder();
    const pipe = pipeAtXY(t.x, t.y);
    if ((!pipe && !hoseAt(t.x, t.y)) || Net.playerAt(ptr.x, ptr.y)) return prev();
    if (!inWrenchReach(t.x, t.y)) return prev(); // (act says "move closer")
    return openHoseWin(at(t.x, t.y), pipe);
  })(act);
{
  const st = document.createElement('style');
  st.textContent = '.hvrow{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}.hvrow .btn{font-size:9px;padding:7px 10px}';
  document.head.appendChild(st);
}

// ---------- online ----------
{
  const prev = Net.onShow;
  Net.onShow = (p) => {
    if (!p || p.k !== 'hv') return prev(p);
    if (!Number.isInteger(p.i) || p.i < 0 || p.i >= bg.length) return;
    const pipe = !!(p.v && p.v.p);
    if (pipe ? !isPipeV(p.i) : !isHoseBg(bg[p.i])) return;
    hvSet(p.i, p.v && typeof p.v === 'object' ? { s: Number.isInteger(p.v.s) ? p.v.s : -1, a: !!p.v.a, p: pipe } : null);
    hvTurnAt.set(p.i, now);
  };
}

// ---------- saving ----------
const _worldDataHv = worldData;
worldData = function () {
  const w = _worldDataHv();
  const hv = [...hoseCfg].filter(([i, c]) => (c.p ? isPipeV(i) : isHoseBg(bg[i]))).map(([i, c]) => (c.p ? [i, c.s, c.a ? 1 : 0, 1] : [i, c.s, c.a ? 1 : 0]));
  if (hv.length) w.hv = hv;
  return w;
};
const _applyWorldHv = applyWorld;
applyWorld = function (w, skew) {
  _applyWorldHv(w, skew);
  for (let i = 0; i < bg.length; i++) if (bg[i] === HV_OLD_BG) bg[i] = VPLAIN_BG; // (build u's Hose Valve)
  hoseCfg.clear();
  hvTurnAt.clear();
  for (const e of Array.isArray(w && w.hv) ? w.hv : []) if (Array.isArray(e) && e.length >= 3 && Number.isInteger(e[0]) && Number.isInteger(e[1])) hvSet(e[0], { s: e[1], a: !!e[2], p: e[3] === 1 });
};
const _genWorldHv = genWorld;
genWorld = function (...a) {
  hoseCfg.clear();
  hvTurnAt.clear();
  return _genWorldHv(...a);
};
