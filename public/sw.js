// Minimal offline shell for the PWA. Cache-first for static assets; network for
// everything else (API + shop pages stay live). Safe no-op if fetch fails.
const CACHE = "stash-v1";
const SHELL = ["/", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // never cache API, blobs or the mutable shop pages
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/s/")) return;
  const isStatic = url.pathname.startsWith("/_next/") || /\.(png|svg|woff2?|css|js|json|ico)$/.test(url.pathname);
  if (!isStatic) return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request)
            .then((res) => {
              if (res.ok) cache.put(e.request, res.clone());
              return res;
            })
            .catch(() => hit)
      )
    )
  );
});
