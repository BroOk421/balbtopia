// Hand-drawn 1 px art (see HD_TEX / HD_DECO in blocks.js)
// Batch D: signs, doors, fences, traps and the world machines. Each painter draws on a 32x32 canvas at 1 px,
// light from the top left, dark outline. f is the frame from decoFrame.
(() => {
  const K = '#1a1210'; // outline
  // a metal or wooden post from y0 to the bottom, with a foot
  function post(R, cx, y0, [dark, mid, light], foot = '#2e323c') {
    R(cx - 2, y0, 4, 32 - y0, K);
    R(cx - 1, y0, 2, 32 - y0, mid);
    R(cx - 1, y0, 1, 32 - y0, light);
    R(cx - 5, 30, 10, 2, foot);
    R(cx - 4, 30, 8, 1, dark);
  }
  // a stick-like spike pointing up (death spikes) or down (stalactite), width shrinking to a point
  function spike(P, cx, top, len, up, [outline, face, lit, dark]) {
    for (let k = 0; k < len; k++) {
      const t = up ? (k + 1) / len : 1 - k / len, // 1 at the wide end
        half = Math.max(0.5, t * (up ? 3.4 : 4.6)),
        j = top + k;
      for (let i = Math.floor(cx - half); i <= Math.ceil(cx + half) - 1; i++) {
        const edge = i === Math.floor(cx - half) || i === Math.ceil(cx + half) - 1;
        P(i, j, edge ? outline : i < cx - half / 3 ? lit : i > cx + half / 3 ? dark : face);
      }
    }
  }

  Object.assign(HD_DECO, {
    // wooden arrow sign pointing right, on a post
    pointy_sign(x, { P, R }) {
      post(R, 9, 17, ['#2a1a0e', '#8a5a32', '#a86c3c'], K);
      // board with an arrow point on the right
      for (let j = 3; j < 19; j++) {
        const d = Math.abs(j - 10.5),
          tip = 31 - Math.round(d);
        for (let i = 0; i <= tip; i++) {
          const edge = i === 0 || i === tip || j === 3 || j === 18;
          if (edge) {
            P(i, j, K);
            continue;
          }
          const n = hdNoise(Math.floor(j / 2), Math.floor(i / 6));
          P(i, j, j === 4 ? '#f0c890' : j === 17 ? '#a86c3c' : n < 0.15 ? '#c08048' : n > 0.85 ? '#e8b680' : '#d8a066');
        }
      }
      // writing and nails
      R(4, 9, 15, 2, '#6b4424');
      R(4, 13, 10, 1, '#6b4424');
      for (const j of [6, 15]) {
        P(3, j, '#4a4a58');
        P(3, j - 1, '#d4d8e0');
      }
    },
    // heavy wooden door with iron bands set in a grey stone wall
    dungeon_door(x, { P, R, E }) {
      // stone wall in rows of blocks
      for (let j = 0; j < 32; j++)
        for (let i = 0; i < 32; i++) {
          const row = Math.floor(j / 8),
            off = row % 2 ? 4 : 0,
            seam = j % 8 === 0 || (i + off) % 10 === 0;
          const n = hdNoise(i, j);
          P(i, j, seam ? '#2a2e38' : j % 8 === 1 ? '#4e5462' : n < 0.12 ? '#343844' : '#3a3f4b');
        }
      // arched doorway
      for (let j = 4; j < 32; j++)
        for (let i = 5; i < 27; i++) {
          if (j < 12 && Math.hypot((i + 0.5 - 16) / 11, (j + 0.5 - 12) / 8) > 1) continue;
          P(i, j, K);
        }
      for (let j = 6; j < 32; j++)
        for (let i = 7; i < 25; i++) {
          if (j < 12 && Math.hypot((i + 0.5 - 16) / 9, (j + 0.5 - 12) / 6.5) > 1) continue;
          const plank = Math.floor((i - 7) / 4.5),
            seam = (i - 7) % 4.5 < 1 && i > 7;
          const n = hdNoise(plank, Math.floor(j / 4));
          P(i, j, seam ? '#4a2c16' : i === 7 ? '#a86c3c' : n < 0.2 ? '#5e3a1e' : '#6b4424');
        }
      // iron bands with rivets
      for (const y of [13, 24]) {
        R(7, y, 18, 3, '#2e323c');
        R(7, y, 18, 1, '#9aa0ad');
        for (let i = 9; i < 24; i += 4) P(i, y + 1, '#c3c9d4');
      }
      // ring handle
      E(20.5, 19.5, 2, 2, '#2e323c');
      E(20.5, 19.5, 1, 1, '#6b4424');
      P(19, 18, '#c3c9d4');
    },
    // white picket fence: three pointed pickets on two rails (rails run to both edges)
    picket_fence(x, { P, R }) {
      // rails behind the pickets
      for (const y of [12, 22]) {
        R(0, y, 32, 4, '#8a8a96');
        R(0, y + 1, 32, 2, '#d8d8e0');
        R(0, y + 1, 32, 1, '#f2f2f6');
      }
      for (const i of [2, 12, 22]) {
        // pointed top
        for (let k = 0; k < 4; k++) R(i + 3 - k, 2 + k, 2 + 2 * k, 1, '#6a6a76');
        R(i, 6, 8, 26, '#6a6a76');
        for (let k = 1; k < 4; k++) R(i + 4 - k, 2 + k, 2 * k, 1, '#f2f2f6');
        R(i + 1, 6, 6, 26, '#e8e8f0');
        R(i + 1, 6, 2, 26, '#ffffff');
        R(i + 6, 6, 1, 26, '#b8b8c4');
        // nail heads on the rails
        P(i + 3, 14, '#8a8a96');
        P(i + 3, 24, '#8a8a96');
        if (hdNoise(i, 3) > 0.5) P(i + 4, 9, '#c8c8d2');
      }
    },
    // little house front: red roof, cream walls, a door and two windows
    house_entrance(x, { P, R, E }) {
      // roof
      for (let k = 0; k < 8; k++) {
        R(8 - k, k, 16 + 2 * k, 1, '#4a0a06');
        if (k > 0) R(9 - k, k, 14 + 2 * k, 1, k % 2 ? '#b8301e' : '#a8281a');
        if (k > 0) P(9 - k, k, '#e05a40');
      }
      R(0, 8, 32, 3, '#4a0a06');
      R(1, 8, 30, 2, '#7a1a10');
      for (let i = 2; i < 30; i += 3) P(i, 9, '#5a120a');
      // walls with siding lines
      R(2, 11, 28, 21, '#8a7a5a');
      R(3, 11, 26, 21, '#f2e6cc');
      for (let j = 14; j < 32; j += 3) R(3, j, 26, 1, '#e0d0b0');
      R(3, 11, 1, 21, '#c8b898');
      // windows
      for (const i of [5, 22]) {
        R(i, 14, 6, 6, '#5a3a20');
        R(i + 1, 15, 4, 4, '#9fd6f5');
        R(i + 1, 15, 2, 2, '#d8f2ff');
        R(i + 3, 15, 1, 4, '#5a3a20');
        R(i + 1, 17, 4, 1, '#5a3a20');
        R(i - 1, 20, 8, 1, '#8a5a32');
      }
      // door
      R(12, 15, 8, 17, '#2a1a0e');
      R(13, 16, 6, 16, '#c98a52');
      R(13, 16, 6, 1, '#e0b07a');
      R(14, 18, 4, 5, '#a86c3c');
      R(14, 25, 4, 5, '#a86c3c');
      P(18, 24, '#ffd23f');
      P(18, 23, '#fff4b8');
      // step
      R(11, 31, 10, 1, '#8a8a96');
    },
    // rough wooden fence: three uneven posts with two rails
    rustic_fence(x, { P, R }) {
      for (const y of [12, 22]) {
        R(0, y, 32, 4, '#3a2414');
        for (let i = 0; i < 32; i++) {
          P(i, y + 1, hdNoise(i, y) < 0.2 ? '#8a5a32' : '#a86c3c');
          P(i, y + 2, hdNoise(i, y + 1) < 0.25 ? '#5a3a20' : '#6b4424');
        }
      }
      for (const [i, top] of [[2, 6], [12, 3], [22, 8]]) {
        R(i, top, 8, 32 - top, '#3a2414');
        R(i + 1, top - 1, 6, 1, '#3a2414');
        for (let j = top; j < 32; j++)
          for (let ii = i + 1; ii < i + 7; ii++) {
            const n = hdNoise(ii, Math.floor(j / 3));
            P(ii, j, ii === i + 1 ? '#b07a4a' : ii === i + 6 ? '#5a3a20' : n < 0.18 ? '#6b4424' : '#8a5a32');
          }
        // cut top and a knot
        R(i + 1, top, 6, 1, '#c98a52');
        P(i + 3, top + 9, '#3a2414');
        P(i + 4, top + 9, '#5a3a20');
      }
    },
    // flag on a pole: grey/white, green when it's the one you'll come back to (f = 1)
    checkpoint(x, { P, R }, f = 0) {
      const c = f ? ['#1a4a16', '#2a6e22', '#4caf3a', '#7ccf5a', '#c8ffb0'] : ['#3a3f4b', '#7a808e', '#c3c9d4', '#e8e8ee', '#ffffff'];
      // pole with a ball on top
      R(6, 3, 4, 27, '#1e2028');
      R(7, 3, 2, 27, '#9aa0ad');
      R(7, 3, 1, 27, '#d4d8e0');
      R(6, 1, 4, 3, '#1e2028');
      R(7, 1, 2, 2, '#ffd23f');
      P(7, 1, '#fff4b8');
      R(2, 29, 12, 3, '#1e2028');
      R(3, 29, 10, 1, '#5a606e');
      // waving flag
      for (let i = 10; i < 30; i++) {
        const wave = Math.round(Math.sin((i - 10) * 0.35) * 1.5),
          top = 4 + wave,
          bot = 18 + wave - Math.floor((i - 10) / 10);
        for (let j = top; j <= bot; j++) {
          const edge = j === top || j === bot || i === 29;
          const shade = Math.sin((i - 10) * 0.35 + 1.2);
          P(i, j, edge ? c[0] : j === top + 1 ? c[4] : shade > 0.5 ? c[3] : shade < -0.5 ? c[1] : c[2]);
        }
      }
      // a star on the flag
      const sx = 19,
        sy = 11;
      for (const [a, b] of [[0, -2], [0, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [0, 1], [-1, 2], [1, 2]]) P(sx + a, sy + b, c[4]);
    },
    // iron street lamp; the glow pulses a little (2 frames)
    streetlamp(x, { P, R, E }, f = 0) {
      // glow
      E(16, 8, 15, 12, f ? 'rgba(255,230,120,.16)' : 'rgba(255,230,120,.09)');
      E(16, 8, 10, 8, f ? 'rgba(255,230,120,.2)' : 'rgba(255,230,120,.12)');
      // pole
      R(14, 15, 4, 15, '#1e2028');
      R(15, 15, 2, 15, '#4a4f5c');
      R(15, 15, 1, 15, '#7a808e');
      R(13, 20, 6, 2, '#1e2028');
      R(10, 29, 12, 3, '#1e2028');
      R(11, 29, 10, 1, '#5a606e');
      // lamp head: roof, glass, base
      R(12, 0, 8, 1, '#1e2028');
      R(10, 1, 12, 3, '#1e2028');
      R(11, 2, 10, 1, '#4a4f5c');
      R(11, 4, 10, 8, '#1e2028');
      R(12, 4, 8, 7, f ? '#ffe680' : '#ffd23f');
      R(12, 4, 8, 2, f ? '#fffbe0' : '#fff4b8');
      R(15, 4, 2, 7, '#1e2028');
      R(11, 11, 10, 2, '#1e2028');
      R(12, 13, 8, 2, '#1e2028');
      P(12, 6, '#ffffff');
    },
    // carnivorous plant hanging from the ceiling, jaws open downwards
    hanging_guytrap(x, { P, R, E }) {
      // vine with leaves
      for (let j = 0; j < 12; j++) {
        const o = Math.round(Math.sin(j * 0.6));
        P(15 + o, j, '#1a4a16');
        P(16 + o, j, '#4caf3a');
        P(17 + o, j, '#2a6e22');
      }
      for (const [cx, cy, s] of [[10, 4, -1], [22, 6, 1]]) {
        E(cx, cy, 4, 2, '#1a4a16');
        E(cx, cy, 3, 1.2, '#4caf3a');
        P(cx - s, cy, '#8fe06a');
      }
      // head
      E(16, 20, 12, 10, '#0e2a0c');
      E(16, 20, 11, 9, '#3f9a30');
      E(14, 17, 7, 5, '#5cbf4a');
      for (const [i, j] of [[9, 15], [21, 14], [12, 26], [22, 24]]) P(i, j, '#8fe06a');
      // mouth with teeth
      R(6, 21, 20, 6, '#4a0614');
      R(7, 22, 18, 4, '#d01a3a');
      R(7, 22, 18, 1, '#ff5a72');
      for (let i = 7; i < 25; i += 3) {
        P(i, 21, '#ffffff');
        P(i + 1, 21, '#ffffff');
        P(i + 1, 22, '#ffffff');
        P(i + 1, 26, '#ffffff');
        P(i + 2, 26, '#ffffff');
        P(i + 1, 25, '#e0e0e8');
      }
    },
    // carnivorous plant growing from the ground, jaws open upwards
    venus_guytrap(x, { P, R, E }) {
      // stem with leaves
      for (let j = 17; j < 32; j++) {
        const o = Math.round(Math.sin(j * 0.5) * 0.8);
        P(15 + o, j, '#1a4a16');
        P(16 + o, j, '#4caf3a');
        P(17 + o, j, '#2a6e22');
      }
      for (const [cx, cy, s] of [[9, 26, -1], [23, 24, 1]]) {
        E(cx, cy, 5, 2.2, '#1a4a16');
        E(cx, cy, 4, 1.4, '#4caf3a');
        P(cx - 2 * s, cy, '#8fe06a');
      }
      // head
      E(16, 11, 13, 10, '#0e2a0c');
      E(16, 11, 12, 9, '#3f9a30');
      E(14, 7, 8, 4, '#5cbf4a');
      for (const [i, j] of [[8, 6], [23, 5], [10, 17], [22, 16]]) P(i, j, '#8fe06a');
      // pink mouth with teeth top and bottom
      R(5, 9, 22, 7, '#4a0624');
      R(6, 10, 20, 5, '#ff6ab0');
      R(6, 12, 20, 1, '#7a0a3a');
      R(6, 10, 20, 1, '#ffa8d4');
      for (let i = 6; i < 26; i += 3) {
        P(i, 9, '#ffffff');
        P(i + 1, 9, '#ffffff');
        P(i + 1, 10, '#ffffff');
        P(i + 1, 15, '#ffffff');
        P(i + 2, 15, '#ffffff');
        P(i + 1, 14, '#e0e0e8');
      }
    },
    // wooden screen door: mesh on top, panel below, brass handle
    screen_door(x, { P, R }) {
      R(4, 0, 24, 32, '#2a1a0e');
      R(5, 0, 22, 32, '#8a5a32');
      R(5, 0, 2, 32, '#a86c3c');
      R(25, 0, 2, 32, '#6b4424');
      // mesh window
      R(8, 3, 16, 13, '#3a2414');
      for (let j = 4; j < 15; j++)
        for (let i = 9; i < 23; i++) P(i, j, (i + j) % 2 ? '#c3c9d4' : '#9aa0ad');
      R(9, 4, 14, 1, '#e0e4ec');
      for (let k = 0; k < 4; k++) P(10 + k, 8 - k, '#ffffff');
      // crossbar and lower panel
      R(5, 16, 22, 2, '#6b4424');
      R(5, 16, 22, 1, '#c98a52');
      R(8, 19, 16, 11, '#3a2414');
      R(9, 20, 14, 9, '#a86c3c');
      R(9, 20, 14, 1, '#c98a52');
      R(10, 22, 12, 5, '#93582f');
      // handle and hinges
      R(22, 15, 2, 4, '#7a5206');
      P(22, 15, '#ffe680');
      for (const j of [3, 26]) {
        R(5, j, 2, 3, '#4a4a58');
        P(5, j, '#c3c9d4');
      }
    },
    // red barn door with a white frame and a white X
    barn_door(x, { P, R }) {
      R(1, 0, 30, 32, '#3a0604');
      // vertical red planks
      for (let j = 0; j < 32; j++)
        for (let i = 2; i < 30; i++) {
          const seam = (i - 2) % 5 === 0 && i > 2,
            n = hdNoise(Math.floor((i - 2) / 5), Math.floor(j / 4));
          P(i, j, seam ? '#7a1410' : n < 0.25 ? '#a8241a' : '#b8281e');
        }
      // white frame and X, with a shaded edge
      const W = '#f2f2f2',
        Ws = '#c8c8d0';
      R(2, 1, 28, 3, W);
      R(2, 28, 28, 3, W);
      R(2, 1, 3, 30, W);
      R(27, 1, 3, 30, W);
      R(2, 3, 28, 1, Ws);
      R(2, 30, 28, 1, Ws);
      for (let k = 0; k < 24; k++) {
        R(4 + k, 4 + k, 3, 1, W);
        R(25 - k, 4 + k, 3, 1, W);
        P(6 + k, 4 + k, Ws);
        P(27 - k, 4 + k, Ws);
      }
      // hinges
      for (const j of [6, 23]) {
        R(0, j, 3, 3, '#2e323c');
        P(1, j + 1, '#9aa0ad');
      }
    },
    // big orange arrow pointing right
    big_old_sideways_arrow(x, { P, R }) {
      const O = '#5a2a04';
      for (let j = 3; j < 29; j++)
        for (let i = 0; i < 32; i++) {
          const head = i >= 17 && Math.abs(j + 0.5 - 16) <= (31.5 - i) * 0.9,
            shaft = i < 19 && j >= 10 && j < 22;
          if (!head && !shaft) continue;
          P(i, j, '#f07a1e');
        }
      // outline, light and shade by checking neighbours
      const inA = (i, j) =>
        j >= 3 && j < 29 && i >= 0 && i < 32 && ((i >= 17 && Math.abs(j + 0.5 - 16) <= (31.5 - i) * 0.9) || (i < 19 && j >= 10 && j < 22));
      for (let j = 3; j < 29; j++)
        for (let i = 0; i < 32; i++) {
          if (!inA(i, j)) continue;
          if (!inA(i - 1, j) || !inA(i + 1, j) || !inA(i, j - 1) || !inA(i, j + 1)) P(i, j, O);
          else if (!inA(i, j - 2) || !inA(i - 2, j)) P(i, j, '#ffad60');
          else if (!inA(i, j + 2) || !inA(i + 2, j)) P(i, j, '#c85a10');
        }
      for (let i = 3; i < 14; i += 4) P(i, 13, '#ffd0a0');
    },
    // looks just like a wood block, so nobody guesses it's a way through
    secret_passage(x) {
      x.drawImage(texCanvas('wood_block'), 0, 0, 32, 32);
      x.fillStyle = '#2a1a0e';
      x.fillRect(0, 0, 32, 1);
    },
    // yellow warning triangle with "!" on a post
    danger_sign(x, { P, R }) {
      post(R, 16, 20, ['#2e323c', '#5a606e', '#9aa0ad']);
      for (let j = 0; j < 22; j++) {
        const half = (j + 1) * 0.72;
        for (let i = Math.floor(16 - half); i < Math.ceil(16 + half); i++) {
          const edge = j > 18 || i < 16 - half + 1.6 || i > 16 + half - 1.6;
          P(i, j, edge ? K : j < 6 || i < 13 ? '#ffe066' : '#ffd23f');
        }
      }
      // inner black border line
      for (let j = 5; j < 18; j++) {
        const half = (j + 1) * 0.72 - 3;
        P(Math.floor(16 - half), j, '#c9a826');
        P(Math.ceil(16 + half) - 1, j, '#c9a826');
      }
      // "!" mark
      R(15, 7, 2, 7, K);
      R(14, 8, 4, 4, K);
      R(15, 16, 2, 2, K);
    },
    // orange biohazard sign: three-lobed symbol, on a post
    biohazard_sign(x, { P, R, E }) {
      post(R, 16, 22, ['#2e323c', '#5a606e', '#9aa0ad']);
      R(2, 1, 28, 23, K);
      R(3, 2, 26, 21, '#f07a1e');
      R(3, 2, 26, 1, '#ffad60');
      R(3, 2, 1, 21, '#ffad60');
      R(3, 22, 26, 1, '#b8500e');
      // symbol: three rings round a centre
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k * Math.PI * 2) / 3,
          cx = 16 + Math.cos(a) * 4.2,
          cy = 12.5 + Math.sin(a) * 4.2;
        E(cx, cy, 4.2, 4.2, K);
        E(cx + Math.cos(a) * 1.4, cy + Math.sin(a) * 1.4, 2.6, 2.6, '#f07a1e');
      }
      E(16, 12.5, 2.4, 2.4, '#f07a1e');
      E(16, 12.5, 1.4, 1.4, K);
      for (let i = 4; i < 28; i++) for (let j = 2; j < 23; j++) if (Math.hypot(i + 0.5 - 16, j + 0.5 - 12.5) > 9.2 && Math.hypot(i + 0.5 - 16, j + 0.5 - 12.5) < 9.9) P(i, j, K);
    },
    // a row of sharp steel spikes on a metal base
    death_spikes(x, { P, R }) {
      R(0, 26, 32, 6, '#1e2028');
      R(0, 27, 32, 4, '#4a4f5c');
      R(0, 27, 32, 1, '#7a808e');
      for (let i = 3; i < 32; i += 8) P(i, 29, '#2e323c');
      for (const cx of [4, 12, 20, 28]) spike(P, cx, 6, 20, true, ['#2e323c', '#c3c9d4', '#ffffff', '#7a808e']);
      // blood-red tips
      for (const cx of [4, 12, 20, 28]) {
        P(cx - 1, 6, '#c8102e');
        P(cx - 1, 7, '#8a0a1e');
      }
    },
    // purple rock icicles hanging from the ceiling
    stalactite(x, { P, R }) {
      R(0, 0, 32, 6, '#1a1222');
      for (let i = 0; i < 32; i++) {
        P(i, 4, hdNoise(i, 4) < 0.3 ? '#3a2e4a' : '#2c2236');
        P(i, 5, '#2c2236');
      }
      for (const [cx, len] of [[5, 18], [15, 26], [25, 14]]) spike(P, cx, 5, len, false, ['#1a1222', '#6a5884', '#9a88b4', '#463858']);
      // drip at the end of the longest
      P(14, 31, '#9fd6f5');
    },
    // iron gate bars with cross bars and spiked ends (joins the tile below)
    portcullis(x, { P, R }) {
      R(0, 0, 32, 4, '#1e2028');
      R(0, 1, 32, 2, '#4a4f5c');
      R(0, 1, 32, 1, '#7a808e');
      for (const y of [10, 20]) {
        R(0, y, 32, 4, '#1e2028');
        R(0, y + 1, 32, 2, '#4a4f5c');
        R(0, y + 1, 32, 1, '#7a808e');
      }
      for (let i = 2; i < 32; i += 8) {
        R(i, 4, 5, 25, '#1e2028');
        R(i + 1, 4, 3, 25, '#5a606e');
        R(i + 1, 4, 1, 25, '#9aa0ad');
        // rivets where bars cross
        for (const y of [11, 21]) P(i + 2, y + 1, '#c3c9d4');
        // spiked end
        R(i, 29, 5, 1, '#1e2028');
        R(i + 1, 29, 3, 2, '#1e2028');
        P(i + 2, 31, '#1e2028');
        P(i + 2, 29, '#9aa0ad');
      }
    },
  });

  // ---------- weather machines: a glass dome on a stand (snow globe / sunny globe) ----------
  function weatherGlobe(x, { P, R, E }, base, scene) {
    const [bd, bm, bl] = base;
    // stand
    R(3, 24, 26, 8, K);
    R(4, 25, 24, 6, bm);
    R(4, 25, 24, 1, bl);
    R(4, 30, 24, 1, bd);
    R(6, 27, 20, 2, bd);
    R(6, 27, 20, 1, bl);
    // dome
    E(16, 14, 13, 13, K);
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++) {
        if (Math.hypot(i + 0.5 - 16, j + 0.5 - 14) > 12 || j > 24) continue;
        scene(i, j);
      }
    // glass rim shine
    for (let k = 0; k < 7; k++) P(7 + Math.round(k * 0.6), 9 - k, 'rgba(255,255,255,.7)');
    P(8, 11, 'rgba(255,255,255,.5)');
    // gold knob on the stand, gold light on top
    R(14, 23, 4, 5, K);
    R(15, 24, 2, 3, '#ffd23f');
    P(15, 24, '#fff4b8');
    R(14, 0, 4, 2, K);
    R(15, 0, 2, 2, '#ffd23f');
    P(15, 0, '#fff4b8');
  }
  HD_DECO.snow_weather_machine = (x, h) =>
    weatherGlobe(x, h, ['#3a5498', '#5a7ac8', '#8aa8e8'], (i, j) => {
      const { P } = h;
      // night-blue sky, snowy mountain, snow on the ground, flakes
      let c = j < 14 ? '#3a5cb0' : '#5a7cd0';
      const m = 16 - Math.abs(i + 0.5 - 15) * 0.9;
      if (j >= 22 - Math.max(0, m - 6) * 1.1 && j > 9) c = j < 13 ? '#ffffff' : j < 17 ? '#c8d6f0' : '#8aa2d4';
      if (j >= 21) c = j === 21 ? '#ffffff' : '#e8f0fc';
      if ([[10, 7], [21, 6], [19, 12], [8, 15], [24, 16], [13, 4]].some(([a, b]) => a === i && b === j)) c = '#ffffff';
      P(i, j, c);
    });
  HD_DECO.sunny_weather_machine = (x, h) =>
    weatherGlobe(x, h, ['#a86c10', '#e0a020', '#ffd23f'], (i, j) => {
      const { P } = h;
      // blue sky, sun with rays, a cloud, green hills
      let c = j < 12 ? '#5ab4f0' : '#8ad0ff';
      const ds = Math.hypot(i + 0.5 - 20, j + 0.5 - 9);
      if (ds < 3.5) c = ds < 1.6 ? '#fff6c0' : '#ffd23f';
      else if (ds < 6 && (Math.abs(i + 0.5 - 20) < 0.8 || Math.abs(j + 0.5 - 9) < 0.8)) c = '#ffe680';
      if ((j === 10 && i >= 7 && i <= 12) || (j === 9 && i >= 8 && i <= 11)) c = '#ffffff';
      if (j === 11 && i >= 7 && i <= 12) c = '#d8ecff';
      if (Math.hypot(i + 0.5 - 11, (j + 0.5 - 25) * 1.2) < 8) c = '#4caf3a';
      if (Math.hypot(i + 0.5 - 22, (j + 0.5 - 26) * 1.2) < 8) c = j < 20 ? '#7ccf5a' : '#3f9a30';
      if (j >= 22) c = '#3f9a30';
      P(i, j, c);
    });

  // ---------- jammers: a small machine in the Gold Lock's dark box; light blinks (2 frames) ----------
  function jammerBoxHD({ P, R }, light, glow) {
    R(0, 0, 32, 32, '#14101c');
    R(2, 2, 28, 28, '#3a3350');
    R(4, 4, 24, 24, '#2a2440');
    R(2, 2, 28, 1, '#4a4266');
    R(2, 2, 1, 28, '#4a4266');
    // antenna with its light
    R(15, 6, 2, 8, '#14101c');
    R(15, 7, 1, 6, '#9aa0ad');
    R(13, 4, 6, 3, '#14101c');
    R(14, 4, 4, 2, light);
    P(14, 4, glow);
    // the machine
    R(6, 14, 20, 12, '#14101c');
    R(7, 15, 18, 10, '#6a707e');
    R(7, 15, 18, 1, '#9aa0ad');
    R(7, 15, 1, 10, '#9aa0ad');
    R(7, 24, 18, 1, '#4a4f5c');
    R(9, 17, 14, 6, '#1e2028');
    R(9, 17, 14, 1, '#2e323c');
    // bolts
    for (const [i, j] of [[8, 16], [23, 16], [8, 23], [23, 23]]) P(i, j, '#c3c9d4');
  }
  HD_DECO.signal_jammer = (x, h, f = 0) => {
    const { P, R } = h;
    jammerBoxHD(h, f ? '#ff4a2a' : '#7a1a10', f ? '#ffb0a0' : '#a83a2a');
    // radio waves round the antenna
    const wc = f ? '#ffd23f' : '#c98a12';
    for (const s of [-1, 1])
      for (let k = 0; k < 2; k++) {
        const r = 5 + k * 3;
        for (let t = -1; t <= 1; t++) P(16 + s * r - (s > 0 ? 1 : 0), 5 + t, wc);
        P(16 + s * (r - 1) - (s > 0 ? 1 : 0), 3, wc);
        P(16 + s * (r - 1) - (s > 0 ? 1 : 0), 7, wc);
      }
    // screen: signal bars crossed out, red and green lights
    for (let k = 0; k < 4; k++) R(11 + k * 2, 21 - k, 1, k + 1, '#7ccf5a');
    for (let k = 0; k < 6; k++) P(11 + k, 18 + Math.floor(k / 2), '#ff4a2a');
    P(20, 19, '#ff4a2a');
    P(21, 21, '#7ccf5a');
  };
  HD_DECO.punch_jammer = (x, h, f = 0) => {
    const { P, R } = h;
    jammerBoxHD(h, f ? '#ffd23f' : '#8a6a10', f ? '#fff4b8' : '#c9a826');
    // a little fist on the screen with a red line through it
    R(12, 18, 8, 4, '#f2b786');
    R(12, 18, 8, 1, '#ffd8b8');
    for (const i of [14, 16, 18]) P(i, 19, '#c98a6a');
    R(11, 20, 2, 2, '#f2b786');
    for (let k = 0; k < 7; k++) {
      P(11 + k * 2, 22 - k, '#ff4a2a');
      P(12 + k * 2, 22 - k, '#ff4a2a');
    }
  };
})();
