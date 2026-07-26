import api from '@/lib/api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function subscribeUserToPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Fetch VAPID Public Key from backend
    const vapidRes = await api.get('/push-subscriptions/vapid-public-key');
    const publicKey = vapidRes.data?.data?.publicKey || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-Njv89lq83k48k5-901k';

    const convertedKey = urlBase64ToUint8Array(publicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    const subJson = subscription.toJSON();

    // Send subscription object to backend
    await api.post('/push-subscriptions', {
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      },
      device_name: navigator.userAgent,
    });

    return true;
  } catch (error) {
    console.error('Failed to subscribe user to Web Push:', error);
    return false;
  }
}
