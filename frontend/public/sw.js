/* NurtureHer AI service worker — offline app shell + read-only wellness cache.
 *
 * Rules:
 *  - Same-origin GET only; auth, chat, and all mutations are never cached.
 *  - Navigations: network-first, falling back to the cached shell, then offline.html.
 *  - Hashed build assets (/assets/): cache-first (filenames are content-hashed).
 *  - GET /api/v1/wellness/dashboard and /api/v1/wellness/analytics: network-first with a
 *    cached fallback so the last loaded figures stay readable offline (view-only; the
 *    app never writes from this cache).
 */

const VERSION = "nurtureher-v1";
const SHELL_CACHE = VERSION + "-shell";
const DATA_CACHE = VERSION + "-data";
const ASSET_CACHE = VERSION + "-assets";
const ACTIVE_CACHES = [SHELL_CACHE, DATA_CACHE, ASSET_CACHE];

const SHELL_URLS = ["/", "/index.html", "/offline.html", "/manifest.webmanifest"];
const OFFLINE_DATA_ENDPOINTS = ["/wellness/dashboard", "/wellness/analytics"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !ACTIVE_CACHES.includes(key)).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // cross-origin API/auth: network only

  // App-shell navigations: network-first, offline falls back to cached SPA then offline.html.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put("/index.html", copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match(request)) || (await caches.match("/index.html"));
          return cached || caches.match("/offline.html");
        })
    );
    return;
  }

  // Read-only offline data for the two wellness screens.
  if (OFFLINE_DATA_ENDPOINTS.some((path) => url.pathname.endsWith(path))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Hashed build assets: cache-first (immutable filenames).
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else (auth, chat, mutations, uploads): plain network, never cached.
});
