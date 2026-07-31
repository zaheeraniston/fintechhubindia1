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

/** Check current notification permission status without prompting */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** Check if push notifications are supported on this device/browser */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Register service worker, subscribe to push, and save in Supabase.
 * MUST be called from a user gesture (button click) to show permission dialog on mobile.
 */
export async function subscribeToPush(userId: string): Promise<'granted' | 'denied' | 'unsupported' | 'error'> {
  try {
    if (!isPushSupported()) {
      console.warn('[Push] Not supported on this browser/device');
      return 'unsupported';
    }

    // Request permission — MUST be called from a user gesture on mobile Chrome
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission:', permission);

    if (permission !== 'granted') return 'denied';

    // Register or get existing service worker
    let reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Force refresh subscription if it exists (to avoid stale subscriptions)
    let sub = await reg.pushManager.getSubscription();

    // If sub exists but might be stale, reuse it; otherwise create new one
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('[Push] New subscription created');
    } else {
      console.log('[Push] Existing subscription found');
    }

    const json = sub.toJSON();
    const endpoint = json.endpoint!;
    const p256dh = (json.keys as any)?.p256dh ?? '';
    const auth = (json.keys as any)?.auth ?? '';

    if (!p256dh || !auth) {
      console.warn('[Push] Missing keys in subscription');
      return 'error';
    }

    // Upsert subscription in Supabase
    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: userId, endpoint, p256dh, auth },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.error('[Push] Failed to save subscription:', error);
      return 'error';
    }

    console.log('[Push] Subscription saved successfully for user:', userId);
    return 'granted';
  } catch (err) {
    console.error('[Push] Subscribe failed:', err);
    return 'error';
  }
}

/** Silent auto-subscribe (only if already granted, no prompt) */
export async function silentSubscribeIfGranted(userId: string): Promise<void> {
  try {
    if (!isPushSupported()) return;
    if (Notification.permission !== 'granted') return;

    // Already granted — just ensure subscription is saved
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    await navigator.serviceWorker.ready;

    const activeReg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!activeReg) return;

    let sub = await activeReg.pushManager.getSubscription();
    if (!sub) {
      sub = await activeReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON();
    const endpoint = json.endpoint!;
    const p256dh = (json.keys as any)?.p256dh ?? '';
    const auth = (json.keys as any)?.auth ?? '';

    if (!endpoint || !p256dh || !auth) return;

    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, endpoint, p256dh, auth },
      { onConflict: 'endpoint' }
    );
    console.log('[Push] Silent subscription ensured');
  } catch (err) {
    console.warn('[Push] Silent subscribe failed:', err);
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
    console.log('[Push] Unsubscribed successfully');
  } catch (err) {
    console.warn('[Push] Unsubscribe failed:', err);
  }
}
