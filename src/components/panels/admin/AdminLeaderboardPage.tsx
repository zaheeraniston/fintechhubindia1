'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trophy, Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeaderboardEntry { id: string; userId: string; earnings: number; rank: number; period: string; dateLabel: string; isOverridden: boolean; user?: { fullName: string }; }

export function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaderboardEntry | null>(null);
  const [form, setForm] = useState({ userId: '', earnings: 0, rank: 0, period: 'daily', dateLabel: '' });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<{ id: string; fullName: string }[]>([]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [lbData, usersData] = await Promise.all([apiFetch('/leaderboard'), apiFetch('/users?limit=100')]);
      setEntries(lbData.data || []);
      setUsers((usersData.data || []).map((u: { id: string; fullName: string }) => ({ id: u.id, fullName: u.fullName })));
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm({ userId: '', earnings: 0, rank: 0, period: 'daily', dateLabel: new Date().toISOString().split('T')[0] }); setDialogOpen(true); }
  function openEdit(e: LeaderboardEntry) { setEditing(e); setForm({ userId: e.userId, earnings: e.earnings, rank: e.rank, period: e.period, dateLabel: e.dateLabel }); setDialogOpen(true); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) { await apiFetch(`/leaderboard/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...form, isOverridden: true }) }); toast.success('Updated'); }
      else { await apiFetch('/leaderboard', { method: 'POST', body: JSON.stringify(form) }); toast.success('Created'); }
      setDialogOpen(false); fetchData();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return;
    try { await apiFetch(`/leaderboard/${id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchData(); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const rankColors = ['from-amber-400 to-yellow-500', 'from-slate-300 to-slate-400', 'from-amber-600 to-orange-600'];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-4 h-4 text-white" />
            </span>
            Leaderboard Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{entries.length} entries</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-lg cursor-pointer rounded-xl py-5">
          <Plus className="w-4 h-4 mr-2" /> Add Entry
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <Card className="glass-premium border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-amber-500/5">
                  <th className="text-left p-3 text-xs font-bold text-amber-300 uppercase tracking-wider">Rank</th>
                  <th className="text-left p-3 text-xs font-bold text-amber-300 uppercase tracking-wider">User</th>
                  <th className="text-left p-3 text-xs font-bold text-amber-300 uppercase tracking-wider">Earnings</th>
                  <th className="text-left p-3 text-xs font-bold text-amber-300 uppercase tracking-wider">Period</th>
                  <th className="text-left p-3 text-xs font-bold text-amber-300 uppercase tracking-wider">Override</th>
                  <th className="text-right p-3 text-xs font-bold text-amber-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-amber-500/5 transition-colors">
                    <td className="p-3">
                      <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${rankColors[(e.rank - 1)] || 'from-violet-500/20 to-fuchsia-500/20'} flex items-center justify-center text-sm font-black text-white shadow-sm`}>
                        #{e.rank}
                      </span>
                    </td>
                    <td className="p-3 text-sm font-semibold text-white">{e.user?.fullName || 'Unknown'}</td>
                    <td className="p-3 font-black text-emerald-400">{fmt(e.earnings)}</td>
                    <td className="p-3">
                      <span className="text-xs font-bold capitalize text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-lg">{e.period}</span>
                    </td>
                    <td className="p-3">
                      {e.isOverridden
                        ? <span className="text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg">Yes</span>
                        : <span className="text-xs text-slate-500">No</span>}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(e)} className="h-8 w-8 p-0 text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 cursor-pointer">
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(e.id)} className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 cursor-pointer">
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
          <DialogHeader><DialogTitle className="text-white font-bold">{editing ? 'Edit Entry' : 'Add Entry'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-300">User *</Label>
              <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white rounded-xl">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300">Earnings (₹)</Label><Input type="number" value={form.earnings} onChange={(e) => setForm({ ...form, earnings: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div><Label className="text-slate-300">Rank</Label><Input type="number" value={form.rank} onChange={(e) => setForm({ ...form, rank: Number(e.target.value) })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <div>
              <Label className="text-slate-300">Period</Label>
              <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="w-full mt-1 h-10 rounded-xl border border-white/10 px-3 text-sm bg-slate-900 text-white">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div><Label className="text-slate-300">Date Label</Label><Input value={form.dateLabel} onChange={(e) => setForm({ ...form, dateLabel: e.target.value })} className="mt-1 bg-white/5 border-white/10 text-white rounded-xl" /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white cursor-pointer rounded-xl py-5">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
