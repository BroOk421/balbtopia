// Emote button (owner, Nov 28 2026: "yung mga command na emotions ... lagay ka ng isang icon na parang modal, pag
// click lilitaw yung mga list ng icon ng emotions, pag click sa isa tyaka gagana ... sa baba ng menu mo ilagay, lagyan
// mo ng mga icons"): a button right UNDER the menu button (top right, inside `.topr` so it zooms with it); tapping it
// opens a small panel of the emotes (5 columns, owner), each a pixel icon + its name; tapping one does what its chat command does
// (social.js chatCommand: /nice, /love, /omg, /cry, /angry, /sleep, /dance, /facejoke, /troll) and closes the panel. The one
// going on now is outlined. Tap the button again / anywhere else = close. Icons painted here (`EMO_BTN_ICONS`, 13 x 13
// pixel maps, the faces on one round yellow face). Loaded after hudbtns.js (same opacity / corners settings).
// ===== emote button =====
const EMO_BTN_LIST = [
  ['nice', 'Thumbs Up'],
  ['love', 'Love'],
  ['omg', 'Wow'],
  ['cry', 'Cry'],
  ['angry', 'Angry'], // (Nov 28 2026)
  ['sleep', 'Sleep'],
  ['dance', 'Dance'],
  ['facejoke', 'Silly'],
  ['troll', 'Troll'],
];
// palette: o outline, y face, Y face shade, k dark, w white, r red, R dark red, p pink, b blue, B light blue, s skin,
// S skin shade, n navy, m tongue
const EMO_BTN_PAL = { o: '#3a2a10', y: '#ffd23f', Y: '#e0a820', k: '#2a1a10', w: '#ffffff', r: '#ff3b5c', R: '#a8102c', p: '#ff9db0', b: '#2f7fe0', B: '#9fd4ff', s: '#ffc9a0', S: '#d8946a', n: '#16305f', m: '#ff6f8a' };
const EMO_BTN_FACE = [
  '....ooooo....',
  '..ooyyyyyoo..',
  '.oyyyyyyyyyo.',
  '.oyyyyyyyyyo.',
  'oyyyyyyyyyyyo',
  'oyyyyyyyyyyyo',
  'oyyyyyyyyyyyo',
  'oyyyyyyyyyyyo',
  'oyyyyyyyyyyyo',
  '.oyyyyyyyyYo.',
  '.oYyyyyyyYYo.',
  '..ooYYYYYoo..',
  '....ooooo....',
];
// a face: the round face with these rows laid over it ('.' = keep the face)
const emoFace = (rows) => EMO_BTN_FACE.map((f, j) => [...f].map((ch, i) => (rows[j] && rows[j][i] && rows[j][i] !== '.' ? rows[j][i] : ch)).join(''));
const EMO_BTN_ICONS = {
  nice: [
    '.....oo......',
    '....osso.....',
    '....osso.....',
    '...ossso.....',
    '...osso......',
    'ooooossoooo..',
    'onnosssssSo..',
    'onnossssssoo.',
    'onnosssssSo..',
    'onnossssssoo.',
    'onnossssSSo..',
    'ooooooooooo..',
    '.............',
  ],
  love: [
    '.............',
    '..ooo...ooo..',
    '.orrro.orrro.',
    'orwwrrorrrrro',
    'orwrrrrrrrrro',
    'orrrrrrrrrrro',
    'orrrrrrrrrrRo',
    '.orrrrrrrrRo.',
    '..orrrrrrRo..',
    '...orrrrRo...',
    '....orrRo....',
    '.....oRo.....',
    '......o......',
  ],
  omg: emoFace([
    '',
    '',
    '..kk.....kk..',
    '.............',
    '...ww...ww...',
    '...wk...wk...',
    '...kk...kk...',
    '',
    '.....kkk.....',
    '....kRRRk....',
    '.....kkk.....',
  ]),
  cry: emoFace([
    '',
    '',
    '',
    '..kk.....kk..',
    '...kk...kk...',
    '...B.....B...',
    '...B.....B...',
    '..B..kkk..B..',
    '..B.k...k.B..',
    '',
  ]),
  angry: emoFace([
    '',
    '',
    '..kk.....kk..',
    '...kk...kk...',
    '....k...k....',
    '...wk...kw...',
    '...kk...kk...',
    '',
    '....kkkkk....',
    '...k.....k...',
  ]).map((r, j) => (j > 0 && j < 12 ? r.replace(/y/g, j < 6 ? 'r' : 'y') : r)),
  sleep: [
    '.....BBBBBBB.',
    '.....BBBBBBB.',
    '.........BB..',
    '........BB...',
    '.......BB....',
    '.....BBBBBBB.',
    '.....BBBBBBB.',
    '.............',
    'BBBBB........',
    '...B.........',
    '..B..........',
    '.B...........',
    'BBBBB........',
  ],
  dance: [
    '.....oooooo..',
    '.....obbbbbo.',
    '.....oboooBo.',
    '.....oo...bo.',
    '.....bo...bo.',
    '.....bo...bo.',
    '.....bo...bo.',
    '..ooobo.ooobo',
    '.obbbbooobbbo',
    'obBbbbo.obbbo',
    'obbbbbo.oooo.',
    '.ooooo.......',
    '.............',
  ],
  facejoke: emoFace([
    '',
    '..www........',
    '.wwkkw..ww...',
    '.wkkkw..kk...',
    '.wwkkw.......',
    '..www........',
    '',
    '...kkkkkkk...',
    '....kmmmk....',
    '.....mmm.....',
  ]),
  troll: emoFace([
    '',
    '',
    '..kkk...kkk..',
    '...wk...wk...',
    '',
    '.kkkkkkkkkkk.',
    '.kwwwwwwwwwk.',
    '.kwkwkwkwkwk.',
    '..kwwwwwwwk..',
    '...kkkkkkk...',
  ]),
};
function emoBtnIcon(k, s) {
  const c = document.createElement('canvas'),
    m = EMO_BTN_ICONS[k];
  c.width = c.height = 13 * s;
  const x = c.getContext('2d');
  m.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch === '.' || !EMO_BTN_PAL[ch]) return;
      x.fillStyle = EMO_BTN_PAL[ch];
      x.fillRect(i * s, j * s, s, s);
    }),
  );
  return c;
}
{
  const st = document.createElement('style');
  st.textContent =
    '#emoBtn{position:absolute;top:100%;right:0;margin-top:8px;width:38px;height:38px;padding:0;display:grid;place-content:center;cursor:pointer;' +
    'background:linear-gradient(var(--b-dim-top,#1d3a78),var(--b-dim-bot,#132a5a));border:2px solid var(--b-edge,#0a1530);border-radius:var(--hbRad,6px);' +
    'box-shadow:inset 0 -2px 0 rgba(0,0,0,.26);opacity:var(--hbOp,1)}' +
    'body.hbcol #emoBtn{background:var(--hbCol) !important}' +
    '#emoBtn canvas{width:26px;height:26px;image-rendering:pixelated;display:block}' +
    '#emoBtn.on{outline:2px solid var(--sun,#ffd23f);outline-offset:1px}' +
    '#emoPanel{position:absolute;top:100%;right:0;margin-top:54px;z-index:30;display:grid;grid-template-columns:repeat(5,58px);gap:6px;padding:10px;' +
    'background:rgba(10,21,48,.94);border:2px solid var(--b-edge,#0a1530);border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.45)}' +
    '#emoPanel[hidden]{display:none}' +
    '#emoPanel h3{grid-column:1/-1;margin:0 0 2px;font-family:var(--pixel,monospace);font-size:8px;color:var(--sun,#ffd23f);letter-spacing:1px}' +
    '#emoPanel button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 2px 5px;cursor:pointer;color:#fff;' +
    'background:linear-gradient(var(--b-dim-top,#1d3a78),var(--b-dim-bot,#132a5a));border:2px solid var(--b-edge,#0a1530);border-radius:8px;font-family:var(--pixel,monospace);font-size:6px}' +
    '#emoPanel button:hover{filter:brightness(1.2)}' +
    '#emoPanel button[aria-pressed="true"]{border-color:var(--sun,#ffd23f)}' +
    '#emoPanel canvas{width:32px;height:32px;image-rendering:pixelated;display:block}' +
    'body.landing #emoBtn,body.landing #emoPanel,body.rvbrun #emoPanel{display:none !important}';
  document.head.appendChild(st);
}
const EMO_BTN = document.createElement('button'),
  EMO_PANEL = document.createElement('div');
EMO_BTN.id = 'emoBtn';
EMO_BTN.type = 'button';
EMO_BTN.title = 'Emotes';
EMO_BTN.setAttribute('aria-label', 'Emotes');
EMO_BTN.setAttribute('aria-expanded', 'false');
EMO_BTN.appendChild(emoBtnIcon('omg', 2));
EMO_PANEL.id = 'emoPanel';
EMO_PANEL.hidden = true;
EMO_PANEL.setAttribute('role', 'menu');
EMO_PANEL.innerHTML = '<h3>EMOTES</h3>';
for (const [k, name] of EMO_BTN_LIST) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.emo = k;
  b.title = name + ' (/' + k + ')';
  b.setAttribute('role', 'menuitem');
  b.appendChild(emoBtnIcon(k, 3));
  b.appendChild(document.createTextNode(name.toUpperCase()));
  EMO_PANEL.appendChild(b);
}
{
  const topr = document.querySelector('.topr');
  (topr || $('wrap')).appendChild(EMO_BTN);
  (topr || $('wrap')).appendChild(EMO_PANEL);
}
// which emote is going on now (outlined in the panel)
function emoBtnActive(k) {
  if (k === 'dance') return !!P.dance;
  if (k === 'facejoke' || k === 'troll') return P.jokeUntil > now && P.jokeKind === (k === 'troll' ? 'troll' : 'wacky');
  return !!(P.emo && P.emo.k === k);
}
function emoBtnMark() {
  for (const b of EMO_PANEL.querySelectorAll('[data-emo]')) b.setAttribute('aria-pressed', String(emoBtnActive(b.dataset.emo)));
}
function emoPanelShow(on) {
  EMO_PANEL.hidden = !on;
  EMO_BTN.classList.toggle('on', on);
  EMO_BTN.setAttribute('aria-expanded', String(on));
  if (on) emoBtnMark();
}
EMO_BTN.onclick = (e) => {
  e.stopPropagation();
  emoPanelShow(EMO_PANEL.hidden);
  EMO_BTN.blur(); // (so Space / Enter go to the game, not this button)
};
EMO_PANEL.onclick = (e) => {
  e.stopPropagation();
  const b = e.target.closest('[data-emo]');
  if (!b) return;
  b.blur();
  if (typeof chatCommand === 'function') chatCommand('/' + b.dataset.emo);
  emoPanelShow(false);
};
// tapping anywhere else closes it
document.addEventListener('pointerdown', (e) => {
  if (!EMO_PANEL.hidden && !EMO_PANEL.contains(e.target) && !EMO_BTN.contains(e.target)) emoPanelShow(false);
});
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !EMO_PANEL.hidden) emoPanelShow(false);
});
