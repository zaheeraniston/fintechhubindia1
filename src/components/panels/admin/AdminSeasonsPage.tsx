'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { Calendar, Plus, Pencil, Trash2, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SeasonItem { id: string; title: string; description: string; meetingType: string; meetingLink: string; startDate: string; status: string; }

export function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SeasonItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', meetingType: 'zoom', meetingLink: '', startDate: '', status: 'upcoming' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSeasons(); }, []);

  async function fetchSeasons() {
    setLoading(true);
    try { const data = await apiFetch('/seasons'); setSeasons(data.data || []); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm({ title: '', description: '', meetingType: 'zoom', meetingLink: '', startDate: '', status: 'upcoming' }); setDialogOpen(true); }
  function openEdit(s: SeasonItem) { setEditing(s); setForm({ title: s.title, description: s.description, meetingType: s.meetingType, meetingLink: s.meetingLink, startDate: s.startDate.slice(0, 16), status: s.status }); setDialogOpen(true); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) { await apiFetch(`/seasons/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }); toast.success('Updated'); }
      else { await apiFetch('/seasons', { method: 'POST', body: JSON.stringify(form) }); toast.success('Created'); }
      setDialogOpen(false); fetchSeasons();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return;
    try { await apiFetch(`/seasons/${id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchSeasons(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg">
              <Calendar className="w-4 h-4 text-white" />
            </span>
            Seasons Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{seasons.length} seasons</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg cursor-pointer rounded-xl py-5">
          <Plus className="w-4 h-4 mr-2" /> Add Season
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {seasons.map((s) => (
            <Card key={s.id} className="glass-premium border border-white/10 shadow-lg hover:border-violet-500/30 transition-all duration-300 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <Video className="w-3.5 h-3.5 text-indigo-300" />
                      </div>
                      <h3 className="font-bold text-white text-sm">{s.title}</h3>
                    </div>
                    {s.description && <p className="text-xs text-slate-400 mt-1 ml-9">{s.description}</p>}
                    <div className="flex items-center gap-3 mt-2 ml-9 text-xs text-slate-500 flex-wrap">
                      <span className="capitalize text-indigo-300 font-medium">{s.meetingType.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{new Date(s.startDate).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={s.status} />
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)} className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 cursor-pointer rounded-xl h-8 w-8 p-0">
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(s.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer rounded-xl h-8 w-8 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-950 border border-violet-500/20 text-white shadow-2xl rounded-2xl">
          <DialogHeader><DialogTitle className="text-white font-bold">{editing ? 'Edit Season' : 'Add Season'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-slate-300">Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl" /></div>
            <div>
              <Label className="text-slate-300">Meeting Type</Label>
              <select value={form.meetingType} onChange={(e) => setForm({ ...form, meetingType: e.target.value })} className="w-full mt-1 h-10 rounded-xl border border-white/10 px-3 text-sm bg-slate-900 text-white">
                <option value="zoom">Zoom</option>
                <option value="google_meet">Google Meet</option>
              </select>
            </div>
            <div><Label className="text-slate-300">Meeting Link</Label><Input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">Start Date/Time</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div>
              <Label className="text-slate-300">Status</Label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 h-10 rounded-xl border border-white/10 px-3 text-sm bg-slate-900 text-white">
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white cursor-pointer rounded-xl py-5">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
