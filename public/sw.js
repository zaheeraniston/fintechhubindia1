/* ─── FINTECH HUB INDIA – Service Worker (Push Notifications) ─── */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

/* Handle incoming Web Push messages */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Fintech Hub India', body: event.data.text() };
  }

  const title = payload.title || 'Fintech Hub India';
  const options = {
    body: payload.body || payload.message || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.tag || 'fhi-notification',
    data: { url: payload.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* Clicking the notification opens the app */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
