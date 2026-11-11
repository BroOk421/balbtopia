// Landing screen corner buttons (owner, Nov 11 2026: "on the landing page a music icon to turn it off and on, and
// beside it Facebook, YouTube and Discord icons").
// - A row of small round buttons at the TOP RIGHT (owner, Nov 11 2026; was bottom right) of the landing / title screen (inside #start, so it shows only while the
//   landing screen does: title menu and the log in pop-up).
// - Music: turns the landing piano music (titlescreen.js tmusSchedule) on / off; kept in localStorage
//   `LAND_MUSIC_KEY` ('0' = off). Only the landing music: the game's own Sound setting is not changed.
// - Facebook / YouTube / Discord: open `SOCIAL_LINKS` in a new tab (the phone app: the system browser). A link left
//   empty says "Coming soon". PUT THE OWNER'S PAGE LINKS HERE.
// Loaded after titlescreen.js, before main.js.
// ===== landing links =====
const SOCIAL_LINKS = {
  facebook: '', // e.g. 'https://www.facebook.com/yourpage'
  youtube: '', // e.g. 'https://www.youtube.com/@yourchannel'
  discord: '', // e.g. 'https://discord.gg/yourinvite'
};
const LAND_MUSIC_KEY = 'balbtopia.titleMusic';
let landMusic = true;
try {
  landMusic = localStorage.getItem(LAND_MUSIC_KEY) !== '0';
} catch (e) {}
// (titlescreen.js asks this before playing)
const landMusicOn = () => landMusic;

const LAND_ICONS = {
  // a note with a speaker-ish feel; `off` adds a slash
  music: (off) =>
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 4v10.6A3.5 3.5 0 1 0 11 17.5V8.2l8-1.8v6.2A3.5 3.5 0 1 0 21 15.5V2.6L9 5.2z"/>' +
    (off ? '<path d="M3 3l18 18" stroke="#ff5a6a" stroke-width="3" stroke-linecap="round"/>' : '') +
    '</svg>',
  facebook: () =>
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.3h2.8V22z"/></svg>',
  youtube: () =>
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22.5 7.2a2.8 2.8 0 0 0-2-2C18.8 4.7 12 4.7 12 4.7s-6.8 0-8.5.5a2.8 2.8 0 0 0-2 2C1 8.9 1 12 1 12s0 3.1.5 4.8a2.8 2.8 0 0 0 2 2c1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5a2.8 2.8 0 0 0 2-2c.5-1.7.5-4.8.5-4.8s0-3.1-.5-4.8zM9.8 15.1V8.9L15.5 12z"/></svg>',
  discord: () =>
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1a15.6 15.6 0 0 0-5.8 0l-.5-1a17 17 0 0 0-4.2 1.3C1.7 9.4 1 13.4 1.3 17.3a17 17 0 0 0 5.2 2.7l1.1-1.8c-.6-.2-1.2-.5-1.7-.8l.4-.3a12 12 0 0 0 11.4 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.8a17 17 0 0 0 5.2-2.7c.4-4.5-.7-8.5-3.1-12zM8.5 14.9c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2zm7 0c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2z"/></svg>',
};
const LAND_LINKS = document.createElement('nav');
LAND_LINKS.className = 'landlinks';
LAND_LINKS.setAttribute('aria-label', 'Music and social links');
LAND_LINKS.innerHTML =
  '<button type="button" class="ll music" id="llMusic"></button>' +
  '<button type="button" class="ll fb" data-link="facebook" title="Facebook" aria-label="Facebook">' + LAND_ICONS.facebook() + '</button>' +
  '<button type="button" class="ll yt" data-link="youtube" title="YouTube" aria-label="YouTube">' + LAND_ICONS.youtube() + '</button>' +
  '<button type="button" class="ll dc" data-link="discord" title="Discord" aria-label="Discord">' + LAND_ICONS.discord() + '</button>';
$('start').appendChild(LAND_LINKS);
{
  const st = document.createElement('style');
  st.textContent =
    '.landlinks{position:fixed;right:max(12px,env(safe-area-inset-right));top:max(12px,env(safe-area-inset-top));display:flex;gap:7px;z-index:5}' +
    'body.booting .landlinks{visibility:hidden}' +
    '.landlinks .ll{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:#fff;' +
    'border:2px solid var(--night,#1c1033);box-shadow:0 2px 0 var(--night,#1c1033),0 4px 8px rgba(0,0,0,.35);transition:transform .12s}' +
    '.landlinks .ll svg{width:16px;height:16px;display:block}' +
    '.landlinks .ll:hover{transform:translateY(-2px)}.landlinks .ll:active{transform:translateY(2px);box-shadow:0 1px 0 var(--night,#1c1033)}' +
    '.landlinks .music{background:#7a52c8}.landlinks .music.off{background:#4a4060;color:#cfc6e0}' +
    '.landlinks .fb{background:#1877f2}.landlinks .yt{background:#ff0033}.landlinks .dc{background:#5865f2}' +
    '@media (max-height:420px){.landlinks .ll{width:28px;height:28px}.landlinks .ll svg{width:14px;height:14px}.landlinks{gap:6px}}';
  document.head.appendChild(st);
}
function landMusicShow() {
  const b = $('llMusic');
  b.innerHTML = LAND_ICONS.music(!landMusic);
  b.classList.toggle('off', !landMusic);
  b.title = landMusic ? 'Music: ON' : 'Music: OFF';
  b.setAttribute('aria-label', b.title);
  b.setAttribute('aria-pressed', landMusic ? 'true' : 'false');
}
landMusicShow();
$('llMusic').onclick = () => {
  landMusic = !landMusic;
  try {
    localStorage.setItem(LAND_MUSIC_KEY, landMusic ? '1' : '0');
  } catch (e) {}
  landMusicShow();
  // (the click counts as the tap browsers want before any sound)
  if (landMusic && typeof Sfx !== 'undefined' && Sfx.unlock) Sfx.unlock();
  if (landMusic && typeof settings !== 'undefined' && settings.sound === false) toast('Sound is OFF: turn it on in OPTIONS to hear the music');
  if (typeof tmusSchedule === 'function') tmusSchedule();
};
LAND_LINKS.querySelectorAll('[data-link]').forEach(
  (b) =>
    (b.onclick = () => {
      const url = SOCIAL_LINKS[b.dataset.link];
      if (!url) return toast(b.title + ': coming soon');
      window.open(url, '_blank', 'noopener');
    }),
);
