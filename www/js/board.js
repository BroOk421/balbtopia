// Suggestion Board (owner, Oct 25 2026; block 127, the old Notice Board, id notice_board kept). WRENCH it (within
// WRENCH_REACH, like the other wrench blocks; a click is a normal punch) and a pop-up opens:
// the title, the list of suggestions (newest at the bottom, a fixed height that scrolls) and a box at the bottom to
// write a new one. Anyone in the world can post; the poster, the world owner and GMs can remove a post (x).
// Online the posts live on the server (schema.sql `board_posts`: board_list / board_post / board_delete /
// board_clear; the server puts the real name on each post and limits how fast you post); a `board` message on
// world:NAME tells the others to reload an open board. Offline and in the private LOBBY they are kept on this device.
// Breaking a board (by a builder) clears its posts, so a new board on that tile starts empty.
// ===== board =====
const NOTICE_BOARD = 127,
  BOARD_MAX = 120, // letters in one suggestion
  BOARD_KEEP = 100; // posts kept per board (the oldest go)
const isBoardT = (t) => t === NOTICE_BOARD;
let boardAt = -1, // tile of the open board's pop-up
  boardBusy = false;

// ---------- where the posts are kept ----------
const boardKey = (i) => 'balbtopia.board.' + worldName + '.' + i;
function boardLocal(i) {
  try {
    const l = JSON.parse(localStorage.getItem(boardKey(i)) || '[]');
    return Array.isArray(l) ? l : [];
  } catch (e) {
    return [];
  }
}
function boardSaveLocal(i, l) {
  try {
    if (l.length) localStorage.setItem(boardKey(i), JSON.stringify(l.slice(-BOARD_KEEP)));
    else localStorage.removeItem(boardKey(i));
  } catch (e) {}
}
// -> { list: [{ id, n, t, at }] } or { err }
async function boardLoad(i) {
  if (!Net.boardWorld()) return { list: boardLocal(i) };
  try {
    return await Net.boardList(i);
  } catch (e) {
    return { err: 'Could not load the suggestions' };
  }
}
// -> null when it went up, or why not
async function boardSend(i, text) {
  if (!Net.boardWorld()) {
    const l = boardLocal(i);
    l.push({ id: Date.now(), n: playerName, t: text, at: Date.now() });
    boardSaveLocal(i, l);
    return null;
  }
  try {
    return await Net.boardPost(i, text);
  } catch (e) {
    return 'Could not post. Check your connection.';
  }
}
async function boardRemove(i, id) {
  if (!Net.boardWorld()) return boardSaveLocal(i, boardLocal(i).filter((p) => p.id !== id)), null;
  try {
    return await Net.boardDelete(i, id);
  } catch (e) {
    return 'Could not remove it. Check your connection.';
  }
}
// the board on tile i was broken (act, actions.js): its posts go with it
function boardBroken(i) {
  if (!Net.boardWorld()) return boardSaveLocal(i, []);
  Net.boardClear(i).catch(() => {});
}
Net.onBoard = (p) => {
  if (p && p.i === boardAt && boardShown()) boardFill();
};

// ---------- the pop-up ----------
const boardShown = () => !$('dlg').hidden && !!$('bList');
function boardAgo(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
const boardCanRemove = (p) => lc(p.n || '') === lc(playerName) || isOwner() || isGM();
function openBoard(i) {
  boardAt = i;
  const body = dialog(
    'SUGGESTIONS',
    `<div class="board">
      <div class="blist" id="bList"><p class="bnone">Loading…</p></div>
      <div class="bform">
        <input id="bText" maxlength="${BOARD_MAX}" placeholder="Write a suggestion…" autocomplete="off" enterkeyhint="send" />
        <button class="btn" id="bSend" type="button">Post</button>
      </div>
      <small class="bcount" id="bCount">0/${BOARD_MAX}</small>
    </div>`,
    [{ label: 'Close', cls: 'ghost', run: () => {} }],
  );
  const input = body.querySelector('#bText'),
    count = body.querySelector('#bCount'),
    btn = body.querySelector('#bSend');
  input.oninput = () => (count.textContent = input.value.length + '/' + BOARD_MAX);
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btn.click();
    }
  };
  btn.onclick = async () => {
    const text = input.value.replace(/\s+/g, ' ').trim().slice(0, BOARD_MAX);
    if (!text) return toast('Write your suggestion first');
    if (boardBusy) return;
    boardBusy = true;
    btn.disabled = true;
    const err = await boardSend(i, text);
    boardBusy = false;
    btn.disabled = false;
    if (err) return toast(err);
    input.value = '';
    input.oninput();
    Sfx.play('pickup');
    if (boardAt === i && boardShown()) boardFill(true);
  };
  boardFill(true);
}
// (re)load the list of the open board; toEnd: scroll down to the newest
async function boardFill(toEnd) {
  const i = boardAt,
    res = await boardLoad(i),
    el = $('bList');
  if (!el || boardAt !== i || !boardShown()) return;
  const atEnd = toEnd || el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  if (res.err) {
    el.innerHTML = `<p class="bnone">${esc(res.err)}</p>`;
    return;
  }
  const list = res.list.slice(-BOARD_KEEP);
  $('dlgTitle').textContent = 'SUGGESTIONS' + (list.length ? ' (' + list.length + ')' : '');
  el.innerHTML = list.length
    ? list
        .map(
          (p) => `<div class="bpost">
            <div class="bhead"><b>${esc(p.n || '?')}</b><small>${boardAgo(+p.at || 0)}</small>${
              boardCanRemove(p) ? `<button class="bdel" type="button" data-id="${esc(String(p.id))}" title="Remove" aria-label="Remove">×</button>` : ''
            }</div>
            <p>${esc(p.t || '')}</p>
          </div>`,
        )
        .join('')
    : '<p class="bnone">No suggestions yet. Be the first!</p>';
  el.querySelectorAll('.bdel').forEach((b) => {
    b.onclick = async () => {
      const raw = b.dataset.id,
        id = Number(raw);
      b.disabled = true;
      const err = await boardRemove(i, Number.isFinite(id) ? id : raw);
      if (err) toast(err);
      if (boardAt === i && boardShown()) boardFill();
    };
  });
  if (atEnd) el.scrollTop = el.scrollHeight;
}
