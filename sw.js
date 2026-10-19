// ===== Lavi, da Firenze al Perù: service worker =====
// OGNI VOLTA CHE AGGIORNI IL GIOCO: cambia il numero qui sotto (lavi-v1 -> lavi-v2 -> lavi-v3 ...)
const CACHE = 'lavi-v3';

// Tutti i file del gioco (percorsi relativi). Il gioco è un unico index.html con font, suoni e grafica dentro.
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

// Installazione: salva i file uno per uno, così un errore su un file non blocca tutto.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(FILES.map(f => cache.add(f).catch(err => console.warn('[sw] non salvato:', f, err)))))
      .then(() => self.skipWaiting())
  );
});

// Attivazione: cancella le cache delle versioni vecchie.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('lavi-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Richieste: prima la cache, poi la rete; offline, le pagine ricadono su index.html.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    })
  );
});
