// Pop-ups and taps (owner, Oct 25 2026). On phones the tap that opened a pop-up went on to press whatever button
// appeared under the finger (e.g. a world in the WORLDS list, which sent you to another world at once). Every pop-up
// (.win / .pop, and every new dialog() even when one was already open) now takes no taps for GUARD_MS after it
// appears (class `justopened`, CSS at the end of style.css). Touch screens only; mouse clicks are not delayed.
// The grow-in animation itself is CSS only (`popGrow`).
// ===== popguard =====
const GUARD_MS = 350;
const touchUI = () => document.body.classList.contains('touch') || matchMedia('(pointer: coarse)').matches;
function guardPopup(el) {
  if (!el || !touchUI()) return;
  el.classList.add('justopened');
  clearTimeout(el._guardT);
  el._guardT = setTimeout(() => el.classList.remove('justopened'), GUARD_MS);
}
// The grow-in uses the CSS `scale` property, which also scales the window's own centring transform
// (translate(-50%, -50%)), so it came in from the lower side instead of from the middle (owner, Oct 25 2026). With the
// origin at (half size + the transform's own shift) the window's centre stays put the whole time, whatever transform
// it has (centred, top-left anchored on phones, the Mannequin pair...).
function popOrigin(el) {
  let e = 0,
    f = 0;
  try {
    const t = getComputedStyle(el).transform;
    if (t && t !== 'none') {
      const m = new DOMMatrixReadOnly(t);
      e = m.e;
      f = m.f;
    }
  } catch (err) {}
  el.style.transformOrigin = el.offsetWidth / 2 + e + 'px ' + (el.offsetHeight / 2 + f) + 'px';
}
new MutationObserver((list) => {
  for (const m of list) {
    const el = m.target;
    if (m.oldValue === null || el.hidden || !el.classList) continue; // only hidden -> shown
    if (el.classList.contains('win') || el.classList.contains('pop')) {
      popOrigin(el);
      guardPopup(el);
    }
  }
}).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden'], attributeOldValue: true });
// a dialog replaced by the next one (a confirm after a confirm) gets the same pause
const _pgDialog = dialog;
dialog = function (...a) {
  const body = _pgDialog.apply(this, a);
  guardPopup($('dlg'));
  return body;
};
