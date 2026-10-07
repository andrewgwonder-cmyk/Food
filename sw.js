// Офлайн-кэш приложения. При обновлении файлов увеличьте номер версии.
// Схема: при наличии сети всегда берём свежие файлы с сайта (ждём не дольше 3 секунд),
// без сети или при медленной сети — сохранённую копию. Так обновления видны сразу.
const VERSION = 'racion-v17';
const FILES = ['./', './index.html', './foods.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png',
  './skin.css', './tag.js', './man.js', './light.js', './art/L_morning.jpg', './art/L_evening.jpg', './art/L_night.jpg'];

self.addEventListener('install', e => {
  // cache: 'reload' — мимо кэша браузера, чтобы не сохранить старую версию файлов
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function timeout(ms) { return new Promise(res => setTimeout(() => res(null), ms)); }

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // онлайн-базы идут напрямую в сеть
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const fromNet = fetch(url.href, { cache: 'no-cache' })
      .then(r => { if (r && r.ok) cache.put(e.request, r.clone()); return r; })
      .catch(() => null);
    const net = await Promise.race([fromNet, timeout(3000)]);
    if (net && net.ok) return net;
    const cached = await cache.match(e.request, { ignoreSearch: true });
    if (cached) return cached;
    const late = await fromNet; // сеть медленная, а копии нет — дождёмся сети
    return late || (await cache.match('./index.html')) || new Response('Нет сети', { status: 503 });
  })());
});
