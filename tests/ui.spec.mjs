// UI smoke tests on a phone-sized screen: onboarding, a full Draft round, a full Decision round, settings.
import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'site', 'index.html')).href;

test.beforeEach(async ({ page }) => {
  // Keep tests offline and deterministic: no fonts, no champion images (the app falls back to initials).
  await page.route(/fonts\.(googleapis|gstatic)\.com|ddragon\.leagueoflegends\.com/, r => r.abort());
});

async function playRound(page, opts, next) {
  for (let k = 0; k < 5; k++) {
    const buttons = page.locator(`${opts} .opt`);
    await expect(buttons.first()).toBeVisible();
    expect(await buttons.count()).toBeGreaterThanOrEqual(3);
    await buttons.first().click();
    await expect(page.locator(next)).toBeVisible();
    await page.locator(next).click();
  }
  await expect(page.locator('#vResult')).toBeVisible();
  await expect(page.locator('#rLevel')).toHaveText(/Level up|Level down|Stay on level/);
}

test('full flow without errors', async ({ page }) => {
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url()) && !/ddragon\.leagueoflegends\.com/.test(r.url())) external.push(r.url()); });
  await page.goto(site);

  await expect(page.locator('#vRole')).toBeVisible();
  await page.click('[data-r="mid"]');
  await expect(page.locator('#vPool')).toBeVisible();
  await page.fill('#poolSearch', 'orian');
  await page.click('#poolGrid [data-n="Orianna"]');
  await page.fill('#poolSearch', '');
  for (const n of ['Syndra', 'Galio', 'Ahri']) await page.click(`#poolGrid [data-n="${n}"]`);
  await expect(page.locator('#poolCount')).toHaveText('4 / 10 selected');
  await page.click('#poolSave');
  await expect(page.locator('#vHome')).toBeVisible();
  await expect(page.locator('#homeRole')).toContainText('Mid');

  await page.click('#playDraft');
  await expect(page.locator('#dLanes .lane')).toHaveCount(5);
  await expect(page.locator('#dLanes .lane.you')).toHaveCount(1);
  await playRound(page, '#dOpts', '#dNext');
  await page.click('#vResult [data-home]');

  await page.click('#playDecision');
  await expect(page.locator('#cMap svg')).toBeVisible();
  await playRound(page, '#cOpts', '#cNext');
  await page.click('#vResult [data-home]');

  await page.click('#toSettings');
  await page.click('#setRoles [data-r="support"]');
  await page.click('#vSettings [data-home]');
  await expect(page.locator('#homeRole')).toContainText('Support');

  expect(errors).toEqual([]);
  expect(external, 'the app makes no third-party requests (fonts are bundled)').toEqual([]);
});

test('answers lock after the first tap and show an explanation', async ({ page }) => {
  await page.goto(site);
  await page.click('[data-r="top"]');
  await page.click('#poolSkip');
  await page.click('#playDraft');
  const first = page.locator('#dOpts .opt').first();
  await first.click();
  await expect(page.locator('#dWhy')).toBeVisible();
  await expect(page.locator('#dOpts .opt.right')).toHaveCount(1);
  await expect(page.locator('#dOpts .opt').nth(1)).toBeDisabled();
});

test('progress survives a reload', async ({ page }) => {
  await page.goto(site);
  await page.click('[data-r="adc"]');
  await page.click('#poolSkip');
  await page.reload();
  await expect(page.locator('#vHome')).toBeVisible();
  await expect(page.locator('#homeRole')).toContainText('ADC');
});

test('a round in progress continues after closing the app', async ({ page }) => {
  await page.goto(site);
  await page.click('[data-r="mid"]');
  await page.click('#poolSkip');
  await page.click('#playDraft');
  await page.locator('#dOpts .opt').first().click();
  await page.click('#dNext');
  const champs = await page.locator('#dLanes').innerText();
  await page.reload();
  await expect(page.locator('#resume')).toBeVisible();
  await expect(page.locator('#resumeText')).toContainText('task 2 of 5');
  await page.click('#resumeBtn');
  await expect(page.locator('#dCount')).toHaveText('2/5');
  expect(await page.locator('#dLanes').innerText()).toBe(champs);
});
