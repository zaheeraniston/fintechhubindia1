'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { Bell, CheckCircle2, AlertCircle, XCircle, Info, Check, BellRing, BellOff } from 'lucide-react';
import { subscribeToPush, getNotificationPermission, isPushSupported, unsubscribeFromPush } from '@/lib/push';

interface NotificationItem {
  id: string;
  userId: string | null; // null means broadcast
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPage() {
  const { user, setUnreadNotificationsCount } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readBroadcasts, setReadBroadcasts] = useState<string[]>([]);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported' | null>(null);
  const [enablingPush, setEnablingPush] = useState(false);

  // Check current push permission status on mount
  useEffect(() => {
    setPushPermission(isPushSupported() ? getNotificationPermission() : 'unsupported');
  }, []);

  async function handleEnableNotifications() {
    if (!user?.id) return;
    setEnablingPush(true);
    try {
      const result = await subscribeToPush(user.id);
      if (result === 'granted') {
        setPushPermission('granted');
        toast.success('🔔 Push notifications enabled! You will now receive alerts.');
      } else if (result === 'denied') {
        setPushPermission('denied');
        toast.error('Notifications blocked. Please enable them in your browser/phone settings.');
      } else if (result === 'unsupported') {
        toast.error('Push notifications are not supported on this device/browser.');
      } else {
        toast.error('Failed to enable notifications. Please try again.');
      }
    } catch {
      toast.error('Failed to enable notifications.');
    } finally {
      setEnablingPush(false);
    }
  }

  async function handleDisableNotifications() {
    try {
      await unsubscribeFromPush();
      setPushPermission('default');
      toast.success('Notifications disabled for this device.');
    } catch {
      toast.error('Failed to disable notifications.');
    }
  }

  // Load read broadcasts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`read_broadcasts_${user?.id}`);
    if (saved) {
      try {
        setReadBroadcasts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse read broadcasts', e);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  // ── Supabase Realtime: sync broadcast edits/inserts instantly ──
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: 'user_id=is.null' },
        (payload) => {
          const updated = payload.new as any;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updated.id
                ? {
                    ...n,
                    title: updated.title,
                    message: updated.message,
                    type: updated.type,
                  }
                : n
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=is.null' },
        (payload) => {
          const n = payload.new as any;
          const newItem: NotificationItem = {
            id: n.id,
            userId: null,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: false,
            createdAt: n.created_at,
          };
          setNotifications((prev) => [newItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Synchronize unread count globally in real-time
  useEffect(() => {
    const unread = notifications.filter((n) => !isNotificationRead(n)).length;
    setUnreadNotificationsCount(unread);
  }, [notifications, readBroadcasts]);

  async function fetchNotifications() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/notifications?userId=${user.id}`);
      setNotifications(data.data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  // Check if a specific notification is read (either DB isRead or broadcast ID in local storage)
  function isNotificationRead(item: NotificationItem) {
    if (item.userId === null) {
      return readBroadcasts.includes(item.id);
    }
    return item.isRead;
  }

  async function handleMarkAllAsRead() {
    if (notifications.length === 0 || !user?.id) return;

    try {
      // 1. Mark user-specific notifications as read on database
      await apiFetch('/notifications/mark-read', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });

      // 2. Mark all broadcast notifications as read locally
      const broadcastIds = notifications
        .filter((n) => n.userId === null)
        .map((n) => n.id);

      const updatedBroadcasts = Array.from(new Set([...readBroadcasts, ...broadcastIds]));
      setReadBroadcasts(updatedBroadcasts);
      localStorage.setItem(`read_broadcasts_${user.id}`, JSON.stringify(updatedBroadcasts));

      // 3. Update local state
      setNotifications(prev =>
        prev.map((n) => ({ ...n, isRead: n.userId !== null ? true : n.isRead }))
      );

      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }

  async function handleMarkSingleAsRead(item: NotificationItem) {
    if (isNotificationRead(item)) return;

    try {
      if (item.userId === null) {
        // Mark broadcast read locally
        const updated = [...readBroadcasts, item.id];
        setReadBroadcasts(updated);
        localStorage.setItem(`read_broadcasts_${user?.id}`, JSON.stringify(updated));
      } else {
        // Mark user-specific read in DB
        await apiFetch('/notifications/mark-read', {
          method: 'POST',
          body: JSON.stringify({ notificationId: item.id }),
        });
        setNotifications(prev =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      toast.error('Failed to mark notification as read');
    }
  }

  if (loading) return <LoadingSpinner text="Loading notifications..." />;

  const unreadCount = notifications.filter((n) => !isNotificationRead(n)).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
            <Bell className="w-6 h-6 text-violet-400" /> Notifications
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification(s)` : 'You are all caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            className="border-violet-500/30 text-violet-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/50 rounded-xl transition-all cursor-pointer h-10 px-4"
          >
            <Check className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      {/* ── Push Notification Permission Banner ── */}
      {pushPermission === 'default' && (
        <div className="mb-5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-violet-400 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Enable Push Notifications</p>
              <p className="text-xs text-slate-400 mt-0.5">Tap below to get instant alerts from admin — announcements, updates &amp; more.</p>
            </div>
          </div>
          <button
            id="enable-push-btn"
            onClick={handleEnableNotifications}
            disabled={enablingPush}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-violet-900/40 disabled:opacity-60 cursor-pointer active:scale-95"
          >
            <BellRing className="w-4 h-4" />
            {enablingPush ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      )}

      {pushPermission === 'denied' && (
        <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-900/20 p-4 flex items-center gap-3">
          <BellOff className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-300">Notifications Blocked</p>
            <p className="text-xs text-slate-400 mt-0.5">Go to your browser/phone Settings → Site Settings → Notifications → Allow for this site.</p>
          </div>
        </div>
      )}

      {pushPermission === 'granted' && (
        <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-900/20 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-300">Push Notifications Active</p>
              <p className="text-xs text-slate-400">You'll receive instant alerts on this device.</p>
            </div>
          </div>
          <button
            onClick={handleDisableNotifications}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors cursor-pointer underline shrink-0"
          >
            Disable
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications Yet"
          description="We'll notify you here when your reports are processed or announcements are made."
        />
      ) : (
        <div className="space-y-3.5">
          {notifications.map((item) => {
            const isRead = isNotificationRead(item);
            
            // Map types to card styling
            const styleMap = {
              success: {
                bg: 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40',
                iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                icon: CheckCircle2,
              },
              error: {
                bg: 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40',
                iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                icon: XCircle,
              },
              warning: {
                bg: 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40',
                iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                icon: AlertCircle,
              },
              info: {
                bg: 'bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40',
                iconBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                icon: Info,
              },
            };

            const typeStyle = styleMap[item.type] || styleMap.info;
            const IconComponent = typeStyle.icon;

            return (
              <Card
                key={item.id}
                onClick={() => handleMarkSingleAsRead(item)}
                className={`border shadow-lg transition-all duration-300 overflow-hidden rounded-2xl cursor-pointer ${
                  isRead ? 'opacity-65 border-white/5 bg-slate-900/30' : `${typeStyle.bg} border-l-4`
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${typeStyle.iconBg}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Message body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-bold text-sm truncate ${isRead ? 'text-slate-300' : 'text-white'}`}>
                        {item.title}
                      </h3>
                      {item.userId === null && (
                        <span className="text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                          Broadcast
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1.5 leading-relaxed break-words ${isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                      {item.message}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      {new Date(item.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_#a78bfa] shrink-0 self-center" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
