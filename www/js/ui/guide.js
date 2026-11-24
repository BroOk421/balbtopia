// THE GUIDE (owner, Nov 22 2026 build za: "delete the RECIPES world; make an icon and a whole section appears with
// everything you need for fishing, the recipes, the combining for the events; the blocks and items listed; click one
// and its info shows: icon, name, info, the seeds it combines from, the time and the rarity"). Replaces the RECIPES
// world (signs.js / worlds.js: no longer built or listed; typing RECIPES opens this).
// - A book button in the top-right row (before the news scroll) opens #guide, FULL SCREEN (build zb, owner: not a
//   pop-up); the X at the top (or Esc) closes it.
// - Tabs: ITEMS (every block, background, wearable, tool and other item, A to Z, with a search box and kind chips;
//   tap one -> its card), RECIPES (every seed combine: result = seed + seed), STOVE (the event / Moon combines cooked
//   in a Stove, and the hair dyes), FISHING (rods, baits, the Bait Basket, how to fish, every fish, the Fish Tank).
// - The card: big icon, name, type, rarity (number and tier), info text, the recipe (two seeds, tappable), the tree's
//   grow time, punches to break (blocks), what it is used in (other recipes) and its Stove recipe if it has one.
// Everything is read from the game's own tables (ITEMS, SPLICE, treeTime, rarityOf, the Stove constants), so new items
// show up by themselves. Loaded right before core/gone.js (deleted items are taken out of ITEMS there, before the
// guide ever opens).
// ===== guide =====
const GUIDE = { tab: 'items', kind: 'all', q: '', sel: null };
const guideEl = document.createElement('section');
guideEl.id = 'guide';
guideEl.className = 'guide';
guideEl.hidden = true;
guideEl.setAttribute('aria-label', 'Guide');
guideEl.innerHTML =
  '<div class="ghead"><b>GUIDE</b><button type="button" class="x" id="guideX" aria-label="Close">X</button></div>' +
  '<div class="tabs gtabs" role="tablist">' +
  ['items', 'recipes', 'stove', 'fishing'].map((t) => `<button type="button" role="tab" data-t="${t}">${t.toUpperCase()}</button>`).join('') +
  '</div><div class="gbody" id="guideBody"></div>';
document.body.appendChild(guideEl);
{
  const st = document.createElement('style');
  st.textContent = `
/* (owner, build zb: "not a pop-up: the whole screen, only an X at the top to close it") it covers the whole screen, over the HUD */
#guide{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;gap:10px;padding:calc(12px + env(safe-area-inset-top)) calc(14px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(14px + env(safe-area-inset-left));background:var(--panel);color:var(--ink);font-family:var(--body)}
#guide[hidden]{display:none}
#guide .ghead{display:flex;align-items:center;justify-content:space-between}
#guide .ghead b{font:14px var(--pixel);letter-spacing:.08em}
#guide .ghead .x{width:38px;height:38px;font-size:13px}
#guide .gtabs{display:flex;gap:6px;flex-wrap:wrap;flex:none;overflow:visible}
#guide .gtabs button{flex:none;height:auto;padding:9px 12px;font:9px var(--pixel)}
#guide .gbody{flex:1;min-height:0;display:flex;gap:10px}
#guide .gcol{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;min-height:0}
#guide .gsearch{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:6px;border:2px solid var(--night);background:var(--slot);color:var(--ink);font:13px var(--body)}
#guide .gchips{display:flex;gap:5px;flex-wrap:wrap}
#guide .gchips button{font:8px var(--pixel);padding:6px 8px;border-radius:5px;border:2px solid var(--night);background:var(--slot);color:var(--muted);cursor:pointer}
#guide .gchips button.on{background:var(--glow);color:#fff}
#guide .ggrid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:5px;align-content:start;padding-right:2px}
#guide .gcell{aspect-ratio:1;border-radius:6px;border:2px solid var(--night);background:var(--slot);display:grid;place-items:center;cursor:pointer;padding:0}
#guide .gcell.on{border-color:var(--sun);box-shadow:0 0 0 2px var(--sun)}
#guide .gcell canvas,#guide .gic canvas{width:32px;height:32px;image-rendering:pixelated}
#guide .gcount{font:8px var(--pixel);color:var(--muted)}
#guide .gcard{width:min(380px,40%);flex:none;overflow:auto;border-radius:8px;border:2px solid var(--night);background:var(--plum);padding:10px;display:flex;flex-direction:column;gap:8px}
#guide .gcard .gtop{display:flex;gap:10px;align-items:center}
#guide .gcard .gbig{width:64px;height:64px;flex:none;border-radius:8px;border:2px solid var(--night);background:var(--slot);display:grid;place-items:center}
#guide .gcard .gbig canvas{width:56px;height:56px;image-rendering:pixelated}
#guide .gcard h3{margin:0;font:11px/1.5 var(--pixel)}
#guide .gcard .grar{font:8px var(--pixel)}
#guide .gcard p{margin:0;font-size:13px;line-height:1.4;color:var(--ink)}
#guide .gcard dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:5px 10px;font-size:12px}
#guide .gcard dt{color:var(--muted);font:8px/16px var(--pixel)}
#guide .gcard dd{margin:0}
#guide .gref{display:inline-flex;align-items:center;gap:4px;padding:2px 6px 2px 2px;margin:1px 0;border-radius:5px;background:var(--slot);border:1px solid var(--night);cursor:pointer;color:var(--ink);font:12px var(--body)}
#guide .gref canvas{width:20px;height:20px;image-rendering:pixelated}
#guide .glist{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:5px}
#guide .grow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 8px;border-radius:6px;background:var(--slot);border:2px solid var(--night);font-size:13px}
#guide .grow .geq{color:var(--muted);font:9px var(--pixel)}
#guide h4{margin:6px 0 2px;font:9px var(--pixel);color:var(--sun)}
#guide .gnote{font-size:12px;color:var(--muted);line-height:1.4}
#guide .gempty{color:var(--muted);font-size:13px;padding:10px}
.r-Common{color:#c8d6ea}
/* (build zc) cells / rows that were not on screen when the list appeared flip in when scrolled to */
/* (build zh: smoother on phones) the grid gives the 3D view once (no perspective() on every cell); cells are contained
   so a flip only repaints itself; on touch screens a lighter flat flip (scaleX) */
#guide .ggrid,#guide .glist{perspective:700px}
#guide .gcell,#guide .grow{contain:layout paint}
#guide .gwait{opacity:0;transform:rotateY(90deg)}
#guide .gflip{animation:gFlip .38s cubic-bezier(.2,.8,.3,1.15) both;will-change:transform,opacity}
@keyframes gFlip{0%{opacity:0;transform:rotateY(90deg)}60%{opacity:1}100%{opacity:1;transform:rotateY(0)}}
.touch #guide .gwait{transform:scaleX(0)}
.touch #guide .gflip{animation:gFlipM .26s ease-out both}
@keyframes gFlipM{0%{opacity:0;transform:scaleX(0)}100%{opacity:1;transform:scaleX(1)}}
@media (prefers-reduced-motion: reduce){#guide .gwait{opacity:1;transform:none}#guide .gflip{animation:none}}.r-Uncommon{color:#7ee08a}.r-Rare{color:#6ab4ff}.r-Epic{color:#c48cff}.r-Legendary{color:#ffc84a}
@media (max-width:640px){#guide .gbody{flex-direction:column}#guide .gcard{width:auto;max-height:46%}}
`;
  document.head.appendChild(st);
}
// ---------- helpers ----------
const gEsc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const gName = (id) => (ITEMS[id] ? ITEMS[id].name : id);
// a copy of the item's icon (an icon canvas is shared, so each place gets its own copy)
function gIcon(id, size = 32) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  try {
    const src = iconCanvas(id),
      x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, size, size);
  } catch (e) {}
  return c;
}
const gRef = (id, qty) => `<button type="button" class="gref" data-id="${gEsc(id)}"><i data-ic="${gEsc(id)}"></i>${qty ? qty + ' ' : ''}${gEsc(gName(id))}</button>`;
// put the icons into every <i data-ic> of an element
function gFillIcons(el, size = 20) {
  for (const i of el.querySelectorAll('i[data-ic]')) i.replaceWith(gIcon(i.dataset.ic, size));
}
const GKIND = [
  ['all', 'ALL'],
  ['block', 'BLOCKS'],
  ['background', 'BACKGROUNDS'],
  ['clothing', 'WEAR'],
  ['tool', 'TOOLS'],
  ['other', 'OTHER'],
];
const gKindOf = (it) => (['block', 'background', 'clothing', 'tool'].includes(it.kind) ? it.kind : 'other');
function gTypeText(id) {
  const it = ITEMS[id];
  if (!it) return '';
  if (it.kind === 'clothing') return 'Wearable · ' + (typeof SLOT_NAME !== 'undefined' && SLOT_NAME[it.slot] ? SLOT_NAME[it.slot] : it.slot || '');
  return { block: 'Block', background: 'Background', tool: 'Tool', fish: 'Fish', bait: 'Bait', seed: 'Seed' }[it.kind] || 'Item';
}
// every item the guide lists: no seeds, nothing retired / deleted
function gItems() {
  const gone = typeof isGone === 'function' ? isGone : () => false;
  return Object.keys(ITEMS)
    .filter((id) => {
      const it = ITEMS[id];
      return it && it.name && it.kind !== 'seed' && !it.retired && !gone(id) && !id.endsWith('_seed');
    })
    .sort((a, b) => gName(a).localeCompare(gName(b), 'en', { sensitivity: 'base' }));
}
// the seed combines that make `id` / that use `id`
const gRecipesOf = (id) => Object.entries(SPLICE).filter(([, r]) => r === id).map(([k]) => k.split('+'));
const gUsedIn = (id) => Object.entries(SPLICE).filter(([k]) => k.split('+').includes(id)).map(([k, r]) => [k.split('+'), r]);
function gRarity(id) {
  const n = typeof rarityOf === 'function' ? rarityOf(id) : null,
    tier = n ? rarityTier(n) : (ITEMS[id] && ITEMS[id].rarity) || '';
  return { n, tier };
}

// ---------- the Stove combines (read from the files that cook them) ----------
function gStove() {
  const out = []; // { make, n (how many), need: [[id, qty]], note }
  const add = (make, n, need, note) => ITEMS[make] && need.every(([id]) => ITEMS[id]) && out.push({ make, n, need, note });
  if (typeof CS_NEED !== 'undefined') add(CS_ID, CS_NEED.out, [['portcullis', CS_NEED.portcullis], ['blue_crystal', CS_NEED.blue_crystal], ['green_crystal', CS_NEED.green_crystal]]);
  if (typeof RS_NEED !== 'undefined') add(RS_ID, RS_NEED.out, [['portcullis', RS_NEED.portcullis], ['red_crystal', RS_NEED.red_crystal]]);
  if (typeof CG_NEED !== 'undefined') add(CG_ID, CG_NEED.out, [['portcullis', CG_NEED.portcullis], ['white_crystal', CG_NEED.white_crystal]]);
  if (typeof PRISM_NEED !== 'undefined') add(PRISM_ID, PRISM_NEED.out, [['moon_rock', PRISM_NEED.moon_rock], ...PRISM_COLS.map((c) => [c + '_crystal', PRISM_NEED.each])]);
  if (typeof MC_BLOCK_NEED !== 'undefined' && typeof MC_NAME !== 'undefined')
    for (const c of Object.keys(MC_NAME)) {
      add(mcBlockId(c), MC_BLOCK_NEED.out, [[c + '_crystal', MC_BLOCK_NEED.crystal], ['moon_rock', MC_BLOCK_NEED.moon_rock]]);
      add(mcWallId(c), MC_WALL_NEED.out, [[c + '_crystal', MC_WALL_NEED.crystal], ['moon_rock_wall', MC_WALL_NEED.moon_rock_wall]]);
    }
  if (typeof LEGEND_NEED !== 'undefined')
    add('legendary_stone', 1, Object.entries(LEGEND_NEED), 'Only a ' + Math.round(LEGEND_CHANCE * 100) + '% chance: most tries make nothing (the stuff is used up).');
  if (typeof FUEL_JAR_OIL !== 'undefined') add('fuel_jar', 1, [['crude_oil', FUEL_JAR_OIL], ['glass_jar', 1]]);
  if (typeof STOVE_RECIPES !== 'undefined')
    for (const [k, r] of Object.entries(STOVE_RECIPES)) {
      const [a, b] = k.split('+');
      add(r, 1, [[a, 1], [b, 1]], 'Hair dye');
    }
  return out;
}

// ---------- flip-in (owner, build zc: "animate the ones that weren't there when it first appeared: they appear when you
// scroll, better with a flip") the items (or rows) already on screen when a list is drawn just show; the others wait
// hidden and flip in (rotateY 90deg -> 0, a little overshoot) as they scroll into view, a few at a time staggered;
// (build zg) every time they come back into view, up or down.
let gObs = null;
const GFLIP_MAX = 18; // at most this many flip at once (a fast scroll just shows the rest)
function gFlipIn(box, sel) {
  if (gObs) gObs.disconnect();
  const items = [...box.querySelectorAll(sel)];
  if (!items.length || typeof IntersectionObserver === 'undefined') {
    for (const el of items) gLazyIcon(el);
    return;
  }
  for (const el of items) el.classList.add('gwait');
  let first = true;
  // (owner, build zg: "the ones above that were passed: scrolling back up they must flip in again") items are watched
  // all the time: leaving the view hides them again (.gwait), coming back in (either way) flips them in again.
  // (build zh: smoother) class changes are batched and the flips started together in the next frame (no reflow per
  // item), only GFLIP_MAX animate at once, and an item's icon is only drawn the first time it comes into view.
  gObs = new IntersectionObserver(
    (ents) => {
      const show = [];
      for (const e of ents) {
        const el = e.target;
        if (!e.isIntersecting) {
          if (!first) {
            el.classList.remove('gflip');
            el.classList.add('gwait');
          }
          continue;
        }
        gLazyIcon(el);
        if (first) {
          el.classList.remove('gwait'); // (on screen from the start: no animation)
          continue;
        }
        show.push(el);
      }
      first = false;
      if (!show.length) return;
      for (const el of show) el.classList.remove('gflip');
      requestAnimationFrame(() =>
        show.forEach((el, k) => {
          el.classList.remove('gwait');
          if (k >= GFLIP_MAX) return; // (too many at once: just shown)
          el.style.animationDelay = Math.min(k, 10) * 24 + 'ms';
          el.classList.add('gflip');
        }),
      );
    },
    { root: box, rootMargin: '0px 0px -8px 0px' },
  );
  for (const el of items) gObs.observe(el);
}
// (build zh) the icons not drawn yet are made a few at a time while the phone is idle, so scrolling meets them ready
let gIdleJob = 0;
function gIconsInIdle(box) {
  const job = ++gIdleJob,
    idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 40));
  const run = (dl) => {
    if (job !== gIdleJob || guideEl.hidden) return;
    const left = box.querySelectorAll('[data-lazy]');
    let k = 0;
    for (const el of left) {
      if (dl.timeRemaining() < 2 && k > 0) break;
      gLazyIcon(el);
      if (++k >= 12) break;
    }
    if (left.length > k) idle(run);
  };
  idle(run);
}
// a grid cell's icon, drawn the first time it is needed (the rows already have theirs)
function gLazyIcon(el) {
  if (!el.dataset.lazy) return;
  el.appendChild(gIcon(el.dataset.lazy));
  delete el.dataset.lazy;
}
// ---------- the card ----------
function gCard(id) {
  const it = ITEMS[id];
  if (!it) return '<div class="gempty">Tap an item to see its info.</div>';
  const { n, tier } = gRarity(id),
    recs = gRecipesOf(id),
    used = gUsedIn(id),
    stove = gStove().filter((s) => s.make === id),
    grow = TREE_TIME[id] !== undefined && typeof treeTime === 'function' ? fmtLeft(treeTime(id)) : null,
    b = it.kind === 'block' && BLOCK[it.block];
  let dl = `<dt>Type</dt><dd>${gEsc(gTypeText(id))}</dd>`;
  dl += `<dt>Rarity</dt><dd class="r-${gEsc(tier)}">${n ? n + ' · ' : ''}${gEsc(tier || '–')}</dd>`;
  if (recs.length) dl += `<dt>Seeds</dt><dd>${recs.map(([a, c]) => gRef(a) + ' + ' + gRef(c)).join('<br>')}</dd>`;
  if (grow) dl += `<dt>Grows in</dt><dd>${grow}</dd>`;
  if (b && b.hits !== Infinity) dl += `<dt>Punches</dt><dd>${b.hits + (typeof rarityHits === 'function' ? rarityHits(b.id) : 0)}</dd>`;
  if (stove.length) dl += `<dt>Stove</dt><dd>${stove.map((s) => s.need.map(([x, q]) => gRef(x, q)).join(' + ') + ' = ' + s.n + (s.note ? '<br><span class="gnote">' + gEsc(s.note) + '</span>' : '')).join('<br>')}</dd>`;
  if (used.length) dl += `<dt>Used in</dt><dd>${used.slice(0, 24).map(([[a, c], r]) => gRef(r) + ' <span class="gnote">(' + gEsc(gName(a === id ? c : a)) + ')</span>').join('<br>')}${used.length > 24 ? '<br>…' : ''}</dd>`;
  if (!recs.length && !stove.length && SHOP.some((s) => s.id === id)) dl += `<dt>Get it</dt><dd>In the Shop</dd>`;
  return `<div class="gtop"><div class="gbig"><i data-big="${gEsc(id)}"></i></div><div><h3>${gEsc(it.name)}</h3><div class="grar r-${gEsc(tier)}">${gEsc(tier)}</div></div></div>
    <p>${gEsc(it.desc || '')}</p><dl>${dl}</dl>`;
}
function gShowCard(box, id) {
  box.innerHTML = gCard(id);
  const big = box.querySelector('i[data-big]');
  if (big) big.replaceWith(gIcon(big.dataset.big, 64));
  gFillIcons(box);
}

// ---------- the tabs ----------
// (Nov 24 2026: was gRender, the same name as the chat's (globalchat.js): this one, loaded later, replaced it and the
// chat's list never drew)
function guideRender() {
  for (const b of guideEl.querySelectorAll('.gtabs button')) b.setAttribute('aria-selected', b.dataset.t === GUIDE.tab ? 'true' : 'false');
  const body = $('guideBody');
  const t = GUIDE.tab;
  if (t === 'items') {
    body.innerHTML = `<div class="gcol"><input class="gsearch" id="guideQ" type="search" placeholder="Search blocks and items" value="${gEsc(GUIDE.q)}">
      <div class="gchips">${GKIND.map(([k, l]) => `<button type="button" data-k="${k}" class="${GUIDE.kind === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="gcount" id="guideN"></div><div class="ggrid" id="guideGrid"></div></div><div class="gcard" id="guideCard"></div>`;
    const grid = $('guideGrid'),
      card = $('guideCard'),
      draw = () => {
        const q = GUIDE.q.trim().toLowerCase(),
          list = gItems().filter((id) => (GUIDE.kind === 'all' || gKindOf(ITEMS[id]) === GUIDE.kind) && (!q || gName(id).toLowerCase().includes(q)));
        $('guideN').textContent = list.length + ' items';
        grid.innerHTML = '';
        const frag = document.createDocumentFragment();
        for (const id of list) {
          const c = document.createElement('button');
          c.type = 'button';
          c.className = 'gcell' + (GUIDE.sel === id ? ' on' : '');
          c.dataset.id = id;
          c.title = gName(id);
          c.dataset.lazy = id; // (build zh: its icon is drawn when it first comes into view, gLazyIcon)
          frag.appendChild(c);
        }
        grid.appendChild(frag);
        gFlipIn(grid, '.gcell');
        gIconsInIdle(grid);
      };
    draw();
    gShowCard(card, GUIDE.sel);
    $('guideQ').oninput = (e) => {
      GUIDE.q = e.target.value;
      draw();
    };
    body.querySelector('.gchips').onclick = (e) => {
      const k = e.target.closest('button');
      if (!k) return;
      GUIDE.kind = k.dataset.k;
      for (const x of body.querySelectorAll('.gchips button')) x.classList.toggle('on', x === k);
      draw();
    };
    grid.onclick = (e) => {
      const c = e.target.closest('.gcell');
      if (!c) return;
      GUIDE.sel = c.dataset.id;
      for (const x of grid.querySelectorAll('.gcell.on')) x.classList.remove('on');
      c.classList.add('on');
      gShowCard(card, GUIDE.sel);
    };
  } else if (t === 'recipes') {
    const rows = Object.entries(SPLICE)
      .filter(([k, r]) => ITEMS[r] && k.split('+').every((s) => ITEMS[s]))
      .sort((a, b) => gName(a[1]).localeCompare(gName(b[1]), 'en', { sensitivity: 'base' }));
    body.innerHTML = `<div class="gcol"><input class="gsearch" id="guideQ" type="search" placeholder="Search recipes" value="${gEsc(GUIDE.q)}">
      <div class="gnote">Plant one seed, then plant the second seed on the young tree before it is ripe: the two make a new tree.</div>
      <div class="gcount" id="guideN"></div><div class="glist" id="guideList"></div></div><div class="gcard" id="guideCard"></div>`;
    const draw = () => {
      const q = GUIDE.q.trim().toLowerCase(),
        list = rows.filter(([k, r]) => !q || [r, ...k.split('+')].some((id) => gName(id).toLowerCase().includes(q)));
      $('guideN').textContent = list.length + ' recipes';
      $('guideList').innerHTML = list
        .slice(0, 400)
        .map(([k, r]) => {
          const [a, b] = k.split('+');
          return `<div class="grow">${gRef(r)}<span class="geq">=</span>${gRef(a)}<span class="geq">+</span>${gRef(b)}</div>`;
        })
        .join('');
      gFillIcons($('guideList'));
      gFlipIn($('guideList'), '.grow');
    };
    draw();
    gShowCard($('guideCard'), GUIDE.sel);
    $('guideQ').oninput = (e) => {
      GUIDE.q = e.target.value;
      draw();
    };
  } else if (t === 'stove') {
    const list = gStove();
    body.innerHTML = `<div class="gcol"><div class="gnote">Put everything inside a Stove (drop the items on it) and switch it on: what the recipe needs is used up and the result pops out. These are the event and Moon combines.</div>
      <div class="glist">${
        list.length
          ? list
              .map((s) => `<div class="grow">${gRef(s.make, s.n > 1 ? s.n : 0)}<span class="geq">=</span>${s.need.map(([x, q]) => gRef(x, q)).join('<span class="geq">+</span>')}${s.note ? `<span class="gnote">${gEsc(s.note)}</span>` : ''}</div>`)
              .join('')
          : '<div class="gempty">No Stove recipes right now.</div>'
      }</div></div><div class="gcard" id="guideCard"></div>`;
    gFillIcons(body);
    gFlipIn(body.querySelector('.glist'), '.grow');
    gShowCard($('guideCard'), GUIDE.sel);
  } else if (t === 'fishing') {
    const rods = typeof ROD_INFO !== 'undefined' ? Object.keys(ROD_INFO).filter((id) => ITEMS[id]) : [],
      baits = typeof BAIT_INFO !== 'undefined' ? Object.keys(BAIT_INFO).filter((id) => ITEMS[id]) : [],
      fish = typeof FISH_LIST !== 'undefined' ? FISH_LIST : [],
      // how to get it: its seeds, else the Shop / the Fish Tank Set (the Fishing Rod), else not out yet (the seasonal rods)
      rec = (id) =>
        gRecipesOf(id).map(([a, b]) => gRef(a) + ' + ' + gRef(b)).join(' or ') ||
        (typeof FISH_SET !== 'undefined' && FISH_SET.get.some(([x]) => x === id) && ITEMS[FISH_SET.id] ? 'In the ' + gRef(FISH_SET.id) + ' (Shop)' : '') ||
        (SHOP.some((s) => s.id === id) ? 'In the Shop' : '<span class="gnote">Not out yet (a seasonal event)</span>');
    body.innerHTML = `<div class="gcol"><div class="glist">
      <h4>HOW TO FISH</h4>
      <div class="gnote">1. Get a rod and put it in your Hand slot (or hold it).<br>2. Tap the rod in your bag and pick a bait (Worm, Snail or Shrimp). One bait is used for every fish you catch.<br>3. With an empty hand, tap a water tile near you: the float flies there and bobs.<br>4. When it jerks under and "!" shows, tap anywhere quickly: the fish is yours. Too early reels it in; too late and it gets away.</div>
      <h4>RODS</h4>${rods.map((id) => `<div class="grow">${gRef(id)}<span class="geq">=</span>${rec(id) || '–'}</div>`).join('')}
      <div class="gnote">Better rods: big fish more often and quicker bites.</div>
      <h4>BAIT</h4>${baits.map((id) => `<div class="grow">${gRef(id)}</div>`).join('')}
      ${ITEMS.bait_basket ? `<div class="grow">${gRef('bait_basket')}<span class="geq">=</span>${rec('bait_basket')}</div><div class="gnote">A Bait Basket fills once a day: tap it to take the bait inside. Better bait = bigger fish more often.</div>` : ''}
      <h4>FISH</h4>${fish
        .map(([sp, name, tier]) => {
          const id = ITEMS[sp] ? sp : ITEMS[sp + '_m'] ? sp + '_m' : null,
            tr = typeof FISH_SIZES !== 'undefined' ? FISH_SIZES[tier] : '';
          return `<div class="grow">${id ? gRef(id) : gEsc(name)}<span class="r-${gEsc(tr)}">${gEsc(tr)}</span><span class="gnote">Small, Medium and Large</span></div>`;
        })
        .join('')}
      ${ITEMS.aquarium ? `<h4>FISH TANK</h4><div class="grow">${gRef('aquarium')}<span class="geq">=</span>${rec('aquarium')}</div><div class="gnote">Hold a fish and tap the tank to put it in. Tanks next to each other make one big tank.</div>` : ''}
      </div></div><div class="gcard" id="guideCard"></div>`;
    gFillIcons(body);
    gFlipIn(body.querySelector('.glist'), '.grow');
    gShowCard($('guideCard'), GUIDE.sel);
  }
}
// any item button anywhere in the guide shows that item's card
guideEl.addEventListener('click', (e) => {
  const r = e.target.closest('.gref');
  if (!r || !ITEMS[r.dataset.id]) return;
  GUIDE.sel = r.dataset.id;
  const card = $('guideCard');
  if (card) gShowCard(card, GUIDE.sel);
});
guideEl.querySelector('.gtabs').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b || b.dataset.t === GUIDE.tab) return;
  GUIDE.tab = b.dataset.t;
  GUIDE.q = '';
  guideRender();
};
function openGuide(tab) {
  if (tab) GUIDE.tab = tab;
  guideEl.hidden = false;
  guideRender();
}
function closeGuide() {
  if (gObs) gObs.disconnect();
  guideEl.hidden = true;
}
$('guideX').onclick = closeGuide;
addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && !guideEl.hidden) closeGuide();
});
// ---------- the book button (top right, before the news scroll) ----------
const guideBtn = document.createElement('button');
guideBtn.id = 'guideBtn';
guideBtn.className = 'newsbtn guidebtn';
guideBtn.type = 'button';
guideBtn.setAttribute('aria-label', 'Guide');
guideBtn.innerHTML =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5z" fill="#fff"/><path d="M13 4h5.5c.8 0 1.5.7 1.5 1.5v12c0 .8-.7 1.5-1.5 1.5H13z" fill="#dce9ff"/><path d="M6.5 7.5h3M6.5 10h3M15 7.5h3M15 10h3M15 12.5h2" stroke="#1e3560" stroke-width="1.3" stroke-linecap="round"/></svg>';
guideBtn.onclick = () => (guideEl.hidden ? openGuide() : closeGuide());
{
  const anchor = document.getElementById('newsBtn') || document.getElementById('burger');
  if (anchor && anchor.parentElement) anchor.parentElement.insertBefore(guideBtn, anchor);
}
{
  const st = document.createElement('style');
  st.textContent = '.guidebtn{position:relative;flex:none;width:38px;height:38px;box-sizing:border-box;display:grid;place-content:center;padding:0;border-radius:6px;cursor:pointer}body.landing #guideBtn{display:none}';
  document.head.appendChild(st);
}
// ---------- the old RECIPES world: typing its name opens the guide instead ----------
enterWorld = ((prev) =>
  async function (name, ...a) {
    if (String(name || '').toUpperCase() === 'RECIPES') {
      openGuide('recipes');
      return false;
    }
    return prev(name, ...a);
  })(enterWorld);
