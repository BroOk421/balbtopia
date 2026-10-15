// Keyboard, mouse/touch and on-screen buttons.
// ===== input =====
const keys = {};
let ptr = { x: 0, y: 0, down: false, inside: false },
  actT = 0;
const $ = (id) => document.getElementById(id);
const cv = $('c'),
  g = cv.getContext('2d');
addEventListener('keydown', (e) => {
  if (!$('start').hidden) return;
  // typing in a text box (world name, player name) is not game input
  if (e.target && e.target.tagName === 'INPUT') return;
  if (!$('worlds').hidden) {
    if (e.code === 'Escape') $('wstay').click();
    return;
  }
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.code) && $('inv').hidden)
    e.preventDefault();
  if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) P.buf = 0.12;
  if (e.code === 'KeyB') {
    e.preventDefault();
    toggleInv();
  }
  if (e.code === 'KeyV') {
    walkStyle = walkStyle === 'step' ? 'stride' : 'step';
    toast(walkStyle === 'step' ? 'Walk B: feet up and down' : 'Walk A: long strides');
  }
  if (e.code === 'Escape') {
    if (!$('menu').hidden) closeMenu();
    else if (!$('pmenu').hidden) closePlayerMenu();
    else if (!$('info').hidden) $('info').hidden = true;
    else if (!$('pop').hidden) closePop();
    else if (!$('inv').hidden) toggleInv();
  }
  if (/^Digit[0-9]$/.test(e.code)) {
    const k = (+e.code.slice(5) + 9) % 10; // keys 1..9 then 0 = slot 10
    const list = hotbarList();
    if (list[k]) selectHand(list[k]);
  }
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (['Space', 'KeyW', 'ArrowUp'].includes(e.code) && P.vy < 0) P.vy *= 0.55;
});
addEventListener('blur', () => {
  for (const k in keys) keys[k] = false;
  ptr.down = false;
});
function toWorld(e) {
  const r = cv.getBoundingClientRect();
  const dpr = cv.width / r.width;
  return { x: ((e.clientX - r.left) * dpr) / Z + cam.x, y: ((e.clientY - r.top) * dpr) / Z + cam.y };
}
cv.addEventListener('pointerdown', (e) => {
  if (!$('inv').hidden) {
    toggleInv();
    return;
  }
  const w = toWorld(e);
  ptr = { ...w, down: true, inside: true };
  if ($('start').hidden) {
    act();
    actT = 0.26;
  }
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', (e) => {
  const w = toWorld(e);
  ptr.x = w.x;
  ptr.y = w.y;
  ptr.inside = true;
});
cv.addEventListener('pointerup', () => (ptr.down = false));
cv.addEventListener('pointercancel', () => (ptr.down = false));
cv.addEventListener('pointerleave', () => {
  if (!ptr.down) ptr.inside = false;
});
cv.addEventListener('contextmenu', (e) => e.preventDefault());
function hold(id, code, jump) {
  const b = $(id);
  const on = (e) => {
    e.preventDefault();
    keys[code] = true;
    if (jump) P.buf = 0.12;
    b.classList.add('on');
  };
  const off = () => {
    keys[code] = false;
    b.classList.remove('on');
    if (jump && P.vy < 0) P.vy *= 0.55;
  };
  b.addEventListener('pointerdown', on);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => b.addEventListener(t, off));
}
hold('pl', 'ArrowLeft');
hold('pr', 'ArrowRight');
hold('pj', 'Space', true);
addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });
