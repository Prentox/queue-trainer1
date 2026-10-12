// Checks the built app is ready to be wrapped as a native app: offline fonts, privacy page,
// manifest, release build without the test label, and no third-party font requests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'dist', 'site');
const build = env => execFileSync(process.execPath, [join(root, 'build.mjs')], { env: { ...process.env, ...env }, cwd: root });

test('release build: no test label, fonts and pages shipped with the app', () => {
  build({ RELEASE: '1' });
  const html = readFileSync(join(site, 'index.html'), 'utf8');
  assert.ok(!html.includes('Test build'), 'release build must not show the test label');
  assert.ok(!html.includes('fonts.googleapis.com'), 'fonts must be bundled, not loaded from Google');
  assert.ok(!html.includes('noindex'), 'release build may be indexed');
  assert.ok(html.includes('href="fonts.css"'));
  assert.ok(readdirSync(join(site, 'fonts')).filter(f => f.endsWith('.woff2')).length >= 7);
  for (const f of ['privacy.html', 'manifest.webmanifest', 'icon.svg', 'robots.txt', 'sw.js']) assert.ok(existsSync(join(site, f)), `${f} missing`);
  const sw = readFileSync(join(site, 'sw.js'), 'utf8');
  assert.ok(sw.includes('index.html') && sw.includes('fonts/'), 'offline cache must include the app shell');
  assert.ok(readFileSync(join(site, 'privacy.html'), 'utf8').includes('does not collect'));
});

test('test build: labelled and hidden from search engines', () => {
  build({ RELEASE: '' });
  const html = readFileSync(join(site, 'index.html'), 'utf8');
  assert.ok(html.includes('Test build v'));
  assert.ok(html.includes('noindex'));
  assert.ok(readFileSync(join(site, 'robots.txt'), 'utf8').includes('Disallow: /'));
});

test('native app files are in place', () => {
  const cap = JSON.parse(readFileSync(join(root, 'capacitor.config.json'), 'utf8'));
  assert.equal(cap.webDir, 'dist/site');
  for (const f of ['icon-only.png', 'icon-foreground.png', 'icon-background.png', 'splash.png', 'splash-dark.png']) assert.ok(existsSync(join(root, 'assets', f)), `assets/${f} missing`);
});
