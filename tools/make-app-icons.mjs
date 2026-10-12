// Renders the app icon and splash screens (PNG) from assets/icon.svg with the test browser.
// Output is what `npx @capacitor/assets generate` expects. Already committed; rerun only if the logo changes.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'assets', 'icon.svg'), 'utf8');
const inner = svg.replace(/^<svg[^>]*>|<\/svg>\s*$/g, '').replace(/<rect[^>]*\/>/, '');
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();
async function render(file, size, logo, bg) {
  await page.setViewportSize({ width: size, height: size });
  const pad = (size - logo) / 2;
  await page.setContent(`<html><body style="margin:0;background:${bg || 'transparent'}"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g transform="translate(${pad} ${pad}) scale(${logo / 512})">${inner}</g></svg></body></html>`);
  await page.screenshot({ path: join(root, 'assets', file), omitBackground: !bg });
}
await render('icon-only.png', 1024, 1024, '#0a1520');
await render('icon-foreground.png', 1024, 640);
await render('icon-background.png', 1024, 0, '#0a1520');
await render('splash.png', 2732, 700, '#0a1520');
await render('splash-dark.png', 2732, 700, '#0a1520');
await browser.close();
console.log('assets/*.png written');
