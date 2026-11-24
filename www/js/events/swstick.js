// Splash Wars analog stick (owner, Nov 24 2026: "in Splash Wars, once the game starts, the left / right arrows become an
// analog stick so you can move properly; the jump goes away too; afterwards back to normal"). On a touch screen, while
// a Red vs Blue / Splash Wars round is being played (rvb.js rvbPlaying), body gets `swplay`: the left pad's two arrow
// buttons are swapped for `#swStick` (a round base with a thumb you drag left / right without lifting your finger:
// past SW_DEAD px it holds the walk key of that side, input.js `keys`) and the Jump button is hidden. When the round is
// over (or you leave), the arrows and Jump come back and the walk keys are let go. Loaded right after rvb.js.
// ===== splash wars stick =====
const SW_DEAD = 10, // px from the middle before it walks
  SW_R = 42; // px: how far the thumb goes
const SW_STICK = document.createElement('div');
SW_STICK.id = 'swStick';
SW_STICK.className = 'swstick';
SW_STICK.innerHTML = '<span class="swarr l">◀</span><span class="swarr r">▶</span><b class="swthumb" id="swThumb"></b>';
{
  const padL = document.querySelector('.pad.l');
  (padL || $('wrap')).appendChild(SW_STICK);
  const st = document.createElement('style');
  st.textContent =
    '.swstick{display:none;position:relative;width:124px;height:124px;border-radius:50%;box-sizing:border-box;touch-action:none;' +
    'border:2px solid var(--line,#4a8fe8);background:rgba(16,35,71,.55)}' +
    '.swstick .swthumb{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;box-sizing:border-box;' +
    'border:2px solid var(--glow,#8fd0ff);background:rgba(143,208,255,.35);transition:transform .08s}' +
    '.swstick.on .swthumb{transition:none;background:rgba(143,208,255,.6)}' +
    '.swstick .swarr{position:absolute;top:50%;transform:translateY(-50%);font:12px var(--pixel,monospace);color:var(--glow,#8fd0ff);opacity:.6}' +
    '.swstick .swarr.l{left:10px}.swstick .swarr.r{right:10px}' +
    'body.swplay .pad.l > button{display:none}body.swplay .swstick{display:block}body.swplay .pad.r{display:none !important}';
  document.head.appendChild(st);
}
let swPtr = null;
function swSet(dx) {
  const d = Math.max(-SW_R, Math.min(SW_R, dx));
  $('swThumb').style.transform = 'translateX(' + d + 'px)';
  keys.ArrowLeft = d < -SW_DEAD;
  keys.ArrowRight = d > SW_DEAD;
}
function swRelease() {
  swPtr = null;
  SW_STICK.classList.remove('on');
  $('swThumb').style.transform = '';
  keys.ArrowLeft = keys.ArrowRight = false;
}
SW_STICK.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  swPtr = e.pointerId;
  SW_STICK.setPointerCapture(e.pointerId);
  SW_STICK.classList.add('on');
  const r = SW_STICK.getBoundingClientRect();
  swSet(e.clientX - (r.left + r.width / 2));
});
SW_STICK.addEventListener('pointermove', (e) => {
  if (e.pointerId !== swPtr) return;
  const r = SW_STICK.getBoundingClientRect();
  swSet(e.clientX - (r.left + r.width / 2));
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => SW_STICK.addEventListener(t, (e) => e.pointerId === swPtr && swRelease()));
// on while a round is played (touch screens only); let go of everything when it switches
let swWas = false;
setInterval(() => {
  let on = false;
  try {
    on = document.body.classList.contains('touch') && typeof rvbPlaying === 'function' && rvbPlaying();
  } catch (e) {}
  if (on === swWas) return;
  swWas = on;
  document.body.classList.toggle('swplay', on);
  swRelease();
  for (const id of ['pl', 'pr', 'pj']) if ($(id)) $(id).classList.remove('on');
  keys.Space = false;
}, 150);
