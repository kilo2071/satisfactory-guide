// Offline support: keep a copy of every file, serve it straight away and
// refresh it in the background, so a new upload shows up on the next launch.
const CACHE = "phase-guide-v5";
const FILES = [
  "./", "./index.html", "./app.js", "./manifest.webmanifest",
  "./ds/tokens.css", "./ds/components/bundle.css", "./ds/components/bundle.js",
  "./ds/components/lib/react.production.min.js", "./ds/components/lib/react-dom.production.min.js",
  "./ds/fonts/NothingYouCouldDo-Regular.ttf", "./ds/fonts/ImpactLabelReversed.ttf",
  "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
