'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  TrendingUp,
  Search,
  Users,
  Award,
  Layers,
  FileText,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';

interface PassiveCommissionItem {
  id: string;
  beneficiaryUserId: string;
  sourceUserId: string;
  sourceReportId: string;
  transactionType: 'l1_commission' | 'l2_commission' | string;
  commissionAmount: number;
  commissionRate: number;
  sourceAmount: number;
  notes: string;
  createdAt: string;
  beneficiary: {
    fullName: string;
    email: string;
    processId: string;
  } | null;
  sourceReport: {
    name: string;
    amount: number;
    appName: string;
  } | null;
}

interface UserPassiveSummary {
  userId: string;
  fullName: string;
  email: string;
  processId: string;
  l1Amount: number;
  l2Amount: number;
  totalAmount: number;
  count: number;
}

export function AdminPassivePayoutsPage() {
  const [transactions, setTransactions] = useState<PassiveCommissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users');
  
  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);
  
  // Pagination
  const [userPage, setUserPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchPassiveCommissions();
  }, []);

  async function fetchPassiveCommissions() {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/passive-commissions');
      setTransactions(res.data || []);
    } catch (err) {
      toast.error('Failed to load passive commissions data');
    } finally {
      setLoading(false);
    }
  }

  // Formatting helpers
  const fmt = (n: number) =>
    `₹${Number(n).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Aggregations
  let totalPassive = 0;
  let totalL1 = 0;
  let totalL2 = 0;

  const userSummaries: Record<string, UserPassiveSummary> = {};

  transactions.forEach((tx) => {
    const amount = tx.commissionAmount;
    totalPassive += amount;
    
    if (tx.transactionType === 'l1_commission') {
      totalL1 += amount;
    } else if (tx.transactionType === 'l2_commission') {
      totalL2 += amount;
    }

    const beneficiaryId = tx.beneficiaryUserId;
    if (beneficiaryId) {
      if (!userSummaries[beneficiaryId]) {
        userSummaries[beneficiaryId] = {
          userId: beneficiaryId,
          fullName: tx.beneficiary?.fullName || 'Unknown User',
          email: tx.beneficiary?.email || 'No Email',
          processId: tx.beneficiary?.processId || '—',
          l1Amount: 0,
          l2Amount: 0,
          totalAmount: 0,
          count: 0,
        };
      }

      userSummaries[beneficiaryId].totalAmount += amount;
      userSummaries[beneficiaryId].count += 1;
      if (tx.transactionType === 'l1_commission') {
        userSummaries[beneficiaryId].l1Amount += amount;
      } else if (tx.transactionType === 'l2_commission') {
        userSummaries[beneficiaryId].l2Amount += amount;
      }
    }
  });

  const allUserSummaries = Object.values(userSummaries).sort((a, b) => b.totalAmount - a.totalAmount);

  // Filters for User Summary
  const filteredUsers = allUserSummaries.filter((u) => {
    const s = userSearch.toLowerCase().trim();
    if (!s) return true;
    return (
      u.fullName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.processId.toLowerCase().includes(s)
    );
  });

  // Filters for Transactions Log
  const filteredTransactions = transactions.filter((t) => {
    // Apply selected user filter if active
    if (selectedUserFilter && t.beneficiaryUserId !== selectedUserFilter) {
      return false;
    }

    const s = txSearch.toLowerCase().trim();
    if (!s) return true;

    return (
      (t.beneficiary?.fullName || '').toLowerCase().includes(s) ||
      (t.beneficiary?.processId || '').toLowerCase().includes(s) ||
      (t.sourceReport?.name || '').toLowerCase().includes(s) ||
      (t.sourceReport?.appName || '').toLowerCase().includes(s) ||
      (t.notes || '').toLowerCase().includes(s)
    );
  });

  // Pagination lists
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);
  const paginatedTxs = filteredTransactions.slice((txPage - 1) * itemsPerPage, txPage * itemsPerPage);

  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const totalTxPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const selectedUserInfo = selectedUserFilter ? userSummaries[selectedUserFilter] : null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-400 to-violet-500 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </span>
            Passive Income Summary
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            System-wide passive commission tracking and breakdown by user
          </p>
        </div>

        <Button
          onClick={fetchPassiveCommissions}
          variant="outline"
          disabled={loading}
          className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl h-10 px-4 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-premium border-white/10 shadow-lg overflow-hidden relative rounded-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <IndianRupee className="w-16 h-16 text-white" />
          </div>
          <CardContent className="p-5">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Passive Commission</p>
            <p className="text-2xl font-black text-white mt-1.5">{fmt(totalPassive)}</p>
            <p className="text-[10px] text-fuchsia-400 font-semibold mt-1">Total distributed upline</p>
          </CardContent>
        </Card>

        <Card className="glass-premium border-white/10 shadow-lg overflow-hidden relative rounded-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award className="w-16 h-16 text-white" />
          </div>
          <CardContent className="p-5">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Level 1 Passive (7.5%)</p>
            <p className="text-2xl font-black text-amber-400 mt-1.5">{fmt(totalL1)}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Direct upline payout</p>
          </CardContent>
        </Card>

        <Card className="glass-premium border-white/10 shadow-lg overflow-hidden relative rounded-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Layers className="w-16 h-16 text-white" />
          </div>
          <CardContent className="p-5">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Level 2 Passive (2.5%)</p>
            <p className="text-2xl font-black text-cyan-400 mt-1.5">{fmt(totalL2)}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Indirect upline payout</p>
          </CardContent>
        </Card>

        <Card className="glass-premium border-white/10 shadow-lg overflow-hidden relative rounded-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText className="w-16 h-16 text-white" />
          </div>
          <CardContent className="p-5">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Transactions Count</p>
            <p className="text-2xl font-black text-violet-400 mt-1.5">{transactions.length}</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Passive events recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 max-w-sm">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          User Summary
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Detailed Transaction Log
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Search Bar for Users */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
              placeholder="Search user, email, PID..."
              className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 rounded-xl"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <Card className="glass-premium border-white/10 p-12 text-center rounded-2xl">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-300 font-bold">No Users Found</p>
              <p className="text-slate-500 text-xs mt-1">No passive income records match your search query.</p>
            </Card>
          ) : (
            <>
              {/* Users Table */}
              <Card className="glass-premium border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-violet-500/5">
                        <th className="text-left p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">User</th>
                        <th className="text-left p-4 text-xs font-bold text-violet-300 uppercase tracking-wider hidden sm:table-cell">Email</th>
                        <th className="text-right p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">Level 1 (7.5%)</th>
                        <th className="text-right p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">Level 2 (2.5%)</th>
                        <th className="text-right p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">Total Earnings</th>
                        <th className="text-right p-4 text-xs font-bold text-violet-300 uppercase tracking-wider hidden md:table-cell">Tx Count</th>
                        <th className="text-center p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((u) => {
                        const initials =
                          u.fullName
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || 'U';

                        return (
                          <tr key={u.userId} className="border-b border-white/5 hover:bg-violet-500/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9 border border-white/10 shrink-0">
                                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-black">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{u.fullName}</p>
                                  <p className="text-xs text-slate-400 font-mono">PID: {u.processId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-slate-300 hidden sm:table-cell">{u.email}</td>
                            <td className="p-4 text-right text-sm font-semibold text-amber-300">{fmt(u.l1Amount)}</td>
                            <td className="p-4 text-right text-sm font-semibold text-cyan-300">{fmt(u.l2Amount)}</td>
                            <td className="p-4 text-right text-sm font-black text-white">{fmt(u.totalAmount)}</td>
                            <td className="p-4 text-right text-sm text-slate-400 hidden md:table-cell">{u.count}</td>
                            <td className="p-4 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUserFilter(u.userId);
                                  setActiveTab('transactions');
                                  setTxPage(1);
                                }}
                                className="h-8 px-3 text-xs bg-violet-500/10 hover:bg-violet-500/25 text-violet-300 border border-violet-500/20 hover:border-violet-500/40 rounded-lg cursor-pointer"
                              >
                                View Txs
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* User pagination */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserPage(Math.max(1, userPage - 1))}
                    disabled={userPage <= 1}
                    className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-400">
                    Page {userPage} of {totalUserPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserPage(Math.min(totalUserPages, userPage + 1))}
                    disabled={userPage >= totalUserPages}
                    className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={txSearch}
                  onChange={(e) => {
                    setTxSearch(e.target.value);
                    setTxPage(1);
                  }}
                  placeholder="Search name, app, PID, notes..."
                  className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500/50 rounded-xl"
                />
              </div>

              {selectedUserFilter && (
                <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full text-xs text-violet-300">
                  <span>
                    Filter: <strong>{selectedUserInfo?.fullName || 'Selected User'}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setSelectedUserFilter(null);
                      setTxPage(1);
                    }}
                    className="p-0.5 rounded-full hover:bg-violet-500/20 text-violet-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card className="glass-premium border-white/10 p-12 text-center rounded-2xl">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-300 font-bold">No Transactions Found</p>
              <p className="text-slate-500 text-xs mt-1">No transaction logs match your criteria.</p>
            </Card>
          ) : (
            <>
              {/* Transactions Table */}
              <Card className="glass-premium border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-violet-500/5">
                        <th className="text-left p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">Beneficiary</th>
                        <th className="text-left p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">Level</th>
                        <th className="text-left p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">Source Partner</th>
                        <th className="text-left p-4 text-xs font-bold text-violet-300 uppercase tracking-wider hidden sm:table-cell">App</th>
                        <th className="text-right p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">App Value</th>
                        <th className="text-right p-4 text-xs font-bold text-violet-300 uppercase tracking-wider">Commission</th>
                        <th className="text-left p-4 text-xs font-bold text-violet-300 uppercase tracking-wider hidden md:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTxs.map((t) => {
                        const isL1 = t.transactionType === 'l1_commission';
                        const beneficiaryInitials =
                          t.beneficiary?.fullName
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || 'U';

                        return (
                          <tr key={t.id} className="border-b border-white/5 hover:bg-violet-500/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9 border border-white/10 shrink-0">
                                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-black">
                                    {beneficiaryInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{t.beneficiary?.fullName || 'System User'}</p>
                                  <p className="text-xs text-slate-400 font-mono">PID: {t.beneficiary?.processId || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  isL1
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                    : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
                                }`}
                              >
                                {isL1 ? 'L1 (7.5%)' : 'L2 (2.5%)'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{t.sourceReport?.name || 'Referred User'}</p>
                                <p className="text-xs text-slate-500">Source Report Account</p>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-slate-300 hidden sm:table-cell">
                              {t.sourceReport?.appName || 'Unknown App'}
                            </td>
                            <td className="p-4 text-right text-sm text-slate-400">
                              {fmt(t.sourceAmount)}
                            </td>
                            <td className="p-4 text-right text-sm font-black text-emerald-400">
                              +{fmt(t.commissionAmount)}
                            </td>
                            <td className="p-4 text-sm text-slate-400 hidden md:table-cell">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{fmtDate(t.createdAt)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Transactions pagination */}
              {totalTxPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTxPage(Math.max(1, txPage - 1))}
                    disabled={txPage <= 1}
                    className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-400">
                    Page {txPage} of {totalTxPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTxPage(Math.min(totalTxPages, txPage + 1))}
                    disabled={txPage >= totalTxPages}
                    className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
