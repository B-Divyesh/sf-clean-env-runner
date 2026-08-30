import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loads without console errors and passes the accessibility baseline', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page).toHaveTitle(/Clean Env Runner/);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('img')).toHaveAttribute('alt', /manifest/i);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))).toEqual([]);
  expect(errors).toEqual([]);
});

test('proofreader handles valid, empty, and error states by keyboard', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Empty boundary' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('The child receives zero environment variables.')).toBeVisible();
  await page.getByRole('button', { name: 'Broken secret' }).press('Enter');
  await expect(page.locator('#audit-output').getByText(/literal secrets are refused/i)).toBeVisible();
  await page.getByLabel('clean-env.toml').fill('version = 1\n\n[env.CI]\nvalue = "true"');
  await expect(page.locator('#audit-mark')).toHaveText('Pass');
  await expect(page.getByText('1 declared variable')).toBeVisible();
});

test('mobile layout does not overflow the viewport', async ({ page }) => {
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByLabel('clean-env.toml')).toBeVisible();
});

test('footer links meet the 44px touch-target minimum on every route', async ({ page }) => {
  for (const route of ['/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route);
    const links = page.locator('footer a');
    for (let index = 0; index < await links.count(); index += 1) {
      const link = links.nth(index);
      const box = await link.boundingBox();
      expect(box, `${route} footer link ${await link.textContent()} is visible`).not.toBeNull();
      expect(box.width, `${route} footer link ${await link.textContent()} width`).toBeGreaterThanOrEqual(44);
      expect(box.height, `${route} footer link ${await link.textContent()} height`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('@claim:offline-reload the versioned worker keeps the guide available offline', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(baseURL);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) throw new Error('service worker did not activate');
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      }
    });
    const cacheState = await page.evaluate(async () => ({
      caches: await caches.keys(),
      scriptCached: Boolean(await caches.match(document.querySelector('script[type="module"]').src)),
      styleCached: Boolean(await caches.match(document.styleSheets[0].href)),
    }));
    expect(cacheState.scriptCached, JSON.stringify(cacheState)).toBe(true);
    expect(cacheState.styleCached, JSON.stringify(cacheState)).toBe(true);
    await context.setOffline(true);
    await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.evaluate(() => window.location.reload()),
    ]);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run commands without ambient credentials.');
    const offlineState = await page.evaluate(() => ({
      controlled: Boolean(navigator.serviceWorker.controller),
      manifestLoaded: document.querySelector('#manifest').value.length > 0,
      navigatorOnline: navigator.onLine,
      statusHidden: document.querySelector('#offline').hidden,
    }));
    expect(offlineState).toEqual({
      controlled: true,
      manifestLoaded: true,
      navigatorOnline: false,
      statusHidden: false,
    });
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:browser-local-only demo input stays local and is not stored', async ({ page, context }) => {
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/?demo=1#proofreader');
  await expect(page).toHaveTitle('Demo — Clean Env Runner');
  await expect(page.getByText('Demo — sample manifest, nothing is saved.')).toBeVisible();
  await page.getByLabel('clean-env.toml').fill('version = 1\n[env.TEST]\nvalue = "local-proof-9381"');
  await expect(page.getByText('1 declared variable')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('clean-env.toml')).not.toHaveValue(/local-proof-9381/);
  const state = await page.evaluate(async () => ({
    localStorage: localStorage.length,
    sessionStorage: sessionStorage.length,
    indexedDatabases: (await indexedDB.databases()).length,
  }));
  expect(state).toEqual({ localStorage: 0, sessionStorage: 0, indexedDatabases: 0 });
  expect(await context.cookies()).toEqual([]);
  const origin = new URL(page.url()).origin;
  expect(requests.every((url) => new URL(url).origin === origin), requests.join('\n')).toBe(true);
});

test('privacy and terms are real accessible policy routes', async ({ page }) => {
  for (const route of ['/privacy/', '/terms/', '/404.html']) {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))).toEqual([]);
    expect(errors).toEqual([]);
  }
});
