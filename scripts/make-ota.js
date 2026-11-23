// Writes www/ota/manifest.json: every file of www/ with its sha256, for the in-game update (bootflow.js +
// @capgo/capacitor-updater). The phone app downloads only the files whose hash it doesn't have yet, from OTA_BASE.
// Run by the "Web version (GitHub Pages)" workflow AFTER make-config.js (online-config.js must already be the final one).
// Usage: node scripts/make-ota.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');
const cfg = fs.readFileSync(path.join(www, 'js', 'online', 'online-config.js'), 'utf8');
const pick = (name) => {
  const m = cfg.match(new RegExp('const ' + name + ' = (.*);'));
  return m ? JSON.parse(m[1]) : null;
};
const build = pick('WEB_BUILD'),
  time = pick('WEB_TIME'),
  base = pick('OTA_BASE');
if (!base || !build || build === 'dev') {
  console.log('make-ota: no OTA_BASE / WEB_BUILD in online-config.js, nothing written');
  process.exit(0);
}
const SKIP = /(^|\/)(\.|ota\/)|\.env|Thumbs\.db$/;
const files = [];
(function walk(dir) {
  for (const n of fs.readdirSync(dir).sort()) {
    const f = path.join(dir, n),
      rel = path.relative(www, f).split(path.sep).join('/');
    if (SKIP.test(rel)) continue;
    if (fs.statSync(f).isDirectory()) walk(f);
    else {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
      // ?h= : GitHub Pages' cache keeps old files ~10 min; the hash in the address always gets this exact file
      files.push({ file_name: rel, file_hash: hash, download_url: base + encodeURI(rel) + '?h=' + hash.slice(0, 12) });
    }
  }
})(www);
fs.mkdirSync(path.join(www, 'ota'), { recursive: true });
fs.writeFileSync(path.join(www, 'ota', 'manifest.json'), JSON.stringify({ build, time, files }));
console.log(`make-ota: www/ota/manifest.json, build ${build}, ${files.length} files`);
