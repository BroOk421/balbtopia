// Styled hair (owner, Oct 31 2026: "sa buhok gawa ka pattern, yung mga recent na buhok lagyan mo lang ng style"):
// new Shop hairs made from the picture hairs (the owner's hairstyles in wear.js), recoloured with a style: ombre (the
// tips fade into a colour), streaks (coloured strands), full colour, rainbow, sunset, galaxy (with sparkles). The
// recolour keeps the picture's own light and shade: every hair pixel's brightness (spread between the picture's dark
// and light hair) picks a colour on the style's ramp [dark, mid, light]; outline pixels (very dark) stay. Pictures
// are made once their source has loaded (IMG getters), the bag icons the same way from the source icons.
// Loaded after clothes.js; prices in shop.js and schema.sql. Names / prices picked by Claude.
// ===== styled hair =====
const HS_RAMPS = {
  pink: ['#a0285a', '#ff6aa8', '#ffc8e0'],
  blue: ['#1a3a9a', '#3a8aff', '#a8dcff'],
  mint: ['#16705a', '#3ad8a8', '#c0ffe8'],
  frost: ['#8890a8', '#d8e0f0', '#ffffff'],
  gold: ['#9a6a08', '#ffc830', '#fff0a0'],
  red: ['#7a0a14', '#e8243a', '#ff9a9a'],
  lavender: ['#5a3a9a', '#a888e8', '#e8dcff'],
  purple: ['#3a1068', '#8a3ad8', '#d8a8ff'],
  silver: ['#5a5e6a', '#b8bcc8', '#f4f6fa'],
  fire: ['#8a1a08', '#ff6a1a', '#ffe040'],
  galaxy: ['#120c3a', '#3a2a9a', '#8a6aff'],
};
// styles: how much of the new colour each pixel takes (0 = the hair's own colour, 1 = the ramp), and which ramp
const HS_STYLES = {
  ombre: (t, x, y, o) => ({ s: Math.max(0, Math.min(1, (t - 0.38) / 0.4)), ramp: o.ramp }),
  // streaks follow the strands: thin, nearly vertical, at random places (the same on every device)
  streak: (t, x, y, o) => {
    const col = Math.floor((x + y * 0.12) / 3),
      h = Math.abs(Math.sin(col * 12.9898) * 43758.5453) % 1;
    return { s: h < 0.24 ? 1 : 0, ramp: o.ramp };
  },
  full: (t, x, y, o) => ({ s: 1, ramp: o.ramp }),
  // two colours down the hair: the first at the roots, the second at the tips
  fade: (t, x, y, o) => ({ s: 1, ramp: t < 0.5 ? o.ramp : o.ramp2, mix: [o.ramp, o.ramp2, Math.max(0, Math.min(1, (t - 0.3) / 0.45))] }),
  rainbow: (t) => {
    const R = ['red', 'fire', 'gold', 'mint', 'blue', 'purple'],
      v = Math.max(0, Math.min(R.length - 1.001, t * R.length * 1.1 - 0.4));
    return { s: 1, mix: [R[Math.floor(v)], R[Math.min(R.length - 1, Math.floor(v) + 1)], v % 1] };
  },
};
const HAIR_STYLED = [
  // [new id, name, from (hair id), style, ramp, ramp2, extra]
  ['fire_quiff', 'Fire Quiff', 'brown_hair', 'fade', 'red', 'fire'],
  ['frosted_quiff', 'Frosted Quiff', 'brown_hair', 'ombre', 'frost'],
  ['pink_ombre_long_hair', 'Pink Ombre Long Hair', 'blonde_bombshell', 'ombre', 'pink'],
  ['rainbow_long_hair', 'Rainbow Long Hair', 'blonde_bombshell', 'rainbow'],
  ['blue_streak_spikes', 'Blue Streak Spikes', 'spikey_hair', 'streak', 'blue'],
  ['galaxy_spikes', 'Galaxy Spikes', 'spikey_hair', 'full', 'galaxy', null, { sparkle: true }],
  ['sunset_ponytail', 'Sunset Ponytail', 'messy_auburn_tresses', 'fade', 'fire', 'purple'],
  ['mint_ponytail', 'Mint Ponytail', 'messy_auburn_tresses', 'full', 'mint'],
  ['lavender_swept_hair', 'Lavender Swept Hair', 'grey_hair_bun', 'full', 'lavender'],
  ['blue_streak_swept_hair', 'Blue Streak Swept Hair', 'grey_hair_bun', 'streak', 'blue'],
  ['cotton_candy_bun', 'Cotton Candy Bun', 'hot_pink_highlights', 'fade', 'pink', 'blue'],
  ['galaxy_bun', 'Galaxy Bun', 'hot_pink_highlights', 'full', 'galaxy', null, { sparkle: true }],
  ['blue_tip_bob', 'Blue Tip Bob', 'purple_mohawk', 'ombre', 'blue'],
  ['red_streak_bob', 'Red Streak Bob', 'purple_mohawk', 'streak', 'red'],
  ['gold_tip_top_bun', 'Gold Tip Top Bun', 'pigtails', 'ombre', 'gold'],
  ['mint_top_bun', 'Mint Top Bun', 'pigtails', 'full', 'mint'],
  ['purple_ombre_long_hair', 'Purple Ombre Long Hair', 'long_black_hair', 'ombre', 'purple'],
  ['silver_streak_long_hair', 'Silver Streak Long Hair', 'long_black_hair', 'streak', 'silver'],
];
const HS_PRICE = { ombre: 10000, streak: 8000, full: 8000, fade: 12000, rainbow: 15000 };
const hsRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function hsRamp(name, n) {
  const r = HS_RAMPS[name].map(hsRgb),
    u = Math.max(0, Math.min(1, n)) * 2,
    a = r[Math.min(1, Math.floor(u))],
    b = r[Math.min(2, Math.floor(u) + 1)],
    k = u - Math.floor(u);
  return a.map((v, i) => v + (b[i] - v) * (u >= 2 ? 1 : k));
}
// a recoloured copy of a hair picture (strip or icon)
function hsRecolor(src, def) {
  const W = src.width,
    H = src.height,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  let d;
  try {
    d = x.getImageData(0, 0, W, H);
  } catch (e) {
    return src; // (page opened as a file: pixels can't be read)
  }
  const p = d.data,
    Ls = [];
  let y0 = H,
    y1 = 0;
  for (let i = 0; i < p.length; i += 4)
    if (p[i + 3] > 100) {
      const L = (p[i] + p[i + 1] + p[i + 2]) / 3;
      if (L > 28) Ls.push(L);
      const y = (i / 4 / W) | 0;
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  Ls.sort((a, b) => a - b);
  const lo = Ls[Math.floor(Ls.length * 0.05)] || 0,
    hi = Ls[Math.floor(Ls.length * 0.95)] || 255,
    style = HS_STYLES[def.style];
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] <= 100) continue;
    const L = (p[i] + p[i + 1] + p[i + 2]) / 3;
    if (L <= 28) continue; // the outline stays
    const px = (i / 4) % W,
      py = (i / 4 / W) | 0,
      t = (py - y0) / Math.max(1, y1 - y0),
      n = (L - lo) / Math.max(1, hi - lo),
      st = style(t, px, py, def);
    if (!st.s) continue;
    const col = st.mix ? hsRamp(st.mix[0], n).map((v, k) => v + (hsRamp(st.mix[1], n)[k] - v) * st.mix[2]) : hsRamp(st.ramp, n);
    for (let k = 0; k < 3; k++) p[i + k] = Math.round(p[i + k] + (col[k] - p[i + k]) * st.s);
  }
  // galaxy: little white stars here and there on the hair
  if (def.sparkle)
    for (let i = 0; i < p.length; i += 4) {
      const px = (i / 4) % W,
        py = (i / 4 / W) | 0;
      if (p[i + 3] > 100 && (p[i] + p[i + 1] + p[i + 2]) / 3 > 28 && (px * 31 + py * 17) % 97 === 0) p[i] = p[i + 1] = p[i + 2] = 255;
    }
  x.putImageData(d, 0, 0);
  return c;
}
// IMG getters: the styled picture is made the first time it is asked for after its source has loaded
function hsLazyImg(key, srcKey, def) {
  let made = null;
  Object.defineProperty(IMG, key, {
    configurable: true,
    enumerable: false,
    get() {
      if (made) return made;
      const src = IMG[srcKey];
      if (!src || !src.width) return undefined;
      return (made = hsRecolor(src, def));
    },
  });
}
for (const [id, name, from, style, ramp, ramp2, extra] of HAIR_STYLED) {
  const base = WEAR_BY_ID[from];
  if (!base || !base.strip) continue;
  const def = { style, ramp, ramp2, ...(extra || {}) };
  hsLazyImg('hs_' + id, base.strip.img, def);
  if (base.iconImg) hsLazyImg('hs_' + id + '_icon', base.iconImg, def);
  const w = {
    ...base,
    id,
    name,
    rarity: style === 'rainbow' || (extra && extra.sparkle) ? 'Epic' : 'Rare',
    shop: true,
    strip: { ...base.strip, img: 'hs_' + id },
    iconImg: base.iconImg ? 'hs_' + id + '_icon' : undefined,
    col: HS_RAMPS[ramp || 'pink'][1],
    desc: name + ': ' + base.desc.replace(/\.$/, '').replace(/^\w/, (c) => c.toLowerCase()) + ', ' + (style === 'rainbow' ? 'in every colour of the rainbow' : style === 'streak' ? 'with ' + ramp + ' streaks' : style === 'ombre' ? 'fading into ' + ramp + ' tips' : style === 'fade' ? 'fading from ' + ramp + ' to ' + ramp2 : 'dyed ' + ramp) + (extra && extra.sparkle ? ', with little stars' : '') + '.',
  };
  WEAR.push(w);
  WEAR_BY_ID[id] = w;
  ITEMS[id] = { name, kind: 'clothing', slot: 'hair', desc: w.desc + ' Wear it from your bag.', rarity: w.rarity };
}
