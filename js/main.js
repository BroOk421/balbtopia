// Game loop. Loaded last: starts loading the images.
// ===== loop =====
function loop(ts) {
  const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
  last = ts;
  now += dt * 1000;
  if ($('start').hidden && $('worlds').hidden) {
    let t = dt;
    while (t > 0) {
      const h = Math.min(1 / 120, t);
      step(h);
      t -= h;
    }
    if (ptr.down && $('inv').hidden) {
      actT -= dt;
      if (actT <= 0) {
        act();
        actT = 0.24;
      }
    }
  }
  const vw = cv.width / Z,
    vh = cv.height / Z;
  const tx = P.x + P.w / 2 - vw / 2,
    ty = P.y + P.h / 2 - vh * 0.55;
  cam.x += (tx - cam.x) * Math.min(1, dt * 8);
  cam.y += (ty - cam.y) * Math.min(1, dt * 8);
  cam.x = Math.max(0, Math.min(WW * TS - vw, cam.x));
  cam.y = Math.max(-vh * 0.3, Math.min(WH * TS - vh, cam.y));
  shake = Math.max(0, shake - dt * 20);
  render();
  $('coords').textContent = `X ${Math.floor((P.x + P.w / 2) / TS)}  Y ${Math.floor((P.y + P.h - 1) / TS)}`;
  requestAnimationFrame(loop);
}

loadAssets();
