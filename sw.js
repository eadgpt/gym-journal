// Offline support: keeps the app files on the phone. Your journal data is never sent anywhere.
const CACHE = "gymjournal-v21";
const PICS = "gymjournal-pictures"; // exercise pictures you've opened (kept across updates)
const PIC_HOST = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/";
const FILES = ["./", "index.html", "styles.css?v=21", "app.js?v=21", "exercises.js?v=21", "manifest.json", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== PICS).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Exercise pictures: saved the first time you open them, then shown from the phone.
  if (e.request.url.startsWith(PIC_HOST)) {
    e.respondWith(caches.open(PICS).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (new URL(e.request.url).origin !== location.origin) return;
  // App files: network first (so updates arrive), fall back to the saved copy when offline.
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
