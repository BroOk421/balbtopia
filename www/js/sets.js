// Outfit sets (owner, Oct 21 2026). Loaded after pets.js. Shop tab SETS: each set costs SET_GOLD and puts all its
// pieces in your bag (the set itself is never an item you hold). Every piece of these sets is no longer spliced:
// their recipes were taken out of data/farming.json and the SPLICE list (config.js), and their seeds are retired
// (old seeds and trees still grow). Server: shop_prices has a 'set_...' row per set (schema.sql, not tracked).
// One hairstyle per set (no two sets share a hair).
// ===== sets =====
const SET_GOLD = 20000;
const OUTFIT_SETS = [
  { id: 'set_gentleman', name: 'Gentleman Set', skin: 'peach', eq: { hair: 'brown_hair', shirt: 'tuxedo', pants: 'black_pants', feet: 'patent_leather_shoes' } },
  { id: 'set_sporty', name: 'Sporty Set', skin: 'honey', eq: { hair: 'red_hair', shirt: 'referee_shirt', pants: 'cargo_shorts', feet: 'stinky_socks' } },
  { id: 'set_biker', name: 'Biker Set', skin: 'peach', eq: { hair: 'long_black_hair', face: 'shades', shirt: 'red_coat', pants: 'black_pants', feet: 'boots' } },
  { id: 'set_lolo', name: 'Lolo Set', skin: 'porcelain', eq: { hair: 'grey_hair_bun', face: 'big_glasses', shirt: 'green_shirt', pants: 'cargo_shorts', feet: 'brown_shoes' } },
  { id: 'set_chill_guy', name: 'Chill Guy Set', skin: 'brown', eq: { hair: 'spikey_hair', hat: 'baseball_cap', shirt: 'green_shirt', pants: 'jeans', feet: 'brown_shoes' } },
  { id: 'set_sunshine', name: 'Sunshine Set', skin: 'tan', eq: { hair: 'blonde_bombshell', shirt: 'tie_dyed_shirt', pants: 'green_skirt', feet: 'brown_shoes' } },
  { id: 'set_cozy_night', name: 'Cozy Night Set', skin: 'honey', eq: { hair: 'pigtails', shirt: 'checkered_pajamas', pants: 'sexy_boxers', feet: 'stinky_socks' } },
  { id: 'set_autumn_red', name: 'Autumn Red Set', skin: 'porcelain', eq: { hair: 'messy_auburn_tresses', shirt: 'tan_shirt', pants: 'jeans', feet: 'boots' } },
  { id: 'set_pastel_pop', name: 'Pastel Pop Set', skin: 'deep', eq: { hair: 'unicorn_hair', shirt: 'plain_white_tee', pants: 'clown_pants', feet: 'brown_shoes' } },
  { id: 'set_lady_green', name: 'Lady Green Set', skin: 'porcelain', eq: { hair: 'purple_mohawk', shirt: 'green_blouse', pants: 'green_skirt', feet: 'patent_leather_shoes' } },
  { id: 'set_pink_rock', name: 'Pink Rock Set', skin: 'porcelain', eq: { hair: 'hot_pink_highlights', face: 'shades', shirt: 'tie_dyed_shirt', pants: 'black_pants', feet: 'boots' } },
];
const SET_BY_ID = {};
const setPieces = (id) => Object.values(SET_BY_ID[id].eq);
SHOP_TABS.splice(SHOP_TABS.findIndex((t) => t.id === 'pets'), 0, { id: 'sets', label: 'SETS' });
for (const st of OUTFIT_SETS) {
  SET_BY_ID[st.id] = st;
  const names = Object.values(st.eq).map((p) => ITEMS[p].name);
  ITEMS[st.id] = { name: st.name, kind: 'set', desc: 'You get: ' + names.join(', ') + '. They go in your bag.', rarity: 'Rare', retired: true };
  SHOP_ICON[st.id] = () => setIcon(st.id);
  SHOP.push({ id: st.id, gold: SET_GOLD, cat: 'sets' });
  // the pieces are Shop-only now: no recipes, seeds retired
  for (const p of Object.values(st.eq)) {
    if (ITEMS[p + '_seed']) ITEMS[p + '_seed'].retired = true;
    // no "X = A + B" recipe text on a set piece any more (owner, Oct 22 2026: set wear is out of the recipes)
    ITEMS[p].desc = ITEMS[p].desc.replace(/\s*[^.]*=[^.]*\+[^.]*\.\s*$/, ' Wear it from your bag.').trim();
  }
  // a set piece is never the result of a splice, even if an old recipe list still has one
  for (const k in SPLICE) if (Object.values(st.eq).includes(SPLICE[k])) delete SPLICE[k];
}
// the Shop picture: the character wearing the set. charPortrait (ui.js) gives a data: URL, so the picture is
// loaded first; until then the card shows the pieces 2 x 2, and the Shop is drawn again once it is ready.
const SET_PICS = {}; // set id -> loaded <img> of the character wearing it
function setPortrait(id, done) {
  if (SET_PICS[id]) return SET_PICS[id].complete ? SET_PICS[id] : null;
  const st = SET_BY_ID[id];
  if (!IMG['skin_' + st.skin + '_open']) return null;
  let url = null;
  try {
    url = charPortrait({ skin: st.skin, equipped: st.eq });
  } catch (e) {
    return null;
  }
  if (typeof url !== 'string') return null;
  const im = new Image();
  im.onload = () => {
    delete ICON[id]; // the card picture is made again with the character
    if (done) done();
  };
  im.src = url;
  SET_PICS[id] = im;
  return null;
}
function setIcon(id) {
  const st = SET_BY_ID[id],
    c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d'),
    pic = setPortrait(id, () => !$('shop').hidden && renderShop());
  if (pic) {
    const s = Math.min(32 / pic.width, 32 / pic.height);
    x.imageSmoothingEnabled = true;
    x.drawImage(pic, (32 - pic.width * s) / 2, (32 - pic.height * s) / 2, pic.width * s, pic.height * s);
    return c;
  }
  x.imageSmoothingEnabled = false;
  ['hair', 'shirt', 'pants', 'feet'].forEach((sl, k) => st.eq[sl] && x.drawImage(iconCanvas(st.eq[sl]), (k % 2) * 16, (k >> 1) * 16, 16, 16));
  return c;
}
// the Shop pop-up of a set: a big picture of the character wearing it
shopItem = ((prev) =>
  function (s) {
    const r = prev(s);
    const st = SET_BY_ID[s.id],
      box = st && document.querySelector('#dlg .spic.big');
    if (box) {
      let url = null;
      try {
        url = charPortrait({ skin: st.skin, equipped: st.eq });
      } catch (e) {}
      if (typeof url === 'string') {
        const im = new Image();
        im.className = 'setpic';
        im.alt = st.name;
        im.src = url;
        box.innerHTML = '';
        box.appendChild(im);
      }
    }
    return r;
  })(shopItem);
// buying a set: room for every piece first, then the server takes the gold (Wallet), then the pieces go in the bag
let buyingSet = false;
buy = ((prev) =>
  function (s) {
    if (!SET_BY_ID[s.id]) return prev(s);
    const st = SET_BY_ID[s.id],
      pieces = setPieces(s.id),
      give = () => {
        for (const p of pieces) addItem(p, 1);
        updateGold(true);
        savePlayer();
        closeShop();
        Native.haptic('medium');
        toast((isGM() ? 'GM: got the ' : 'Bought the ') + st.name + '! ' + pieces.length + ' pieces are in your bag');
      };
    // a free bag slot for each piece (pieces you already have a stack of fit on it)
    const need = pieces.filter((p) => !inv.some((o) => o.id === p && !o.hb && o.qty < MAXSTACK)).length;
    if (!isGM() && bagSize() - bagCount() < need) return toast('You need ' + need + ' free bag slots for this set');
    if (Wallet.on()) {
      if (buyingSet || buying) return;
      if (shortOf(s)) return goTopUp(s);
      buyingSet = true;
      Wallet.buy(s.id, 1).then((err) => {
        buyingSet = false;
        if (err) {
          Wallet.load();
          if (/not enough (gold|balb)/i.test(err)) return goTopUp(s);
          return toast(err);
        }
        give();
      });
      return;
    }
    if (!isGM()) {
      if (shortOf(s)) return goTopUp(s);
      P.gold -= s.gold;
    }
    give();
  })(buy);
