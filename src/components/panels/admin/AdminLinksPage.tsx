'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { Link2, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LinkItem { id: string; appName: string; link: string; status: string; sortOrder: number; logoUrl?: string; }

export function AdminLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LinkItem | null>(null);
  const [form, setForm] = useState({ appName: '', link: '', status: 'active', sortOrder: 0, logoUrl: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchLinks(); }, []);

  async function fetchLinks() {
    setLoading(true);
    try { const data = await apiFetch('/links'); setLinks(data.data || []); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm({ appName: '', link: '', status: 'active', sortOrder: 0, logoUrl: '' }); setDialogOpen(true); }
  function openEdit(l: LinkItem) { setEditing(l); setForm({ appName: l.appName, link: l.link, status: l.status, sortOrder: l.sortOrder, logoUrl: l.logoUrl || '' }); setDialogOpen(true); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) { await apiFetch(`/links/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }); toast.success('Updated'); }
      else { await apiFetch('/links', { method: 'POST', body: JSON.stringify(form) }); toast.success('Created'); }
      setDialogOpen(false); fetchLinks();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return;
    try { await apiFetch(`/links/${id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchLinks(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <Link2 className="w-4 h-4 text-white" />
            </span>
            Live Links Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{links.length} links configured</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg cursor-pointer rounded-xl py-5">
          <Plus className="w-4 h-4 mr-2" /> Add Link
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <Card className="glass-premium border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-violet-500/5">
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">App Name</th>
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Link</th>
                  <th className="text-left p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Status</th>
                  <th className="text-right p-3 text-xs font-bold text-violet-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-violet-500/5 transition-colors">
                    <td className="p-3 text-sm font-semibold text-white flex items-center gap-3">
                      {l.logoUrl ? (
                        <img src={l.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-400">
                          FHI
                        </div>
                      )}
                      <span>{l.appName}</span>
                    </td>
                    <td className="p-3 text-sm text-slate-400 max-w-xs truncate">{l.link}</td>
                    <td className="p-3"><StatusBadge status={l.status} /></td>
                    <td className="p-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <a href={l.link} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 cursor-pointer">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </a>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(l)} className="h-8 w-8 p-0 text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 cursor-pointer">
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(l.id)} className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 cursor-pointer">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-950 border border-violet-500/20 text-white shadow-2xl rounded-2xl">
          <DialogHeader><DialogTitle className="text-white font-bold">{editing ? 'Edit Link' : 'Add Link'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-slate-300">App Name *</Label><Input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">App Logo URL</Label><Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://example.com/logo.png (Optional)" className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">Link *</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
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
