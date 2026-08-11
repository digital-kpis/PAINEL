const CACHE_NAME = "digital-kpis-v1";
const CORE_ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
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

// Só faz cache do "casco" do app (index/manifest/ícones).
// Os iframes dos sistemas (Helppi, Presença, Vendas etc.) continuam sempre
// carregando direto da internet, para não mostrar dados desatualizados.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isCoreAsset = CORE_ASSETS.some((asset) => url.pathname.endsWith(asset.replace("./", "/")));

  if (!isCoreAsset) return; // deixa passar direto pra rede

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
