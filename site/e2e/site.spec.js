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
