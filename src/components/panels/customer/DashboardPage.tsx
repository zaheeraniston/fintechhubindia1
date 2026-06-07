'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SkeletonCard } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import {
  FileText,
  Link2,
  Wallet,
  Users,
  Copy,
  CheckCircle2,
  Share2,
  TrendingUp,
  CalendarDays,
  Sparkles,
  ArrowDownToLine,
} from 'lucide-react';

/* ─── tiny inline styles for animations not in Tailwind ─── */
const style = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes cardShimmer {
  0%   { transform: translateX(-120%); }
  100% { transform: translateX(120%);  }
}
@keyframes floatOrb1 {
  0%,100% { transform: translate(0px,  0px)  scale(1);    }
  33%      { transform: translate(18px,-22px) scale(1.08); }
  66%      { transform: translate(-12px,14px) scale(0.95); }
}
@keyframes floatOrb2 {
  0%,100% { transform: translate(0px, 0px)  scale(1);    }
  40%      { transform: translate(-20px,18px) scale(1.06); }
  70%      { transform: translate(14px,-10px) scale(0.97); }
}
@keyframes floatOrb3 {
  0%,100% { transform: translate(0px, 0px); }
  50%      { transform: translate(10px,20px); }
}
@keyframes starTwinkle {
  0%,100% { opacity: 0.15; transform: scale(1);    }
  50%      { opacity: 0.8;  transform: scale(1.5);  }
}
@keyframes avatarPulseRing {
  0%   { box-shadow: 0 0 0 0px rgba(167,139,250,0.55); }
  70%  { box-shadow: 0 0 0 12px rgba(167,139,250,0);   }
  100% { box-shadow: 0 0 0 0px rgba(167,139,250,0);    }
}
.anim-slide-0 { animation: fadeSlideUp 0.55s cubic-bezier(.22,1,.36,1) 0.05s both; }
.anim-slide-1 { animation: fadeSlideUp 0.55s cubic-bezier(.22,1,.36,1) 0.15s both; }
.anim-slide-2 { animation: fadeSlideUp 0.55s cubic-bezier(.22,1,.36,1) 0.25s both; }
.anim-slide-3 { animation: fadeSlideUp 0.55s cubic-bezier(.22,1,.36,1) 0.35s both; }
.anim-slide-4 { animation: fadeSlideUp 0.55s cubic-bezier(.22,1,.36,1) 0.45s both; }
.anim-slide-5 { animation: fadeSlideUp 0.55s cubic-bezier(.22,1,.36,1) 0.55s both; }
.anim-slide-6 { animation: fadeSlideUp 0.55s cubic-bezier(.22,1,.36,1) 0.65s both; }
.earning-card { position: relative; overflow: hidden; }
.earning-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
  animation: cardShimmer 3.5s ease-in-out infinite;
  pointer-events: none;
}
.avatar-pulse { animation: avatarPulseRing 2.4s ease-out infinite; }
`;

interface IncomeData {
  daily: { credits: number; debits: number; net: number };
  monthly: { credits: number; debits: number; net: number };
  lifetime: { credits: number; debits: number; net: number; availableBalance: number };
  breakdown?: {
    self: number;
    direct: number;
    level2: number;
    level3: number;
    passive: number;
  };
}

interface DownlineUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  processId: string;
  sponsorId: string;
  referralId: string;
  level: number;
  reportCount: number;
  totalEarnings: number;
}

interface DownlineData {
  data: DownlineUser[];
  meta: {
    totalDownline: number;
    maxLevel: number;
    levelBreakdown: { level: number; count: number }[];
  };
}

/* ─── Tiny floating star dot ─── */
function Star({ x, y, delay, size }: { x: string; y: string; delay: string; size: number }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'white',
        animation: `starTwinkle 2.8s ease-in-out ${delay} infinite`,
        pointerEvents: 'none',
      }}
    />
  );
}

/* ─── Animated Earning Counter component ─── */
function CountUpAmount({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;
    const startValue = 0;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressPercentage = Math.min(progress / duration, 1);
      
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progressPercentage);
      
      setCount(Math.floor(startValue + easedProgress * (value - startValue)));
      if (progressPercentage < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return (
    <>
      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(count)}
    </>
  );
}

export function DashboardPage() {
  const { user, setPage, refreshTrigger } = useAppStore();
  const [income, setIncome] = useState<IncomeData | null>(null);
  const [downline, setDownline] = useState<DownlineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPassiveModal, setShowPassiveModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [incomeRes, downlineRes] = await Promise.all([
          apiFetch('/income/summary'),
          apiFetch(`/downline?userId=${user?.id}`)
        ]);
        setIncome(incomeRes.data);
        setDownline(downlineRes);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchData();
  }, [user?.id, refreshTrigger]);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
        <SkeletonCard className="h-48 rounded-3xl" />
        <SkeletonCard className="h-20 rounded-2xl" />
        <SkeletonCard className="h-20 rounded-2xl" />
        <SkeletonCard className="h-20 rounded-2xl" />
        <SkeletonCard className="h-20 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      {/* Inject animation keyframes */}
      <style>{style}</style>

      <div className="pt-0 pb-6 px-4 sm:p-6 space-y-3 sm:space-y-5 max-w-4xl mx-auto relative z-10">

        {/* ══════════════════════════════════════════════════════
            1. PROFILE HERO
            ══════════════════════════════════════════════════════ */}
        <div className="anim-slide-0 mt-[-16px] sm:mt-0 relative rounded-3xl overflow-hidden">

          {/* ── Animated background ── */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-700 via-fuchsia-700 to-slate-950" />

          {/* Floating orb 1 */}
          <div style={{ position:'absolute', top:'10%', left:'8%', width:110, height:110,
            background:'radial-gradient(circle, rgba(167,139,250,0.45) 0%, transparent 70%)',
            borderRadius:'50%', filter:'blur(18px)',
            animation:'floatOrb1 7s ease-in-out infinite' }} />
          {/* Floating orb 2 */}
          <div style={{ position:'absolute', top:'15%', right:'10%', width:90, height:90,
            background:'radial-gradient(circle, rgba(232,121,249,0.45) 0%, transparent 70%)',
            borderRadius:'50%', filter:'blur(16px)',
            animation:'floatOrb2 9s ease-in-out infinite' }} />
          {/* Floating orb 3 – bottom center */}
          <div style={{ position:'absolute', bottom:'0%', left:'40%', width:140, height:60,
            background:'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
            borderRadius:'50%', filter:'blur(24px)',
            animation:'floatOrb3 11s ease-in-out infinite' }} />

          {/* Star particles */}
          <Star x="12%"  y="20%" delay="0s"    size={3} />
          <Star x="80%"  y="12%" delay="0.6s"  size={2} />
          <Star x="55%"  y="8%"  delay="1.2s"  size={2} />
          <Star x="25%"  y="65%" delay="0.3s"  size={2} />
          <Star x="88%"  y="55%" delay="1.8s"  size={3} />
          <Star x="65%"  y="78%" delay="0.9s"  size={2} />
          <Star x="38%"  y="40%" delay="2.1s"  size={2} />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center pt-8 pb-6 px-6 text-center">
            {/* Avatar */}
            <div className="relative mb-3">
              {/* Animated glow ring behind avatar */}
              <div className="absolute inset-0 rounded-full"
                style={{ background:'linear-gradient(135deg,#a78bfa,#f0abfc)',
                  filter:'blur(10px)', opacity:0.65, transform:'scale(1.18)' }} />
              <Avatar className="relative avatar-pulse w-20 h-20 border-[3px] border-white/40 shadow-2xl">
                <AvatarImage src={user?.profilePhoto} alt={user?.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-2xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Greeting */}
            <p className="text-white/70 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1">
              {(() => {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 12) return 'Good Morning ☀️';
                if (hour >= 12 && hour < 17) return 'Good Afternoon 🌤️';
                if (hour >= 17 && hour < 22) return 'Good Evening 🌇';
                return 'Good Night 🌙';
              })()}
            </p>

            {/* Name */}
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg leading-none mt-1">
              {user?.fullName}
            </h1>

            {/* Process ID badge */}
            <div className="mt-2 flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-fuchsia-300" />
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">ID:</span>
              <span className="text-white text-xs font-black font-mono tracking-wider">{user?.processId}</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            2. EARNING CARDS — stacked full-width
            ══════════════════════════════════════════════════════ */}
        <div className="space-y-3">

          {/* TODAY'S EARNING */}
          <div className="anim-slide-1 earning-card rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#059669 0%,#10b981 55%,#34d399 100%)' }}>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11
              bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="px-5 py-4 pr-20">
              <p className="text-white/75 text-[10px] font-extrabold uppercase tracking-[0.18em] mb-1">Today's Earning</p>
              <p className="text-2xl sm:text-3xl font-black text-white drop-shadow">
                <CountUpAmount value={income?.daily?.net ?? 0} />
              </p>
            </div>
          </div>

          {/* MONTHLY EARNING */}
          <div className="anim-slide-2 earning-card rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 55%,#60a5fa 100%)' }}>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11
              bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div className="px-5 py-4 pr-20">
              <p className="text-white/75 text-[10px] font-extrabold uppercase tracking-[0.18em] mb-1">Monthly Earning</p>
              <p className="text-2xl sm:text-3xl font-black text-white drop-shadow">
                <CountUpAmount value={income?.monthly?.net ?? 0} />
              </p>
            </div>
          </div>

          {/* TOTAL EARNING */}
          <div className="anim-slide-3 earning-card rounded-2xl"
            style={{ background: 'linear-gradient(135deg,#c2410c 0%,#f97316 55%,#fb923c 100%)' }}>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11
              bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="px-5 py-4 pr-20">
              <p className="text-white/75 text-[10px] font-extrabold uppercase tracking-[0.18em] mb-1">Total Earning</p>
              <p className="text-2xl sm:text-3xl font-black text-white drop-shadow">
                <CountUpAmount value={income?.lifetime?.net ?? 0} />
              </p>
            </div>
          </div>

          {/* AVAILABLE WITHDRAWAL BALANCE — withdraw CTA */}
          <div
            className="anim-slide-4 earning-card rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg,#5b21b6 0%,#7c3aed 55%,#a78bfa 100%)' }}
            onClick={() => setPage('payout')}
          >
            {/* Animated pulsing ring on icon */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <div className="absolute inset-0 rounded-xl bg-white/30 animate-ping opacity-30" />
              <div className="relative w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="px-5 py-4 pr-20">
              <p className="text-white/75 text-[10px] font-extrabold uppercase tracking-[0.18em] mb-1">Available Withdrawal Balance</p>
              <p className="text-2xl sm:text-3xl font-black text-white drop-shadow">
                <CountUpAmount value={income?.lifetime?.availableBalance ?? 0} />
              </p>
              <p className="text-white/55 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                Tap to withdraw
              </p>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════
            3. WITHOUT INVESTMENT WORK CARD
            ══════════════════════════════════════════════════════ */}
        <div className="anim-slide-5 relative overflow-hidden rounded-3xl card-hover-3d">
          <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-r from-emerald-400 via-yellow-400 to-emerald-400 animate-pulse">
            <div className="h-full w-full rounded-3xl bg-slate-950/90" />
          </div>
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl" />
          <div className="no-investment-banner relative z-10 bg-gradient-to-br from-emerald-950/80 via-slate-950/90 to-yellow-950/80 rounded-3xl px-6 py-5 border border-emerald-500/30">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-400 to-yellow-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 border-2 border-slate-950 flex items-center justify-center animate-ping" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 border-2 border-slate-950 flex items-center justify-center">
                  <span className="text-[8px] font-black text-slate-900">★</span>
                </span>
              </div>
              <div className="text-center sm:text-left flex-1">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  100% Genuine
                </span>
                <h2 className="shimmer-text text-3xl sm:text-4xl font-black tracking-tight leading-none">
                  WITHOUT INVESTMENT
                </h2>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide mt-0.5">
                  <span className="text-yellow-400">WORK</span>
                </h3>
                <p className="text-slate-300 text-sm mt-2 font-medium leading-relaxed">
                  Bina investment ke kaam karo aur <span className="text-emerald-400 font-bold">unlimited earning</span> karo!
                </p>
              </div>
              <div className="shrink-0 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-emerald-400/20 border border-yellow-400/30 flex flex-col items-center justify-center gap-1 shadow-xl backdrop-blur-sm">
                  <Sparkles className="w-7 h-7 text-yellow-300" />
                  <span className="text-[10px] font-black text-yellow-300 uppercase tracking-wider leading-tight text-center">Earn<br/>Daily</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            4. REFERRAL CODE & SPONSOR ID
            ══════════════════════════════════════════════════════ */}
        <div className="anim-slide-6 space-y-3">
          <Card className="border border-white/10 shadow-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 overflow-hidden relative rounded-3xl card-hover-3d">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
            <CardContent className="p-5 relative">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Your Referral Code</p>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <p className="text-3xl font-black text-white tracking-widest font-mono">{user?.referralId || '—'}</p>
                    <button
                      onClick={() => {
                        if (user?.referralId) {
                          navigator.clipboard.writeText(user.referralId);
                          setCopied(true);
                          toast.success('Referral code copied!');
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 cursor-pointer"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (user?.referralId) {
                          const shareUrl = `${window.location.origin}?ref=${user.referralId}`;
                          const shareText = `Join FINTECH HUB INDIA! Use my referral code: ${user.referralId} or click: ${shareUrl}`;
                          if (navigator.share) {
                            navigator.share({ title: 'FINTECH HUB INDIA', text: shareText, url: shareUrl });
                          } else {
                            navigator.clipboard.writeText(shareText);
                            toast.success('Referral link copied!');
                          }
                        }
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1.5">Share this code to grow your downline team</p>
                </div>
                <Button
                  onClick={() => setPage('downline-report')}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 border-white/10 text-white hover:text-white rounded-xl cursor-pointer py-5"
                >
                  <Users className="w-4 h-4 mr-2" /> View Downline
                </Button>
              </div>
            </CardContent>
          </Card>

          {user?.sponsorId && (
            <Card className="glass-premium border border-white/10 shadow-lg rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-violet-300" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Sponsor's Referral Code</p>
                    <p className="text-sm font-black text-white font-mono mt-0.5">{user.sponsorId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Passive Balance Card */}
        <div className="anim-slide-6 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <p className="text-white/80 font-medium text-sm">Available Passive Balance</p>
            <h2 className="text-4xl font-black text-white mt-1">
              ₹{(income?.breakdown?.passive ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <button
            onClick={() => setShowPassiveModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-violet-700 font-bold hover:bg-white/90 transition-all shadow-lg cursor-pointer active:scale-95 shrink-0"
          >
            <Wallet className="w-5 h-5" />
            Withdraw Passive Income
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            REFERRAL & PASSIVE EARNINGS (LEVEL 1, 2, 3)
            ══════════════════════════════════════════════════════ */}
        <div className="anim-slide-5 space-y-3">
          <h2 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Team Network & Passive Income</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DIRECT REFERRAL (LEVEL 1) */}
            <Card className="glass-premium border border-white/10 shadow-xl rounded-3xl overflow-hidden card-hover-3d relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/15" />
              <CardContent className="p-5 relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                      Level 1 • Direct
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <Users className="w-4.5 h-4.5 text-indigo-300" />
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Direct Referral Earnings</p>
                  <p className="text-2xl font-black text-white mt-1 drop-shadow-md">
                    <CountUpAmount value={income?.breakdown?.direct ?? 0} />
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Referred Partners</span>
                  <span className="font-bold text-indigo-300">
                    {downline?.meta?.levelBreakdown?.find(lb => lb.level === 1)?.count ?? 0} Active
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* PASSIVE TEAM INCOME (LEVEL 2 & 3) */}
            <Card className="glass-premium border border-white/10 shadow-xl rounded-3xl overflow-hidden card-hover-3d relative">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-pink-500/15" />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Level 2 & 3 • Passive
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-fuchsia-300" />
                  </div>
                </div>
                
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Passive Network Earnings</p>
                <p className="text-2xl font-black text-white mt-1 drop-shadow-md">
                  <CountUpAmount value={income?.breakdown?.passive ?? 0} />
                </p>
                
                <div className="mt-4 space-y-2 pt-3 border-t border-white/5">
                  {/* LEVEL 2 BREAKDOWN */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                      <span className="text-slate-300 font-medium">Level 2 (7.5% share)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white mr-2">
                        <CountUpAmount value={income?.breakdown?.level2 ?? 0} />
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        ({downline?.meta?.levelBreakdown?.find(lb => lb.level === 2)?.count ?? 0} members)
                      </span>
                    </div>
                  </div>
                  
                  {/* LEVEL 3 BREAKDOWN */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                      <span className="text-slate-300 font-medium">Level 3 (2.5% share)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white mr-2">
                        <CountUpAmount value={income?.breakdown?.level3 ?? 0} />
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        ({downline?.meta?.levelBreakdown?.find(lb => lb.level === 3)?.count ?? 0} members)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            5. QUICK ACTIONS
            ══════════════════════════════════════════════════════ */}
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 mb-3 tracking-widest uppercase">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPage('submit-report')}
              className="flex flex-col items-center p-4 glass-premium border border-white/10 rounded-2xl shadow-lg hover:shadow-xl hover:border-violet-500/40 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-2">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Submit Report</span>
            </button>

            <button
              onClick={() => setPage('active-links')}
              className="flex flex-col items-center p-4 glass-premium border border-white/10 rounded-2xl shadow-lg hover:shadow-xl hover:border-fuchsia-500/40 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/25 mb-2">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Active Links</span>
            </button>

            <button
              onClick={() => setPage('payout')}
              className="flex flex-col items-center p-4 glass-premium border border-white/10 rounded-2xl shadow-lg hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-2">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Payout</span>
            </button>
          </div>
        </div>

        {/* Developer / Neurox Details */}
        <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_30px_rgba(139,92,246,0.15)] max-w-xs mx-auto mt-10 hover:shadow-[0_0_40px_rgba(139,92,246,0.25)] transition-all duration-500 hover:scale-[1.03] group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative z-10 rounded-[15px] bg-slate-950/90 backdrop-blur-xl p-4 text-center">
            
            {/* Tiny top glowing banner */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[8px] font-black tracking-widest uppercase mb-3 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
              Developed &amp; Maintained By
            </div>

            {/* Neurox logo & text */}
            <h3 className="text-xs font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent tracking-widest leading-none group-hover:scale-105 transition-transform duration-500 uppercase">
              Neurox Technology
            </h3>
            
            {/* Developer name */}
            <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">
              Zaheer Abbas
            </p>

            {/* Glowing divider line */}
            <div className="w-12 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 mx-auto my-3.5 opacity-60 group-hover:w-20 transition-all duration-500" />

            {/* Button links */}
            <div className="flex gap-2 mt-1 justify-center">
              <a
                href="https://wa.me/+918453031680"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wide transition-all duration-300 active:scale-95 cursor-pointer shadow-lg hover:shadow-emerald-500/5"
              >
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/neuroxtechnology/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-300 text-[10px] font-bold tracking-wide transition-all duration-300 active:scale-95 cursor-pointer shadow-lg hover:shadow-pink-500/5"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* ── UNDER CONSTRUCTION MODAL ── */}
      {showPassiveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowPassiveModal(false)}
        >
          <div
            className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 border border-violet-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_25px_80px_rgba(139,92,246,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-5 text-4xl shadow-lg">
                🚧
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                Coming Soon
              </div>
              <h2 className="text-xl font-black text-white mb-2">Under Construction</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Passive income withdrawal is coming very soon! We're building it and will notify you once it's live.
              </p>
              <button
                onClick={() => setShowPassiveModal(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-sm transition-all duration-300 cursor-pointer active:scale-[0.98]"
              >
                Got it, I'll wait! 🙌
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
