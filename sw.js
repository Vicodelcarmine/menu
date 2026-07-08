/* Vico del Carmine — Service Worker
   Rende l'app installabile e utilizzabile anche con rete debole.
   Strategia: network-first per avere sempre l'ultimo menu, con la cache come
   riserva quando si è offline. */
const CACHE = "vicodelcarmine-v1";
const CORE = [
  "./",
  "index.html",
  "assets/css/style.css",
  "assets/js/menu-data.js",
  "assets/js/i18n.js",
  "assets/js/store.js",
  "assets/js/app.js",
  "assets/media/logo.jpg",
  "manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
