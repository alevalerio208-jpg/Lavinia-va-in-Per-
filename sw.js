// ===== Lavi, da Firenze al Perù: service worker =====
// OGNI VOLTA CHE AGGIORNI IL GIOCO: cambia il numero qui sotto (lavi-v1 -> lavi-v2 -> lavi-v3 ...)
const CACHE = 'lavi-v11';

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
      .then(cache => Promise.all(FILES.map(f => cache.add(new Request(f, { cache: 'reload' })).catch(err => console.warn('[sw] non salvato:', f, err)))))
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

// Richieste: la pagina del gioco si prende sempre fresca dalla rete (così gli aggiornamenti arrivano subito);
// se sei offline si usa la copia salvata. Icone e manifest: prima la cache.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  if (isPage) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
        return res;
      }).catch(() => caches.match('./index.html', { ignoreSearch: true }).then(r => r || caches.match('./')))
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
