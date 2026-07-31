'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Users, FileText, Wallet, AppWindow, TrendingUp, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AdminStats {
  totalUsers:      number;
  totalCustomers:  number;
  activeUsers:     number;
  totalReports:    number;
  pendingReports:  number;
  doneReports:     number;
  totalPayouts:    number;
  pendingPayouts:  number;
  activeApps:      number;
  totalApps:       number;
}

const DEFAULT_STATS: AdminStats = {
  totalUsers:     0,
  totalCustomers: 0,
  activeUsers:    0,
  totalReports:   0,
  pendingReports: 0,
  doneReports:    0,
  totalPayouts:   0,
  pendingPayouts: 0,
  activeApps:     0,
  totalApps:      0,
};

export function AdminDashboardPage() {
  const { user, refreshTrigger } = useAppStore();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<AdminStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Uses direct DB COUNT queries — no pagination, always 100% accurate
        const res = await apiFetch('/admin/stats');
        if (res?.data) setStats({ ...DEFAULT_STATS, ...res.data });
      } catch {
        // Keep defaults on error
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [refreshTrigger]);

  const statCards = [
    {
      label: 'Total Members',
      value: stats.totalCustomers,
      sub:   `${stats.activeUsers} Active`,
      icon:  Users,
      color: 'from-violet-400 to-fuchsia-500',
      shadow: 'shadow-violet-500/25',
      border: 'hover:border-violet-500/50',
    },
    {
      label: 'Total Reports',
      value: stats.totalReports,
      sub:   `${stats.doneReports} Approved`,
      icon:  FileText,
      color: 'from-fuchsia-400 to-pink-500',
      shadow: 'shadow-fuchsia-500/25',
      border: 'hover:border-fuchsia-500/50',
    },
    {
      label: 'Total Payouts',
      value: stats.totalPayouts,
      sub:   `${stats.pendingPayouts} Pending`,
      icon:  Wallet,
      color: 'from-indigo-400 to-violet-500',
      shadow: 'shadow-indigo-500/25',
      border: 'hover:border-indigo-500/50',
    },
    {
      label: 'Active Apps',
      value: stats.activeApps,
      sub:   `${stats.totalApps} Total`,
      icon:  AppWindow,
      color: 'from-cyan-400 to-indigo-500',
      shadow: 'shadow-cyan-500/25',
      border: 'hover:border-cyan-500/50',
    },
    {
      label: 'Pending Reports',
      value: stats.pendingReports,
      sub:   'Require attention',
      icon:  Clock,
      color: 'from-rose-400 to-red-500',
      shadow: 'shadow-rose-500/25',
      border: 'hover:border-rose-500/50',
    },
    {
      label: 'Pending Payouts',
      value: stats.pendingPayouts,
      sub:   'Awaiting processing',
      icon:  TrendingUp,
      color: 'from-amber-400 to-orange-500',
      shadow: 'shadow-amber-500/25',
      border: 'hover:border-amber-500/50',
    },
  ];

  const hour = new Date().getHours();
  let greeting = 'Welcome back';
  if (hour >= 5 && hour < 12)       greeting = 'Good Morning ☀️';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon 🌤️';
  else if (hour >= 17 && hour < 22) greeting = 'Good Evening 🌇';
  else                               greeting = 'Good Night 🌙';

  return (
    <div className={`p-4 sm:p-6 space-y-6 max-w-5xl mx-auto relative z-10 ${isMobile ? 'pt-4' : ''}`}>

      {/* Welcome Header Card */}
      <Card className="border border-white/10 shadow-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 overflow-hidden relative rounded-3xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-40" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">{greeting},</p>
              <h1 className="text-2xl font-black text-white tracking-wide">{user?.fullName}</h1>
              <p className="text-white/60 text-xs mt-0.5 font-semibold uppercase tracking-widest">Administrator</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid — accurate DB counts via /admin/stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <Card
              key={card.label}
              className={`glass-premium border border-white/10 shadow-lg ${card.border} transition-all duration-300 overflow-hidden card-hover-3d rounded-2xl`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg ${card.shadow}`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-medium">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-1">{card.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Summary — 4 cells */}
      <Card className="glass-premium border border-white/10 shadow-2xl relative overflow-hidden card-hover-3d rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Quick Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <p className="text-xs text-rose-300 font-medium">Pending Reports</p>
              <p className="text-xl font-black text-white mt-0.5">{stats.pendingReports}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Require attention</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-300 font-medium">Pending Payouts</p>
              <p className="text-xl font-black text-white mt-0.5">{stats.pendingPayouts}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Awaiting processing</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-300 font-medium">Approved Reports</p>
              <p className="text-xl font-black text-white mt-0.5">{stats.doneReports}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Successfully done</p>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <p className="text-xs text-violet-300 font-medium">Active Members</p>
              <p className="text-xl font-black text-white mt-0.5">{stats.activeUsers}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">of {stats.totalCustomers} total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
