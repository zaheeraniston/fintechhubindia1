'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { Wallet, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PayoutItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  branchName: string;
  upiId: string;
  upiName: string;
  adminNotes: string;
  createdAt: string;
  user?: { fullName: string; email: string };
}

export function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPayout, setActionPayout] = useState<PayoutItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionOpen, setActionOpen] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => { fetchPayouts(); }, []);

  async function fetchPayouts() {
    setLoading(true);
    try { const data = await apiFetch('/payouts'); setPayouts(data.data || []); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  function openAction(p: PayoutItem) {
    setActionPayout(p);
    setNewStatus(p.status);
    setAdminNotes(p.adminNotes);
    setActionOpen(true);
  }

  async function handleAction() {
    if (!actionPayout) return;
    setActing(true);
    try {
      await apiFetch(`/payouts/${actionPayout.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus, adminNotes }) });
      toast.success('Payout updated');
      setActionOpen(false);
      fetchPayouts();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setActing(false); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg">
            <Wallet className="w-4 h-4 text-white" />
          </span>
          Payout Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">{payouts.length} payout requests</p>
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
                <tr className="border-b border-white/10 bg-indigo-500/5">
                  <th className="text-left p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider">User</th>
                  <th className="text-left p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider">Amount</th>
                  <th className="text-left p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider">Method</th>
                  <th className="text-left p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider hidden md:table-cell">Details</th>
                  <th className="text-right p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-indigo-500/5 transition-colors">
                    <td className="p-3">
                      <p className="text-sm font-semibold text-white">{p.user?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{p.user?.email}</p>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-black text-emerald-400">{fmt(p.amount)}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-lg">
                        {p.method === 'bank' ? 'Bank' : 'UPI'}
                      </span>
                    </td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3 text-xs text-slate-400 hidden md:table-cell max-w-xs truncate">
                      {p.method === 'bank' ? `${p.accountHolderName} • ••••${p.accountNumber?.slice(-4)}` : p.upiId}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openAction(p)} className="h-8 border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 cursor-pointer rounded-lg">
                        <ArrowRight className="w-3 h-3 mr-1" /> Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="bg-slate-950 border border-violet-500/20 text-white shadow-2xl rounded-2xl">
          <DialogHeader><DialogTitle className="text-white font-bold">Update Payout</DialogTitle></DialogHeader>
          {actionPayout && (
            <div className="space-y-4 mt-4">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-sm space-y-1">
                <p className="text-slate-300"><span className="text-indigo-300 font-semibold">User:</span> {actionPayout.user?.fullName}</p>
                <p className="text-slate-300"><span className="text-indigo-300 font-semibold">Amount:</span> <span className="text-emerald-400 font-bold">{fmt(actionPayout.amount)}</span></p>
                <p className="text-slate-300"><span className="text-indigo-300 font-semibold">Method:</span> {actionPayout.method}</p>
                {actionPayout.method === 'bank' ? (
                  <>
                    <p className="text-slate-300"><span className="text-indigo-300 font-semibold">Account:</span> {actionPayout.accountHolderName}</p>
                    <p className="text-slate-300"><span className="text-indigo-300 font-semibold">Acct No:</span> {actionPayout.accountNumber}</p>
                    <p className="text-slate-300"><span className="text-indigo-300 font-semibold">IFSC:</span> {actionPayout.ifscCode}</p>
                    {actionPayout.branchName && <p className="text-slate-300"><span className="text-indigo-300 font-semibold">Branch:</span> {actionPayout.branchName}</p>}
                  </>
                ) : (
                  <>
                    <p className="text-slate-300"><span className="text-indigo-300 font-semibold">UPI ID:</span> {actionPayout.upiId}</p>
                    <p className="text-slate-300"><span className="text-indigo-300 font-semibold">Name:</span> {actionPayout.upiName}</p>
                  </>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300">Status</Label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full mt-1 h-10 rounded-xl border border-white/10 px-3 text-sm bg-slate-900 text-white">
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300">Admin Notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl" />
              </div>
              <Button onClick={handleAction} disabled={acting} className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white cursor-pointer rounded-xl py-5">
                {acting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
