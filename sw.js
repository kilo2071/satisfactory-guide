// Offline support with self-updating.
// Online: every file comes fresh from the server (checked against the server's
// copy, so unchanged files cost almost nothing), and the copy is kept.
// Offline or on a slow connection: the kept copy is used.
// Change CACHE whenever you upload new files: open apps then fetch the new
// version and reload themselves the next time they come to the foreground.
const CACHE = "phase-guide-v17";
const FILES = [
  "./", "./index.html", "./app.js", "./manifest.webmanifest",
  "./ds/tokens.css", "./ds/components/bundle.css", "./ds/components/bundle.js",
  "./ds/components/lib/react.production.min.js", "./ds/components/lib/react-dom.production.min.js",
  "./ds/fonts/NothingYouCouldDo-Regular.ttf", "./ds/fonts/ImpactLabelReversed.ttf",
  "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png",
];
const TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  // cache: "reload" skips the browser's own HTTP cache, so the copies are really new
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
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
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req, { cache: "no-cache" }).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    if (!cached) return network;
    // fresh when the server answers in time, the kept copy otherwise
    const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), TIMEOUT_MS));
    return Promise.race([network.catch(() => cached), timeout]);
  })());
});
