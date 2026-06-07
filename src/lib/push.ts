/**
 * push.ts – Web Push subscription helpers for Fintech Hub India
 */

import { supabase } from './supabase';

// Must match the VAPID public key used in the edge function
export const VAPID_PUBLIC_KEY =
  'BKmen1o_Cy-9Bv7SUOSp2KW27O4y7aJBzkZs2n3ncjIFAPtaaOTA8nn-zYFuvY_3NI3xGO9J73kPZyL9tqkT52U';

/** Convert VAPID public key from base64url to Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return view;
}

/** Register service worker, subscribe to push, and save in Supabase */
export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Check if already subscribed
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON();
    const endpoint = json.endpoint!;
    const p256dh = (json.keys as any)?.p256dh ?? '';
    const auth = (json.keys as any)?.auth ?? '';

    // Upsert subscription in Supabase
    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, endpoint, p256dh, auth },
      { onConflict: 'endpoint' }
    );

    return true;
  } catch (err) {
    console.warn('[Push] Subscribe failed:', err);
    return false;
  }
}

/** Unsubscribe device from push notifications */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (err) {
    console.warn('[Push] Unsubscribe failed:', err);
  }
}
