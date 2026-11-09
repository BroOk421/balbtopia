// Menu -> Settings: sizes (owner, Oct 24 2026).
// - Buttons: the on-screen buttons and bars (top-right bar, hotbar, walk / jump pads, BAG) at UI_SIZES.btnSize steps
//   (CSS `zoom` through the --btnz variable on <html>), saved as settings.btnSize (index, 2 = normal).
// (a Name size slider was tried and removed again, owner Oct 24 2026)
// Also: the menu's title shows the open tab (the tabs are a column outside the window, CSS).
// ===== uisize =====
// slider steps (index saved) and which step is the normal size
const UI_SIZES = { btnSize: [[0.7, 0.85, 1, 1.15, 1.3, 1.5], 2] };
const sizeIdx = (key) => {
  const k = settings[key],
    [list, normal] = UI_SIZES[key];
  return Number.isInteger(k) && k >= 0 && k < list.length ? k : normal;
};
const sizeOf = (key) => UI_SIZES[key][0][sizeIdx(key)];
function applySizes() {
  document.documentElement.style.setProperty('--btnz', String(sizeOf('btnSize')));
}
const _applySettingsUi = applySettings;
applySettings = function () {
  _applySettingsUi();
  applySizes();
};
const _settingsTabUi = settingsTab;
settingsTab = function (el) {
  _settingsTabUi(el);
  const row = (id, label) =>
    `<div class="set"><span>${label}</span><span class="zoom"><small>Small</small><input type="range" id="${id}" min="0" max="5" step="1" aria-label="${label} size" /><small>Big</small></span></div>`;
  const first = el.querySelector('.set');
  first.insertAdjacentHTML('afterend', row('sBtn', 'Button size'));
  for (const [id, key] of [['sBtn', 'btnSize']]) {
    const inp = el.querySelector('#' + id);
    inp.value = sizeIdx(key);
    inp.oninput = () => {
      settings[key] = Math.max(0, Math.min(UI_SIZES[key][0].length - 1, Number(inp.value) | 0));
      applySizes();
    };
    inp.onchange = () => savePlayer();
  }
};
// the menu title = the open tab
const MENU_TITLES = { profile: 'PROFILE', worlds: 'WORLDS', friends: 'FRIENDS', email: 'EMAIL', settings: 'SETTINGS' };
const _renderMenuUi = renderMenu;
renderMenu = function () {
  _renderMenuUi();
  const t = $('menuTitle');
  if (t) t.textContent = MENU_TITLES[menuTab] || 'MENU';
};
applySizes();
