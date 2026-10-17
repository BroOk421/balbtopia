// Online play with Supabase: accounts, saves in the cloud and other players in the same world.
// Turned on by filling in SUPABASE_URL and SUPABASE_ANON_KEY in online-config.js.
// Without them, Net.online is false and the game keeps everything on this device.
//
// Realtime (one channel per world, "world:NAME"):
//   p        position, facing, walking, skin and clothes, about 10 times a second
//   punch    someone threw a punch at a point
//   tiles    blocks, backgrounds, trees or the world owner changed
//   drop     a floating drop appeared (or got bigger)
//   take     someone picked a floating drop up
//   sign     someone wrote on a sign
//   vend     a Vending Machine was filled, priced, emptied or bought from
//   show     a Display Box got or lost its item, or a Mannequin was dressed (k: 'd' or 'm')
//   chat     someone said something to everyone in the world (Chat button)
//   clear    the owner used Clear World
//   die      someone died (their ghost flies up, then they come back at the door)
//   sync_req a player just arrived; someone already here answers with...
//   sync     ...the full world as they see it
// Presence tells us when someone leaves.
// ===== net =====
const Net = (() => {
  // why online play is off (shown under the login form), or '' when it is on
  const url = typeof SUPABASE_URL === 'string' ? SUPABASE_URL.trim() : '',
    key = typeof SUPABASE_ANON_KEY === 'string' ? SUPABASE_ANON_KEY.trim() : '';
  let why = '';
  if (typeof SUPABASE_URL === 'undefined') why = 'online-config.js is missing (run npm run config)';
  else if (!url && !key) why = '';
  else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))
    why = 'SUPABASE_URL should look like https://xxxx.supabase.co';
  else if (key.length < 20) why = 'SUPABASE_ANON_KEY is empty or too short';
  else if (/^sb_secret_/.test(key) || /service_role/.test(atobSafe(key)))
    why = 'That is the secret key. Use the anon / publishable key';
  else if (!(window.supabase && window.supabase.createClient)) why = 'js/vendor/supabase.js did not load';
  function atobSafe(k) {
    try {
      return atob(k.split('.')[1] || '');
    } catch (e) {
      return '';
    }
  }
  const cfg = url && key && !why;
  if (why) console.warn('Balbtopia offline: ' + why);
  let sb = null;
  try {
    if (cfg) sb = window.supabase.createClient(url.replace(/\/$/, ''), key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch (e) {
    console.error('Supabase setup failed', e);
  }
  const N = { online: !!sb, why, sb, me: null, remotes: new Map(), worldList: [], loading: false };
  // Supabase accounts need an email; players only pick a username, so we make one up from it
  const emailOf = (u) => u.toLowerCase() + '@players.balbtopia.app';

  // ---------- accounts ----------
  function authError(e) {
    const m = (e && e.message) || String(e);
    if (/already registered|already exists/i.test(m)) return 'That username is taken';
    if (/invalid login/i.test(m)) return 'Wrong username or password';
    if (/not confirmed/i.test(m)) return 'Turn off "Confirm email" in Supabase (see README)';
    if (/rate limit/i.test(m)) return 'Supabase is still sending emails: turn off "Confirm email" (see README), then try again';
    if (/signups? not allowed|signup is disabled/i.test(m)) return 'Turn on "Allow new users to sign up" in Supabase';
    if (/password/i.test(m) && /6/.test(m)) return 'Password needs at least 6 characters';
    if (/fetch|network/i.test(m)) return 'No connection to the server';
    return m;
  }
  const userOf = (u) => u && { id: u.id, name: (u.user_metadata && u.user_metadata.username) || u.email.split('@')[0] };
  N.signUp = async (user, pass) => {
    try {
      const { data, error } = await sb.auth.signUp({
        email: emailOf(user),
        password: pass,
        options: { data: { username: user } },
      });
      if (error) return authError(error);
      // with "Confirm email" on, Supabase returns no session (or a fake user for a taken email)
      if (!data.session) return 'Turn off "Confirm email" in Supabase (see README)';
      N.me = userOf(data.user);
      return null;
    } catch (e) {
      return authError(e);
    }
  };
  N.signIn = async (user, pass) => {
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email: emailOf(user), password: pass });
      if (error) return authError(error);
      N.me = userOf(data.user);
      return null;
    } catch (e) {
      return authError(e);
    }
  };
  N.restore = async () => {
    try {
      const { data } = await sb.auth.getSession();
      N.me = data && data.session ? userOf(data.session.user) : null;
    } catch (e) {
      N.me = null;
    }
    return N.me;
  };
  N.signOut = async () => {
    try {
      if (ch) await sb.removeChannel(ch);
      await sb.auth.signOut();
    } catch (e) {}
  };

  // a database error as a message the player can act on
  N.dbError = (e) => {
    const m = ((e && (e.code || '') + ' ' + (e.message || '')) || String(e)).trim();
    if (/PGRST205|42P01|does not exist|schema cache/i.test(m))
      return 'The tables are missing: run supabase/schema.sql in the Supabase SQL Editor';
    if (/42501|permission denied|row-level security/i.test(m))
      return 'No permission: run supabase/schema.sql again in the Supabase SQL Editor';
    if (/fetch|network|Failed to/i.test(m)) return "Couldn't reach the server. Check your connection.";
    return 'Server error: ' + m;
  };

  // ---------- saves ----------
  let lastPlayer = '';
  N.loadPlayer = async () => {
    const { data, error } = await sb.from('players').select('data').eq('id', N.me.id).maybeSingle();
    if (error) throw error;
    return data ? data.data : null;
  };
  // one save at a time; while one is on its way, only the newest waiting save is kept and goes next,
  // so an older save can never arrive after a newer one (that used to undo outfit changes)
  let playerBusy = false,
    playerNext = null;
  N.savePlayer = (d) => {
    if (!N.me) return;
    const j = JSON.stringify(d);
    if (j === lastPlayer) return;
    lastPlayer = j;
    playerNext = { d, j };
    if (!playerBusy) sendPlayer();
  };
  function sendPlayer() {
    const job = playerNext;
    playerNext = null;
    if (!job || !N.me) return;
    playerBusy = true;
    sb.from('players')
      .upsert({ id: N.me.id, username: N.me.name, data: job.d, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) {
          if (lastPlayer === job.j) lastPlayer = '';
          console.error('save player', error);
        }
      })
      .catch((e) => console.error('save player', e))
      .finally(() => {
        playerBusy = false;
        sendPlayer();
      });
  }
  N.savingPlayer = () => playerBusy || !!playerNext;
  const lastWorld = {};
  // returns { ...world } or null when the world doesn't exist yet; throws when offline
  N.loadWorld = async (name) => {
    const { data, error } = await sb.from('worlds').select('data,owner').eq('name', name).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    lastWorld[name] = JSON.stringify(data.data);
    return { ...data.data, owner: data.owner };
  };
  N.saveWorld = (name, w, force) => {
    if (!N.me) return;
    const { visited, ...rest } = w,
      j = JSON.stringify(rest);
    if (!force && lastWorld[name] === j) return;
    lastWorld[name] = j;
    sb.from('worlds')
      .upsert({ name, data: rest, owner: w.owner, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) {
          delete lastWorld[name];
          console.error('save world', error);
        }
      });
  };
  // the list at the main door and in the menu; returns true when it changed
  N.refreshWorlds = async () => {
    try {
      // jam: the world's jammers, read out of its saved data (older servers: without it)
      const q = (cols) => sb.from('worlds').select(cols).order('updated_at', { ascending: false }).limit(100);
      let { data, error } = await q('name,owner,updated_at,jam:data->jam');
      if (error) ({ data, error } = await q('name,owner,updated_at'));
      if (error) throw error;
      const list = data.map((r) => ({ name: r.name, owner: r.owner, visited: Date.parse(r.updated_at) || 0, jam: r.jam || null }));
      const changed = JSON.stringify(list) !== JSON.stringify(N.worldList);
      N.worldList = list;
      return changed;
    } catch (e) {
      console.error('world list', e);
      return false;
    }
  };

  // ---------- realtime ----------
  let ch = null,
    synced = false,
    syncTimer = 0;
  let snapFg = null,
    snapBg = null,
    snapVari = null,
    snapTrees = new Map(),
    snapOwner = null,
    snapLock = '',
    snapDoor = '';
  const treeKey = (t) => t.seed + '|' + t.planted + '|' + t.fruit + '|' + (t.spliced ? 1 : 0);
  function snapshot() {
    snapFg = fg.slice();
    snapBg = bg.slice();
    snapVari = vari.slice();
    snapTrees = new Map([...trees].map(([i, t]) => [i, treeKey(t)]));
    snapOwner = worldOwner;
    snapLock = JSON.stringify(lockCfg);
    snapDoor = door.x + ',' + door.y;
  }
  const send = (event, payload) => {
    if (ch && joined) ch.send({ type: 'broadcast', event, payload });
  };
  let joined = false;
  N.joinWorld = (name) => {
    N.remotes.clear();
    snapshot();
    if (!sb || !N.me) return;
    if (ch) sb.removeChannel(ch);
    joined = synced = false;
    clearTimeout(syncTimer);
    const c = sb.channel('world:' + name, {
      config: { broadcast: { self: false }, presence: { key: N.me.id } },
    });
    ch = c;
    c.on('broadcast', { event: 'p' }, ({ payload }) => onPos(payload))
      .on('broadcast', { event: 'punch' }, ({ payload }) => {
        const r = N.remotes.get(payload.id);
        if (!r) return;
        // 'place': the arm pops out and the hand shakes (no punch out and back)
        if (payload.k === 'place') {
          r.place = { t: 0, x: payload.x, y: payload.y, sx: r.tx, sy: r.ty };
          r.punch = null;
        } else {
          r.punch = { t: 0, x: payload.x, y: payload.y };
          r.place = null;
          r.angry = ANGRY_TIME;
        }
      })
      .on('broadcast', { event: 'hit' }, ({ payload }) => {
        if (payload && payload.to === N.me.id) gotHit(payload);
        else if (payload) {
          // someone else got punched: nudge them here too so it shows right away
          const r = N.remotes.get(payload.to);
          if (r) r.shove = (payload.d || 1) * 10;
        }
      })
      .on('broadcast', { event: 'tiles' }, ({ payload }) => applyTiles(payload))
      .on('broadcast', { event: 'drop' }, ({ payload }) => netDrop(payload))
      .on('broadcast', { event: 'take' }, ({ payload }) => payload && netTake(payload.u, payload.by))
      .on('broadcast', { event: 'vend' }, ({ payload }) => N.onVend && N.onVend(payload))
      .on('broadcast', { event: 'show' }, ({ payload }) => N.onShow && N.onShow(payload))
      .on('broadcast', { event: 'sign' }, ({ payload }) => N.onSign && N.onSign(payload))
      .on('broadcast', { event: 'chat' }, ({ payload }) => payload && N.onChat && N.onChat(payload))
      .on('broadcast', { event: 'clear' }, () => {
        if (snapFg) clearWorldTiles();
      })
      .on('broadcast', { event: 'die' }, ({ payload }) => {
        const r = payload && N.remotes.get(payload.id);
        if (r) r.dead = { t: 0 };
      })
      .on('broadcast', { event: 'fly' }, ({ payload }) => N.onFly && N.onFly(payload))
      .on('broadcast', { event: 'sync_req' }, ({ payload }) => onSyncReq(payload))
      .on('broadcast', { event: 'sync' }, ({ payload }) => onSync(payload))
      .on('presence', { event: 'leave' }, ({ key }) => {
        gone.set(key, now);
        const r = N.remotes.get(key);
        if (r) {
          N.remotes.delete(key);
          toast(r.name + ' left');
        }
      })
      .subscribe((status) => {
        if (c !== ch) return;
        if (status === 'SUBSCRIBED') {
          joined = true;
          c.track({ name: playerName, skin });
          send('sync_req', { from: N.me.id });
          sendPos(true);
        }
      });
  };

  // other players: we only get a few updates a second, so they glide between them
  const gone = new Map(); // players who just left: ignore their last few messages
  function onPos(p) {
    if (!p || p.id === (N.me && N.me.id)) return;
    if (gone.has(p.id) && now - gone.get(p.id) < 3000) return;
    gone.delete(p.id);
    let r = N.remotes.get(p.id);
    if (!r) {
      r = { x: p.x, y: p.y, w: P.w, h: P.h, walkPh: 0, punch: null, hurt: 0, blink: Math.random() * 6000 };
      N.remotes.set(p.id, r);
      toast(p.n + ' joined');
    }
    if (Math.hypot(p.x - r.x, p.y - r.y) > TS * 4) {
      r.x = p.x;
      r.y = p.y;
    }
    Object.assign(r, {
      id: p.id,
      tx: p.x,
      ty: p.y,
      face: p.f,
      walking: !!p.w,
      ground: !!p.g,
      skin: SKINS.includes(p.s) ? p.s : 'tan',
      style: p.st,
      name: String(p.n || 'Player').slice(0, 16),
      equipped: p.eq && typeof p.eq === 'object' ? { ...p.eq } : { hair: p.h || null, feet: p.ft || null },
      hand: typeof p.hd === 'string' ? p.hd : 'fist',
      hurt: p.hu ? 0.3 : 0,
      seen: now,
    });
    if (!r.walking) r.walkPh = 0;
  }
  let lastPos = '',
    posT = 0,
    beatT = 0;
  function sendPos(force) {
    if (!N.me) return;
    const p = {
      id: N.me.id,
      n: playerName,
      s: skin,
      st: walkStyle,
      x: Math.round(P.x * 10) / 10,
      y: Math.round(P.y * 10) / 10,
      f: P.face,
      w: P.walkT > 0 ? 1 : 0,
      g: P.ground ? 1 : 0,
      h: equipped.hair,
      ft: equipped.feet,
      eq: equipped, // everything worn
      hd: hand, // what's in the hand (tools show)
      hu: P.hurt > 0 || P.hitT > 0 ? 1 : 0,
    };
    const j = JSON.stringify(p);
    if (!force && j === lastPos && now - beatT < 1500) return;
    lastPos = j;
    beatT = now;
    send('p', p);
  }
  N.sendPunch = (x, y, kind) => {
    if (N.me) send('punch', { id: N.me.id, x: Math.round(x), y: Math.round(y), k: kind || undefined });
  };
  // floating drops: everyone in the world sees the same ones
  N.sendDrop = (d) => {
    if (N.me)
      send('drop', { u: d.uid, id: d.id, q: d.qty, x: Math.round(d.x), y: Math.round(d.y), a: Date.now() - d.born, b: d.by || undefined });
  };
  N.sendDie = () => {
    if (N.me) send('die', { id: N.me.id });
  };
  N.takeDrop = (u) => {
    if (N.me) send('take', { u, by: N.me.id });
  };
  N.sendVend = (i, v) => {
    if (N.me) send('vend', { i, v });
  };
  N.sendShow = (i, k, v) => {
    if (N.me) send('show', { i, k, v });
  };
  N.sendSign = (i, text) => {
    if (N.me) send('sign', { i, text });
  };
  N.sendChat = (text) => {
    if (N.me) send('chat', { id: N.me.id, n: playerName, text });
  };
  N.sendClear = () => {
    if (N.me) send('clear', {});
  };
  // after a big change everyone makes the same way (Clear World): don't send it tile by tile
  N.resnap = () => snapshot();
  // a gift or trade happened here: everyone else in the world sees the items fly
  N.sendFly = (from, to, items) => send('fly', { from, to, items });
  // you punched another player: they get knocked back on their screen
  N.hit = (r, dir) => {
    if (!N.me) return;
    send('hit', { to: r.id, from: N.me.id, n: playerName, d: dir });
    r.shove = dir * 10;
  };

  // blocks: compare with the last snapshot to find what this player changed, and send only that
  function diffTiles() {
    if (!snapFg) return;
    const t = [],
      tr = [];
    for (let i = 0; i < fg.length; i++)
      if (fg[i] !== snapFg[i] || bg[i] !== snapBg[i] || vari[i] !== snapVari[i]) {
        t.push([i, fg[i], bg[i], vari[i]]);
        snapFg[i] = fg[i];
        snapBg[i] = bg[i];
        snapVari[i] = vari[i];
      }
    for (const [i, tree] of trees) {
      const k = treeKey(tree);
      if (snapTrees.get(i) !== k) {
        tr.push([i, tree.seed, tree.planted, tree.fruit, tree.spliced ? 1 : 0]);
        snapTrees.set(i, k);
      }
    }
    for (const i of [...snapTrees.keys()])
      if (!trees.has(i)) {
        tr.push([i, null]);
        snapTrees.delete(i);
      }
    const msg = {};
    if (t.length) msg.t = t;
    if (tr.length) msg.tr = tr;
    if (worldOwner !== snapOwner) {
      msg.o = worldOwner;
      snapOwner = worldOwner;
    }
    // the main door moved (Door Mover)
    if (door.x + ',' + door.y !== snapDoor) {
      msg.d = [door.x, door.y];
      snapDoor = door.x + ',' + door.y;
    }
    const lk = JSON.stringify(lockCfg);
    if (lk !== snapLock) {
      msg.lk = lockCfg;
      snapLock = lk;
    }
    if (Object.keys(msg).length) send('tiles', msg);
  }
  function applyTiles(m) {
    if (!snapFg) return;
    for (const [i, f, b, v] of m.t || []) {
      if (i < 0 || i >= fg.length) continue;
      const x = i % WW,
        y = (i / WW) | 0;
      if (fg[i] && !f) {
        burst(x, y, fg[i], 10);
        smoke(x, y, 8, 1.3);
      } else if (!fg[i] && f) placeFx(x, y, f, false);
      else if (!bg[i] && b && !f) placeFx(x, y, (BGS[b] || BGS[1]).fx, false);
      else if (bg[i] && !b && !f) smoke(x, y, 6, 1);
      fg[i] = snapFg[i] = f;
      bg[i] = snapBg[i] = b;
      vari[i] = snapVari[i] = v;
      dmg[i] = bgDmg[i] = 0;
    }
    for (const [i, seed, planted, fruit, sp] of m.tr || []) {
      if (seed === null) {
        trees.delete(i);
        snapTrees.delete(i);
      } else if (TREE_TIME[seed]) {
        const tree = { seed, planted, fruit, spliced: !!sp };
        trees.set(i, tree);
        snapTrees.set(i, treeKey(tree));
      }
    }
    if (Array.isArray(m.d) && inW(m.d[0], m.d[1])) {
      smoke(door.x, door.y, 8, 1);
      door.x = m.d[0];
      door.y = m.d[1];
      snapDoor = door.x + ',' + door.y;
      smoke(door.x, door.y, 10, 1.3);
    }
    if ('o' in m) {
      worldOwner = snapOwner = m.o || null;
      updateWorldLabel();
    }
    if (m.lk) {
      setLockCfg(m.lk);
      snapLock = JSON.stringify(lockCfg);
      if (!$('lockwin').hidden) renderLockWin();
    }
  }
  function onSyncReq(p) {
    if (!inWorld || !p || p.from === N.me.id) return;
    clearTimeout(syncTimer);
    // whoever answers first wins; the others see the answer and stay quiet
    // now: our clock, so they can line up how old each drop is with theirs
    syncTimer = setTimeout(() => send('sync', { to: p.from, w: worldData(), now: Date.now() }), 60 + Math.random() * 400);
  }
  function onSync(p) {
    clearTimeout(syncTimer);
    if (!p || p.to !== N.me.id || synced) return;
    synced = true;
    applyWorld(p.w, p.now ? Date.now() - p.now : 0);
    snapshot();
    updateWorldLabel();
  }

  // called every frame from the game loop
  N.tick = (dt) => {
    if (!N.online || !inWorld) return;
    for (const [id, r] of N.remotes) {
      if (now - r.seen > 8000) {
        N.remotes.delete(id);
        continue;
      }
      // dead: stay where they fell until the ghost is gone, then show up where they really are (the door)
      if (r.dead && (r.dead.t += dt) >= DEATH_TIME) {
        r.dead = null;
        r.x = r.tx;
        r.y = r.ty;
        r.spawnT = SPAWN_FADE;
      }
      if (r.spawnT > 0) r.spawnT -= dt;
      const k = r.dead ? 0 : Math.min(1, dt * 12);
      r.x += (r.tx - r.x) * k;
      r.y += (r.ty - r.y) * k;
      if (r.walking) r.walkPh += dt * (r.style === 'stride' ? 10 : 13);
      if (r.punch && (r.punch.t += dt) >= PUNCH_TIME) r.punch = null;
      if (r.angry > 0) r.angry -= dt;
      if (r.place && ((r.place.t += dt) >= PLACE_POSE || r.walking || Math.abs(r.tx - r.place.sx) > 1.5 || Math.abs(r.ty - r.place.sy) > 1.5)) r.place = null;
      if (r.say && (r.say.t -= dt) <= 0) r.say = null;
      if (r.shove) {
        const d = r.shove * Math.min(1, dt * 10);
        r.x += d;
        r.shove -= d;
        if (Math.abs(r.shove) < 0.2) r.shove = 0;
      }
    }
    posT += dt;
    if (posT >= 0.1) {
      posT = 0;
      sendPos(false);
      diffTiles();
    }
  };
  // the other player whose body is under a world point (for punching them), or null
  N.bodyAt = (x, y) => {
    for (const r of N.remotes.values()) if (x > r.x - 3 && x < r.x + r.w + 3 && y > r.y - 2 && y < r.y + r.h + 2) return r;
    return null;
  };
  // the other player under a world point (for the wrench), or null
  N.playerAt = (x, y) => {
    for (const r of N.remotes.values()) {
      const w = r.wrenchHit;
      if (x > r.x - 4 && x < r.x + r.w + 4 && y > r.y - 14 && y < r.y + r.h + 4) return r;
      if (w && x > w.x - 2 && x < w.x + w.s + 2 && y > w.y - 2 && y < w.y + w.s + 2) return r;
    }
    return null;
  };

  // ---------- lobby: everyone online, for messages, friends, gifts and trades ----------
  // payloads always carry { to, from, fn (sender name) }; each player only handles what is sent to them
  const LOBBY_EVENTS = [
    'dm',
    'friend_req',
    'friend_ok',
    'friend_no',
    'gift',
    'gift_ok',
    'gift_no',
    'trade_req',
    'trade_yes',
    'trade_no',
    'trade_offer',
    'trade_accept',
    'trade_cancel',
    'mail_ping',
  ];
  const lobbyH = {};
  let lobby = null,
    lobbyJoined = false;
  N.people = new Map(); // id -> { name, world } of everyone online
  N.onLobby = (ev, fn) => (lobbyH[ev] = fn);
  N.lsend = (ev, to, data) => {
    if (!lobby || !lobbyJoined || !N.me) return false;
    lobby.send({ type: 'broadcast', event: ev, payload: { ...data, to, from: N.me.id, fn: playerName } });
    return true;
  };
  N.joinLobby = () => {
    if (!sb || !N.me || lobby) return;
    const c = sb.channel('lobby', { config: { broadcast: { self: false }, presence: { key: N.me.id } } });
    lobby = c;
    for (const ev of LOBBY_EVENTS)
      c.on('broadcast', { event: ev }, ({ payload }) => {
        if (payload && payload.to === N.me.id && lobbyH[ev]) lobbyH[ev](payload);
      });
    c.on('presence', { event: 'sync' }, () => {
      const st = c.presenceState();
      N.people.clear();
      for (const id in st) {
        const m = st[id] && st[id][st[id].length - 1];
        if (m && id !== N.me.id) N.people.set(id, { name: m.name, world: m.world });
      }
      if (lobbyH.people) lobbyH.people();
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        lobbyJoined = true;
        c.track({ name: playerName, world: inWorld ? worldName : '' });
      }
    });
  };
  N.lobbyWorld = (name) => {
    if (lobby && lobbyJoined) lobby.track({ name: playerName, world: name });
  };

  // ---------- email (stored in the "mail" table) ----------
  N.mail = [];
  N.loadMail = async () => {
    if (!sb || !N.me) return false;
    const { data, error } = await sb
      .from('mail')
      .select('id,from_id,from_name,subject,body,created_at,read')
      .eq('to_id', N.me.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      console.error('mail', error);
      return false;
    }
    N.mail = data || [];
    return true;
  };
  N.sendMail = async (toId, toName, subject, body) => {
    const { error } = await sb.from('mail').insert({
      to_id: toId,
      to_name: toName,
      from_id: N.me.id,
      from_name: playerName,
      subject,
      body,
    });
    if (error) return N.dbError(error);
    N.lsend('mail_ping', toId, {});
    return null;
  };
  N.markRead = (id) => sb.from('mail').update({ read: true }).eq('id', id).then(() => {});
  N.deleteMail = (id) => sb.from('mail').delete().eq('id', id).then(() => {});
  N.unread = () => N.mail.filter((m) => !m.read).length;
  return N;
})();
