// Online play with Supabase: accounts, saves in the cloud and other players in the same world.
// Turned on by filling in SUPABASE_URL and SUPABASE_ANON_KEY in online-config.js.
// Without them, Net.online is false and the game keeps everything on this device.
//
// Security (supabase/schema.sql, SECURITY section): the server decides who a player is (whoami), who is a GM and
// who is banned; worlds are saved through save_world (owner / access / open checks there); kicks go through
// kick_player / claim_kick. Channels are private: "world:NAME" for everyone, "build:NAME:LOCKV" only for players
// who may build there (blocks, signs, songs, displays, Clear World, world sync, machine changes). LOCKV is the
// world's lock version (goes up when its owner or access changes), so rights are checked again after every change.
// Servers that haven't run the new schema yet: everything falls back to the old way (N.secure false, public channels).
//
// Realtime (world:NAME and build:NAME):
//   p        position, facing, walking, skin and clothes, about 5 times a second (POS_EVERY; others glide between)
//   punch    someone threw a punch at a point
//   tiles    blocks, backgrounds, trees or the world owner changed
//   drop     a floating drop appeared (or got bigger)
//   take     someone picked a floating drop up
//   sign     someone wrote on a sign
//   vend     a Vending Machine was filled, priced, emptied or bought from
//   show     a Display Box got or lost its item, or a Mannequin was dressed (k: 'd' or 'm')
//   chat     someone said something to everyone in the world (Chat button). New servers: sent by the server
//            (send_chat) on chat:NAME, where players can only listen, so the name on it is real
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
  const N = { online: !!sb, why, sb, me: null, remotes: new Map(), worldList: [], loading: false, secure: false, gm: false };
  // Supabase accounts need an email; players only pick a username, so we make one up from it
  const emailOf = (u) => u.toLowerCase() + '@players.balbtopia.app';

  // ---------- accounts ----------
  function authError(e) {
    const m = (e && e.message) || String(e);
    if (/already registered|already exists|database error saving new user|username is taken/i.test(m)) return 'That username is taken';
    if (/invalid login/i.test(m)) return 'Wrong username or password';
    if (/not confirmed/i.test(m)) return 'Turn off "Confirm email" in Supabase (see README)';
    if (/rate limit/i.test(m)) return 'Supabase is still sending emails: turn off "Confirm email" (see README), then try again';
    if (/signups? not allowed|signup is disabled/i.test(m)) return 'Turn on "Allow new users to sign up" in Supabase';
    if (/password/i.test(m) && /6/.test(m)) return 'Password needs at least 6 characters';
    if (/fetch|network/i.test(m)) return 'No connection to the server';
    return m;
  }
  const userOf = (u) => u && { id: u.id, name: (u.user_metadata && u.user_metadata.username) || u.email.split('@')[0] };
  // New accounts go through the "signup" Edge Function (supabase/functions/signup): at most 3 accounts per IP address.
  // If that function isn't deployed yet, the old direct sign-up is used (no limit then).
  N.signUp = async (user, pass) => {
    try {
      const { error } = await sb.functions.invoke('signup', { body: { username: user, password: pass } });
      if (!error) return N.signIn(user, pass);
      const res = error.context;
      const status = res && res.status;
      if (status && status !== 404) {
        let msg = '';
        try {
          msg = (await res.json()).error;
        } catch (e) {}
        return msg || 'Could not make the account (' + status + ')';
      }
      // 404 / no response: the function isn't there, fall back below
    } catch (e) {
      // network trouble reaching the function: fall back below
    }
    return N.signUpDirect(user, pass);
  };
  N.signUpDirect = async (user, pass) => {
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
  // a player who changed their name (Change Name, rename.js) still logs in with the e-mail made from the FIRST name:
  // the server says which e-mail belongs to a name (login_email); older servers: the name's own e-mail
  async function loginEmail(user) {
    try {
      const { data, error } = await sb.rpc('login_email', { p_name: user });
      if (!error && typeof data === 'string' && data) return data;
    } catch (e) {}
    return emailOf(user);
  }
  N.signIn = async (user, pass) => {
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email: await loginEmail(user), password: pass });
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
  // after logging in: the server's word on this account (its fixed name, GM, banned). Returns an error to show
  // (banned) or null. Old servers without whoami(): N.secure stays false and the account's own name is used.
  N.whoami = async () => {
    N.secure = N.gm = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      let data = null,
        error = null;
      try {
        ({ data, error } = await sb.rpc('whoami'));
      } catch (e) {
        error = e;
      }
      if (!error && data) {
        if (!data.name) return 'This account has no player name on the server. Make a new account.';
        N.secure = true;
        N.me.name = data.name;
        N.gm = !!data.gm;
        if (data.banned !== null && data.banned !== undefined) return 'This account is banned' + (data.banned ? ': ' + data.banned : '');
        return null;
      }
      // the function isn't on the server: an old setup, play the old way
      const code = (error && (error.code || '')) + ' ' + ((error && error.message) || '');
      if (/PGRST202|42883|Could not find the function/i.test(code)) {
        console.warn('whoami missing: run the new supabase/schema.sql for the server checks');
        return null;
      }
      await new Promise((ok) => setTimeout(ok, 700));
    }
    return "Couldn't reach the server. Check your connection and try again.";
  };
  N.signOut = async () => {
    try {
      await dropChannel(ch);
      await dropChannel(bch);
      ch = bch = null;
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
    if (/banned/i.test(m)) return 'This account is banned';
    if (/P0001|Too many/i.test(m)) return (e && e.message) || m; // the server's own message (e.g. mail limit)
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
  const lockV = {}; // world -> its lock version on the server (null: not saved yet)
  N.loadWorld = async (name) => {
    const { data, error } = await sb.from('worlds').select(N.secure ? 'data,owner,lockv' : 'data,owner').eq('name', name).maybeSingle();
    if (error) throw error;
    lockV[name] = data ? data.lockv | 0 : null;
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
    // new servers: save_world checks who may change what (visitors only change drops and Vending Machine sales);
    // old servers: the table directly
    const req = N.secure
      ? sb.rpc('save_world', { p_name: name, p_data: rest })
      : sb.from('worlds').upsert({ name, data: rest, owner: w.owner, updated_at: new Date().toISOString() });
    req.then(({ data, error }) => {
        if (error) {
          delete lastWorld[name];
          console.error('save world', error);
        } else if (N.secure && data && typeof data.v === 'number') {
          // saved as a builder: our owner / lock are the server's. Saved as a visitor: the server may know a newer
          // owner or lock (e.g. a World Key was used), so read them before taking its version
          if (data.r === 'saved') gotLockV(name, data.v, true);
          else if (data.v !== lockV[name]) checkLockV(name);
        }
      });
  };
  // the worlds this player has locked (Menu -> Worlds); returns true when the list changed
  N.ownWorlds = [];
  N.refreshOwnWorlds = async () => {
    try {
      const { data, error } = await sb
        .from('worlds')
        .select('name,owner,updated_at')
        .ilike('owner', playerName)
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const list = data.map((r) => ({ name: r.name, owner: r.owner, visited: Date.parse(r.updated_at) || 0 }));
      const changed = JSON.stringify(list) !== JSON.stringify(N.ownWorlds);
      N.ownWorlds = list;
      return changed;
    } catch (e) {
      console.error('own worlds', e);
      return false;
    }
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
  let ch = null, // world:NAME
    bch = null, // build:NAME (private channels only)
    bJoined = false,
    privRT = true, // private channels; false after they failed once (server not set up for them yet)
    synced = false,
    syncTimer = 0;
  let snapFg = null,
    snapBg = null,
    snapVari = null,
    snapTrees = new Map(),
    snapOwner = null,
    snapLock = '',
    snapDoor = '',
    snapAL = '', // Red / Blue Locks (alocks.js)
    snapATM = ''; // ATM Machines' last pay-out day (atm.js)
  const treeKey = (t) => t.seed + '|' + t.planted + '|' + t.fruit + '|' + (t.spliced ? 1 : 0) + '|' + (t.pa || '');
  function snapshot() {
    snapFg = fg.slice();
    snapBg = bg.slice();
    snapVari = vari.slice();
    snapTrees = new Map([...trees].map(([i, t]) => [i, treeKey(t)]));
    snapOwner = worldOwner;
    snapLock = JSON.stringify(lockCfg);
    snapDoor = door.x + ',' + door.y;
    snapAL = typeof alockKey === 'function' ? alockKey() : '';
    snapATM = typeof atmKey === 'function' ? atmKey() : '';
  }
  const send = (event, payload) => {
    if (ch && joined) ch.send({ type: 'broadcast', event, payload });
  };
  // building changes: on build:NAME (only players who may build here can send there); old way: world:NAME
  const sendB = (event, payload) => {
    if (!privRT) return send(event, payload);
    if (bch && bJoined) bch.send({ type: 'broadcast', event, payload });
  };
  const mayBuild = () => typeof canEdit === 'function' && canEdit(true);
  let joined = false,
    joinedName = '';
  const chOpts = (presence) => ({
    config: { private: privRT, broadcast: { self: false }, ...(presence ? { presence: { key: N.me.id } } : {}) },
  });
  // channel(topic) hands back an old channel with the same topic until it has fully left, so wait for that (and
  // make sure a channel that never got in is gone too) before making a new one
  async function dropChannel(c) {
    if (!c) return;
    try {
      await sb.removeChannel(c);
    } catch (e) {}
    try {
      if (sb.getChannels().includes(c)) {
        c.teardown();
        sb.realtime._remove(c);
      }
    } catch (e) {}
  }
  // (re)join build:NAME:LOCKV. The server works out once, on joining, whether we may send there; when the world's
  // owner or access changes its lock version goes up and everyone moves to the new topic (checked again).
  let buildSeq = 0;
  async function joinBuild(name) {
    const seq = ++buildSeq,
      old = bch;
    bch = null;
    bJoined = false;
    await dropChannel(old);
    if (seq !== buildSeq || !privRT || !sb || !N.me || name !== joinedName) return;
    const b = sb.channel('build:' + name + ':' + (lockV[name] | 0), chOpts(false));
    bch = b;
    onBuild(b, true);
    b.on('broadcast', { event: 'lockv' }, () => checkLockV(name));
    b.subscribe((status) => {
      if (b === bch && status === 'SUBSCRIBED') bJoined = true;
    });
  }
  // our save came back with the world's lock version (mine) or someone said it changed: move if it did. Our own
  // change: first tell the others on the old topic, where they still are (they check the server, not the message).
  function gotLockV(name, v, mine) {
    const old = lockV[name];
    if (old === v && name !== joinedName) return;
    if (old === v && bch) return;
    lockV[name] = v;
    if (name !== joinedName || !privRT) return;
    if (mine && old !== null && old !== undefined && bch && bJoined) bch.send({ type: 'broadcast', event: 'lockv', payload: {} });
    joinBuild(name);
  }
  let checkingV = false;
  async function checkLockV(name) {
    if (checkingV || name !== joinedName) return;
    checkingV = true;
    try {
      const { data } = await sb.from('worlds').select('lockv,owner,lock:data->lock').eq('name', name).maybeSingle();
      if (data && name === joinedName && (data.lockv | 0) !== lockV[name]) {
        // the owner or the lock changed on the server (e.g. a World Key was used): take the server's
        if ((data.owner || null) !== worldOwner) {
          worldOwner = snapOwner = data.owner || null;
          updateWorldLabel();
        }
        if (data.lock) {
          setLockCfg(data.lock);
          snapLock = JSON.stringify(lockCfg);
        }
        if (!$('lockwin').hidden) renderLockWin();
        gotLockV(name, data.lockv | 0, false);
      }
    } catch (e) {}
    checkingV = false;
  }
  // the lock changed on the server outside a world save (a World Key was used, keys.js): note the new version,
  // tell everyone here to check the server (world:, where anyone may send; they never trust the message itself)
  // and move to the new build topic
  N.lockChanged = (name, v) => {
    lockV[name] = v;
    snapOwner = worldOwner;
    snapLock = JSON.stringify(lockCfg);
    if (ch && joined) ch.send({ type: 'broadcast', event: 'lockv', payload: {} });
    if (name === joinedName && privRT) joinBuild(name);
  };
  // the building events, on whichever channel carries them; trusted: it came from build: (or the old setup)
  function onBuild(c, trusted) {
    c.on('broadcast', { event: 'tiles' }, ({ payload }) => applyTiles(payload))
      .on('broadcast', { event: 'sign' }, ({ payload }) => N.onSign && N.onSign(payload))
      .on('broadcast', { event: 'song' }, ({ payload }) => N.onSong && N.onSong(payload))
      .on('broadcast', { event: 'show' }, ({ payload }) => N.onShow && N.onShow(payload))
      .on('broadcast', { event: 'vend' }, ({ payload }) => N.onVend && N.onVend(payload, trusted))
      .on('broadcast', { event: 'clear' }, () => {
        if (snapFg) clearWorldTiles();
      })
      .on('broadcast', { event: 'sync' }, ({ payload }) => onSync(payload));
  }
  let worldSeq = 0;
  N.joinWorld = (name) => {
    N.remotes.clear();
    realNames.clear();
    pendingPos.clear();
    snapshot();
    if (!sb || !N.me) return;
    const seq = ++worldSeq,
      old = ch;
    ch = null;
    joined = synced = false;
    // the LOBBY is private: everyone gets their own copy (no channel, so no other players, chat or live changes)
    const own = name === LOBBY_WORLD;
    joinedName = own ? '' : name;
    clearTimeout(syncTimer);
    joinChat(''); // leave the old world's chat:NAME
    if (own) worldHello(''); // in our own lobby: the server forgets which world we were in (nobody can use our name there)
    dropChannel(old).then(() => {
      if (seq !== worldSeq) return;
      if (own) {
        if (bch) dropChannel(bch);
        bch = null;
        bJoined = false;
      } else openWorld(name, seq);
    });
  };
  function openWorld(name, seq) {
    const c = sb.channel('world:' + name, chOpts(true));
    ch = c;
    if (privRT) {
      joinBuild(name);
      joinChat(name);
      // a Vending Machine sale from a visitor (only a paid-for sale is taken from here)
      c.on('broadcast', { event: 'vend' }, ({ payload }) => N.onVend && N.onVend(payload, false));
      // someone changed the lock outside a save (World Key): check the server
      c.on('broadcast', { event: 'lockv' }, () => checkLockV(name));
    } else onBuild(c, true);
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
      .on('broadcast', { event: 'drop' }, ({ payload }) => netDrop(payload))
      .on('broadcast', { event: 'take' }, ({ payload }) => payload && netTake(payload.u, payload.by))
      // 5 coins on one tile joined into a bigger one (coins.js)
      .on('broadcast', { event: 'merge' }, ({ payload }) => typeof netMerge === 'function' && netMerge(payload))
      // someone posted / removed a suggestion on a Suggestion Board (board.js): an open board reloads
      .on('broadcast', { event: 'board' }, ({ payload }) => N.onBoard && N.onBoard(payload))
      // (once the server's chat:NAME is joined, chat sent by players themselves is ignored: its name could be fake)
      .on('broadcast', { event: 'chat' }, ({ payload }) => payload && !cJoined && N.onChat && N.onChat(payload))
      .on('broadcast', { event: 'die' }, ({ payload }) => {
        const r = payload && N.remotes.get(payload.id);
        if (r) r.dead = { t: 0 };
      })
      .on('broadcast', { event: 'fly' }, ({ payload }) => N.onFly && N.onFly(payload))
      .on('broadcast', { event: 'kick' }, ({ payload }) => payload && onKickMsg(payload))
      // the owner moved this world to a new name (World Transfer): ask the server where to, then follow (rename.js)
      .on('broadcast', { event: 'moved' }, () => N.onMoved && N.onMoved(name))
      .on('broadcast', { event: 'sync_req' }, ({ payload }) => onSyncReq(payload))
      .on('presence', { event: 'leave' }, ({ key }) => {
        gone.set(key, now);
        const r = N.remotes.get(key);
        if (r) {
          N.remotes.delete(key);
          toast(r.name + ' left');
        }
      })
      .subscribe((status, err) => {
        if (c !== ch || seq !== worldSeq) return;
        // private channels refused before we ever got in: the server has no realtime rules for them (old schema, or
        // Supabase didn't let schema.sql add them). Play on with public channels (needs "Allow public access" ON).
        if (status === 'CHANNEL_ERROR' && privRT && !joined) {
          console.warn('Private channels refused, using public ones', err);
          privRT = false;
          N.joinWorld(name);
          return;
        }
        if (status === 'SUBSCRIBED') {
          joined = true;
          c.track({ name: playerName, skin });
          // tell the server we are here first, so the others can check our name (world_names) when we show up
          worldHello(name).then(() => {
            if (c !== ch || seq !== worldSeq) return;
            send('sync_req', { from: N.me.id });
            sendPos(true);
          });
        }
      });
  }

  // other players: we only get a few updates a second, so they glide between them
  const gone = new Map(); // players who just left: ignore their last few messages
  // would another player's body at (x, y) overlap a solid block? (gates count as open: we don't know if they may pass)
  // name: whose guess it is. A gate (Iron Bars, Portcullis) is solid for them unless they may pass (gates.js
  // gatePass), just like on their own screen (owner's bug, Oct 26 2026: a player spam-jumping on Iron Bars sank
  // into them on everyone else's screen, then popped back up with the next update).
  function remoteHits(x, y, w, h, name) {
    const x0 = Math.floor((x + 1) / TS),
      x1 = Math.floor((x + w - 2) / TS),
      y0 = Math.floor((y + 1) / TS),
      y1 = Math.floor((y + h - 2) / TS);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) {
        if (tx < 0 || tx >= WW || ty < 0 || ty >= WH) return true;
        const t = fg[at(tx, ty)];
        if (!t || !BLOCK[t]) continue;
        if (BLOCK[t].gate) {
          if (!(typeof gatePass === 'function' && name && gatePass(at(tx, ty), name))) return true;
        } else if (BLOCK[t].solid !== false) return true;
      }
    return false;
  }
  // falling from y0 to y1 (top of the body): the top of a platform (Steel Beam / Bridge, Bookcase...) or a shut gate
  // the feet go past, or -1. Platforms only catch from above, like in physics.js collide.
  function remoteLand(x, y0, y1, w, h, name) {
    const b0 = y0 + h,
      b1 = y1 + h,
      x0 = Math.floor((x + 1) / TS),
      x1 = Math.floor((x + w - 2) / TS);
    for (let ty = Math.floor(b0 / TS); ty <= Math.floor(b1 / TS); ty++) {
      const top = ty * TS;
      if (top < b0 - 0.5 || top > b1) continue;
      for (let tx = x0; tx <= x1; tx++) {
        if (tx < 0 || tx >= WW || ty < 0 || ty >= WH) continue;
        const t = fg[at(tx, ty)],
          B = t && BLOCK[t];
        if (!B) continue;
        if (B.plat || (B.gate && !(typeof gatePass === 'function' && name && gatePass(at(tx, ty), name)))) return top;
      }
    }
    return -1;
  }
  // ---- names over other players' heads come from the SERVER (schema.sql PLAYER NAMES OVER HEADS) ----
  // A position message's id and name are written by the sender's game, so a changed game could use any name.
  // We ask the server (`world_names`) for the name of every id we see; it only answers for players who really are in
  // this world (`world_hello`). Until the answer comes the player isn't shown; "not here" = their messages are
  // ignored (asked again after NAME_RETRY). Old server without these functions: the name in the message, as before.
  const realNames = new Map(), // id -> { n: name | null (not in this world), at }
    pendingPos = new Map(), // id -> newest position message while their name is being asked
    nameAsk = new Set();
  const NAME_RETRY = 3000, // "not here": ask again after this (they may have just come in)
    NAME_RECHECK = 60000, // a known name is checked again this often (they may have left, their id kept being used)
    HELLO_EVERY = 20000; // ms between our own hellos, wherever we are (the server forgets us after 75 s)
  let namesOn = true,
    nameTimer = null;
  const isUuid = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  const checkNames = () => namesOn && N.secure;
  async function worldHello(name) {
    if (!checkNames()) return;
    try {
      const { error } = await sb.rpc('world_hello', { p_world: name });
      if (error && (error.code === 'PGRST202' || error.code === '42883')) namesOn = false;
    } catch (e) {}
  }
  function askName(id) {
    nameAsk.add(id);
    if (!nameTimer) nameTimer = setTimeout(fetchNames, 250);
  }
  async function fetchNames() {
    nameTimer = null;
    const ids = [...nameAsk].slice(0, 60),
      world = joinedName,
      seq = worldSeq;
    ids.forEach((id) => nameAsk.delete(id));
    if (nameAsk.size) nameTimer = setTimeout(fetchNames, 250);
    if (!ids.length || !world) return;
    let res;
    try {
      res = await sb.rpc('world_names', { p_world: world, p_ids: ids });
    } catch (e) {
      return;
    }
    if (seq !== worldSeq) return;
    if (res.error) {
      if (res.error.code === 'PGRST202' || res.error.code === '42883') {
        namesOn = false; // old server: names from the messages again
        for (const p of pendingPos.values()) onPos(p);
        pendingPos.clear();
      }
      return;
    }
    const got = new Map((res.data || []).map((row) => [row.id, row.name]));
    for (const id of ids) {
      const n = got.get(id) || null;
      realNames.set(id, { n, at: now });
      const r = N.remotes.get(id);
      if (r && n) r.name = n;
      else if (r && !n) N.remotes.delete(id); // the server says they aren't here: someone was using their id
      const p = pendingPos.get(id);
      pendingPos.delete(id);
      if (p && n) onPos(p);
    }
  }
  // the name to show for a position message: a string, null = ignore the message, undefined = still asking
  function shownName(p) {
    if (!checkNames()) return String(p.n || 'Player').slice(0, 16);
    if (!isUuid(p.id)) return null;
    const k = realNames.get(p.id);
    if (!k || (!k.n && now - k.at > NAME_RETRY)) {
      if (k) realNames.delete(p.id);
      askName(p.id);
      return undefined;
    }
    if (k.n && now - k.at > NAME_RECHECK && !nameAsk.has(p.id)) {
      k.at = now; // (no second ask while this one is out)
      askName(p.id);
    }
    return k.n;
  }
  function onPos(p) {
    if (!p || p.id === (N.me && N.me.id)) return;
    if (gone.has(p.id) && now - gone.get(p.id) < 3000) return;
    const realName = shownName(p);
    if (realName === undefined) return void pendingPos.set(p.id, p);
    if (realName === null) return;
    gone.delete(p.id);
    let r = N.remotes.get(p.id);
    if (!r) {
      r = { x: p.x, y: p.y, w: P.w, h: P.h, walkPh: 0, punch: null, hurt: 0, blink: Math.random() * 6000 };
      N.remotes.set(p.id, r);
      toast(realName + ' joined');
    }
    if (Math.hypot(p.x - r.x, p.y - r.y) > TS * 4) {
      r.x = p.x;
      r.y = p.y;
    }
    // how fast they move (from the last two updates), to glide on between updates (N.tick)
    const gap = r.posAt ? (now - r.posAt) / 1000 : 0;
    const fresh = gap > 0.05 && gap < 0.6 && r.px !== undefined;
    r.vx = fresh && p.w ? Math.max(-600, Math.min(600, (p.x - r.px) / gap)) : 0;
    r.vy = fresh && !p.g ? Math.max(-900, Math.min(900, (p.y - r.py) / gap)) : 0; // on the ground: no sliding
    r.px = p.x;
    r.py = p.y;
    r.posAt = now;
    Object.assign(r, {
      id: p.id,
      tx: p.x,
      ty: p.y,
      face: p.f,
      walking: !!p.w,
      ground: !!p.g,
      skin: SKINS.includes(p.s) ? p.s : 'tan',
      style: p.st,
      name: realName,
      equipped: p.eq && typeof p.eq === 'object' ? { ...p.eq } : { hair: p.h || null, feet: p.ft || null },
      hand: typeof p.hd === 'string' ? p.hd : 'fist',
      flag: typeof isFlag === 'function' && isFlag(p.fl) ? p.fl : null, // flags.js
      hurt: p.hu ? 0.3 : 0,
      rest: restFromNet(p.rs),
      typing: !!p.ty,
      seen: now,
    });
    if (!r.walking) r.walkPh = 0;
  }
  // how often our position goes out (s). Was 0.1 (10 a second); 5 a second halves the realtime messages, which
  // count against Supabase's limit (Free: 100 a second for the whole project, sent and received)
  const POS_EVERY = 0.2;
  let lastPos = '',
    posT = 0,
    tileT = 0,
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
      fl: myFlag || undefined, // the player's flag (flags.js)
      hu: P.hurt > 0 || P.hitT > 0 ? 1 : 0,
      rs: P.rest ? [P.rest.k, P.rest.tx, P.rest.ty] : 0, // sitting / sleeping
      ty: typeof chatTyping === 'function' && chatTyping() ? 1 : 0, // the chat is open: the little bubble shows (liven.js)
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
      send('drop', { u: d.uid, id: d.id, q: d.qty, x: Math.round(d.x), y: Math.round(d.y), a: Date.now() - d.born, b: d.by || undefined, k: d.ck || undefined });
  };
  N.sendMoved = () => {
    if (N.me) send('moved', {});
  };
  N.sendDie = () => {
    if (N.me) send('die', { id: N.me.id });
  };
  // coins that joined (coins.js): the 5 that went and the new one
  N.sendMerge = (us, d) => {
    if (N.me)
      send('merge', { us, d: { u: d.uid, q: d.qty, x: Math.round(d.x), y: Math.round(d.y), a: Date.now() - d.born, b: d.by || undefined, k: d.ck } });
  };
  // ---------- Suggestion Board posts (board.js; schema.sql board_posts) ----------
  // null = not online in a shared world (the board keeps its suggestions on this device instead)
  N.boardWorld = () => (sb && N.me && joinedName ? joinedName : null);
  const boardErr = (error) =>
    error.code === 'PGRST202' || error.code === '42883'
      ? 'The server needs an update for Suggestion Boards (run schema.sql)'
      : error.code === 'P0001' || error.code === '42501'
        ? error.message
        : N.dbError(error);
  N.boardList = async (i) => {
    const { data, error } = await sb.rpc('board_list', { p_world: joinedName, p_tile: i });
    return error ? { err: boardErr(error) } : { list: Array.isArray(data) ? data : [] };
  };
  N.boardPost = async (i, text) => {
    const { error } = await sb.rpc('board_post', { p_world: joinedName, p_tile: i, p_text: text });
    if (error) return boardErr(error);
    send('board', { i });
    return null;
  };
  N.boardDelete = async (i, id) => {
    const { error } = await sb.rpc('board_delete', { p_id: id });
    if (error) return boardErr(error);
    send('board', { i });
    return null;
  };
  N.boardClear = async (i) => {
    const { error } = await sb.rpc('board_clear', { p_world: joinedName, p_tile: i });
    if (!error) send('board', { i });
  };
  N.takeDrop = (u) => {
    if (N.me) send('take', { u, by: N.me.id });
  };
  // a Vending Machine: builders send any change on build:; a visitor's sale goes on world: (others check it)
  N.sendVend = (i, v) => {
    if (N.me) (mayBuild() ? sendB : send)('vend', { i, v });
  };
  N.sendShow = (i, k, v) => {
    if (N.me) sendB('show', { i, k, v });
  };
  N.sendSign = (i, text) => {
    if (N.me) sendB('sign', { i, text });
  };
  N.sendSong = (i, s) => {
    if (N.me) sendB('song', { i, s });
  };
  // the world's song list (the owner's saved songs, music.js): i -1 so older games ignore it
  N.sendSongList = (ol) => {
    if (N.me) sendB('song', { i: -1, ol });
  };
  // world chat: null when it went out, or why not (shown to the player; the message then wasn't sent).
  // New servers: send_chat puts the real name on it and sends it on chat:NAME (players can't send there).
  N.sendChat = async (text) => {
    if (!N.me || !sb) return 'Not connected. Your message was not sent.';
    if (cJoined && serverChat) {
      const { error } = await sb.rpc('send_chat', { p_world: joinedName, p_text: text });
      if (!error) return null;
      if (!(error.code === 'PGRST202' || error.code === '42883' || /realtime\.send/i.test(error.message || '')))
        return error.code === 'P0001' || error.code === '42501' ? error.message : N.dbError(error);
      // the server has no send_chat yet (old schema.sql): the old way from now on
      console.warn('send_chat missing, chat names are not checked', error);
      serverChat = false;
      joinChat('');
    }
    if (!ch || !joined) return 'Not connected to this world. Your message was not sent.';
    send('chat', { id: N.me.id, n: playerName, text });
    return null;
  };
  // ---------- chat:NAME (server-sent chat) ----------
  let cch = null,
    cJoined = false,
    chatSeq = 0,
    serverChat = true; // false once the server showed it has no send_chat / chat: rules (old schema.sql)
  async function joinChat(name) {
    const seq = ++chatSeq,
      old = cch;
    cch = null;
    cJoined = false;
    await dropChannel(old);
    if (seq !== chatSeq || !name || !privRT || !N.secure || !serverChat || !sb || !N.me || name !== joinedName) return;
    const c = sb.channel('chat:' + name, chOpts(false));
    cch = c;
    c.on('broadcast', { event: 'chat' }, ({ payload }) => {
      // our own message comes back too: it is already in our chat
      if (payload && payload.id !== N.me.id && N.onChat) N.onChat(payload);
    });
    c.subscribe((status) => {
      if (c !== cch) return;
      if (status === 'SUBSCRIBED') cJoined = true;
      else if (status === 'CHANNEL_ERROR' && !cJoined) {
        console.warn('chat:' + name + ' refused (run the new supabase/schema.sql): chat names are not checked');
        serverChat = false;
      }
    });
  }
  // ---------- bans from one world (wrench a player -> Ban from this world; schema.sql world_bans) ----------
  const newServer = (error) => error && (error.code === 'PGRST202' || error.code === '42883');
  const rpcErr = (error) =>
    newServer(error)
      ? 'This needs the new server setup (run supabase/schema.sql again)'
      : error.code === 'P0001' || error.code === '42501'
        ? error.message
        : N.dbError(error);
  // am I banned from this world? null, or { until (ISO or null = no end), by }
  N.worldBan = async (name) => {
    if (!sb || !N.me || !N.secure) return null;
    const { data, error } = await sb.rpc('my_world_ban', { p_world: name });
    return error ? null : data || null;
  };
  // ban a player (id) from this world for `minutes` (null: until lifted) and send them out. null or an error
  N.banFromWorld = async (to, minutes) => {
    if (!sb || !N.me) return 'Bans need online play';
    if (!N.secure) return 'This needs the new server setup (run supabase/schema.sql again)';
    const { data, error } = await sb.rpc('ban_from_world', { p_world: worldName, p_to: to, p_minutes: minutes });
    if (error) return rpcErr(error);
    send('kick', { kid: data });
    return null;
  };
  N.unbanFromWorld = async (name) => {
    if (!sb || !N.me || !N.secure) return 'This needs the new server setup';
    const { error } = await sb.rpc('unban_from_world', { p_world: worldName, p_name: name });
    return error ? rpcErr(error) : null;
  };
  // [{ name, until }] of this world, or null when the server can't tell
  N.worldBanList = async () => {
    if (!sb || !N.me || !N.secure) return null;
    const { data, error } = await sb.rpc('world_ban_list', { p_world: worldName });
    return error ? null : data || [];
  };
  // the world owner sends a player (to: their id, or '*' for everyone) back to the door (k 'spawn')
  // or out of the world (k 'out')
  // new servers: the kick is made on the server (only the owner may) and only its id goes out; each player asks
  // the server whether it is real and for them (claim_kick). Returns an error message or null.
  // k: 'spawn' | 'out' | 'pull' (x, y: where to, world pixels; pull needs the new server)
  N.sendKick = async (to, k, x, y) => {
    if (!N.me) return null;
    if (!N.secure) {
      if (k === 'pull') return 'Pull needs the new server setup (supabase/schema.sql)';
      send('kick', { to, k, n: playerName });
      return null;
    }
    const args = { p_world: worldName, p_to: to, p_kind: k };
    if (k === 'pull') Object.assign(args, { p_x: x, p_y: y });
    const { data, error } = await sb.rpc('kick_player', args);
    if (error) return /owner/i.test(error.message || '') ? 'Only the owner of this world can do that' : N.dbError(error);
    send('kick', { kid: data });
    return null;
  };
  async function onKickMsg(p) {
    if (!N.onKick) return;
    if (p.kid === undefined) {
      if (!N.secure) N.onKick(p); // old servers only: on new ones a kick without an id is fake
      return;
    }
    const { data, error } = await sb.rpc('claim_kick', { p_id: p.kid });
    const k = !error && Array.isArray(data) && data[0];
    if (k && k.world === worldName) N.onKick({ to: N.me.id, k: k.kind, n: k.from_name, x: k.px, y: k.py, verified: true });
  }
  N.sendClear = () => {
    if (N.me) sendB('clear', {});
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
        tr.push([i, tree.seed, tree.planted, tree.fruit, tree.spliced ? 1 : 0, tree.pa || 0]);
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
    // Red / Blue Locks placed, broken or changed (alocks.js)
    const ak = typeof alockKey === 'function' ? alockKey() : '';
    if (ak !== snapAL) {
      msg.al = alockList();
      snapAL = ak;
    }
    // an ATM Machine paid out (atm.js)
    const tk = typeof atmKey === 'function' ? atmKey() : '';
    if (tk !== snapATM) {
      msg.atm = atmList();
      snapATM = tk;
    }
    if (Object.keys(msg).length) sendB('tiles', msg);
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
    for (const [i, seed, planted, fruit, sp, pa] of m.tr || []) {
      if (seed === null) {
        trees.delete(i);
        snapTrees.delete(i);
      } else if (TREE_TIME[seed]) {
        const tree = { seed, planted, fruit, spliced: !!sp, pa: typeof pa === 'string' ? pa : null };
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
    if (Array.isArray(m.al) && typeof setALocks === 'function') {
      setALocks(m.al);
      snapAL = alockKey();
    }
    if (Array.isArray(m.atm) && typeof setATMs === 'function') {
      setATMs(m.atm);
      snapATM = atmKey();
    }
  }
  function onSyncReq(p) {
    if (!inWorld || !p || p.from === N.me.id) return;
    if (privRT && !mayBuild()) return; // only builders answer (on build:, where only they can send)
    clearTimeout(syncTimer);
    // whoever answers first wins; the others see the answer and stay quiet
    // now: our clock, so they can line up how old each drop is with theirs
    syncTimer = setTimeout(() => sendB('sync', { to: p.from, w: worldData(), now: Date.now() }), 60 + Math.random() * 400);
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
      // between updates (POS_EVERY apart) a walking player keeps moving the way they went, for a short while,
      // so they glide instead of hopping from one update to the next
      // (owner's bug, Oct 25 2026: jumping players seemed to go through blocks) the guess falls with gravity like a
      // real jump and stops at solid blocks, one axis at a time, instead of flying on in a straight line
      if (!r.dead && r.vx !== undefined && now - r.posAt < POS_EVERY * 1500) {
        if (r.vy) r.vy = Math.min(MAX_FALL, r.vy + GRAVITY * dt);
        const rw = r.w || P.w,
          rh = r.h || P.h;
        const nx = r.tx + r.vx * dt;
        if (!remoteHits(nx, r.ty, rw, rh, r.name)) r.tx = nx;
        else r.vx = 0;
        const ny = r.ty + r.vy * dt,
          land = r.vy > 0 ? remoteLand(r.tx, r.ty, ny, rw, rh, r.name) : -1;
        if (land >= 0) {
          // landed on a platform / shut gate: stand on it instead of sinking through until the next update
          r.ty = land - rh;
          r.vy = 0;
        } else if (!remoteHits(r.tx, ny, rw, rh, r.name)) r.ty = ny;
        else r.vy = 0;
      }
      const k = r.dead ? 0 : Math.min(1, dt * 12);
      r.x += (r.tx - r.x) * k;
      r.y += (r.ty - r.y) * k;
      if (r.walking) r.walkPh += dt * 10; // strides for everyone
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
    tileT += dt;
    if (posT >= POS_EVERY) {
      posT = 0;
      sendPos(false);
    }
    if (tileT >= 0.1) {
      tileT = 0;
      diffTiles();
    }
    // safety net: every 15 s check the world's lock version, in case the "it changed" message was missed
    if (privRT && N.secure && joinedName && (lockCheckT += dt) >= 15) {
      lockCheckT = 0;
      checkLockV(joinedName);
    }
  };
  let lockCheckT = 0;
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
    'gold_done', // a trade's gold was settled on the server (economy.js)
  ];
  const lobbyH = {};
  let lobby = null,
    lobbyJoined = false;
  // id -> { name, world } of everyone online (not us). From the SERVER (`online_people`: who said hello in the last
  // 75 s, real names, '' = own lobby / PLAY screen); the lobby channel's presence (names and worlds any game can make
  // up) is only used when the server is too old, and to know when to ask again.
  N.people = new Map();
  const presPeople = new Map();
  let peopleOn = true,
    peopleBusy = false,
    peopleAgain = false,
    peopleTimer = null,
    helloTimer = null;
  function usePresence() {
    N.people.clear();
    for (const [id, m] of presPeople) N.people.set(id, m);
    if (lobbyH.people) lobbyH.people();
  }
  async function refreshPeople() {
    if (!peopleOn || !N.secure || !N.me) return usePresence();
    if (peopleBusy) return void (peopleAgain = true);
    peopleBusy = true;
    let res;
    try {
      res = await sb.rpc('online_people');
    } catch (e) {}
    peopleBusy = false;
    if (res && res.error && (res.error.code === 'PGRST202' || res.error.code === '42883')) {
      peopleOn = false;
      return usePresence();
    }
    if (res && !res.error) {
      N.people.clear();
      for (const row of res.data || [])
        if (row.id !== N.me.id) N.people.set(row.id, { name: String(row.name || ''), world: String(row.world || '') });
      if (lobbyH.people) lobbyH.people();
    }
    if (peopleAgain) {
      peopleAgain = false;
      setTimeout(refreshPeople, 1500);
    }
  }
  // someone came / went / moved (presence): ask the server soon (at most once every 2 s)
  function peopleSoon() {
    if (!peopleTimer) peopleTimer = setTimeout(() => ((peopleTimer = null), refreshPeople()), 2000);
  }
  // say hello every 20 s wherever we are (a world, or '' in our own lobby / on the PLAY screen), then refresh the list
  function startHello() {
    if (helloTimer) return;
    const beat = () => worldHello(inWorld && joinedName ? joinedName : '').then(refreshPeople); // (not in a world: '')
    beat();
    helloTimer = setInterval(() => N.me && beat(), HELLO_EVERY);
  }
  N.onLobby = (ev, fn) => (lobbyH[ev] = fn);
  // ---- messages, friend requests, trades, gifts go THROUGH THE SERVER (schema.sql lobby_send, build v) ----
  // The server puts our real id and name on them and delivers them on the receiver's own 'inbox:<id>' channel (only
  // they can listen, only the server can send there). Once our inbox is joined, messages broadcast on the shared
  // lobby channel (old builds: anyone could fake their sender, and everyone could read them) are ignored.
  // Old server (no lobby_send / private channels): the old lobby broadcast.
  let srvInbox = true,
    inbox = null,
    iJoined = false,
    lq = Promise.resolve(); // sends go out one after another, so a trade's messages arrive in order
  const useInbox = () => srvInbox && privRT && N.secure;
  function lobbyBroadcast(ev, to, data) {
    if (!lobby || !lobbyJoined || !N.me) return false;
    lobby.send({ type: 'broadcast', event: ev, payload: { ...data, to, from: N.me.id, fn: playerName } });
    return true;
  }
  N.lsend = (ev, to, data) => {
    if (!N.me) return false;
    if (!useInbox()) return lobbyBroadcast(ev, to, data);
    lq = lq.then(async () => {
      let error;
      try {
        ({ error } = await sb.rpc('lobby_send', { p_event: ev, p_to: to, p_data: data || {} }));
      } catch (e) {
        error = { message: String(e) };
      }
      if (!error) return;
      if (error.code === 'PGRST202' || error.code === '42883' || /realtime\.send/i.test(error.message || '')) {
        srvInbox = false; // the server can't do it yet: the old way, this message too
        lobbyBroadcast(ev, to, data);
      } else if (error.code === 'P0001' || error.code === '42501') toast(error.message);
      else console.warn('lobby_send', error);
    });
    return true;
  };
  function joinInbox() {
    if (inbox || !useInbox() || !N.me) return;
    const c = sb.channel('inbox:' + N.me.id, chOpts(false));
    inbox = c;
    for (const ev of LOBBY_EVENTS)
      c.on('broadcast', { event: ev }, ({ payload }) => {
        if (payload && payload.to === N.me.id && lobbyH[ev]) lobbyH[ev](payload);
      });
    c.subscribe((status) => {
      if (inbox !== c) return;
      if (status === 'SUBSCRIBED') iJoined = true;
      else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !iJoined) {
        // no realtime rule for inbox: yet (old schema): keep the lobby broadcasts
        srvInbox = false;
        inbox = null;
        dropChannel(c);
      }
    });
  }
  N.joinLobby = () => {
    if (!sb || !N.me || lobby) return;
    const c = sb.channel('lobby', chOpts(true));
    lobby = c;
    for (const ev of LOBBY_EVENTS)
      c.on('broadcast', { event: ev }, ({ payload }) => {
        // (once our inbox works, a message here is from an old build or a faked sender)
        if (payload && payload.to === N.me.id && lobbyH[ev] && !iJoined) lobbyH[ev](payload);
      });
    c.on('presence', { event: 'sync' }, () => {
      const st = c.presenceState();
      presPeople.clear();
      for (const id in st) {
        const m = st[id] && st[id][st[id].length - 1];
        if (m && id !== N.me.id) presPeople.set(id, { name: String(m.name || '').slice(0, 16), world: String(m.world || '') });
      }
      if (peopleOn && N.secure) peopleSoon();
      else usePresence();
    }).subscribe((status) => {
      if (status === 'CHANNEL_ERROR' && privRT && !lobbyJoined && lobby === c) {
        privRT = false; // see openWorld: the server isn't set up for private channels yet
        lobby = null;
        dropChannel(c).then(() => N.joinLobby());
        return;
      }
      if (status === 'SUBSCRIBED') {
        lobbyJoined = true;
        c.track({ name: playerName, world: inWorld ? worldName : '' });
        startHello();
        joinInbox();
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
  // ---------- Global Chat (globalchat.js; schema.sql global_chat / send_broadcast) ----------
  // messages: { id, u (sender id), n (name), w (their world), t (text), at }
  const gRow = (r) => ({ id: +r.id, u: r.from_id, n: r.from_name, w: r.world || '', t: r.body, at: Date.parse(r.created_at) || Date.now() });
  N.globalList = async (after = 0) => {
    if (!sb || !N.me) return null;
    let q = sb.from('global_chat').select('id,from_id,from_name,world,body,created_at').order('id', { ascending: false }).limit(40);
    if (after) q = q.gt('id', after);
    const { data, error } = await q;
    return error ? null : (data || []).map(gRow).reverse();
  };
  N.globalSend = async (text, world) => {
    const { data, error } = await sb.rpc('send_broadcast', { p_text: text, p_world: world || '' });
    if (!error) return { id: +data };
    return {
      err:
        error.code === 'PGRST202' || error.code === '42883'
          ? 'The server needs an update for Global Chat (run schema.sql)'
          : error.code === 'P0001' || error.code === '42501'
            ? error.message
            : N.dbError(error),
    };
  };
  let gch = null;
  N.joinGlobal = () => {
    if (!sb || !N.me || gch) return;
    gch = sb.channel('global', chOpts(false));
    gch.on('broadcast', { event: 'g' }, ({ payload }) => payload && N.onGlobal && N.onGlobal({ ...payload, id: +payload.id, at: Date.now() })).subscribe();
  };
  // ---------- the GM's updates (mailbox.js; schema.sql announcements) ----------
  N.annList = async () => {
    if (!sb || !N.me) return null;
    const { data, error } = await sb.from('announcements').select('id,title,body,created_at').order('id', { ascending: false }).limit(20);
    if (error) return null;
    return (data || []).map((a) => ({ id: +a.id, title: a.title, body: a.body, at: Date.parse(a.created_at) || 0 }));
  };
  N.annPost = async (title, body) => {
    const { error } = await sb.rpc('post_announcement', { p_title: title, p_body: body });
    if (!error) return null;
    return error.code === 'PGRST202' || error.code === '42883' ? 'The server needs an update for the Mailbox (run schema.sql)' : error.code === 'P0001' || error.code === '42501' ? error.message : N.dbError(error);
  };
  N.annDelete = async (id) => {
    const { error } = await sb.rpc('delete_announcement', { p_id: id });
    return error ? (error.code === 'P0001' || error.code === '42501' ? error.message : N.dbError(error)) : null;
  };
  // a look at another world's saved data without joining it or touching the save cache (Question Door, qdoor.js)
  N.peekWorld = async (name) => {
    if (!sb || !N.me) return null;
    const { data, error } = await sb.from('worlds').select('data').eq('name', name).maybeSingle();
    return error || !data ? null : data.data;
  };
  // ---------- letters in a Mailbox (schema.sql mailbox_letters; mailbox.js) ----------
  // the letters in this world's Mailboxes: everyone gets who sent it and the subject; the world's owner also gets the
  // text, the items and whether it was read
  const mbErr = (error) =>
    error.code === 'PGRST202' || error.code === '42883'
      ? 'The server needs an update for the Mailbox (run schema.sql)'
      : error.code === 'P0001' || error.code === '42501'
        ? error.message
        : N.dbError(error);
  N.mailboxList = async (world) => {
    if (!sb || !N.me) return null;
    const { data, error } = await sb.rpc('mailbox_list', { p_world: world });
    if (error || !Array.isArray(data)) return null;
    return data;
  };
  N.mailboxSend = async (world, tile, subject, body, items) => {
    const { data, error } = await sb.rpc('mailbox_send', { p_world: world, p_tile: tile, p_subject: subject, p_body: body, p_items: items });
    return error ? { err: mbErr(error) } : { id: +data };
  };
  N.mailboxClaim = async (id) => {
    const { data, error } = await sb.rpc('mailbox_claim', { p_id: id });
    return error ? { err: mbErr(error) } : { items: Array.isArray(data) ? data : [] };
  };
  N.mailboxRead = async (id) => {
    const { error } = await sb.rpc('mailbox_read', { p_id: id });
    return error ? mbErr(error) : null;
  };
  N.mailboxDelete = async (id) => {
    const { error } = await sb.rpc('mailbox_delete', { p_id: id });
    return error ? mbErr(error) : null;
  };
  return N;
})();
