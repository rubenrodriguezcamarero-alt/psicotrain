// Service worker: permite usar la app sin conexión.
const CACHE = 'psicotrain-v33';
const ASSETS = ['./', 'index.html', 'styles.css', 'app.js', 'data.js', 'figures.js', 'spatial.js', 'motivacion.js', 'temario/datos.js', 'assets/cara.jpg', 'assets/cara2.jpg', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const viejas = (await caches.keys()).filter(k => k !== CACHE);
    await Promise.all(viejas.map(k => caches.delete(k)));
    await self.clients.claim();
    return viejas.length;
  })().then(habiaVieja => {
    // Si venimos de una versión anterior, recarga las pantallas abiertas para que usen ya la nueva.
    // No se espera a la recarga: la página nueva necesita que esta activación haya terminado.
    if (habiaVieja) self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(c => c.navigate(c.url).catch(() => {})));
  }));
});
// Con conexión, siempre la versión más reciente (así las mejoras llegan al momento);
// sin conexión, lo que haya guardado.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    try {
      const r = await fetch(e.request.url, { cache: 'no-cache' });
      if (r.ok) cache.put(e.request, r.clone());
      return r;
    } catch (err) {
      return (await cache.match(e.request, { ignoreSearch: true })) || Response.error();
    }
  }));
});
