'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { GraduationCap, Plus, Pencil, Trash2, PlayCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TrainingItem { id: string; title: string; youtubeUrl: string; status: string; sortOrder: number; }

export function AdminTrainingsPage() {
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingItem | null>(null);
  const [form, setForm] = useState({ title: '', youtubeUrl: '', status: 'active', sortOrder: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTrainings(); }, []);

  async function fetchTrainings() {
    setLoading(true);
    try { const data = await apiFetch('/trainings'); setTrainings(data.data || []); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm({ title: '', youtubeUrl: '', status: 'active', sortOrder: 0 }); setDialogOpen(true); }
  function openEdit(t: TrainingItem) { setEditing(t); setForm({ title: t.title, youtubeUrl: t.youtubeUrl, status: t.status, sortOrder: t.sortOrder }); setDialogOpen(true); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) { await apiFetch(`/trainings/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }); toast.success('Updated'); }
      else { await apiFetch('/trainings', { method: 'POST', body: JSON.stringify(form) }); toast.success('Created'); }
      setDialogOpen(false); fetchTrainings();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return;
    try { await apiFetch(`/trainings/${id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchTrainings(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-400 to-violet-500 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-4 h-4 text-white" />
            </span>
            Trainings Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{trainings.length} training videos</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg cursor-pointer rounded-xl py-5">
          <Plus className="w-4 h-4 mr-2" /> Add Training
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {trainings.map((t) => (
            <Card key={t.id} className="glass-premium border border-white/10 shadow-lg hover:border-violet-500/30 transition-all duration-300 rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <PlayCircle className="w-5 h-5 text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{t.title}</h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{t.youtubeUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={t.status} />
                  <Button size="sm" variant="outline" onClick={() => openEdit(t)} className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 cursor-pointer rounded-xl h-8 w-8 p-0">
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer rounded-xl h-8 w-8 p-0">
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
          <DialogHeader><DialogTitle className="text-white font-bold">{editing ? 'Edit Training' : 'Add Training'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-slate-300">Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">YouTube URL *</Label><Input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
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
