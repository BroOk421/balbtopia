// The announcement banner (owner, Nov 26 2026, his art: art-source/ui/annc_*_full.png, his mockup "9.png"): his title
// picture centred over a band across the whole screen (his RECTANGLE: black at 51 %), the message in the band; it
// fades in moving UP, stays ANNC.ms (5 s), then fades out moving DOWN. Right under the chat.
// announce(kind, text): kind = 'announce' (his ANOUNCEMENT, the GM's: announcements.js), 'event' (his EVENT: an event
// world, worldevent below), 'special' (his SPECIAL EVENT; not used yet: owner "stay muna"). Text: [words] in square
// brackets are coloured (the kind's colour). Several in a row wait their turn.
// ===== announcement banner =====
const ANNC = { ms: 5000, gap: 8, scale: 0.6 }; // scale: his title pictures (assets/ui, 0.4 of his canvas) on screen
const ANNC_KINDS = {
  announce: { img: 'assets/ui/annc_announcement.png', hi: '#ffd23f' },
  event: { img: 'assets/ui/annc_event.png', hi: '#5cff8a' },
  special: { img: 'assets/ui/annc_special.png', hi: '#ffd23f' },
};
const ANNC_IMG = {};
for (const [k, v] of Object.entries(ANNC_KINDS)) (ANNC_IMG[k] = new Image()).src = v.img;
const anncQ = [];
let anncEl = null,
  anncBusy = false;
function announce(kind, text) {
  if (!ANNC_KINDS[kind]) kind = 'announce';
  anncQ.push({ kind, text: String(text || '').slice(0, 200) });
  if (!anncBusy) anncNext();
}
// right under the chat bar (or its open panel)
function anncPlace() {
  const c = document.getElementById('gchat');
  if (!anncEl) return;
  anncEl.style.top = (c ? c.getBoundingClientRect().bottom : 0) + ANNC.gap + 'px';
}
// the message with its [coloured] parts, as DOM (never HTML from the text)
function anncText(el, text, hi) {
  el.textContent = '';
  const parts = text.split(/(\[[^\]]*\])/);
  for (const p of parts) {
    if (!p) continue;
    if (p[0] === '[' && p.endsWith(']')) {
      const s = document.createElement('b');
      s.style.color = hi;
      s.textContent = p.slice(1, -1);
      el.appendChild(s);
    } else el.appendChild(document.createTextNode(p));
  }
}
function anncNext() {
  const a = anncQ.shift();
  if (!a) return void (anncBusy = false);
  anncBusy = true;
  if (!anncEl) {
    anncEl = document.createElement('div');
    anncEl.className = 'annc';
    anncEl.setAttribute('role', 'status');
    anncEl.innerHTML = '<img class="annc-t" alt="" /><div class="annc-b"><span class="annc-m"></span></div>';
    document.body.appendChild(anncEl);
  }
  const k = ANNC_KINDS[a.kind],
    im = anncEl.querySelector('.annc-t'),
    pic = ANNC_IMG[a.kind];
  im.src = k.img;
  const h = (pic.naturalHeight || 64) * ANNC.scale;
  im.style.height = h + 'px';
  im.alt = a.kind;
  anncText(anncEl.querySelector('.annc-m'), a.text, k.hi);
  anncEl.className = 'annc k-' + a.kind;
  anncPlace();
  anncEl.hidden = false;
  // (owner, Nov 26 2026: "a sound when it appears, like a big gong hit with a big stick") all three kinds
  if (typeof Sfx !== 'undefined') Sfx.play('gong');
  void anncEl.offsetWidth;
  anncEl.classList.add('in');
  setTimeout(() => {
    anncEl.classList.remove('in');
    anncEl.classList.add('out');
    setTimeout(() => {
      anncEl.hidden = true;
      anncEl.classList.remove('out');
      anncNext();
    }, 450);
  }, ANNC.ms);
}
addEventListener('resize', anncPlace);
setInterval(() => anncBusy && anncPlace(), 250); // the chat opens / closes

// ---------- event worlds (owner: "when you get into the world that has the event, like SPLASHWARS or MOONEVENT") ----
// coming into one of these shows its EVENT banner (once per visit)
const WORLD_EVENTS = {
  SPLASHWARS: 'Welcome to [Splash Wars]! Pick a team, grab a water gun and [soak] the other side!',
  MOONEVENT: 'Break [100 asteroids] for a chance to get [Moon Crystals]!',
};
let anncWorld = '';
setInterval(() => {
  const w = typeof inWorld !== 'undefined' && inWorld && typeof worldName === 'string' ? worldName.toUpperCase() : '';
  if (w === anncWorld) return;
  anncWorld = w;
  if (WORLD_EVENTS[w]) setTimeout(() => anncWorld === w && announce('event', WORLD_EVENTS[w]), 800);
}, 500);
