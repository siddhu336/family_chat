const CACHE_NAME = "family-chat-shell-v3";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/static/style.css?v=12",
  "/static/app.js?v=14",
  "/static/icons/icon.svg",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
  "/static/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/ws") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { title: "Family Chat", body: event.data?.text() || "New message" };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Family Chat", {
      body: payload.body || "New message",
      tag: payload.tag || "family-chat-message",
      icon: "/static/icons/icon-192.png",
      badge: "/static/icons/icon-192.png",
      data: { contactId: payload.contactId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const contactId = event.notification.data?.contactId;
  const target = contactId ? `/?contact=${contactId}` : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
