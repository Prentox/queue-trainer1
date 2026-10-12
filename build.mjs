// Build Queue Trainer.
//   dist/site/       static app for GitHub Pages and for the native app (Capacitor uses it as webDir)
//   dist/artifact.html  single-file preview
// No backend: everything runs on the device, so hosting is free at any user count.
// RELEASE=1 removes the "test build" label and allows search engines (for the store build).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(join(root, 'src', f), 'utf8');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const RELEASE = process.env.RELEASE === '1';

const champs = src('champions.txt');
if (champs.includes('`') || champs.includes('${')) throw new Error('champions.txt must not contain ` or ${');

// Real match data (aggregates from tools/analyze.mjs), if it has been collected.
const derived = f => { const p = join(root, 'data', 'derived', f); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
const lanes = derived('lanes.json'), situations = derived('situations.json'), decisions = derived('decisions.json');
const matchData = JSON.stringify({ lanes: lanes ? { matchups: lanes.matchups.filter(m => m.games >= 30) } : null, situations, decisions: decisions && decisions.method === 2 ? decisions.table.filter(r => r.best).map(r => ({ key: r.key, best: r.best })) : null });

// Champion icons bundled by tools/fetch-icons.mjs (so the app works offline), if present.
const iconDir = join(root, 'assets', 'champions');
const iconMap = existsSync(join(iconDir, 'index.json')) ? JSON.parse(readFileSync(join(iconDir, 'index.json'), 'utf8')) : {};

const label = RELEASE ? '' : `Test build v${pkg.version}. `;
const assemble = fonts => src('app.html')
  .replace('{{FONTS}}', () => fonts)
  .replace('{{BUILD_LABEL}}', () => label)
  .replace('{{MATCH_DATA}}', () => matchData)
  .replace('{{ICONS}}', () => JSON.stringify(iconMap))
  .replace('{{CHAMPIONS}}', () => champs)
  .replace('{{ENGINE}}', () => src('engine.js'))
  .replace('{{UI}}', () => src('ui.js'));

const dist = join(root, 'dist'), site = join(dist, 'site');
rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });

// Preview page: fonts from Google (it cannot load local files), no bundled icons.
const googleFonts = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Barlow:wght@400;500;600;700&display=swap">';
writeFileSync(join(dist, 'artifact.html'), assemble(googleFonts).replace(JSON.stringify(iconMap), '{}'));

// Site / app: fonts shipped with the app (offline, no third-party requests).
mkdirSync(join(site, 'fonts'), { recursive: true });
const faces = [['chakra-petch', 'Chakra Petch', [500, 600, 700]], ['barlow', 'Barlow', [400, 500, 600, 700]]];
let css = '';
for (const [pkgName, family, weights] of faces) for (const w of weights) {
  const file = `${pkgName}-latin-${w}-normal.woff2`;
  copyFileSync(join(root, 'node_modules', '@fontsource', pkgName, 'files', file), join(site, 'fonts', file));
  css += `@font-face{font-family:'${family}';font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${file}) format('woff2')}\n`;
}
writeFileSync(join(site, 'fonts.css'), css);
const page = assemble('<link rel="stylesheet" href="fonts.css">');

if (Object.keys(iconMap).length) {
  mkdirSync(join(site, 'champions'), { recursive: true });
  for (const f of readdirSync(iconDir)) if (f.endsWith('.png')) copyFileSync(join(iconDir, f), join(site, 'champions', f));
}

writeFileSync(join(site, 'icon.svg'), readFileSync(join(root, 'assets', 'icon.svg'), 'utf8'));
writeFileSync(join(site, 'manifest.webmanifest'), JSON.stringify({
  name: 'Queue Trainer', short_name: 'Queue Trainer', start_url: './', scope: './', display: 'standalone',
  background_color: '#0a1520', theme_color: '#0a1520',
  icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
}, null, 2));
writeFileSync(join(site, 'robots.txt'), RELEASE ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n');
writeFileSync(join(site, 'privacy.html'), src('privacy.html'));

const head = [
  '<!doctype html>', '<html lang="en">', '<head>', '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<link rel="manifest" href="manifest.webmanifest">', '<link rel="icon" href="icon.svg" type="image/svg+xml">',
  '<meta name="apple-mobile-web-app-capable" content="yes">', '<meta name="apple-mobile-web-app-title" content="Queue Trainer">', ''
].join('\n');
const body = RELEASE ? page.replace('<meta name="robots" content="noindex, nofollow">', '') : page;
const i = body.indexOf('<div class="app">');
writeFileSync(join(site, 'index.html'), head + body.slice(0, i) + '</head>\n<body>\n' + body.slice(i) + '\n</body>\n</html>\n');
// Offline cache for the web version: the app shell is stored on the device, updates are fetched in the background.
const shell = ['./', 'index.html', 'fonts.css', 'manifest.webmanifest', 'icon.svg', 'privacy.html', ...readdirSync(join(site, 'fonts')).map(f => 'fonts/' + f)];
writeFileSync(join(site, 'sw.js'), `/* Queue Trainer offline cache v${pkg.version} */
const CACHE = 'qt-${pkg.version}';
const SHELL = ${JSON.stringify(shell)};
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const icon = url.hostname === 'ddragon.leagueoflegends.com' && url.pathname.includes('/img/champion/');
  if (url.origin !== location.origin && !icon) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
    return icon ? (hit || fresh) : (hit ? (e.waitUntil(fresh), hit) : fresh);
  }));
});
`);
console.log(`built dist/site v${pkg.version}${RELEASE ? ' (release)' : ''}${lanes || situations || decisions ? ' · match data' : ''}${Object.keys(iconMap).length ? ` · ${Object.keys(iconMap).length} icons` : ''}`);
