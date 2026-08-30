import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { promisify } from 'node:util';

const root = new URL('../', import.meta.url);
const text = (path) => readFile(new URL(path, root), 'utf8');
const execFileAsync = promisify(execFile);

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

test('@claim:response-policy static deployment declares immutable assets and restrictive browser policies', async () => {
  const headers = await text('public/_headers');
  assert.match(headers, /\/assets\/\*[\s\S]*?Cache-Control: public, max-age=31536000, immutable/);
  assert.match(headers, /\/sw\.js[\s\S]*?Cache-Control: no-cache, must-revalidate/);
  assert.match(headers, /\/privacy\/\*[\s\S]*?Cache-Control: no-cache, must-revalidate/);
  assert.match(headers, /\/terms\/\*[\s\S]*?Cache-Control: no-cache, must-revalidate/);
  assert.match(headers, /\/404\.html[\s\S]*?Cache-Control: no-cache, must-revalidate/);
  assert.doesNotMatch(headers, /^\/\*\s*\n(?:\s*#.*\n)*\s*Cache-Control:/m, 'global browser policies must not override immutable asset caching');
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
  assert.equal(azure.routes.some((route) => route.route === '/*'), false, 'a catch-all cache route can override immutable asset caching');
  for (const route of ['/', '/index.html', '/404.html', '/privacy/*', '/terms/*']) {
    assert.deepEqual(azure.routes.find((entry) => entry.route === route), { route, headers: { 'cache-control': 'no-cache, must-revalidate' } });
  }
  assert.deepEqual(azure.responseOverrides, { 404: { rewrite: '/404.html' } });
});

test('publishable crate excludes workspace dependency documentation', async () => {
  const repository = new URL('../../', import.meta.url).pathname;
  const { stdout } = await execFileAsync(
    'cargo',
    ['package', '--locked', '--allow-dirty', '--list'],
    { cwd: repository, windowsHide: true },
  );
  const files = stdout.trim().split(/\r?\n/);
  assert.equal(files.some((file) => file.startsWith('node_modules/')), false, stdout);
  for (const expected of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
    assert.equal(files.includes(expected), true, `${expected} is missing from the crate`);
  }
});

test('built service worker versions its shell cache from the hashed asset list', async () => {
  await rm(new URL('../../dist/site/', import.meta.url), { recursive: true, force: true });
  await new Promise((resolve, reject) => execFile('npm', ['run', 'build:site'], { cwd: new URL('../../', import.meta.url).pathname, windowsHide: true }, (error) => error ? reject(error) : resolve()));
  const worker = await readFile(new URL('../../dist/site/sw.js', import.meta.url), 'utf8');
  assert.match(worker, /const CACHE = 'clean-env-runner-[a-f0-9]{12}';/);
  assert.doesNotMatch(worker, /clean-env-runner-v1/);
});
