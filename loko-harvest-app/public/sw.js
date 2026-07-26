// Loko Harvest Service Worker for Web Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: 'Loko Harvest Alert', body: event.data.text() };
  }

  // Check TTL expiration
  if (payload.expires_at) {
    const expiresAt = new Date(payload.expires_at).getTime();
    if (Date.now() > expiresAt) {
      console.log('Skipping expired push notification');
      return;
    }
  }

  // Handle Silent Push
  if (payload.silent) {
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({ type: 'SILENT_PUSH_UPDATE', payload });
      });
    });
    return;
  }

  const title = payload.title || 'Loko Harvest';
  const options = {
    body: payload.body || 'You have a new update.',
    icon: payload.icon || '/logo/loko.png',
    badge: payload.badge || '/logo/loko.png',
    data: {
      url: payload.route?.path || payload.action_url || '/',
      notification_uuid: payload.notification_uuid,
      priority: payload.priority || 'medium',
      schema_version: payload.schema_version || 1,
    },
    requireInteraction: payload.priority === 'urgent' || payload.priority === 'high',
    tag: payload.notification_uuid || 'loko-notification',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification dismissed:', event.notification.tag);
});
