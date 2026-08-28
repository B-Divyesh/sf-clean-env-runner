import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const text = (path) => readFile(new URL(path, root), 'utf8');

test('privacy page truthfully describes local receipts and no-collection posture', async () => {
  const privacy = await text('privacy/index.html');
  for (const phrase of ['.clean-env/receipts/', 'working directory', 'timestamps', 'variable names', 'secret values', '--no-receipt', 'no accounts, analytics, cookies, telemetry, or network collection']) {
    assert.match(privacy, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.equal((privacy.match(/<h1[ >]/g) ?? []).length, 1);
  assert.match(privacy, /<main id="main"/);
});

test('terms page is a complete accessible static route', async () => {
  const terms = await text('terms/index.html');
  assert.match(terms, /<html lang="en">/);
  assert.match(terms, /<title>Terms — Clean Env Runner<\/title>/);
  assert.equal((terms.match(/<h1[ >]/g) ?? []).length, 1);
  assert.match(terms, /<main id="main"/);
  assert.match(terms, /literal secrets/i);
});

test('static deployment declares immutable assets and restrictive browser policies', async () => {
  const headers = await text('public/_headers');
  assert.match(headers, /\/assets\/\*[\s\S]*?Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/sw\.js[\s\S]*?Cache-Control: no-cache, must-revalidate/);
  assert.match(headers, /\/\*[\s\S]*?Content-Security-Policy: default-src 'self';/);
  assert.match(headers, /worker-src 'self'/);
  assert.match(headers, /Permissions-Policy: /);
  for (const feature of ['camera', 'microphone', 'geolocation']) assert.match(headers, new RegExp(`${feature}=\\(\\)`));

  const azure = JSON.parse(await text('public/staticwebapp.config.json'));
  assert.match(azure.globalHeaders['content-security-policy'], /^default-src 'self';/);
  assert.match(azure.globalHeaders['content-security-policy'], /worker-src 'self'/);
  assert.match(azure.globalHeaders['permissions-policy'], /camera=\(\)/);
  assert.deepEqual(azure.routes[0], { route: '/assets/*', headers: { 'cache-control': 'public, max-age=31536000, immutable' } });
  assert.deepEqual(azure.routes.find((route) => route.route === '/sw.js'), { route: '/sw.js', headers: { 'cache-control': 'no-cache, must-revalidate' } });
});
