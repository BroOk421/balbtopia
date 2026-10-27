// GM watch (owner, Oct 27 2026): GMs hear about new rows in the server's cheat_log (schema.sql: saves whose items jump,
// Shop-only items nobody paid for, gold over the hourly limit, level ahead of the server...) while they play.
// - Every GMW_EVERY ms a GM's game asks for rows newer than the last one seen (only GMs may read the table: its RLS
//   policy "cheat log: GMs read"); new ones give a toast with the newest name and what happened.
// - /cheats (GM only, social.js chatCommand) opens the list of the newest GMW_LIST rows, each with a BAN button
//   (the same /gban confirm). The last id seen is kept per device (localStorage), so a GM isn't told twice.
const GMW_EVERY = 45000,
  GMW_LIST = 50,
  GMW_KEY = 'balbtopia.gmwatch';
let gmwLast = null,
  gmwBusy = false;
function gmwSeen() {
  if (gmwLast !== null) return gmwLast;
  try {
    gmwLast = +localStorage.getItem(GMW_KEY) || 0;
  } catch (e) {
    gmwLast = 0;
  }
  return gmwLast;
}
function gmwMark(id) {
  gmwLast = Math.max(gmwSeen(), id | 0);
  try {
    localStorage.setItem(GMW_KEY, String(gmwLast));
  } catch (e) {}
}
// what a cheat_log row means, in a few words
function gmwWhat(r) {
  const w = String(r.what || ''),
    n = (v) => (v === null || v === undefined ? '?' : Number(v).toLocaleString());
  if (w === 'items') return 'items jumped ' + n(r.before_value) + ' → ' + n(r.after_value);
  if (w.startsWith('item: ')) return 'has ' + n(r.after_value) + ' ' + itemName(w.slice(6)) + ', paid for ' + n(r.before_value);
  return w + (r.after_value !== null && r.after_value !== undefined ? ' (' + n(r.before_value) + ' → ' + n(r.after_value) + ')' : '');
}
async function gmwPoll() {
  if (gmwBusy || !Net.online || !Net.secure || !Net.me || !isGM()) return;
  gmwBusy = true;
  try {
    const { data, error } = await Net.sb
      .from('cheat_log')
      .select('id,name,what,before_value,after_value,created_at')
      .gt('id', gmwSeen())
      .order('id', { ascending: false })
      .limit(20);
    if (error || !data || !data.length) return;
    const top = data[0];
    gmwMark(top.id);
    toast('⚠ Cheat log: ' + (data.length >= 20 ? '20+' : data.length) + ' new. ' + (top.name || '?') + ': ' + gmwWhat(top) + '. Type /cheats to see');
  } catch (e) {
  } finally {
    gmwBusy = false;
  }
}
setInterval(gmwPoll, GMW_EVERY);
setTimeout(gmwPoll, 8000); // soon after logging in

// /cheats: the newest rows with a BAN button each
async function openCheats() {
  if (!Net.online || !Net.secure) return toast('/cheats works when playing online');
  const { data, error } = await Net.sb
    .from('cheat_log')
    .select('id,name,what,before_value,after_value,created_at')
    .order('id', { ascending: false })
    .limit(GMW_LIST);
  if (error) return toast("Couldn't read the cheat log: " + error.message);
  if (data && data.length) gmwMark(data[0].id);
  const rows = (data || [])
    .map(
      (r) =>
        `<li class="cheatrow"><span class="cwho">${esc(r.name || '?')}</span><span class="cwhat">${esc(gmwWhat(r))}</span><span class="cwhen">${esc(
          new Date(r.created_at).toLocaleString(),
        )}</span>${r.name ? `<button class="btn ghost cban" type="button" data-n="${esc(r.name)}">BAN</button>` : ''}</li>`,
    )
    .join('');
  const body = dialog(
    'CHEAT LOG',
    rows
      ? `<p class="dtext">Not everything here is cheating (a Shop item picked up from a drop is listed too). Look before you ban.</p><ul class="cheatlist">${rows}</ul>`
      : '<p class="dtext">Nothing in the cheat log.</p>',
    [{ label: 'Close', run: () => true }],
  );
  body.querySelectorAll('.cban').forEach((b) => (b.onclick = () => gmBanCommand('gban', [b.dataset.n, 'Cheating'])));
}
