// Game loop. Loaded last: starts loading the images.
// ===== loop =====
function loop(ts) {
  const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
  last = ts;
  now += dt * 1000;
  if ($('start').hidden && $('worlds').hidden && $('menu').hidden && !Net.loading && !doorTrip) {
    let t = dt;
    while (t > 0) {
      const h = Math.min(1 / 120, t);
      step(h);
      t -= h;
    }
    if (ptr.down && $('inv').hidden) {
      actT -= dt;
      const t = tileUnder();
      if (placingHand() && actTile && (t.x !== actTile.x || t.y !== actTile.y)) {
        // placing blocks / backgrounds / seeds: every new tile the finger or mouse moves onto gets one at once,
        // tiles skipped between two frames too, so dragging places as smoothly as breaking
        dragPlace(actTile, t);
        actT = 0.24;
      } else if (actT <= 0) {
        act();
        actTile = t;
        actT = (heldTool(hand) && heldTool(hand).rate) || 0.24; // fancy pickaxes swing faster
      }
    }
  }
  const vw = cv.width / Z,
    vh = cv.height / Z;
  const tx = P.x + P.w / 2 - vw / 2,
    ty = P.y + P.h / 2 - vh * 0.55;
  // the camera eases after you (a little delay), but never lets you get more than CAM_LAG of the screen away
  // from the middle, so falling or flying fast you stay in view
  cam.x += (tx - cam.x) * Math.min(1, dt * 8);
  cam.y += (ty - cam.y) * Math.min(1, dt * 9);
  const lx = vw * CAM_LAG,
    ly = vh * CAM_LAG;
  cam.x = Math.max(tx - lx, Math.min(tx + lx, cam.x));
  cam.y = Math.max(ty - ly, Math.min(ty + ly, cam.y));
  cam.x = Math.max(0, Math.min(WW * TS - vw, cam.x));
  cam.y = Math.max(-vh * 0.3, Math.min(WH * TS - vh, cam.y));
  shake = Math.max(0, shake - dt * 20);
  Net.tick(dt);
  const dz = doorZoomBegin(); // walking through a door: the camera zooms into it (signs.js)
  render();
  doorZoomEnd(dz);
  $('coords').textContent = `X ${Math.floor((P.x + P.w / 2) / TS)}  Y ${Math.floor((P.y + P.h - 1) / TS)}`;
  requestAnimationFrame(loop);
}

loadAssets();
