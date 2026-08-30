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

test('404 route publishes complete product social metadata', async () => {
  const notFound = await text('404.html');
  assert.match(notFound, /<meta property="og:type" content="website">/);
  assert.match(notFound, /<meta property="og:url" content="https:\/\/clean-env-runner\.sociobot\.in\/404\.html">/);
  assert.match(notFound, /<meta property="og:title" content="Page not found — Clean Env Runner">/);
  assert.match(notFound, /<meta property="og:description" content="The requested Clean Env Runner page was not found\.">/);
  assert.match(notFound, /<meta property="og:image" content="https:\/\/clean-env-runner\.sociobot\.in\/social-card\.webp">/);
  assert.match(notFound, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(notFound, /<meta name="twitter:title" content="Page not found — Clean Env Runner">/);
  assert.match(notFound, /<meta name="twitter:description" content="The requested Clean Env Runner page was not found\.">/);
  assert.match(notFound, /<meta name="twitter:image" content="https:\/\/clean-env-runner\.sociobot\.in\/social-card\.webp">/);
});

test('browser claim commands build their production site from a clean checkout', async () => {
  const packageJson = JSON.parse(await text('../package.json'));
  const playwright = await text('../playwright.config.js');
  const claims = JSON.parse(await text('../.factory/claims.json'));
  const browserClaims = claims.filter(({ id }) => ['browser-local-only', 'offline-reload'].includes(id));

  assert.equal(packageJson.scripts['preview:test'], 'npm run build:site && vite preview --config site/vite.config.js');
  assert.match(playwright, /command: 'npm run preview:test -- --host 127\.0\.0\.1 --port 4173'/);
  assert.equal(browserClaims.length, 2);
  for (const claim of browserClaims) {
    assert.match(claim.test, /^npx playwright test --grep='@claim:[a-z-]+'$/);
  }
});

test('every registered claim has one tagged regression', async () => {
  const claims = JSON.parse(await text('../.factory/claims.json'));
  const ids = claims.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, 'claim ids must be unique');
  const testSources = await Promise.all([
    text('tests/claims.test.mjs'),
    text('tests/release-contract.test.mjs'),
    text('e2e/site.spec.js'),
  ]);
  for (const claim of claims) {
    assert.match(claim.test, new RegExp(`@claim:${claim.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    const tag = `@claim:${claim.id}`;
    const definitions = testSources.flatMap((source) => (
      [...source.matchAll(/test\(['"](@claim:[a-z-]+)\b/g)].map((match) => match[1])
    )).filter((candidate) => candidate === tag);
    assert.equal(definitions.length, 1, `${tag} must label exactly one test`);
  }
});

test('first-screen privacy copy distinguishes user data from the offline shell cache', async () => {
  const landing = await text('index.html');
  const privacy = await text('privacy/index.html');

  assert.match(landing, /No user data stored or analytics/);
  assert.doesNotMatch(landing, /No browser storage/i);
  assert.match(privacy, /service worker only to cache the site shell/i);
  assert.match(privacy, /browser may keep that cache until you clear site data/i);
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
