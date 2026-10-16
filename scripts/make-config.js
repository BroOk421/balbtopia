// Writes www/js/online-config.js from .env (or from environment variables, e.g. GitHub Secrets).
// Run it with: npm run config   (serve, sync and apk run it for you)
// The key ends up in the game's files, because the browser needs it to talk to Supabase.
// What .env does is keep it out of git; what keeps the data safe is the rules in supabase/schema.sql.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envFile = path.join(root, '.env');
const out = path.join(root, 'www', 'js', 'online-config.js');

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
`,
);
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))
  console.warn('! SUPABASE_URL should look like https://xxxx.supabase.co (got "' + url + '")');
if (url && !key) console.warn('! SUPABASE_ANON_KEY is empty');
console.log(url && key ? `✓ online-config.js: online (${url})` : '✓ online-config.js: offline (no SUPABASE_URL / SUPABASE_ANON_KEY)');
console.log('  written to ' + out);
