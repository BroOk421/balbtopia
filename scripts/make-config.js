// Writes www/js/online/online-config.js from .env (or from environment variables, e.g. GitHub Secrets).
// Run it with: npm run config   (serve, sync and apk run it for you)
// The key ends up in the game's files, because the browser needs it to talk to Supabase.
// What .env does is keep it out of git; what keeps the data safe is the rules in supabase/schema.sql.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envFile = path.join(root, '.env');
const out = path.join(root, 'www', 'js', 'online', 'online-config.js');

// tiny .env reader: KEY=value lines, # comments, optional quotes, optional "export "
function readEnv(file) {
  const env = {};
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*[=:]\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, ''); // inline comment
    env[m[1].toUpperCase()] = v.trim();
  }
  return env;
}
// look for .env, and for the usual mistakes (".env.txt" on Windows, inside www/, only .env.example filled)
const candidates = ['.env', '.env.txt', '.env.local', 'www/.env', 'env', 'env.txt'].map((f) => path.join(root, f));
const found = candidates.find((f) => fs.existsSync(f));
let env = {};
if (found) {
  env = readEnv(found);
  const rel = path.relative(root, found);
  if (rel !== '.env') console.warn(`! Using "${rel}". Rename it to ".env" (in the same folder as package.json).`);
  if (!env.SUPABASE_URL && !env.SUPABASE_ANON_KEY)
    console.warn(`! "${rel}" has no SUPABASE_URL / SUPABASE_ANON_KEY lines. Found: ${Object.keys(env).join(', ') || 'nothing'}`);
} else {
  console.warn('! No .env file found in ' + root);
  const ex = path.join(root, '.env.example');
  if (fs.existsSync(ex)) {
    const e = readEnv(ex);
    if (e.SUPABASE_URL && !e.SUPABASE_URL.includes('xxxx') && e.SUPABASE_ANON_KEY) {
      console.warn('! You filled in .env.example. Copy it to a file named ".env" (the example file is uploaded to GitHub!). Using it for now.');
      env = e;
    }
  }
}
// real environment variables win (CI secrets)
const url = (process.env.SUPABASE_URL || env.SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '').trim();
// Edge Function addresses (the dashboard editor may give them random ones like "rapid-endpoint"): the last part of
// the function's URL, or the whole URL. Empty = the default names "signup" / "password-reset".
const slug = (v, d) => (String(v || '').trim().replace(/\/+$/, '').split('/').pop() || d);
const fnSignup = slug(process.env.SUPABASE_FN_SIGNUP || env.SUPABASE_FN_SIGNUP, 'signup');
const fnReset = slug(process.env.SUPABASE_FN_RESET || env.SUPABASE_FN_RESET, 'password-reset');

// (Nov 23 2026, in-game updates: www/js/core/bootflow.js) which build of www/ this is, and where the newest one lives.
// WEB_BUILD = the git commit (GitHub Actions gives GITHUB_SHA), WEB_TIME = its time (unix s): the game only updates to
// a NEWER one. OTA_BASE = the web version's address (GitHub Pages: https://OWNER.github.io/REPO/, worked out from
// GITHUB_REPOSITORY; set OTA_BASE in .env / the environment for a custom domain). Empty / 'dev' = no in-game updates.
const { execSync } = require('child_process');
const git = (c) => {
  try {
    return execSync('git ' + c, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {
    return '';
  }
};
const webBuild = (process.env.WEB_BUILD || process.env.GITHUB_SHA || '').trim().slice(0, 12) || 'dev';
const webTime = Number(process.env.WEB_TIME || (webBuild !== 'dev' && git('log -1 --format=%ct')) || 0) || 0;
let otaBase = (process.env.OTA_BASE || env.OTA_BASE || '').trim();
if (!otaBase && process.env.GITHUB_REPOSITORY) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  otaBase = repo.toLowerCase() === (owner + '.github.io').toLowerCase() ? `https://${owner.toLowerCase()}.github.io/` : `https://${owner.toLowerCase()}.github.io/${repo}/`;
}
if (otaBase && !otaBase.endsWith('/')) otaBase += '/';
// (Nov 26 2026) the own realtime server's fixed address (wss://...), for a named tunnel / own domain. Empty: the game
// asks Supabase where it is (rt-server writes it there), and uses Supabase Realtime when none is up.
const rtUrl = (process.env.RT_URL || env.RT_URL || '').trim();
if (rtUrl && !/^wss?:\/\//.test(rtUrl)) console.warn('! RT_URL should start with wss:// (got "' + rtUrl + '")');

function looksSecret(k) {
  if (k.startsWith('sb_secret_')) return true;
  try {
    return /service_role/.test(Buffer.from(k.split('.')[1] || '', 'base64').toString());
  } catch (e) {
    return false;
  }
}
if (key && looksSecret(key)) {
  console.error('✗ SUPABASE_ANON_KEY is the SECRET key. Never put it in the game; use the anon / publishable key.');
  process.exit(1);
}

fs.writeFileSync(
  out,
  `// Made by scripts/make-config.js from .env. Don't edit by hand: change .env and run "npm run config".
const SUPABASE_URL = ${JSON.stringify(url)};
const SUPABASE_ANON_KEY = ${JSON.stringify(key)};
const SUPABASE_FN_SIGNUP = ${JSON.stringify(fnSignup)};
const SUPABASE_FN_RESET = ${JSON.stringify(fnReset)};
const WEB_BUILD = ${JSON.stringify(webBuild)};
const WEB_TIME = ${webTime};
const OTA_BASE = ${JSON.stringify(otaBase)};
const RT_URL = ${JSON.stringify(rtUrl)};
`,
);
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))
  console.warn('! SUPABASE_URL should look like https://xxxx.supabase.co (got "' + url + '")');
if (url && !key) console.warn('! SUPABASE_ANON_KEY is empty');
console.log(url && key ? `✓ online-config.js: online (${url})` : '✓ online-config.js: offline (no SUPABASE_URL / SUPABASE_ANON_KEY)');
console.log('  functions: signup -> ' + fnSignup + ', forgot password -> ' + fnReset);
console.log('  build ' + webBuild + (webTime ? ' (' + new Date(webTime * 1000).toISOString() + ')' : '') + ', updates from ' + (otaBase || '(none)'));
console.log('  written to ' + out);

// (Nov 23 2026, owner: "I don't want it downloading; when I push to GitHub everyone should just have it") LIVE_APP=1
// (android.yml): the APK opens the GitHub Pages site itself (Capacitor server.url) instead of its own copy of www/, so
// every push that reaches Pages is what every phone plays on its next start, with nothing to download. No connection:
// the copy's offline.html (server.errorPath) with a retry button. Only the CI copy of capacitor.config.json changes.
if (/^(1|true|yes)$/i.test(process.env.LIVE_APP || env.LIVE_APP || '')) {
  const capPath = path.join(root, 'capacitor.config.json');
  const cap = JSON.parse(fs.readFileSync(capPath, 'utf8'));
  if (otaBase) {
    cap.server = Object.assign({}, cap.server, { url: otaBase, errorPath: 'offline.html' });
    console.log('✓ capacitor.config.json: the app opens ' + otaBase + ' (live, no downloads)');
  } else {
    delete cap.server;
    console.warn('! LIVE_APP is on but there is no OTA_BASE / GITHUB_REPOSITORY: the app plays its own copy');
  }
  fs.writeFileSync(capPath, JSON.stringify(cap, null, 2) + '\n');
}
