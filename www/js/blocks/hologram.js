// Hologram Board (owner, Nov 7 2026 build f: "a block that looks like a hologram, with the same button at the bottom as
// the vacuums; works like a sign: details of what is floating, gold etc.; wrench it to put in the blocks / seeds to
// list, the same as the vacuum's wrench").
// Loaded after vacuum.js. Block 425 is permanent (NEXT FREE BLOCK: 426). Shop WORLD 15,000 (price picked by Claude).
// - Look: the vacuums' base (landing pad + round button in front), no glass: a cyan light cone rises from the pad and
//   a see-through hologram of the listed items floats in it, one after another (`HOLO_CYCLE_MS`), flickering, with
//   scan lines. Gold shows as a hologram coin.
// - Stand on it (like a Sign): a panel over it lists, for this world, how many of each listed item are floating, and
//   the floating gold and how many players are in the world (owner, build g). Only the items in the slots are listed
//   (owner, build h: no "floats most" list when the slots are empty), + gold / players if ON.
// - Wrench (players who can build here): HOLO_MAX slots (tap an empty one = pick from the bag, tap a full one = take it
//   off the list), "Gold" ON / OFF, "Players" ON / OFF (`pl`) and the board's ON / OFF (off = no hologram, no panel, red
//   button). Saved with the world as `holo` [[tile, { ids, gold, off }]], sent as `show` k 'holo'. It holds nothing,
//   so it can always be broken (it always drops itself).
// ===== hologram =====
const HOLO_T = 425,
  HOLO_MAX = 5, // slots (owner: 5, was 8)
  HOLO_CYCLE_MS = 2200;
{
  if (BLOCK[HOLO_T]) console.error('hologram.js: block number used twice: ' + HOLO_T);
  BLOCK[HOLO_T] = { id: 'hologram_board', name: 'Hologram Board', hits: 4, art: 'deco', solid: false, fx: ['#3ee0ff', '#8a95ae', '#bff6ff'] };
  ITEMS.hologram_board = {
    name: 'Hologram Board',
    kind: 'block',
    block: HOLO_T,
    desc: 'A hologram projector. Stand on it to see how many items and how much gold are floating in this world. Wrench it to pick which blocks and seeds it lists.',
    rarity: 'Epic',
  };
  SHOP.push({ id: 'hologram_board', gold: 15000, cat: 'world' });
}
const isHoloT = (t) => t === HOLO_T;
const holos = new Map(); // tile -> { ids: [item ids], gold: bool, pl: bool (players row), off: bool }
const holoListable = (id) => !!ITEMS[id] && id !== 'wrench' && id !== 'fist' && !ITEMS[id].key && !ITEMS[id].bound;
function setHolo(i, v) {
  if (!isHoloT(fg[i]) || !v || typeof v !== 'object') return holos.delete(i);
  const ids = [...new Set((Array.isArray(v.ids) ? v.ids : []).filter(holoListable))].slice(0, HOLO_MAX);
  holos.set(i, { ids, gold: v.gold !== false && v.gold !== 0, pl: v.pl !== false && v.pl !== 0, off: !!v.off });
}
const holoGet = (i) => holos.get(i) || { ids: [], gold: true, pl: true, off: false };
// players in this world now: you + everyone here (offline: just you)
const holoPlayers = () => 1 + (typeof Net !== 'undefined' && Net.remotes ? Net.remotes.size : 0);
function holoChanged(i) {
  Net.sendShow(i, 'holo', holos.get(i) || null);
  saveWorld();
}
// what is floating in this world: id -> amount, and the gold (cached a quarter of a second)
let holoCount = null,
  holoCountT = -1e9;
function holoFloating() {
  if (holoCount && now - holoCountT < 250) return holoCount;
  const items = new Map();
  let gold = 0;
  for (const d of drops) {
    if (d.mg && d.id !== 'gold') continue;
    if (d.id === 'gold') gold += d.qty;
    else items.set(d.id, (items.get(d.id) || 0) + d.qty);
  }
  holoCountT = now;
  return (holoCount = { items, gold });
}
// the rows the board shows: [{ id, n }] (id 'gold' = the gold)
function holoRows(i) {
  const h = holoGet(i),
    f = holoFloating(),
    rows = h.ids.map((id) => ({ id, n: f.items.get(id) || 0 })); // only what is in the slots (owner, build h)
  if (h.gold) rows.push({ id: 'gold', n: f.gold });
  if (h.pl) rows.push({ id: 'players', n: holoPlayers() });
  return rows;
}

// ---------- the wrench window ----------
const HOLO_CSS = document.createElement('style');
HOLO_CSS.textContent =
  '.holowin{display:flex;flex-direction:column;gap:10px}' +
  '.holowin .hgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}' +
  '.holowin .hslot{aspect-ratio:1;border-radius:10px;border:3px dashed rgba(62,224,255,.45);background:rgba(10,30,50,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:2px;position:relative;min-width:0}' +
  '.holowin .hslot.full{border-style:solid;border-color:#3ee0ff;box-shadow:0 0 8px rgba(62,224,255,.5) inset}' +
  '.holowin .hslot canvas{width:62%;height:auto;image-rendering:pixelated}' +
  '.holowin .hslot .plus{font:bold 24px monospace;color:rgba(62,224,255,.7)}' +
  '.holowin .hslot .hn{font-size:10px;color:#bff6ff;font-weight:bold;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.holowin .hrow{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}' +
  '.holowin .vpow{min-width:110px;font-weight:bold;border-radius:20px}' +
  '.holowin .vpow.on{background:#2ab862;border-color:#3ee07a;color:#fff}' +
  '.holowin .vpow.off{background:#7a1a2a;border-color:#c23a50;color:#ffe0e4}' +
  '.holowin .hnote{font-size:12px;opacity:.8;text-align:center;margin:0}';
document.head.appendChild(HOLO_CSS);
function openHolo(x, y) {
  const i = at(x, y);
  if (!canEdit(true, i)) return toast('Stand on the Hologram Board to read it');
  holoWin(i);
}
function holoWin(i) {
  if (!isHoloT(fg[i])) return;
  const h = holoGet(i),
    f = holoFloating();
  let slots = '';
  for (let k = 0; k < HOLO_MAX; k++) {
    const id = h.ids[k];
    slots += id
      ? `<button type="button" class="hslot full" data-k="${k}" title="${esc(ITEMS[id].name)}: tap to take it off"><span class="hpic"></span><span class="hn">${(f.items.get(id) || 0).toLocaleString()}</span></button>`
      : `<button type="button" class="hslot" data-k="${k}" aria-label="Empty slot"><span class="plus">+</span></button>`;
  }
  const body = dialog(
    'HOLOGRAM BOARD',
    `<div class="holowin">
      <p class="hnote">Put the blocks / seeds to list in the slots (tap a full slot to take it off). Only what is in the slots is listed. Stand on the board to read it.</p>
      <div class="hgrid">${slots}</div>
      <div class="hrow">
        <button type="button" class="btn vpow ${h.gold ? 'on' : 'off'}" id="hGold">Gold ${h.gold ? 'ON' : 'OFF'}</button>
        <button type="button" class="btn vpow ${h.pl ? 'on' : 'off'}" id="hPl">Players ${h.pl ? 'ON' : 'OFF'}</button>
        <button type="button" class="btn vpow ${h.off ? 'off' : 'on'}" id="hPow">${h.off ? 'OFF' : 'ON'}</button>
      </div>
      <p class="hnote">Floating now: ${f.gold.toLocaleString()} gold · Players here: ${holoPlayers()}</p>
    </div>`,
    [{ label: 'Close', cls: 'ghost', run: () => {} }],
  );
  body.querySelectorAll('.hslot').forEach((b) => {
    const k = +b.dataset.k,
      id = h.ids[k];
    if (id) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      drawFitted(4, 4, 56, id, c.getContext('2d'));
      b.querySelector('.hpic').replaceWith(c);
      b.onclick = () => {
        const cur = holoGet(i);
        setHolo(i, { ...cur, ids: cur.ids.filter((o) => o !== id) });
        holoChanged(i);
        holoWin(i);
      };
    } else
      b.onclick = () =>
        pickFromBag(
          'Tap the block or seed the Hologram Board should list',
          (o) => holoListable(o) && !holoGet(i).ids.includes(o),
          (o) => {
            if (!isHoloT(fg[i]) || !canEdit(true, i)) return;
            const cur = holoGet(i);
            if (cur.ids.length >= HOLO_MAX) return toast('All ' + HOLO_MAX + ' slots are full');
            setHolo(i, { ...cur, ids: [...cur.ids, o] });
            holoChanged(i);
            holoFlash.set(i, now);
            holoWin(i);
          },
          (o) => (holoGet(i).ids.includes(o) ? 'It is already on the list' : "This can't be listed"),
        );
  });
  body.querySelector('#hGold').onclick = () => {
    const cur = holoGet(i);
    setHolo(i, { ...cur, gold: !cur.gold });
    holoChanged(i);
    holoWin(i);
  };
  body.querySelector('#hPl').onclick = () => {
    const cur = holoGet(i);
    setHolo(i, { ...cur, pl: !cur.pl });
    holoChanged(i);
    holoWin(i);
  };
  body.querySelector('#hPow').onclick = () => {
    const cur = holoGet(i);
    setHolo(i, { ...cur, off: !cur.off });
    holoChanged(i);
    holoFlash.set(i, now);
    Sfx.play('pickup', 0.5);
    holoWin(i);
  };
}

// ---------- clicks, saving, syncing ----------
act = ((prev) =>
  function () {
    if (P.dead || hand !== 'wrench') return prev();
    const t = tileUnder();
    if (!inW(t.x, t.y) || !isHoloT(fg[at(t.x, t.y)])) return prev();
    if (Net.playerAt(ptr.x, ptr.y) || !inWrenchReach(t.x, t.y)) return prev();
    return openHolo(t.x, t.y);
  })(act);
wrenchBlock = ((prev) =>
  function (x, y) {
    return prev(x, y) || (inW(x, y) && isHoloT(fg[at(x, y)]));
  })(wrenchBlock);
breakDrop = ((prev) =>
  function (id) {
    return id === 'hologram_board' ? { block: true, seed: false, gold: 0 } : prev(id);
  })(breakDrop);
{
  const prev = Net.onShow;
  Net.onShow = (p) => {
    if (!p || p.k !== 'holo') return prev(p);
    if (!Number.isInteger(p.i) || p.i < 0 || p.i >= fg.length || !isHoloT(fg[p.i])) return;
    setHolo(p.i, p.v);
  };
}
setInterval(() => {
  for (const i of holos.keys()) if (!isHoloT(fg[i])) holos.delete(i);
}, 1000);
worldData = ((prev) =>
  function () {
    const w = prev();
    w.holo = [...holos].filter(([i]) => isHoloT(fg[i]));
    return w;
  })(worldData);
applyWorld = ((prev) =>
  function (w, skew) {
    prev(w, skew);
    holos.clear();
    for (const [i, v] of Array.isArray(w && w.holo) ? w.holo : []) if (Number.isInteger(i) && i >= 0 && i < fg.length) setHolo(i, v);
  })(applyWorld);
genWorld = ((prev) =>
  function (...a) {
    holos.clear();
    return prev.apply(this, a);
  })(genWorld);

// ---------- drawing ----------
const HOLO_PICS = {},
  holoFlash = new Map();
// the base only (the vacuums' base, cyan trim): pad on top, round button in front
function holoBase() {
  if (HOLO_PICS.base) return HOLO_PICS.base;
  const M = VAC_STYLE[VAC_ITEM_T].M,
    trim = VAC_STYLE[VAC_ITEM_T].trim;
  return (HOLO_PICS.base = pix64Canvas(64, (a) => {
    a.rect(5, 50, 54, 1, M[4]);
    a.rect(5, 51, 54, 3, M[3]);
    a.poly([[4, 54], [60, 54], [62, 63], [2, 63]], (i, j) => (j >= 62 ? M[0] : i < 8 ? M[3] : i > 55 ? M[1] : M[2]));
    a.rect(4, 54, 56, 1, M[1]);
    a.rect(6, 59, 52, 1, trim);
    a.disc(32, 58.5, 4.6, M[0]);
    // two small emitters on the pad
    a.rect(14, 48, 5, 2, M[1]);
    a.rect(45, 48, 5, 2, M[1]);
    a.outline('#0e0c12');
  }));
}
// an item's picture as a see-through cyan hologram with scan lines (cached per item)
function holoPic(id) {
  const key = 'h_' + id;
  if (HOLO_PICS[key]) return HOLO_PICS[key];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (id === 'gold') x.drawImage(coinCanvas('gold_b'), 0, 0, 64, 64);
  else drawFitted(0, 0, 64, id, x);
  // keep its shading, tint it cyan
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(62,224,255,.55)';
  x.fillRect(0, 0, 64, 64);
  x.fillStyle = 'rgba(0,30,50,.35)';
  for (let y = 0; y < 64; y += 4) x.fillRect(0, y, 64, 2);
  x.globalCompositeOperation = 'source-over';
  return (HOLO_PICS[key] = c);
}
function drawHolo(x, y, px, py, T) {
  const i = at(x, y),
    h = holoGet(i),
    on = !h.off,
    u = T / 64,
    cx = px + 32 * u,
    fl = holoFlash.get(i),
    pk = fl !== undefined && now - fl < 450 ? 1 - (now - fl) / 450 : 0;
  if (fl !== undefined && !pk) holoFlash.delete(i);
  if (on) {
    // the light cone from the pad
    const gr = g.createLinearGradient(0, py + 50 * u, 0, py + 4 * u);
    gr.addColorStop(0, `rgba(62,224,255,${0.42 + 0.3 * pk})`);
    gr.addColorStop(1, 'rgba(62,224,255,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(px + 18 * u, py + 50 * u);
    g.lineTo(px + 46 * u, py + 50 * u);
    g.lineTo(px + 60 * u, py + 6 * u);
    g.lineTo(px + 4 * u, py + 6 * u);
    g.closePath();
    g.fill();
    // what it shows now: the listed items one after another (gold too), else a coin / question mark
    const list = h.ids.length ? [...h.ids] : [];
    if (h.gold) list.push('gold');
    const k = list.length ? Math.floor((now + i * 377) / HOLO_CYCLE_MS) % list.length : -1,
      id = k >= 0 ? list[k] : null,
      ph = ((now + i * 377) % HOLO_CYCLE_MS) / HOLO_CYCLE_MS,
      fade = Math.min(1, ph * 8, (1 - ph) * 8), // fades between items
      flick = Math.random() < 0.04 ? 0.45 : 1,
      bob = Math.sin(now / 500 + i) * 2 * u,
      s = 30 * u;
    g.save();
    g.globalAlpha = 0.8 * fade * flick;
    if (id) {
      const sp = id === 'gold' ? Math.max(0.15, Math.abs(Math.cos(now / 350 + i))) : 1;
      g.translate(cx, py + 26 * u + bob);
      g.scale(sp, 1);
      // a little sideways jitter now and then, like a hologram
      g.drawImage(holoPic(id), -s / 2 + (Math.random() < 0.05 ? 1.5 * u : 0), -s / 2, s, s);
    } else {
      g.fillStyle = '#9ff0ff';
      g.font = `bold ${Math.round(20 * u)}px monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('?', cx, py + 26 * u + bob);
    }
    g.restore();
    // a scan line sweeping up
    const sy = py + (48 - ((now / 22) % 44)) * u;
    g.fillStyle = 'rgba(191,246,255,.35)';
    g.fillRect(px + 10 * u, sy, 44 * u, 1 * u);
  }
  g.drawImage(holoBase(), px, py, T, T);
  // the pad's light and the button (green on, red off, white when changed)
  g.fillStyle = on ? `rgba(62,224,255,${0.75 + 0.2 * Math.sin(now / 240 + i)})` : 'rgba(110,110,120,.5)';
  g.beginPath();
  g.ellipse(cx, py + 50.6 * u, 12 * u, 1.4 * u, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = pk > 0.2 ? '#ffffff' : on ? (Math.sin(now / 380 + i) > -0.3 ? '#3ee07a' : '#2ab862') : '#e8303e';
  g.beginPath();
  g.arc(cx, py + 58.5 * u, 3.2 * u, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.7)';
  g.fillRect(cx - 1.6 * u, py + 56.6 * u, 1.4 * u, 1.2 * u);
}
drawNewBlock = ((prev) =>
  function (b, x, y, px, py, T) {
    if (b.id === 'hologram_board') return drawHolo(x, y, px, py, T);
    return prev(b, x, y, px, py, T);
  })(drawNewBlock);
// the players row's icon: a little person (head + shoulders) in green
function holoPersonIcon(x, y, s) {
  g.fillStyle = '#3ee07a';
  g.beginPath();
  g.arc(x + s / 2, y + s * 0.3, s * 0.22, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(x + s / 2, y + s * 0.92, s * 0.4, s * 0.36, 0, Math.PI, 0);
  g.fill();
}
// standing on it: the list in a hologram panel over it (like a Sign's bubble)
function holoUnderPlayer() {
  const tx = Math.floor((P.x + P.w / 2) / TS);
  for (const py of [P.y + P.h - 2, P.y + P.h / 2]) {
    const ty = Math.floor(py / TS);
    if (inW(tx, ty) && isHoloT(fg[at(tx, ty)])) return at(tx, ty);
  }
  return -1;
}
drawSignBubble = ((prev) =>
  function (ox, oy) {
    prev(ox, oy);
    if (P.dead || !inWorld) return;
    const i = holoUnderPlayer();
    if (i < 0 || holoGet(i).off) return;
    const rows = holoRows(i),
      x = i % WW,
      y = (i / WW) | 0,
      cx = ox + (x * TS + TS / 2) * Z,
      tipY = oy + (y * TS - 2) * Z - 30 * Z, // over the player's head
      U = Math.max(Z, 2.4 * Math.min(2, devicePixelRatio || 1)),
      lh = 9 * U,
      ic = 7 * U;
    g.font = `${4 * U}px "Press Start 2P", monospace`;
    const title = 'FLOATING IN ' + worldName,
      lines = rows.length ? rows.map((r) => (r.id === 'gold' ? 'Gold' : r.id === 'players' ? 'Players' : ITEMS[r.id].name) + '  ' + r.n.toLocaleString()) : ['Put blocks / seeds in the slots (wrench)'],
      w = Math.max(g.measureText(title).width, ...lines.map((l) => g.measureText(l).width + ic + 3 * U)) + 10 * U,
      h = (lines.length + 1) * lh + 6 * U,
      bx = Math.max(4, Math.min(cv.width - w - 4, cx - w / 2)),
      by = Math.max(4, tipY - h);
    g.save();
    g.fillStyle = 'rgba(8,28,44,.82)';
    g.strokeStyle = 'rgba(62,224,255,.9)';
    g.lineWidth = Math.max(1, U / 2);
    g.shadowColor = 'rgba(62,224,255,.7)';
    g.shadowBlur = 4 * U;
    g.beginPath();
    g.roundRect(bx, by, w, h, 3 * U);
    g.fill();
    g.stroke();
    g.shadowBlur = 0;
    // faint scan lines
    g.fillStyle = 'rgba(62,224,255,.06)';
    for (let sy = by + 2 * U; sy < by + h - U; sy += 2 * U) g.fillRect(bx + U, sy, w - 2 * U, U * 0.5);
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = '#9ff0ff';
    g.fillText(title, bx + 5 * U, by + 3 * U + lh / 2);
    lines.forEach((l, k) => {
      const ry = by + 3 * U + (k + 1) * lh,
        r = rows[k];
      if (r) {
        if (r.id === 'gold') g.drawImage(coinCanvas('gold_b'), bx + 5 * U, ry + (lh - ic) / 2, ic, ic);
        else if (r.id === 'players') holoPersonIcon(bx + 5 * U, ry + (lh - ic) / 2, ic);
        else drawIcon(r.id, bx + 5 * U, ry + (lh - ic) / 2, ic);
      }
      g.fillStyle = r && r.id === 'gold' ? '#ffd23f' : r && r.id === 'players' ? '#9affc0' : '#e8fbff';
      g.fillText(l, bx + 5 * U + (r ? ic + 3 * U : 0), ry + lh / 2);
    });
    g.restore();
  })(drawSignBubble);
SHOP_ICON.hologram_board = () => {
  if (HOLO_PICS.icon) return HOLO_PICS.icon;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 50, 0, 4);
  gr.addColorStop(0, 'rgba(62,224,255,.55)');
  gr.addColorStop(1, 'rgba(62,224,255,0)');
  x.fillStyle = gr;
  x.beginPath();
  x.moveTo(18, 50);
  x.lineTo(46, 50);
  x.lineTo(60, 6);
  x.lineTo(4, 6);
  x.fill();
  x.globalAlpha = 0.85;
  x.drawImage(holoPic('gold'), 17, 11, 30, 30);
  x.globalAlpha = 1;
  x.drawImage(holoBase(), 0, 0);
  x.fillStyle = '#3ee07a';
  x.beginPath();
  x.arc(32, 58.5, 3.2, 0, Math.PI * 2);
  x.fill();
  return (HOLO_PICS.icon = c);
};
HD_DECO.hologram_board = (x) => x.drawImage(SHOP_ICON.hologram_board(), 0, 0, 32, 32);
