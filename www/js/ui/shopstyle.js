// Shop: grouped tabs and picture backgrounds (owner, Nov 10 2026: "make background images for the things in the shop;
// put everything for the character together and give it tabs; then the world ones, pets, top up and the packs; the
// wearable sets go in characters").
// - The column of tabs on the right now shows GROUPS: (AUTUMN while it runs), CHARACTER, WORLD, PETS, PACKS, TOP UP.
//   CHARACTER = WEAR, SETS, TOOLS, RIDES; WORLD = LOCKS, ITEMS (the old WORLD tab), MUSIC. A group with more than one
//   part shows a row of SUB-TABS above the cards (`#shopSub`); the group remembers the part you looked at last.
//   `shopTab` is still the part (wear, sets, locks ...), so the rest of the game (TOP UP links, the autumn tab) works
//   as before. A part some later file adds to SHOP_TABS that isn't in a group becomes its own tab.
// - Every card gets a painted background for its part (`shopBg`, pixel art made here once and kept as a picture): a
//   spotlit stage for WEAR, a fashion runway for SETS, a glowing forge for TOOLS, a sunset road for RIDES, a vault for
//   LOCKS, green hills for ITEMS, a starry night for MUSIC, a meadow for PETS, golden rays for PACKS, falling leaves for
//   AUTUMN. The bottom of the card darkens so the price and BUY stay easy to read.
// Loaded after the files that add Shop tabs (sets, pets, rides, economy, autumn, starterpack).
// ===== shopstyle =====
const SHOP_GROUPS = [
  { id: 'autumn' },
  { id: 'character', label: 'CHARACTER', parts: ['wear', 'sets', 'tools', 'rides'] },
  { id: 'world', label: 'WORLD', parts: ['locks', 'world', 'music'] },
  { id: 'pets' },
  { id: 'packs' },
  { id: 'topup' },
];
const SHOP_PART_LABEL = { world: 'ITEMS' }; // (inside WORLD, the old WORLD tab is called ITEMS)
const shopGroupLast = {}; // group id -> the part looked at last
// the groups that have something to show right now, each with its parts (in SHOP_TABS order)
function shopGroups() {
  const have = SHOP_TABS.map((t) => t.id),
    used = new Set(),
    out = [];
  for (const gr of SHOP_GROUPS) {
    const parts = (gr.parts || [gr.id]).filter((p) => have.includes(p));
    if (!parts.length) continue;
    parts.forEach((p) => used.add(p));
    out.push({ id: gr.id, label: gr.label || SHOP_TABS.find((t) => t.id === parts[0]).label, parts });
  }
  for (const t of SHOP_TABS) if (!used.has(t.id)) out.push({ id: t.id, label: t.label, parts: [t.id] }); // (anything new)
  return out;
}
const shopGroupOf = (part) => shopGroups().find((g) => g.parts.includes(part));

// ---------- the backgrounds ----------
const SHOP_BG = {};
function shopBg(part) {
  if (SHOP_BG[part] !== undefined) return SHOP_BG[part];
  const W = 96,
    H = 72,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d'),
    R = (i, j, w, h, col) => ((x.fillStyle = col), x.fillRect(i, j, w, h)),
    P = (i, j, col) => R(i, j, 1, 1, col),
    sky = (cols) => cols.forEach((col, k) => R(0, Math.floor((k * H) / cols.length), W, Math.ceil(H / cols.length) + 1, col)),
    rnd = (n) => {
      let s = n * 9301 + 49297;
      return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    };
  const paint = {
    // a stage: dark purple, curtains, a spotlight cone onto a round floor spot, sparkles
    wear() {
      sky(['#1a0c2e', '#22103a', '#2a1446', '#321852']);
      for (let j = 0; j < H; j++) {
        const hw = 6 + j * 0.42;
        for (let i = Math.floor(48 - hw); i < 48 + hw; i++) P(i, j, j % 2 ? 'rgba(255,240,200,0.10)' : 'rgba(255,240,200,0.14)');
      }
      for (let j = 54; j < 66; j++) {
        const hw = 30 * Math.sqrt(1 - ((j - 60) / 6) ** 2);
        R(Math.floor(48 - hw), j, Math.ceil(hw * 2), 1, 'rgba(255,230,170,0.22)');
      }
      for (let j = 0; j < H; j++) {
        R(0, j, 10 - Math.round(Math.sin(j / 5) * 2), 1, j % 6 < 3 ? '#7a1830' : '#5a1022');
        R(W - 10 + Math.round(Math.sin(j / 5) * 2), j, 10, 1, j % 6 < 3 ? '#7a1830' : '#5a1022');
      }
      R(0, 0, W, 5, '#5a1022');
      const r = rnd(1);
      for (let k = 0; k < 14; k++) P(14 + Math.floor(r() * 68), Math.floor(r() * 50), '#fff3c0');
    },
    // a runway: pink stripes, a lit catwalk, hearts and stars
    sets() {
      sky(['#5a1a4a', '#6a2058', '#7a2a66', '#8a3474']);
      for (let i = -H; i < W; i += 12) for (let j = 0; j < H; j++) if (((i + j) % 12 + 12) % 12 < 5) P(i + j, j, 'rgba(255,150,220,0.12)');
      for (let j = 40; j < H; j++) {
        const hw = 8 + (j - 40) * 0.9;
        R(Math.floor(48 - hw), j, Math.ceil(hw * 2), 1, j % 4 ? '#c86aa8' : '#e890c8');
      }
      for (let j = 40; j < H; j += 6) {
        const hw = 8 + (j - 40) * 0.9;
        P(Math.floor(48 - hw), j, '#fff0a0');
        P(Math.ceil(48 + hw) - 1, j, '#fff0a0');
      }
      const r = rnd(2);
      for (let k = 0; k < 10; k++) {
        const sx = Math.floor(r() * W),
          sy = Math.floor(r() * 36);
        P(sx, sy, '#ffffff');
        P(sx - 1, sy, '#ffb0e0');
        P(sx + 1, sy, '#ffb0e0');
        P(sx, sy - 1, '#ffb0e0');
        P(sx, sy + 1, '#ffb0e0');
      }
    },
    // a forge: dark stone, a hot glow from below, an anvil shape, sparks
    tools() {
      sky(['#14100e', '#1e1612', '#2a1a12', '#3a1e10', '#5a2a10', '#8a3a10']);
      for (let j = 50; j < H; j++) R(0, j, W, 1, `rgba(255,${120 + (j - 50) * 4},40,${((j - 50) / 22) * 0.5})`);
      for (let j = 0; j < H; j += 8) for (let i = (j / 8) % 2 ? 0 : 8; i < W; i += 16) R(i, j, 15, 7, 'rgba(255,255,255,0.03)');
      R(30, 52, 36, 6, '#2a2a30');
      R(26, 50, 44, 3, '#4a4a52');
      R(40, 58, 16, 8, '#2a2a30');
      R(26, 50, 44, 1, '#8a8a96');
      const r = rnd(3);
      for (let k = 0; k < 18; k++) P(Math.floor(r() * W), 20 + Math.floor(r() * 40), r() < 0.5 ? '#ffd23f' : '#ff7a1a');
    },
    // a sunset road: warm sky, a big sun, dark hills, a road with dashes
    rides() {
      sky(['#3a1a5a', '#7a2a6a', '#c8406a', '#ff7a5a', '#ffb060']);
      for (let j = 18; j < 46; j++) {
        const hw = Math.sqrt(Math.max(0, 196 - (j - 32) ** 2));
        R(Math.floor(48 - hw), j, Math.ceil(hw * 2), 1, j % 5 === 0 ? '#ff9a3a' : '#ffd23f');
      }
      for (let i = 0; i < W; i++) R(i, 40 + Math.round(Math.sin(i / 9) * 3), 1, 12, '#3a1440');
      R(0, 50, W, H - 50, '#2a1030');
      for (let j = 50; j < H; j++) {
        const hw = 6 + (j - 50) * 1.6;
        R(Math.floor(48 - hw), j, Math.ceil(hw * 2), 1, '#1a1a22');
        if (j % 6 < 3) R(47, j, 2, 1, '#ffe080');
      }
    },
    // a vault: teal steel plates, rivets, a big round door outline, gold glints
    locks() {
      sky(['#0e2a2e', '#123438', '#163e42']);
      for (let j = 0; j < H; j += 18) for (let i = 0; i < W; i += 24) {
        R(i, j, 23, 17, '#1a4a50');
        R(i, j, 23, 1, '#2a6a70');
        P(i + 2, j + 2, '#4a9aa0');
        P(i + 20, j + 2, '#4a9aa0');
        P(i + 2, j + 14, '#4a9aa0');
        P(i + 20, j + 14, '#4a9aa0');
      }
      for (let a = 0; a < 360; a += 2) {
        const t = (a * Math.PI) / 180;
        P(Math.round(48 + Math.cos(t) * 26), Math.round(36 + Math.sin(t) * 26), '#5ab8b8');
      }
      const r = rnd(4);
      for (let k = 0; k < 8; k++) P(Math.floor(r() * W), Math.floor(r() * H), '#ffd23f');
    },
    // green hills under a blue sky, clouds
    world() {
      sky(['#3a8ad8', '#5aa0e0', '#7ab8ea', '#a0d0f2']);
      for (const [cx, cy] of [[20, 14], [70, 10], [50, 24]])
        for (let j = -4; j <= 4; j++) {
          const hw = 10 * Math.sqrt(1 - (j / 5) ** 2);
          R(Math.floor(cx - hw), cy + j, Math.ceil(hw * 2), 1, j < 1 ? '#ffffff' : '#e0ecf8');
        }
      for (let i = 0; i < W; i++) {
        const h1 = 46 + Math.round(Math.sin(i / 14) * 5),
          h2 = 56 + Math.round(Math.sin(i / 10 + 2) * 4);
        R(i, h1, 1, H - h1, '#4aa84a');
        P(i, h1, '#7ad86a');
        R(i, h2, 1, H - h2, '#2a8a3a');
        P(i, h2, '#5ac85a');
      }
    },
    // a starry night with music notes
    music() {
      sky(['#0a0c2a', '#10143a', '#161c4a', '#1e2658']);
      const r = rnd(5);
      for (let k = 0; k < 30; k++) P(Math.floor(r() * W), Math.floor(r() * H), r() < 0.3 ? '#ffffff' : '#8a9ad8');
      for (const [nx, ny] of [[18, 40], [70, 20], [80, 52]]) {
        R(nx, ny, 4, 3, '#ffd23f');
        R(nx + 3, ny - 10, 1, 11, '#ffd23f');
        R(nx + 3, ny - 10, 4, 2, '#ffd23f');
      }
    },
    // a meadow: soft sky, grass, flowers, paw prints
    pets() {
      sky(['#8ad0f0', '#a8dcf4', '#c8eaf8']);
      for (let i = 0; i < W; i++) {
        const h = 40 + Math.round(Math.sin(i / 12) * 3);
        R(i, h, 1, H - h, '#6ac85a');
        P(i, h, '#9ae87a');
      }
      const r = rnd(6);
      for (let k = 0; k < 12; k++) {
        const fx = Math.floor(r() * W),
          fy = 46 + Math.floor(r() * 24);
        P(fx, fy, r() < 0.5 ? '#ffffff' : '#ffd23f');
      }
      for (const [px, py] of [[16, 56], [28, 50], [66, 60], [80, 52]]) {
        R(px, py, 3, 3, 'rgba(60,110,50,0.45)');
        for (const [dx, dy] of [[-1, -2], [1, -3], [3, -2]]) P(px + dx, py + dy, 'rgba(60,110,50,0.45)');
      }
    },
    // golden rays bursting from the middle on deep red
    packs() {
      sky(['#3a0a14', '#4a0e1a', '#5a1220']);
      for (let j = 0; j < H; j++)
        for (let i = 0; i < W; i++) {
          const a = Math.atan2(j - 30, i - 48);
          if (Math.floor(((a + Math.PI) / (Math.PI * 2)) * 16) % 2) P(i, j, 'rgba(255,200,60,0.16)');
        }
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (Math.hypot(i - 48, j - 30) < 16) P(i, j, `rgba(255,230,140,${(0.3 * (1 - Math.hypot(i - 48, j - 30) / 16)).toFixed(3)})`);
      const r = rnd(7);
      for (let k = 0; k < 10; k++) P(Math.floor(r() * W), Math.floor(r() * H), '#ffe680');
    },
    // falling autumn leaves on warm orange
    autumn() {
      sky(['#5a2a10', '#7a3a14', '#9a4a18', '#b85a1e']);
      const r = rnd(8);
      for (let k = 0; k < 16; k++) {
        const lx = Math.floor(r() * W),
          ly = Math.floor(r() * H),
          col = ['#ffb030', '#e85a1a', '#c8301a', '#ffd23f'][k % 4];
        R(lx, ly, 3, 2, col);
        P(lx + 1, ly - 1, col);
        P(lx + 3, ly + 2, '#4a2008');
      }
    },
  };
  if (!paint[part]) return (SHOP_BG[part] = null);
  paint[part]();
  return (SHOP_BG[part] = c.toDataURL());
}

// ---------- drawing the tabs, the sub-tabs and the card backgrounds ----------
renderShop = ((prev) =>
  function (...a) {
    const r = prev(...a);
    const groups = shopGroups(),
      cur = shopGroupOf(shopTab) || groups[0];
    if (cur) shopGroupLast[cur.id] = shopTab;
    // the column on the right: one tab per group
    const tabs = $('shopTabs');
    tabs.innerHTML = '';
    for (const gr of groups) {
      const b = document.createElement('button');
      b.type = 'button';
      b.role = 'tab';
      b.textContent = gr.label;
      b.setAttribute('aria-selected', !!cur && gr.id === cur.id);
      b.onclick = () => {
        const last = shopGroupLast[gr.id];
        shopTab = gr.parts.includes(last) ? last : gr.parts[0];
        renderShop();
        $('shopList').scrollTop = 0;
      };
      tabs.appendChild(b);
    }
    // the sub-tabs above the cards (a group with more than one part)
    let sub = $('shopSub');
    if (!sub) {
      sub = document.createElement('div');
      sub.id = 'shopSub';
      sub.className = 'ssub';
      sub.setAttribute('role', 'tablist');
      $('shopList').before(sub);
    }
    sub.innerHTML = '';
    sub.hidden = !cur || cur.parts.length < 2;
    if (!sub.hidden)
      for (const p of cur.parts) {
        const b = document.createElement('button');
        b.type = 'button';
        b.role = 'tab';
        b.textContent = SHOP_PART_LABEL[p] || SHOP_TABS.find((t) => t.id === p).label;
        b.setAttribute('aria-selected', p === shopTab);
        b.onclick = () => {
          shopTab = p;
          renderShop();
          $('shopList').scrollTop = 0;
        };
        sub.appendChild(b);
      }
    // the card backgrounds
    const bg = shopBg(shopTab);
    if (bg)
      $('shopList').querySelectorAll('.scard:not(.topup)').forEach((card) => {
        card.classList.add('sbg');
        card.style.backgroundImage = `linear-gradient(to bottom, rgba(20,10,40,0) 30%, rgba(20,10,40,.88) 78%), url(${bg})`;
      });
    return r;
  })(renderShop);

{
  const st = document.createElement('style');
  st.textContent = [
    '.ssub{display:flex;gap:5px;flex-wrap:wrap;margin:0 0 8px}',
    '.ssub[hidden]{display:none}',
    '.ssub button{font:8px var(--pixel);padding:7px 10px;border-radius:4px;border:2px solid var(--night);background:var(--slot);color:var(--muted);cursor:pointer}',
    ".ssub button[aria-selected='true']{background:var(--sun);color:var(--night);border-color:var(--sun)}",
    '.ssub button:hover{border-color:var(--glow)}',
    '.scard.sbg{background-size:cover;background-position:center;image-rendering:pixelated;background-color:var(--slot)}',
    '.scard.sbg .spic{filter:drop-shadow(0 3px 0 rgba(0,0,0,.45))}',
    '.scard.sbg .sprice{text-shadow:0 1px 0 #000,0 0 3px #000}',
    '@media (orientation: landscape) and (max-height: 520px){.ssub button{font-size:6px;padding:5px 7px}.ssub{margin-bottom:5px;gap:3px}}',
  ].join('\n');
  document.head.appendChild(st);
}
