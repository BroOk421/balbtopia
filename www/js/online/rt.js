// The owner's own realtime server (owner, Nov 26 2026: "run the realtime on my own PC"; rt-server/), with Supabase
// Realtime as the fallback. net.js makes its busy channels (world:NAME, build:NAME:LOCKV, lobby) with RT.channel
// instead of sb.channel. RT.channel hands back a stand-in with the parts of a Supabase channel net.js uses (on,
// subscribe, send, track, presenceState, unsubscribe); when it subscribes it picks where it really goes:
// - the own server if one is up: the address is RT_URL in online-config.js, or else the one the server wrote into
//   Supabase (rt_url, fresh in the last 3 minutes); it must let us log in within RT_CFG.connectMs;
// - else a normal Supabase channel, with everything registered so far moved onto it (exactly the old way).
// Lost mid-game: it tries again (RT_CFG.retryMs); not back within RT_CFG.giveUpMs every stand-in moves to Supabase
// for the rest of the session. A topic the server refuses (banned...) also goes to Supabase, whose rules decide.
// Everyone uses the server when it is up (all find the same address), so players don't split between the two.
// Loaded after online-config.js, before net.js (which calls RT.init(sb)).
// ===== own realtime =====
// (owner, Nov 26 2026, option B: "if I restart, everyone suddenly lands on Supabase") giveUpMs was 20 s, and once on
// Supabase a player stayed there for the whole session. Now a lost server gets 2 minutes (a restart fits), and
// whoever is on Supabase (gave up, or the server was down at login) checks every backMs whether the own server is up
// again and moves back onto it by itself.
const RT_CFG = { connectMs: 5000, retryMs: [1000, 2000, 4000, 8000, 15000], giveUpMs: 120000, backMs: 60000 };
const RT = (() => {
  let sb = null,
    mode = '', // '' not decided, 'rt' own server, 'sb' Supabase
    ws = null,
    ready = null, // Promise<boolean>: logged in on the own server
    sentToken = '',
    lostAt = 0,
    tries = 0,
    refN = 0;
  const live = new Set(); // stand-ins
  const byTopic = new Map(); // topic -> Set(stand-ins on the own server)
  const say = (m) => ws && ws.readyState === 1 && ws.send(JSON.stringify(m));
  async function token() {
    try {
      const { data } = await sb.auth.getSession();
      return (data && data.session && data.session.access_token) || '';
    } catch (e) {
      return '';
    }
  }
  async function address() {
    const fixed = typeof RT_URL === 'string' ? RT_URL.trim() : '';
    if (fixed) return fixed;
    try {
      const { data, error } = await sb.rpc('rt_url');
      return !error && typeof data === 'string' && /^wss?:\/\//.test(data) ? data : '';
    } catch (e) {
      return '';
    }
  }
  // connect + log in; resolves true / false
  function connect(url) {
    return new Promise((done) => {
      let ok = false;
      const timer = setTimeout(() => finish(false), RT_CFG.connectMs);
      function finish(v) {
        clearTimeout(timer);
        if (ok) return;
        ok = true;
        if (!v && s) {
          s.onclose = null;
          try {
            s.close();
          } catch (e) {}
        }
        done(v);
      }
      let s;
      try {
        s = new WebSocket(url);
      } catch (e) {
        return finish(false);
      }
      s.onopen = async () => {
        sentToken = await token();
        if (!sentToken) return finish(false);
        s.send(JSON.stringify({ t: 'auth', token: sentToken }));
      };
      s.onmessage = (ev) => {
        let m;
        try {
          m = JSON.parse(ev.data);
        } catch (e) {
          return;
        }
        if (!ok) {
          if (m.t === 'auth') {
            if (m.ok) {
              ws = s;
              s.onmessage = (e2) => onMsg(e2.data);
              s.onclose = lost;
              finish(true);
            } else finish(false);
          }
          return;
        }
      };
      s.onerror = () => finish(false);
      s.onclose = () => finish(false);
    });
  }
  async function decide() {
    const url = await address();
    if (!url) return false;
    return connect(url);
  }
  // the own server went away mid-game: try again; not back soon: everything to Supabase
  function lost() {
    ws = null;
    if (mode !== 'rt') return;
    if (!lostAt) lostAt = Date.now();
    // (no CHANNEL_ERROR to net.js: before it got in that would read as "no private channels" and turn them off)
    if (Date.now() - lostAt > RT_CFG.giveUpMs) {
      console.warn('Own realtime server gone: using Supabase Realtime');
      mode = 'sb';
      lostAt = tries = 0;
      for (const c of [...live]) if (c.on_ === 'rt') c.toSupabase();
      return;
    }
    const wait = RT_CFG.retryMs[Math.min(tries++, RT_CFG.retryMs.length - 1)];
    setTimeout(async () => {
      if (mode !== 'rt') return;
      const url = await address();
      if (url && (await connect(url))) {
        lostAt = 0;
        tries = 0;
        for (const c of live) if (c.on_ === 'rt') c.joinRT();
      } else lost();
    }, wait);
  }
  // on Supabase: every backMs, is the own server up again? Then everything moves back onto it
  let backBusy = false;
  async function tryBack() {
    if (mode !== 'sb' || backBusy || !sb || !live.size) return;
    backBusy = true;
    try {
      const url = await address();
      if (url && mode === 'sb' && (await connect(url))) {
        console.log('Own realtime server is back: moving onto it');
        mode = 'rt';
        ready = Promise.resolve(true);
        lostAt = tries = 0;
        for (const c of [...live]) if (c.on_ === 'sb') c.toRT();
      }
    } catch (e) {
    } finally {
      backBusy = false;
    }
  }
  (function backLoop() {
    setTimeout(() => (tryBack(), backLoop()), RT_CFG.backMs);
  })();
  function onMsg(raw) {
    let m;
    try {
      m = JSON.parse(raw);
    } catch (e) {
      return;
    }
    const set = byTopic.get(m.topic);
    if (!set) return;
    for (const c of set) c.got(m);
  }
  function addTopic(c) {
    if (!byTopic.has(c.topic)) byTopic.set(c.topic, new Set());
    byTopic.get(c.topic).add(c);
  }
  function dropTopic(c) {
    const s = byTopic.get(c.topic);
    if (!s) return;
    s.delete(c);
    if (!s.size) {
      byTopic.delete(c.topic);
      say({ t: 'leave', topic: c.topic });
    }
  }

  class Chan {
    constructor(topic, opts) {
      this.topic = topic;
      this.opts = opts;
      this.isRT = true;
      this.hs = []; // [type, filter, cb]
      this.cb = null;
      this.on_ = ''; // '' not yet, 'rt', 'sb', 'off'
      this.sc = null; // the Supabase channel when on_ === 'sb'
      this.st = {}; // presence: key -> [meta]
      this.mine = null; // our tracked presence
      this.ref = 0;
      live.add(this);
    }
    on(type, filter, cb) {
      this.hs.push([type, filter, cb]);
      if (this.sc) this.sc.on(type, filter, cb);
      return this;
    }
    status(s, err) {
      if (this.cb) this.cb(s, err);
    }
    subscribe(cb) {
      this.cb = cb;
      (async () => {
        if (!mode) {
          if (!ready) ready = decide();
          mode = (await ready) ? 'rt' : 'sb';
          if (mode === 'rt') console.log('Realtime: own server');
        } else if (mode === 'rt' && ready) await ready;
        if (this.on_ === 'off') return;
        if (mode === 'rt' && ws) {
          this.on_ = 'rt';
          addTopic(this);
          this.joinRT();
        } else this.toSupabase();
      })();
      return this;
    }
    async joinRT() {
      if (this.on_ !== 'rt' || !ws) return;
      const t = await token();
      if (t && t !== sentToken) {
        sentToken = t;
        say({ t: 'auth', token: t });
      }
      this.st = {};
      this.ref = ++refN;
      say({ t: 'join', topic: this.topic, ref: this.ref });
    }
    toSupabase() {
      if (this.on_ === 'off' || this.on_ === 'sb') return;
      if (this.on_ === 'rt') dropTopic(this);
      this.on_ = 'sb';
      const sc = (this.sc = sb.channel(this.topic, this.opts));
      for (const [type, filter, cb] of this.hs) sc.on(type, filter, cb);
      // (only while this is still the channel in use: one left behind by toRT says CLOSED, which isn't news to net.js)
      sc.subscribe((s, err) => this.sc === sc && this.status(s, err));
    }
    // back from Supabase onto the own server (tryBack); net.js gets SUBSCRIBED again, as after any rejoin
    toRT() {
      if (this.on_ !== 'sb' || !ws) return;
      const old = this.sc;
      this.sc = null;
      this.on_ = 'rt';
      addTopic(this);
      this.joinRT();
      if (old) Promise.resolve().then(() => sb.removeChannel(old)).catch(() => {});
    }
    got(m) {
      if (m.t === 'joined') {
        if (m.ref !== this.ref) return;
        if (!m.ok) return this.toSupabase(); // refused here: let Supabase's own rules decide
        // back after a lost connection: our presence again (net.js also tracks on SUBSCRIBED; that one replaces it)
        const had = this.mine;
        if (had) say({ t: 'track', topic: this.topic, s: had });
        this.status('SUBSCRIBED');
      } else if (m.t === 'b') {
        for (const [type, f, cb] of this.hs) if (type === 'broadcast' && f && f.event === m.e) cb({ type: 'broadcast', event: m.e, payload: m.p });
      } else if (m.t === 'ps') {
        this.st = {};
        const keys = new Set();
        for (const r in m.state) {
          const v = m.state[r];
          (this.st[v.k] = this.st[v.k] || []).push({ ...v.s, presence_ref: String(r) });
          keys.add(v.k);
        }
        for (const k of keys) this.pres('join', { key: k, newPresences: this.st[k], currentPresences: [] });
        this.pres('sync', {});
      } else if (m.t === 'pj') {
        const metas = (this.st[m.k] = (this.st[m.k] || []).filter((x) => x.presence_ref !== String(m.r)));
        const meta = { ...m.s, presence_ref: String(m.r) };
        metas.push(meta);
        this.pres('join', { key: m.k, newPresences: [meta], currentPresences: metas });
        this.pres('sync', {});
      } else if (m.t === 'pl') {
        const all = this.st[m.k] || [],
          left = all.filter((x) => x.presence_ref === String(m.r)),
          rest = all.filter((x) => x.presence_ref !== String(m.r));
        if (rest.length) this.st[m.k] = rest;
        else delete this.st[m.k];
        if (left.length) this.pres('leave', { key: m.k, leftPresences: left, currentPresences: rest });
        this.pres('sync', {});
      }
    }
    pres(ev, arg) {
      for (const [type, f, cb] of this.hs) if (type === 'presence' && f && f.event === ev) cb(arg);
    }
    send(msg) {
      if (this.on_ === 'sb' && this.sc) return this.sc.send(msg);
      if (this.on_ !== 'rt' || !ws || !msg) return Promise.resolve('error');
      say({ t: 'b', topic: this.topic, e: msg.event, p: msg.payload });
      return Promise.resolve('ok');
    }
    track(s) {
      this.mine = s;
      if (this.on_ === 'sb' && this.sc) return this.sc.track(s);
      say({ t: 'track', topic: this.topic, s });
      return Promise.resolve('ok');
    }
    untrack() {
      this.mine = null;
      if (this.on_ === 'sb' && this.sc) return this.sc.untrack();
      say({ t: 'untrack', topic: this.topic });
      return Promise.resolve('ok');
    }
    presenceState() {
      if (this.on_ === 'sb' && this.sc) return this.sc.presenceState();
      return this.st;
    }
    async unsubscribe() {
      const was = this.on_;
      this.on_ = 'off';
      live.delete(this);
      if (was === 'rt') dropTopic(this);
      if (was === 'sb' && this.sc) {
        try {
          await sb.removeChannel(this.sc);
        } catch (e) {}
      }
      this.status('CLOSED');
      return 'ok';
    }
  }
  return {
    init(client) {
      sb = client;
    },
    channel: (topic, opts) => new Chan(topic, opts),
    // logging out: every stand-in off, the connection closed, decided again on the next login
    reset() {
      for (const c of [...live]) c.unsubscribe();
      const s = ws;
      ws = null;
      mode = '';
      ready = null;
      lostAt = tries = 0;
      sentToken = '';
      if (s) {
        s.onclose = null;
        try {
          s.close();
        } catch (e) {}
      }
    },
    get mode() {
      return mode;
    },
  };
})();
