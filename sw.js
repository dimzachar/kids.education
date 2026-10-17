const CACHE = "toys-aed4dfbd53";
const PAGES = ["/","/jack-in-the-box/","/seesaw/","/gears/","/circuit/","/pulley/","/favicon.svg","/manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PAGES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/_vercel/")) return;
  e.respondWith(fetch(e.request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
