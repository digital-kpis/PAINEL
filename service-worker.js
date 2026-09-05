const CACHE_NAME = "digital-kpis-v2";
const CORE_ASSETS = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// O "casco" do app (index.html / navegação) sempre busca a versão mais nova
// na rede primeiro. Só cai pro cache se o dispositivo estiver offline.
// Isso garante que toda atualização publicada apareça assim que o app reabrir.
// Ícones e manifest raramente mudam, então esses continuam cache-primeiro
// (mais rápido, sem gastar dado à toa).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const isNavigation =
    req.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/PAINEL/") ||
    url.pathname === "/";

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  const isCoreAsset = CORE_ASSETS.some((asset) => url.pathname.endsWith(asset.replace("./", "/")));
  if (!isCoreAsset) return; // iframes dos sistemas: sempre direto da rede

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
