// v4 — la página (index.html) se pide primero a la red, así las actualizaciones aparecen solas.
// Sin conexión usa la copia guardada. Si cambiás sw.js, subí el número de versión.
const CACHE = 'sorteo-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // cache:'reload' evita que se guarde una copia vieja que tenga el navegador
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // fuentes, etc.: red normal
  if (url.pathname.endsWith('/sw.js')) return;           // el navegador gestiona su propia actualización

  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isPage) {
    // red primero → siempre la última versión; sin red, la copia guardada
    e.respondWith(
      fetch(req.url, { cache: 'no-cache' })
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // íconos y manifest: caché primero
  e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
