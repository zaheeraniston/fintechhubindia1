'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bell, Send, Trash2, Megaphone } from 'lucide-react';

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
}

export function AdminNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  async function fetchBroadcasts() {
    setLoading(true);
    try {
      const data = await apiFetch('/notifications?userId=00000000-0000-0000-0000-000000000000'); // Send dummy/ignored UUID but retrieve all broadcasts (user_id is null)
      // Filter only broadcast notifications (where userId is null)
      const list = data.data || [];
      const filtered = list.filter((n: any) => n.userId === null);
      setBroadcasts(filtered);
    } catch {
      toast.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter a title and message');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/notifications/send-broadcast', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type }),
      });
      toast.success('Announcement broadcasted successfully!');
      setTitle('');
      setMessage('');
      setType('info');
      fetchBroadcasts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to broadcast announcement');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this broadcast notification?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/notifications?id=${id}`, {
        method: 'DELETE',
      });
      toast.success('Broadcast notification deleted');
      setBroadcasts(prev => prev.filter((b) => b.id !== id));
    } catch (err) {
      toast.error('Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <Bell className="w-4 h-4 text-white" />
          </span>
          Broadcast Announcements
        </h1>
        <p className="text-sm text-slate-400 mt-1">Send global custom notifications to all customer dashboards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <Card className="lg:col-span-1 border border-violet-500/20 shadow-2xl bg-violet-950/10 backdrop-blur-xl rounded-2xl overflow-hidden self-start">
          <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-fuchsia-400" /> Write Announcement
            </h2>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., App Maintenance Updates"
                  required
                  className="h-10 bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Notification Category</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-10 bg-slate-900/60 border-white/10 text-white rounded-xl">
                    <SelectValue placeholder="Choose category..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-slate-100">
                    <SelectItem value="info" className="focus:bg-violet-600 focus:text-white">Info (Blue)</SelectItem>
                    <SelectItem value="success" className="focus:bg-emerald-600 focus:text-white">Success (Green)</SelectItem>
                    <SelectItem value="warning" className="focus:bg-amber-600 focus:text-white">Warning (Yellow)</SelectItem>
                    <SelectItem value="error" className="focus:bg-rose-600 focus:text-white">Alert/Danger (Red)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Message Content</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write announcement text here..."
                  rows={4}
                  required
                  className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 rounded-xl resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold cursor-pointer rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Announcement
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Column */}
        <Card className="lg:col-span-2 glass-premium border border-white/10 shadow-2xl rounded-2xl overflow-hidden self-start">
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Broadcast History</h2>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Megaphone className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">No announcements broadcasted yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Announcement</th>
                      <th className="p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Type</th>
                      <th className="p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Date</th>
                      <th className="p-3 text-xs font-bold text-violet-300 uppercase tracking-wider text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {broadcasts.map((b) => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-violet-500/5 transition-colors">
                        <td className="p-3 max-w-[240px]">
                          <p className="font-semibold text-sm text-white truncate">{b.title}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{b.message}</p>
                        </td>
                        <td className="p-3 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            b.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                            b.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
                            b.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                            'bg-blue-500/10 border-blue-500/30 text-blue-300'
                          }`}>
                            {b.type}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-slate-400">
                          {new Date(b.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === b.id}
                            onClick={() => handleDelete(b.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer"
                          >
                            {deletingId === b.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
