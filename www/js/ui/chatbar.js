// The chat bar at the top left (owner, Nov 9 2026: "next to the global chat put an input, a bit long, the input first,
// then the globe icon; it only shows the latest WORLD chat; clicking the global chat makes the chats appear, expanding
// down from the top, and that input becomes the real (empty) one; the chat list is the one made before").
// - Closed: [bar][globe]. The bar shows the newest line of this world's chat ("Name: text", social.js chatLog), or
//   "World chat" when there is none; tapping it opens the Global Chat, like the globe.
// - The globe opens the Global Chat: the bar turns into its input (globalchat.js's own #gText, moved here: Enter
//   broadcasts, Esc leaves it) and the old panel (title, mics, minimise, list) drops down under the row, growing
//   from the top. The globe (or the panel's "–") closes it again. The red number stays on the globe.
// Loaded after globalchat.js (and news.js).
// ===== chatbar =====
{
  const g = $('gchat'),
    tog = $('gOpen'),
    input = $('gText'),
    form = input && input.parentElement;
  if (g && tog && input) {
    const slot = document.createElement('div');
    slot.className = 'gslot';
    const tick = document.createElement('button');
    tick.type = 'button';
    tick.className = 'gtick';
    tick.id = 'gTick';
    tick.innerHTML = '<span class="gtick-t">World chat</span>';
    slot.appendChild(tick);
    g.insertBefore(slot, tog); // the bar first, then the globe
    // (owner, 16:40: "one function only") tapping the bar does what the globe does: the Global Chat slides down
    tick.onclick = () => gShow(true);
    if (form) form.classList.add('gform-moved');
    let lastKey = '';
    const showTick = () => {
      const m = typeof chatLog !== 'undefined' && chatLog.length ? chatLog[chatLog.length - 1] : null,
        key = m ? m.name + '\u0000' + m.text : '';
      if (key === lastKey) return;
      lastKey = key;
      tick.innerHTML = m ? `<span class="gtick-t"><b>${esc(m.name)}:</b> ${esc(m.text)}</span>` : '<span class="gtick-t gtick-none">World chat</span>';
    };
    setInterval(showTick, 400);
    // open: the bar is the Global Chat's input; closed: the world chat line
    gShow = ((prev) =>
      function (open) {
        const r = prev(open);
        if (open) {
          slot.appendChild(input);
          tick.hidden = true;
          setTimeout(() => input.focus(), 30);
        } else {
          if (form) form.appendChild(input);
          tick.hidden = false;
          input.blur();
        }
        return r;
      })(gShow);
    tog.onclick = () => gShow(!gOpenNow);
    const st = document.createElement('style');
    g.classList.add('gbar');
    st.textContent = [
      // (owner, 16:31: "make the input as wide as the global chat; reversed: the chats appear on top, sliding down")
      // one column as wide as the old panel: [bar][globe] closed; open, the panel takes the top and the bar slides below it
      '.gchat.gbar{display:flex;flex-wrap:wrap;align-items:flex-start;gap:6px;width:calc(min(300px,42vw) + 22px)}',
      '@media (orientation: landscape) and (max-height: 520px){.gchat.gbar{width:calc(min(260px,38vw) + 18px)}.gchat.gbar .gslot,.gchat .gtick,.gchat .gslot input{height:34px}}',
      '.gchat .gslot{flex:1;min-width:0;height:38px;display:flex}',
      '.gchat .gtick,.gchat .gslot input{flex:1;min-width:0;height:38px;box-sizing:border-box;border-radius:6px;border:2px solid var(--line);' +
        'background:rgba(28,16,51,.82);color:var(--ink);font:12px var(--body);padding:0 9px;text-align:left}',
      '.gchat .gtick{cursor:pointer;overflow:hidden}',
      '.gchat .gtick-t{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.gchat .gtick-t b{color:var(--glow);font-weight:600}',
      '.gchat .gtick-none{color:var(--muted)}',
      '.gchat .gslot input{border-color:var(--glow);outline:none}',
      // the globe stays where it is, open or not
      '.gchat.open .gtoggle{display:grid}',
      // the old panel goes on top, full width, and grows downward (pushing the bar down with it)
      '.gchat.gbar .gpanel{order:-1;width:100%;box-sizing:border-box;overflow:hidden}',
      '.gchat.gbar.open .gpanel{animation:gDrop .25s ease-out}',
      '@keyframes gDrop{from{max-height:0;opacity:.2;padding-top:0;padding-bottom:0}to{max-height:260px;opacity:1}}',
      '.gchat .gform-moved{display:none}',
    ].join('\n');
    document.head.appendChild(st);
  }
}
