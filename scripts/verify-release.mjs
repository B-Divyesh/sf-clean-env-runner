import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const site = new URL('../dist/site/', import.meta.url);
const text = async (path) => readFile(new URL(path, site), 'utf8');
const exists = async (path) => stat(new URL(path, site));

for (const page of ['privacy/index.html', 'terms/index.html']) {
  await exists(page);
  const html = await text(page);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<main id="main"/);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, `${page} must have exactly one h1`);
}

const privacy = await text('privacy/index.html');
for (const phrase of ['.clean-env/receipts/', 'working directory', 'timestamps', 'variable names', '--no-receipt', 'no accounts, analytics, cookies, telemetry, or network collection']) {
  assert.match(privacy, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `privacy page missing ${phrase}`);
}

const headers = await text('_headers');
assert.match(headers, /\/assets\/\*[\s\S]*?Cache-Control: public, max-age=31536000, immutable/);
assert.match(headers, /\/sw\.js[\s\S]*?Cache-Control: no-cache, must-revalidate/);
assert.match(headers, /\/\*[\s\S]*?Content-Security-Policy: default-src 'self';/);
assert.match(headers, /Permissions-Policy: /);
for (const feature of ['camera', 'microphone', 'geolocation']) assert.match(headers, new RegExp(`${feature}=\\(\\)`));

const azure = JSON.parse(await text('staticwebapp.config.json'));
assert.equal(azure.globalHeaders['content-security-policy'].startsWith("default-src 'self';"), true);
assert.match(azure.globalHeaders['permissions-policy'], /camera=\(\).*microphone=\(\).*geolocation=\(\)|camera=\(\).*geolocation=\(\).*microphone=\(\)/);
assert.deepEqual(azure.routes[0], { route: '/assets/*', headers: { 'cache-control': 'public, max-age=31536000, immutable' } });
assert.deepEqual(azure.routes.find((route) => route.route === '/sw.js'), { route: '/sw.js', headers: { 'cache-control': 'no-cache, must-revalidate' } });

console.log('Release artifact policy routes and deployment headers verified.');
