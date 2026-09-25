/* Vico del Carmine — Service Worker
   Rende l'app installabile e utilizzabile anche con rete debole.

   Due regole diverse, perché sono due cose diverse:

   · IL MENU (pagine, testi, prezzi): prima la rete, così si vede sempre
     l'ultima versione; la copia sul telefono serve solo quando si è offline.

   · LE FOTO DEI PIATTI: prima la memoria del telefono. È sicuro perché ogni
     foto caricata dall'editor riceve un nome nuovo (data + nome del file):
     una foto cambiata è un indirizzo nuovo, quindi il telefono non può mai
     mostrare una foto vecchia al posto di quella nuova. Prima invece ogni
     foto veniva richiesta alla rete a ogni visita, anche quelle viste un
     minuto prima: in sala, col segnale che va e viene, voleva dire attese e
     foto che non arrivavano.

   E una cosa che non deve succedere mai più: quando la rete salta, a una
   richiesta di FOTO si risponde con un errore, non con la pagina del menu.
   Prima arrivava la pagina iniziale al posto della foto, la foto falliva di
   sicuro, e il menu la buttava via. Con l'errore, il menu sa che deve
   riprovare (vedi caricaFoto in app.js). */
const CACHE = "vicodelcarmine-v2";      // v2: butta via la vecchia memoria, piena di foto "chiuse"
const FOTO = "vicodelcarmine-foto-v1";
const MAX_FOTO = 250;                    // oltre, si dimenticano le più vecchie
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FOTO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function eFoto(url) { return url.pathname.indexOf("/storage/v1/object/public/") !== -1; }

async function foto(req) {
  const cache = await caches.open(FOTO);
  const gia = await cache.match(req);
  if (gia && !(gia.type === "opaque" && req.mode === "cors")) return gia;
  const res = await fetch(req);          // se la rete salta, l'errore arriva alla foto e il menu riprova
  // si conservano solo le risposte "in chiaro": una scatola chiusa (opaque)
  // pesa sette volte tanto nella memoria del telefono e non si può controllare
  if (res.ok && res.type !== "opaque") {
    const copia = res.clone();
    cache.put(req, copia).then(pota).catch(() => {});
  }
  return res;
}

function pota() {
  return caches.open(FOTO).then((c) => c.keys().then((k) =>
    k.length > MAX_FOTO ? Promise.all(k.slice(0, k.length - MAX_FOTO).map((r) => c.delete(r))) : null));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (eFoto(url)) { e.respondWith(foto(req)); return; }

  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        // come prima: anche i caratteri di Google (che arrivano "chiusi") restano
        // sul telefono, così offline il menu non perde la sua scrittura
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      // offline: la copia sul telefono. La pagina iniziale solo al posto di
      // una PAGINA — mai al posto di una foto, di un video o di uno script.
      .catch(() => caches.match(req).then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
