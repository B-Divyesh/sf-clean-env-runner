import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../dist/site/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const discovered = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)]
  .map((match) => match[1])
  .filter((path) => path.startsWith('/assets/'));
const assets = ['/', '/index.html', '/environment-proof.webp', ...discovered];
const serviceWorker = `const CACHE = 'clean-env-runner-v1';
const SHELL = ${JSON.stringify(assets)};
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => caches.match('/index.html'))));
});
`;
await writeFile(new URL('sw.js', root), serviceWorker);
