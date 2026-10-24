// Country flags (owner, Oct 24 2026): picked when registering (or later in Menu -> Profile -> FLAG), saved with the
// player (`flag`: a code from FLAGS), sent in the position message (`fl`) and drawn at the LEFT of the name tag
// (drawNameTag in render.js). Each flag is painted pixel by pixel on an 18 x 12 canvas (flagCanvas, cached), simple
// enough to read at name-tag size.
// ===== flags =====
const FLAG_W = 18,
  FLAG_H = 12;
// painter helpers on an 18 x 12 grid
function flagPainter(x) {
  const R = (i, j, w, h, c) => {
      x.fillStyle = c;
      x.fillRect(i, j, w, h);
    },
    H = (cols, w) => {
      // horizontal bands; w = relative heights (default equal)
      const ws = w || cols.map(() => 1),
        tot = ws.reduce((a, b) => a + b, 0);
      let y = 0;
      cols.forEach((c, k) => {
        const y1 = k === cols.length - 1 ? FLAG_H : Math.round(y + (ws[k] / tot) * FLAG_H);
        R(0, Math.round(y), FLAG_W, y1 - Math.round(y), c);
        y = y1;
      });
    },
    V = (cols, w) => {
      const ws = w || cols.map(() => 1),
        tot = ws.reduce((a, b) => a + b, 0);
      let xx = 0;
      cols.forEach((c, k) => {
        const x1 = k === cols.length - 1 ? FLAG_W : Math.round(xx + (ws[k] / tot) * FLAG_W);
        R(Math.round(xx), 0, x1 - Math.round(xx), FLAG_H, c);
        xx = x1;
      });
    },
    D = (cx, cy, r, c) => {
      for (let j = 0; j < FLAG_H; j++)
        for (let i = 0; i < FLAG_W; i++) if ((i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2 <= r * r) R(i, j, 1, 1, c);
    },
    // crescent: disc minus a shifted disc
    C = (cx, cy, r, dx, c) => {
      for (let j = 0; j < FLAG_H; j++)
        for (let i = 0; i < FLAG_W; i++) {
          const a = (i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2 <= r * r,
            b = (i + 0.5 - cx - dx) ** 2 + (j + 0.5 - cy) ** 2 <= r * r * 0.72;
          if (a && !b) R(i, j, 1, 1, c);
        }
    },
    // a small star (plus with a dot) or, r >= 2, a 5-pointed star
    S = (cx, cy, r, c) => {
      if (r < 2) {
        R(cx - 1, cy, 3, 1, c);
        R(cx, cy - 1, 1, 3, c);
        return;
      }
      for (let j = 0; j < FLAG_H; j++)
        for (let i = 0; i < FLAG_W; i++) if (inStar(i + 0.5 - cx, j + 0.5 - cy, r)) R(i, j, 1, 1, c);
    },
    // Nordic cross: centre of the upright at x = 6
    N = (bg, cross, edge) => {
      R(0, 0, FLAG_W, FLAG_H, bg);
      if (edge) {
        R(4, 0, 4, FLAG_H, edge);
        R(0, 4, FLAG_W, 4, edge);
      }
      R(5, 0, 2, FLAG_H, cross);
      R(0, 5, FLAG_W, 2, cross);
    },
    // a small Union Jack in the box (x0, y0, w, h)
    UJ = (x0, y0, w, h) => {
      R(x0, y0, w, h, '#1f3a8a');
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const u = (i + 0.5) / w,
            v = (j + 0.5) / h,
            d1 = Math.abs(u - v),
            d2 = Math.abs(u + v - 1);
          if (d1 < 0.12 || d2 < 0.12) R(x0 + i, y0 + j, 1, 1, '#ffffff');
          if (d1 < 0.045 || d2 < 0.045) R(x0 + i, y0 + j, 1, 1, '#d4202c');
        }
      const cx = x0 + Math.floor(w / 2) - 1,
        cy = y0 + Math.floor(h / 2) - 1;
      R(cx - 1, y0, 4, h, '#ffffff');
      R(x0, cy - 1, w, 4, '#ffffff');
      R(cx, y0, 2, h, '#d4202c');
      R(x0, cy, w, 2, '#d4202c');
    };
  return { R, H, V, D, C, S, N, UJ };
}
// [code, name, painter]
const FLAGS = [
  ['PH', 'Philippines', ({ R, D, S }, x) => {
    R(0, 0, 18, 6, '#0038a8');
    R(0, 6, 18, 6, '#ce1126');
    for (let j = 0; j < 12; j++) R(0, j, Math.round(9 - Math.abs(j + 0.5 - 6) * 1.5), 1, '#ffffff');
    D(3.2, 6, 1.6, '#fcd116');
    R(1, 1, 1, 1, '#fcd116');
    R(1, 10, 1, 1, '#fcd116');
    R(7, 5, 1, 2, '#fcd116');
  }],
  ['US', 'United States', ({ R }) => {
    for (let j = 0; j < 12; j++) R(0, j, 18, 1, j % 2 ? '#ffffff' : '#b22234');
    R(0, 0, 8, 7, '#3c3b6e');
    for (let j = 1; j < 7; j += 2) for (let i = 1; i < 8; i += 2) R(i, j, 1, 1, '#ffffff');
  }],
  ['JP', 'Japan', ({ R, D }) => {
    R(0, 0, 18, 12, '#ffffff');
    D(9, 6, 3.6, '#bc002d');
  }],
  ['KR', 'South Korea', ({ R, D }) => {
    R(0, 0, 18, 12, '#ffffff');
    D(9, 6, 3.4, '#cd2e3a');
    for (let j = 6; j < 10; j++) for (let i = 5; i < 13; i++) if ((i + 0.5 - 9) ** 2 + (j + 0.5 - 6) ** 2 <= 11.6) R(i, j, 1, 1, '#0047a0');
    for (const [i, j] of [[2, 2], [14, 2], [2, 8], [14, 8]]) R(i, j, 2, 2, '#000000');
  }],
  ['CN', 'China', ({ R, S }) => {
    R(0, 0, 18, 12, '#de2910');
    S(3.5, 3.5, 2.6, '#ffde00');
    for (const [i, j] of [[7, 1], [8, 3], [8, 5], [7, 7]]) R(i, j, 1, 1, '#ffde00');
  }],
  ['TW', 'Taiwan', ({ R, D }) => {
    R(0, 0, 18, 12, '#fe0000');
    R(0, 0, 9, 6, '#000095');
    D(4.5, 3, 1.8, '#ffffff');
  }],
  ['HK', 'Hong Kong', ({ R, D }) => {
    R(0, 0, 18, 12, '#de2910');
    D(9, 6, 3.2, '#ffffff');
    D(9, 6, 1.2, '#de2910');
  }],
  ['ID', 'Indonesia', ({ H }) => H(['#ce1126', '#ffffff'])],
  ['MY', 'Malaysia', ({ R, C, S }) => {
    for (let j = 0; j < 12; j++) R(0, j, 18, 1, j % 2 ? '#ffffff' : '#cc0001');
    R(0, 0, 9, 7, '#010066');
    C(3.6, 3.5, 2.6, 1.1, '#ffcc00');
    S(6.5, 3, 1, '#ffcc00');
  }],
  ['SG', 'Singapore', ({ H, C, R }) => {
    H(['#ef3340', '#ffffff']);
    C(3.6, 3, 2.3, 1, '#ffffff');
    for (const [i, j] of [[6, 1], [7, 3], [5, 4]]) R(i, j, 1, 1, '#ffffff');
  }],
  ['TH', 'Thailand', ({ H }) => H(['#a51931', '#f4f5f8', '#2d2a4a', '#f4f5f8', '#a51931'], [1, 1, 2, 1, 1])],
  ['VN', 'Vietnam', ({ R, S }) => {
    R(0, 0, 18, 12, '#da251d');
    S(9, 6.2, 3.8, '#ffff00');
  }],
  ['KH', 'Cambodia', ({ H, R }) => {
    H(['#032ea1', '#e00025', '#032ea1'], [1, 2, 1]);
    R(6, 4, 6, 4, '#ffffff');
    R(8, 3, 2, 1, '#ffffff');
    R(7, 7, 4, 1, '#c8c8c8');
  }],
  ['LA', 'Laos', ({ H, D }) => {
    H(['#ce1126', '#002868', '#ce1126'], [1, 2, 1]);
    D(9, 6, 2.2, '#ffffff');
  }],
  ['MM', 'Myanmar', ({ H, S }) => {
    H(['#fecb00', '#34b233', '#ea2839']);
    S(9, 6.3, 3.6, '#ffffff');
  }],
  ['IN', 'India', ({ H, D }) => {
    H(['#ff9933', '#ffffff', '#138808']);
    D(9, 6, 1.6, '#000080');
    D(9, 6, 0.7, '#ffffff');
  }],
  ['PK', 'Pakistan', ({ R, C, S }) => {
    R(0, 0, 18, 12, '#01411c');
    R(0, 0, 5, 12, '#ffffff');
    C(11, 6, 3.2, 1.3, '#ffffff');
    S(13, 4, 1, '#ffffff');
  }],
  ['BD', 'Bangladesh', ({ R, D }) => {
    R(0, 0, 18, 12, '#006a4e');
    D(8, 6, 3.4, '#f42a41');
  }],
  ['AU', 'Australia', ({ R, UJ, S }) => {
    R(0, 0, 18, 12, '#012169');
    UJ(0, 0, 9, 6);
    S(4, 9, 1, '#ffffff');
    for (const [i, j] of [[13, 2], [15, 5], [12, 6], [14, 9]]) R(i, j, 1, 1, '#ffffff');
  }],
  ['NZ', 'New Zealand', ({ R, UJ }) => {
    R(0, 0, 18, 12, '#012169');
    UJ(0, 0, 9, 6);
    for (const [i, j] of [[13, 2], [15, 5], [12, 6], [14, 9]]) R(i, j, 1, 1, '#c8102e');
  }],
  ['GB', 'United Kingdom', ({ UJ }) => UJ(0, 0, 18, 12)],
  ['IE', 'Ireland', ({ V }) => V(['#169b62', '#ffffff', '#ff883e'])],
  ['CA', 'Canada', ({ V, R }) => {
    V(['#d80621', '#ffffff', '#d80621'], [1, 2, 1]);
    R(8, 3, 2, 6, '#d80621');
    R(6, 5, 6, 2, '#d80621');
    R(7, 4, 4, 3, '#d80621');
    R(6, 3, 1, 1, '#d80621');
    R(11, 3, 1, 1, '#d80621');
  }],
  ['MX', 'Mexico', ({ V, D }) => {
    V(['#006847', '#ffffff', '#ce1126']);
    D(9, 6, 1.6, '#8c5a2b');
  }],
  ['BR', 'Brazil', ({ R, D }) => {
    R(0, 0, 18, 12, '#009c3b');
    for (let j = 1; j < 11; j++) {
      const hw = Math.round(8 - Math.abs(j + 0.5 - 6) * 1.6);
      R(9 - hw, j, hw * 2, 1, '#ffdf00');
    }
    D(9, 6, 2.6, '#002776');
    // a white band across the globe
    R(7, 6, 4, 1, '#ffffff');
  }],
  ['AR', 'Argentina', ({ H, D }) => {
    H(['#74acdf', '#ffffff', '#74acdf']);
    D(9, 6, 1.4, '#f6b40e');
  }],
  ['CO', 'Colombia', ({ H }) => H(['#fcd116', '#003893', '#ce1126'], [2, 1, 1])],
  ['PE', 'Peru', ({ V }) => V(['#d91023', '#ffffff', '#d91023'])],
  ['CL', 'Chile', ({ H, R, S }) => {
    H(['#ffffff', '#d52b1e']);
    R(0, 0, 6, 6, '#0039a6');
    S(3, 3, 2.2, '#ffffff');
  }],
  ['DE', 'Germany', ({ H }) => H(['#000000', '#dd0000', '#ffce00'])],
  ['FR', 'France', ({ V }) => V(['#0055a4', '#ffffff', '#ef4135'])],
  ['IT', 'Italy', ({ V }) => V(['#009246', '#ffffff', '#ce2b37'])],
  ['ES', 'Spain', ({ H, R }) => {
    H(['#aa151b', '#f1bf00', '#aa151b'], [1, 2, 1]);
    R(4, 4, 2, 4, '#aa151b');
  }],
  ['PT', 'Portugal', ({ V, D }) => {
    V(['#006600', '#ff0000'], [2, 3]);
    D(7, 6, 2.4, '#ffff00');
    D(7, 6, 1.4, '#ff0000');
  }],
  ['NL', 'Netherlands', ({ H }) => H(['#ae1c28', '#ffffff', '#21468b'])],
  ['BE', 'Belgium', ({ V }) => V(['#000000', '#fdda24', '#ef3340'])],
  ['CH', 'Switzerland', ({ R }) => {
    R(0, 0, 18, 12, '#da291c');
    R(8, 2, 2, 8, '#ffffff');
    R(5, 5, 8, 2, '#ffffff');
  }],
  ['SE', 'Sweden', ({ N }) => N('#006aa7', '#fecc00')],
  ['NO', 'Norway', ({ N }) => N('#ba0c2f', '#00205b', '#ffffff')],
  ['DK', 'Denmark', ({ N }) => N('#c8102e', '#ffffff')],
  ['FI', 'Finland', ({ N }) => N('#ffffff', '#002f6c')],
  ['PL', 'Poland', ({ H }) => H(['#ffffff', '#dc143c'])],
  ['UA', 'Ukraine', ({ H }) => H(['#0057b7', '#ffd700'])],
  ['RU', 'Russia', ({ H }) => H(['#ffffff', '#0039a6', '#d52b1e'])],
  ['GR', 'Greece', ({ R }) => {
    for (let j = 0; j < 12; j++) R(0, j, 18, 1, Math.floor(j / 1.34) % 2 ? '#ffffff' : '#0d5eaf');
    R(0, 0, 7, 7, '#0d5eaf');
    R(3, 0, 1, 7, '#ffffff');
    R(0, 3, 7, 1, '#ffffff');
  }],
  ['TR', 'Turkey', ({ R, C, S }) => {
    R(0, 0, 18, 12, '#e30a17');
    C(7, 6, 3.4, 1.2, '#ffffff');
    S(11, 6, 1, '#ffffff');
  }],
  ['SA', 'Saudi Arabia', ({ R }) => {
    R(0, 0, 18, 12, '#006c35');
    R(4, 4, 10, 2, '#ffffff');
    R(5, 8, 8, 1, '#ffffff');
  }],
  ['AE', 'United Arab Emirates', ({ H, R }) => {
    H(['#00732f', '#ffffff', '#000000']);
    R(0, 0, 5, 12, '#ff0000');
  }],
  ['QA', 'Qatar', ({ R }) => {
    R(0, 0, 18, 12, '#8a1538');
    for (let j = 0; j < 12; j++) R(0, j, 5 + (j % 2), 1, '#ffffff');
  }],
  ['EG', 'Egypt', ({ H, D }) => {
    H(['#ce1126', '#ffffff', '#000000']);
    D(9, 6, 1.4, '#c09300');
  }],
  ['NG', 'Nigeria', ({ V }) => V(['#008751', '#ffffff', '#008751'])],
  ['ZA', 'South Africa', ({ H, R }) => {
    H(['#de3831', '#ffffff', '#007a4d', '#ffffff', '#002395'], [5, 1, 3, 1, 5]);
    for (let j = 0; j < 12; j++) {
      const w = Math.round(7 - Math.abs(j + 0.5 - 6) * 1.15);
      R(0, j, w + 1, 1, '#ffffff');
      R(0, j, w, 1, '#007a4d');
      R(0, j, Math.max(0, w - 2), 1, '#ffb612');
      R(0, j, Math.max(0, w - 3), 1, '#000000');
    }
  }],
];
const FLAG_BY = Object.fromEntries(FLAGS.map((f) => [f[0], f]));
const isFlag = (c) => typeof c === 'string' && !!FLAG_BY[c];
const FLAG_PICS = {};
function flagCanvas(code) {
  if (FLAG_PICS[code]) return FLAG_PICS[code];
  const f = FLAG_BY[code];
  if (!f) return null;
  const c = document.createElement('canvas');
  c.width = FLAG_W;
  c.height = FLAG_H;
  const x = c.getContext('2d');
  f[2](flagPainter(x), x);
  return (FLAG_PICS[code] = c);
}
// a grid of flag buttons; onPick(code or null). `none` adds a "no flag" button first.
function flagGrid(box, selected, onPick, none = true) {
  box.innerHTML = '';
  const add = (code, title) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'flagbtn' + ((code || null) === (selected || null) ? ' on' : '');
    b.title = title;
    b.setAttribute('aria-label', title);
    if (code) {
      const im = flagCanvas(code).cloneNode();
      im.getContext('2d').drawImage(flagCanvas(code), 0, 0);
      b.appendChild(im);
    } else b.textContent = '—';
    b.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      selected = code;
      box.querySelectorAll('.flagbtn').forEach((x) => x.classList.toggle('on', x === b));
      onPick(code);
    };
    box.appendChild(b);
  };
  if (none) add(null, 'No flag');
  for (const [code, name] of FLAGS) add(code, name);
}
const flagName = (c) => (FLAG_BY[c] ? FLAG_BY[c][1] : 'No flag');

// the flag this player picked (null = none); saved with the player as `flag`
let myFlag = null;
