// Stamps www/index.html for a deploy (owner, Nov 24 2026: the phone app, which opens the live site, went blank after a
// big update: its WebView can keep OLD copies of some scripts / styles for a while (GitHub Pages lets files be cached
// ~10 min) and mix them with the NEW index.html). Every local <script src> and stylesheet <link href> gets ?v=<build>,
// so a new build always loads its own files and never an older cached one. Local testing is unchanged (only the CI copy
// is stamped). Run by the Pages workflow AFTER make-config.js (needs WEB_BUILD) and BEFORE make-ota.js (the manifest
// then hashes the stamped index.html).
// Usage: node scripts/stamp-build.js
const fs = require('fs');
const path = require('path');

const www = path.join(__dirname, '..', 'www');
const cfg = fs.readFileSync(path.join(www, 'js', 'online', 'online-config.js'), 'utf8');
const m = cfg.match(/const WEB_BUILD = (.*);/);
const build = m ? JSON.parse(m[1]) : null;
if (!build || build === 'dev') {
  console.log('stamp-build: no WEB_BUILD in online-config.js, index.html left as it is');
  process.exit(0);
}
const file = path.join(www, 'index.html');
let html = fs.readFileSync(file, 'utf8'),
  n = 0;
html = html.replace(/(<script\b[^>]*\bsrc=")((?:js|css)\/[^"?#]+)(")/g, (all, a, src, b) => (n++, a + src + '?v=' + build + b));
html = html.replace(/(<link\b[^>]*\bhref=")((?:css|js)\/[^"?#]+)(")/g, (all, a, href, b) => (n++, a + href + '?v=' + build + b));
fs.writeFileSync(file, html);
console.log(`stamp-build: index.html, ${n} files stamped with ?v=${build}`);
