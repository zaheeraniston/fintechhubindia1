'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';
import { FileText, ArrowRight, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportItem {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  accountOpenDate: string;
  status: string;
  amount: number;
  tradeSubmitted: boolean;
  adminNotes: string;
  createdAt: string;
  user?: { fullName: string; email: string; processId?: string; referralId?: string };
  app?: { appName: string; amount: number };
  appName?: string;
}

export function AdminReportsPage() {
  const { refreshTrigger } = useAppStore();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [historyUser, setHistoryUser] = useState<{ fullName: string; processId?: string; referralId?: string } | null>(null);
  const [actionReport, setActionReport] = useState<ReportItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionOpen, setActionOpen] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => { fetchReports(); }, [statusFilter, refreshTrigger]);

  async function fetchReports() {
    setLoading(true);
    try {
      const data = await apiFetch(`/reports${statusFilter && statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      setReports(data.data || []);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }

  function viewUserHistory(userId: string, fullName: string, processId?: string, referralId?: string) {
    setHistoryUserId(userId);
    setHistoryUser({ fullName, processId, referralId });
  }

  const filteredReports = reports.filter((r) => {
    if (historyUserId && r.userId !== historyUserId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const userName = (r.user?.fullName || '').toLowerCase();
      const processId = (r.user?.processId || '').toLowerCase();
      const referralId = (r.user?.referralId || '').toLowerCase();
      const submitterName = (r.name || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const appName = (r.appName || r.app?.appName || '').toLowerCase();
      return (
        userName.includes(q) ||
        processId.includes(q) ||
        referralId.includes(q) ||
        submitterName.includes(q) ||
        phone.includes(q) ||
        appName.includes(q)
      );
    }
    return true;
  });

  function openAction(report: ReportItem) {
    setActionReport(report);
    setNewStatus(report.status);
    setAdminNotes(report.adminNotes);
    setActionOpen(true);
  }

  async function handleAction() {
    if (!actionReport || !newStatus) return;
    setActing(true);
    try {
      await apiFetch(`/reports/${actionReport.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus, adminNotes }) });
      toast.success(`Report status updated to ${newStatus}`);
      setActionOpen(false);
      fetchReports();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
    finally { setActing(false); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-500 flex items-center justify-center shadow-lg">
              <FileText className="w-4 h-4 text-white" />
            </span>
            Reports Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">{filteredReports.length} reports found</p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search name, code, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-xl border border-white/10 px-3.5 pl-9 text-xs bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="trade_pending">Trade Pending</SelectItem>
              <SelectItem value="trade_completed">Trade Completed</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="lead_received">Lead Recived</SelectItem>
              <SelectItem value="payment_clex">Payment Clex</SelectItem>
              <SelectItem value="no_lead_check_clint_info">No Lead Check Clint Info.</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History Filter Indicator */}
      {historyUserId && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            <span className="text-slate-300">
              Showing reports submitted by <strong className="text-white">{historyUser?.fullName}</strong> 
              {historyUser?.referralId && <span className="text-violet-400 font-bold ml-1.5">({historyUser.referralId})</span>}
              {historyUser?.processId && <span className="text-slate-400 text-xs ml-1.5">• {historyUser.processId}</span>}
            </span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => { setHistoryUserId(null); setHistoryUser(null); }}
            className="h-8 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            Clear Filter / Show All
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <Card className="glass-premium border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-fuchsia-500/5">
                  <th className="text-left p-3 text-xs font-bold text-fuchsia-300 uppercase tracking-wider">User</th>
                  <th className="text-left p-3 text-xs font-bold text-fuchsia-300 uppercase tracking-wider">App</th>
                  <th className="text-left p-3 text-xs font-bold text-fuchsia-300 uppercase tracking-wider">Amount</th>
                  <th className="text-left p-3 text-xs font-bold text-fuchsia-300 uppercase tracking-wider">Status</th>
                  <th className="text-left p-3 text-xs font-bold text-fuchsia-300 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right p-3 text-xs font-bold text-fuchsia-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                      No reports found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-fuchsia-500/5 transition-colors">
                      <td className="p-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={() => r.userId && viewUserHistory(r.userId, r.user?.fullName || 'Unknown', r.user?.processId, r.user?.referralId)}
                              className="text-sm font-semibold text-white hover:text-violet-400 hover:underline cursor-pointer transition-colors"
                              title="Click to view user history"
                            >
                              {r.user?.fullName || 'Unknown'}
                            </span>
                            {r.user?.referralId && (
                              <span 
                                onClick={() => r.userId && viewUserHistory(r.userId, r.user?.fullName || 'Unknown', r.user?.processId, r.user?.referralId)}
                                className="px-2 py-0.5 text-[9px] font-black bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-md cursor-pointer hover:bg-violet-500/20 transition-colors animate-pulse"
                                title="Refer Code (Click to view history)"
                              >
                                {r.user.referralId}
                              </span>
                            )}
                            {r.user?.processId && (
                              <span 
                                onClick={() => r.userId && viewUserHistory(r.userId, r.user?.fullName || 'Unknown', r.user?.processId, r.user?.referralId)}
                                className="px-2 py-0.5 text-[9px] font-bold bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 rounded-md cursor-pointer hover:bg-fuchsia-500/20 transition-colors"
                                title="Process ID (Click to view history)"
                              >
                                {r.user.processId}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{r.name} • {r.phone}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-300">{r.appName || r.app?.appName || '-'}</td>
                      <td className="p-3">
                        <span className="text-sm font-black text-emerald-400">{fmt(r.amount)}</span>
                      </td>
                      <td className="p-3"><StatusBadge status={r.status} /></td>
                      <td className="p-3 text-xs text-slate-400 hidden md:table-cell">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-right flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => r.userId && viewUserHistory(r.userId, r.user?.fullName || 'Unknown', r.user?.processId, r.user?.referralId)}
                          className="h-8 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                          title="View Submission History"
                        >
                          History
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAction(r)} className="h-8 border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 cursor-pointer rounded-lg">
                          <ArrowRight className="w-3 h-3 mr-1" /> Update
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="bg-slate-950 border border-violet-500/20 text-white shadow-2xl rounded-2xl">
          <DialogHeader><DialogTitle className="text-white font-bold">Update Report Status</DialogTitle></DialogHeader>
          {actionReport && (
            <div className="space-y-4 mt-4">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-sm space-y-1">
                <p className="text-slate-300"><span className="text-violet-300 font-semibold">User:</span> {actionReport.user?.fullName}</p>
                <p className="text-slate-300"><span className="text-violet-300 font-semibold">App:</span> {actionReport.app?.appName}</p>
                <p className="text-slate-300"><span className="text-violet-300 font-semibold">Amount:</span> <span className="text-emerald-400 font-bold">{fmt(actionReport.amount)}</span></p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300">New Status</Label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full mt-1 h-10 rounded-xl border border-white/10 px-3 text-sm bg-slate-900 text-white">
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="trade_pending">Trade Pending</option>
                  <option value="trade_completed">Trade Completed</option>
                  <option value="done">Done (Credit Income)</option>
                  <option value="lead_received">Lead Recived</option>
                  <option value="payment_clex">Payment Clex</option>
                  <option value="no_lead_check_clint_info">No Lead Check Clint Info.</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-300">Admin Notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Optional notes..." className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl" />
              </div>
              <Button onClick={handleAction} disabled={acting} className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white cursor-pointer rounded-xl py-5">
                {acting ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
