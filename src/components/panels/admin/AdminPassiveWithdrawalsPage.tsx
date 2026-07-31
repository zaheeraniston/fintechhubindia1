'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { Wallet, ArrowRight, CheckCircle2, Clock, XCircle, IndianRupee, TrendingDown, Search } from 'lucide-react';
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

export function AdminPassiveWithdrawalsPage() {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPayout, setActionPayout] = useState<PayoutItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionOpen, setActionOpen] = useState(false);
  const [acting, setActing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchPayouts(); }, []);

  async function fetchPayouts() {
    setLoading(true);
    try { const data = await apiFetch('/passive-payouts'); setPayouts(data.data || []); }
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
      await apiFetch(`/passive-payouts/${actionPayout.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus, adminNotes }) });
      toast.success('Passive Payout updated');
      setActionOpen(false);
      fetchPayouts();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setActing(false); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const completedPayouts = payouts.filter(p => p.status === 'completed');
  const pendingPayouts   = payouts.filter(p => p.status === 'pending');
  const processingPayouts = payouts.filter(p => p.status === 'processing');
  const rejectedPayouts  = payouts.filter(p => p.status === 'rejected');

  const totalCompleted  = completedPayouts.reduce((s, p) => s + p.amount, 0);
  const totalPending    = pendingPayouts.reduce((s, p) => s + p.amount, 0);
  const totalProcessing = processingPayouts.reduce((s, p) => s + p.amount, 0);
  const totalAllTime    = payouts.reduce((s, p) => s + p.amount, 0);

  const filteredPayouts = payouts.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    if (!matchStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (p.user?.fullName || '').toLowerCase().includes(q) ||
        (p.user?.email || '').toLowerCase().includes(q) ||
        (p.upiId || '').toLowerCase().includes(q) ||
        (p.accountHolderName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg">
              <Wallet className="w-4 h-4 text-white" />
            </span>
            Passive Withdrawals Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{payouts.length} total passive withdrawal requests</p>
        </div>
      </div>

      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-premium border border-emerald-500/20 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Total Withdrawn</p>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{fmt(totalCompleted)}</p>
            <p className="text-[10px] text-emerald-400 mt-1 font-semibold">{completedPayouts.length} completed payouts</p>
          </CardContent>
        </Card>

        <Card className="glass-premium border border-amber-500/20 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">Pending Amount</p>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{fmt(totalPending)}</p>
            <p className="text-[10px] text-amber-400 mt-1 font-semibold">{pendingPayouts.length} awaiting action</p>
          </CardContent>
        </Card>

        <Card className="glass-premium border border-blue-500/20 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Processing</p>
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{fmt(totalProcessing)}</p>
            <p className="text-[10px] text-blue-400 mt-1 font-semibold">{processingPayouts.length} in process</p>
          </CardContent>
        </Card>

        <Card className="glass-premium border border-violet-500/20 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">All-Time Requests</p>
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{fmt(totalAllTime)}</p>
            <p className="text-[10px] text-violet-400 mt-1 font-semibold">{payouts.length} total requests</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search user, email, UPI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-xl border border-white/10 px-3.5 pl-9 text-xs bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-white/10 px-3 text-xs bg-slate-900 text-white focus:outline-none focus:border-violet-500 transition-colors"
        >
          <option value="all">All Status ({payouts.length})</option>
          <option value="pending">Pending ({pendingPayouts.length})</option>
          <option value="processing">Processing ({processingPayouts.length})</option>
          <option value="completed">Completed ({completedPayouts.length})</option>
          <option value="rejected">Rejected ({rejectedPayouts.length})</option>
        </select>
        <p className="text-xs text-slate-400 ml-auto">{filteredPayouts.length} shown</p>
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
                  <th className="text-left p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider hidden lg:table-cell">Date</th>
                  <th className="text-right p-3 text-xs font-bold text-indigo-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                      No passive payout requests found.
                    </td>
                  </tr>
                ) : filteredPayouts.map((p) => (
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
                    <td className="p-3 text-xs text-slate-400 hidden lg:table-cell">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
          <DialogHeader><DialogTitle className="text-white font-bold">Update Passive Payout</DialogTitle></DialogHeader>
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
