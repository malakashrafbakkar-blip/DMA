/* DMA service worker: يخلّي التطبيق يفتح من غير نت بعد أول فتحة. غيّري رقم النسخة لما تحدّثي الملفات. */
var VERSION = "dma-v1";
var SHELL = ["./", "index.html", "quran.json", "adhkar.json", "manifest.webmanifest",
  "icon.svg", "icon-192.png", "icon-512.png", "maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var same = url.origin === self.location.origin;
  var fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!same && !fonts) return;
  if (fonts) {
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (r) { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
    return;
  }
  // الصفحة: جرّبي النت الأول عشان التحديثات توصل، ولو مفيش نت هات من الكاش
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (r) {
      var copy = r.clone(); caches.open(VERSION).then(function (c) { c.put("index.html", copy); }); return r;
    }).catch(function () { return caches.match("index.html"); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (r) {
      if (r.ok) { var copy = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return r;
    });
  }));
});
