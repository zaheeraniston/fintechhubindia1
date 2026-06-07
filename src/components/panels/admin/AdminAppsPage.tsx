'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { AppWindow, Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AppItem {
  id: string;
  appName: string;
  referralLink: string;
  amount: number;
  status: string;
  iconUrl: string;
  sortOrder: number;
}

export function AdminAppsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppItem | null>(null);
  const [form, setForm] = useState({ appName: '', referralLink: '', amount: 0, status: 'active', iconUrl: '', sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchApps(); }, []);

  async function fetchApps() {
    setLoading(true);
    try {
      const data = await apiFetch('/apps');
      setApps(data.data || []);
    } catch { toast.error('Failed to load apps'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ appName: '', referralLink: '', amount: 0, status: 'active', iconUrl: '', sortOrder: 0 });
    setDialogOpen(true);
  }

  function openEdit(app: AppItem) {
    setEditing(app);
    setForm({ appName: app.appName, referralLink: app.referralLink, amount: app.amount, status: app.status, iconUrl: app.iconUrl, sortOrder: app.sortOrder });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/apps/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('App updated');
      } else {
        await apiFetch('/apps', { method: 'POST', body: JSON.stringify(form) });
        toast.success('App created');
      }
      setDialogOpen(false);
      fetchApps();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this app?')) return;
    try {
      await apiFetch(`/apps/${id}`, { method: 'DELETE' });
      toast.success('App deleted');
      fetchApps();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg">
              <AppWindow className="w-4 h-4 text-white" />
            </span>
            App Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{apps.length} apps configured</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg cursor-pointer rounded-xl py-5">
          <Plus className="w-4 h-4 mr-2" /> Add App
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map((app) => (
            <Card key={app.id} className="glass-premium border border-white/10 shadow-lg hover:border-violet-500/40 transition-all duration-300 card-hover-3d rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.appName} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                        <AppWindow className="w-5 h-5 text-violet-300" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-sm">{app.appName}</h3>
                      <p className="text-xl font-black text-emerald-400 mt-0.5">{fmt(app.amount)}</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-slate-500 truncate mb-4">{app.referralLink || 'No link set'}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(app)} className="flex-1 border-violet-500/30 text-violet-300 hover:bg-violet-500/10 cursor-pointer rounded-xl">
                    <Pencil className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(app.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer rounded-xl">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-950 border border-violet-500/20 text-white shadow-2xl rounded-2xl">
          <DialogHeader><DialogTitle className="text-white font-bold">{editing ? 'Edit App' : 'Add New App'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-slate-300">App Name *</Label><Input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">Referral Link</Label><Input value={form.referralLink} onChange={(e) => setForm({ ...form, referralLink: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">Amount (₹) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">Icon URL</Label><Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div>
              <Label className="text-slate-300">Status</Label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 h-10 rounded-xl border border-white/10 px-3 text-sm bg-slate-900 text-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div><Label className="text-slate-300">Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white cursor-pointer rounded-xl py-5">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
