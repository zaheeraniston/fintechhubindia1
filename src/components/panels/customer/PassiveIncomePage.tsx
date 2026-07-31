'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { TrendingUp, Award, Layers, RefreshCw, IndianRupee, Users, Wallet } from 'lucide-react';
import { PassiveWithdrawModal } from './PassiveWithdrawModal';

interface PassiveTx {
  id: string;
  transactionType: string;
  commissionAmount: number;
  commissionRate: number;
  sourceAmount: number;
  notes: string;
  createdAt: string;
  sourceReport: {
    name: string;
    phone: string;
    amount: number;
    appName: string;
  } | null;
}

export function PassiveIncomePage() {
  const { refreshTrigger } = useAppStore();
  const [transactions, setTransactions] = useState<PassiveTx[]>([]);
  const [totalPassive, setTotalPassive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  async function fetchPassive() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/income/passive');
      setTransactions(res.data || []);
      setTotalPassive(res.totalPassive || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load passive income');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPassive(); }, [refreshTrigger]);

  const l1Total = transactions.filter(t => t.transactionType === 'l1_commission').reduce((s, t) => s + t.commissionAmount, 0);
  const l2Total = transactions.filter(t => t.transactionType === 'l2_commission').reduce((s, t) => s + t.commissionAmount, 0);
  const l1Count = transactions.filter(t => t.transactionType === 'l1_commission').length;
  const l2Count = transactions.filter(t => t.transactionType === 'l2_commission').length;

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Passive Income</h1>
          <p className="text-slate-400 text-sm mt-1">Referral commissions earned from your downline's approved reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPassive}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <p className="text-white/80 font-medium text-sm">Available Passive Balance</p>
          <h2 className="text-4xl font-black text-white mt-1">{fmt(totalPassive)}</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-violet-700 font-bold hover:bg-white/90 transition-all shadow-lg"
        >
          <Wallet className="w-5 h-5" />
          Withdraw Passive Income
        </button>
      </div>

      {/* ── WITHDRAW MODAL ── */}
      {showModal && (
        <PassiveWithdrawModal 
          onClose={() => setShowModal(false)} 
          availableBalance={totalPassive}
          onSuccess={fetchPassive}
        />
      )}

      {/* Important Note */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-emerald-300 text-sm font-semibold">
          💡 Passive Income is <span className="text-emerald-200 font-black">system-generated commission</span>. It is completely separate from your report income. No deductions are made from your report earnings.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Level 1 */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level 1 (7.5%)</span>
          </div>
          <p className="text-2xl font-black text-amber-300">{fmt(l1Total)}</p>
          <p className="text-xs text-slate-500 mt-1">{l1Count} commissions</p>
        </div>

        {/* Level 2 */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level 2 (2.5%)</span>
          </div>
          <p className="text-2xl font-black text-cyan-300">{fmt(l2Total)}</p>
          <p className="text-xs text-slate-500 mt-1">{l2Count} commissions</p>
        </div>
      </div>

      {/* Commission Structure Info */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 flex-1 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <Users className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-300">Direct Sponsor (L1)</p>
            <p className="text-xs text-slate-400">7.5% on each approved report from your direct referrals</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-1 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
          <Users className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-cyan-300">Indirect Sponsor (L2)</p>
            <p className="text-xs text-slate-400">2.5% on each approved report from your indirect referrals</p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Transaction History</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading passive income...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={fetchPassive} className="mt-3 text-violet-400 hover:text-violet-300 text-xs underline cursor-pointer">Retry</button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <IndianRupee className="w-7 h-7 text-violet-400 opacity-50" />
            </div>
            <p className="text-slate-400 text-sm font-medium">No passive income yet</p>
            <p className="text-slate-500 text-xs text-center max-w-xs">Refer members to the platform. When they get reports approved, you'll earn commissions automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((tx) => {
              const isL1 = tx.transactionType === 'l1_commission';
              return (
                <div key={tx.id} className="p-4 hover:bg-white/3 transition-colors duration-150">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isL1 ? 'bg-amber-500/15' : 'bg-cyan-500/15'}`}>
                        {isL1 ? <Award className="w-5 h-5 text-amber-400" /> : <Layers className="w-5 h-5 text-cyan-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {isL1 ? 'Level 1 Commission' : 'Level 2 Commission'}
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-black ${isL1 ? 'bg-amber-500/15 text-amber-400' : 'bg-cyan-500/15 text-cyan-400'}`}>
                            {(tx.commissionRate * 100).toFixed(1)}%
                          </span>
                        </p>
                        {tx.sourceReport && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {tx.sourceReport.appName || 'Report'} • {tx.sourceReport.name}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-0.5">{fmtDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-base font-black ${isL1 ? 'text-amber-300' : 'text-cyan-300'}`}>+{fmt(tx.commissionAmount)}</p>
                      <p className="text-[10px] text-slate-500">from {fmt(tx.sourceAmount)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
