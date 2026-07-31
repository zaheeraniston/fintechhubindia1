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
  Zap,
} from 'lucide-react';
import { PassiveWithdrawModal } from './PassiveWithdrawModal';

const style = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmerCard {
  0%   { transform: translateX(-200%); }
  100% { transform: translateX(200%);  }
}
@keyframes avatarGlow {
  0%,100% { box-shadow: 0 0 0 4px rgba(139,92,246,0.5), 0 0 30px rgba(139,92,246,0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(139,92,246,0.2), 0 0 50px rgba(139,92,246,0.6); }
}
@keyframes twinkle {
  0%,100% { opacity:0.2; transform:scale(1); }
  50%      { opacity:1;   transform:scale(1.8); }
}
.dash-card-shimmer { position:relative; overflow:hidden; }
.dash-card-shimmer::after {
  content:'';
  position:absolute;
  top:0; left:0; bottom:0;
  width:60%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  animation: shimmerCard 3s ease-in-out infinite;
  pointer-events:none;
}
.avatar-glow-ring { animation: avatarGlow 2.5s ease-in-out infinite; }
.s0 { animation: fadeSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.05s both; }
.s1 { animation: fadeSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.12s both; }
.s2 { animation: fadeSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.20s both; }
.s3 { animation: fadeSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.28s both; }
.s4 { animation: fadeSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.36s both; }
.s5 { animation: fadeSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.44s both; }
.s6 { animation: fadeSlideUp 0.5s cubic-bezier(.22,1,.36,1) 0.52s both; }
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

function CountUpAmount({ value, duration = 1400 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = progress * (2 - progress);
      setCount(Math.floor(eased * value));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);
  return <>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(count)}</>;
}

/* Small twinkling dot */
function Dot({ style: s }: { style: React.CSSProperties }) {
  return <span style={{ position:'absolute', borderRadius:'50%', background:'white', animation:'twinkle 3s ease-in-out infinite', ...s }} />;
}

export function DashboardPage() {
  const { user, setPage, refreshTrigger, triggerRefresh } = useAppStore();
  const [income, setIncome] = useState<IncomeData | null>(null);
  const [downline, setDownline] = useState<DownlineData | null>(null);
  const [passiveBalance, setPassiveBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPassiveModal, setShowPassiveModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [incomeRes, downlineRes, passiveRes] = await Promise.all([
          apiFetch('/income/summary'),
          apiFetch(`/downline?userId=${user?.id}`),
          apiFetch('/income/passive'),
        ]);
        setIncome(incomeRes.data);
        setDownline(downlineRes);
        setPassiveBalance(passiveRes.totalPassive ?? 0);
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

  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'GOOD MORNING ☀️';
    if (h >= 12 && h < 17) return 'GOOD AFTERNOON 🌤️';
    if (h >= 17 && h < 22) return 'GOOD EVENING 🌇';
    return 'GOOD NIGHT 🌙';
  })();

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <SkeletonCard className="h-10 rounded-xl" />
        <SkeletonCard className="h-52 rounded-3xl" />
        <SkeletonCard className="h-20 rounded-2xl" />
        <SkeletonCard className="h-20 rounded-2xl" />
        <SkeletonCard className="h-20 rounded-2xl" />
        <SkeletonCard className="h-20 rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <style>{style}</style>

      {/* ─── TOP HERO BANNER (outside card) ─────────────────────── */}
      {/* -mt-14 cancels the pt-14 on <main> for mobile — removes blank space above banner */}
      <div className="-mt-14 md:mt-0 w-full text-center py-3 px-4 bg-slate-950 select-none">
        <p className="text-[22px] sm:text-3xl font-black leading-tight tracking-tight">
          <span className="text-white italic">DEMAT ACCOUNT WORK</span>
          <br />
          <span className="text-yellow-400 italic">WITHOUT INVESTMENT</span>
        </p>
      </div>

      <div className="pb-6 px-3 space-y-3 max-w-lg mx-auto relative z-10">

        {/* ── 1. PROFILE HERO CARD ──────────────────────────────── */}
        <div className="s0 relative rounded-3xl overflow-hidden" style={{
          background: 'linear-gradient(160deg, #3d1a6e 0%, #1e0a4a 40%, #120630 100%)',
          border: '1.5px solid rgba(139,92,246,0.4)',
          boxShadow: '0 0 40px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          {/* Background star dots */}
          <Dot style={{ width:3, height:3, top:'12%', left:'8%', animationDelay:'0s' }} />
          <Dot style={{ width:2, height:2, top:'8%', left:'55%', animationDelay:'0.8s' }} />
          <Dot style={{ width:3, height:3, top:'15%', right:'12%', animationDelay:'1.5s' }} />
          <Dot style={{ width:2, height:2, top:'60%', left:'15%', animationDelay:'0.4s' }} />
          <Dot style={{ width:2, height:2, top:'55%', right:'8%', animationDelay:'2.1s' }} />
          <Dot style={{ width:2, height:2, top:'35%', left:'82%', animationDelay:'1.1s' }} />

          {/* Glowing bg orb behind avatar */}
          <div style={{
            position:'absolute', top:'0%', left:'50%', transform:'translateX(-50%)',
            width:180, height:180,
            background:'radial-gradient(circle, rgba(138,43,226,0.55) 0%, transparent 70%)',
            filter:'blur(30px)',
          }} />

          {/* Top Row: Avatar LEFT + Name/Greeting RIGHT */}
          <div className="relative z-10 flex flex-row items-center gap-4 px-4 pt-6 pb-4">
            {/* Avatar with glowing purple ring */}
            <div className="relative flex-shrink-0">
              {/* Neon glow ring */}
              <div style={{
                position:'absolute', inset:-4, borderRadius:'50%',
                background:'linear-gradient(135deg, #a855f7, #7c3aed)',
                padding: 3,
              }}>
                <div style={{ borderRadius:'50%', width:'100%', height:'100%', background:'transparent' }} />
              </div>
              <Avatar
                className="avatar-glow-ring relative w-20 h-20 border-[3px] bg-slate-900"
                style={{ borderColor: 'transparent', borderRadius:'50%' }}
              >
                <AvatarImage src={user?.profilePhoto} alt={user?.fullName} />
                <AvatarFallback style={{
                  background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                  color:'white', fontSize:28, fontWeight:900, borderRadius:'50%',
                }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Solid purple border ring */}
              <div style={{
                position:'absolute', inset:-5, borderRadius:'50%',
                border:'3px solid rgba(168,85,247,0.8)',
                boxShadow:'0 0 20px rgba(168,85,247,0.6)',
              }} />
            </div>

            {/* Right side: Greeting + Name + ID */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
              {/* Greeting */}
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:11, fontWeight:700, letterSpacing:'0.12em', marginBottom:2 }}>
                {greeting}
              </p>

              {/* Name */}
              <h1 style={{
                fontSize:22, fontWeight:900, color:'white', letterSpacing:'0.08em',
                textTransform:'uppercase', lineHeight:1.1, marginBottom:8,
              }}>
                {user?.fullName}
              </h1>

              {/* ID Badge */}
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
                borderRadius:999, padding:'5px 14px',
              }}>
                <Sparkles style={{ width:13, height:13, color:'#c084fc' }} />
                <span style={{ color:'rgba(255,255,255,0.55)', fontSize:10, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase' }}>ID:</span>
                <span style={{ color:'white', fontSize:12, fontWeight:900, fontFamily:'monospace', letterSpacing:'0.12em' }}>{user?.processId}</span>
              </div>
            </div>
          </div>

          {/* Bottom section: Feature badges + Earn Daily pill */}
          <div className="relative z-10 px-4 pb-5" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            {/* Feature badges row */}
            <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
              {/* 100% SAFE */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  border:'2px solid #eab308', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(234,179,8,0.08)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <polyline points="9,12 11,14 15,10"/>
                  </svg>
                </div>
                <span style={{ fontSize:9, fontWeight:800, color:'#eab308', textAlign:'center', letterSpacing:'0.04em', lineHeight:1.2 }}>
                  100% SAFE<br/>&amp; SECURE
                </span>
              </div>
              {/* NO INVESTMENT */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  border:'2px solid #eab308', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(234,179,8,0.08)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </div>
                <span style={{ fontSize:9, fontWeight:800, color:'#eab308', textAlign:'center', letterSpacing:'0.04em', lineHeight:1.2 }}>
                  NO INVESTMENT<br/>REQUIRED
                </span>
              </div>
              {/* DAILY INCOME */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  border:'2px solid #eab308', display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(234,179,8,0.08)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                  </svg>
                </div>
                <span style={{ fontSize:9, fontWeight:800, color:'#eab308', textAlign:'center', letterSpacing:'0.04em', lineHeight:1.2 }}>
                  DAILY INCOME<br/>OPPORTUNITY
                </span>
              </div>
            </div>

            {/* EARN DAILY pill */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)',
              borderRadius:999, padding:'8px 20px',
            }}>
              <CheckCircle2 style={{ width:15, height:15, color:'#a78bfa' }} />
              <span style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.88)', letterSpacing:'0.1em' }}>
                EARN DAILY &bull; NO RISK &bull; NO INVESTMENT
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. TODAY'S EARNING ───────────────────────────────── */}
        <div className="s1 dash-card-shimmer rounded-2xl" style={{
          background:'linear-gradient(135deg, #059669 0%, #047857 100%)',
          padding:'18px 16px',
          boxShadow:'0 4px 20px rgba(5,150,105,0.3)',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:4 }}>
                TODAY'S EARNING
              </p>
              <p style={{ fontSize:32, fontWeight:900, color:'white', lineHeight:1 }}>
                <CountUpAmount value={income?.daily?.net ?? 0} />
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:10, fontWeight:900, color:'white', lineHeight:1.3 }}>
                  <span style={{ color:'#86efac' }}>100%</span> WITHOUT
                </p>
                <p style={{ fontSize:10, fontWeight:900, color:'white' }}>INVESTMENT</p>
              </div>
              <div style={{
                width:40, height:40, borderRadius:10,
                background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <TrendingUp style={{ width:20, height:20, color:'white' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. MONTHLY EARNING ───────────────────────────────── */}
        <div className="s2 dash-card-shimmer rounded-2xl" style={{
          background:'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
          padding:'18px 16px',
          boxShadow:'0 4px 20px rgba(29,78,216,0.3)',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:4 }}>
                MONTHLY EARNING
              </p>
              <p style={{ fontSize:32, fontWeight:900, color:'white', lineHeight:1 }}>
                <CountUpAmount value={income?.monthly?.net ?? 0} />
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:10, fontWeight:900, color:'#93c5fd', lineHeight:1.3 }}>CONSISTENT</p>
                <p style={{ fontSize:10, fontWeight:900, color:'#93c5fd' }}>GROWTH</p>
              </div>
              <div style={{
                width:40, height:40, borderRadius:10,
                background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <CalendarDays style={{ width:20, height:20, color:'white' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. TOTAL EARNING ─────────────────────────────────── */}
        <div className="s3 dash-card-shimmer rounded-2xl" style={{
          background:'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
          padding:'18px 16px',
          boxShadow:'0 4px 20px rgba(234,88,12,0.3)',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:4 }}>
                TOTAL EARNING
              </p>
              <p style={{ fontSize:32, fontWeight:900, color:'white', lineHeight:1 }}>
                <CountUpAmount value={income?.lifetime?.net ?? 0} />
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:10, fontWeight:900, color:'#fde68a', lineHeight:1.3 }}>REAL INCOME</p>
                <p style={{ fontSize:10, fontWeight:900, color:'#fde68a' }}>REAL RESULTS</p>
              </div>
              <div style={{
                width:40, height:40, borderRadius:10,
                background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Sparkles style={{ width:20, height:20, color:'white' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. AVAILABLE WITHDRAWAL BALANCE ──────────────────── */}
        <div
          className="s4 dash-card-shimmer rounded-2xl cursor-pointer active:scale-[0.99] transition-transform"
          style={{
            background:'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)',
            padding:'18px 16px',
            boxShadow:'0 4px 20px rgba(109,40,217,0.35)',
          }}
          onClick={() => setPage('payout')}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,0.65)', fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:4 }}>
                AVAILABLE WITHDRAWAL BALANCE
              </p>
              <p style={{ fontSize:32, fontWeight:900, color:'white', lineHeight:1 }}>
                <CountUpAmount value={income?.lifetime?.availableBalance ?? 0} />
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:10, fontWeight:900, color:'#c4b5fd', lineHeight:1.3 }}>EASY WITHDRAWAL</p>
                <p style={{ fontSize:10, fontWeight:900, color:'#c4b5fd' }}>ANYTIME</p>
              </div>
              <div style={{
                width:40, height:40, borderRadius:10,
                background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Wallet style={{ width:20, height:20, color:'white' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. START TODAY BANNER ────────────────────────────── */}
        <div className="s5 rounded-2xl" style={{
          background:'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          border:'1px solid rgba(255,255,255,0.08)',
          padding:'14px 16px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
            <div style={{
              width:36, height:36, borderRadius:8, flexShrink:0,
              background:'rgba(234,179,8,0.15)', border:'1px solid rgba(234,179,8,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Zap style={{ width:18, height:18, color:'#eab308', fill:'#eab308' }} />
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:900, color:'white', letterSpacing:'0.06em', lineHeight:1.3 }}>
                ⚡ START TODAY • EARN EVERYDAY
              </p>
              <p style={{ fontSize:9, fontWeight:600, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                Join Fintech Hub India &amp; Build Your Future
              </p>
            </div>
          </div>
          {/* NO INVESTMENT badge */}
          <div style={{
            flexShrink:0, textAlign:'center',
            background:'#ca8a04', borderRadius:10, padding:'8px 10px',
            border:'1px solid #eab308',
            minWidth:72,
          }}>
            <p style={{ fontSize:10, fontWeight:900, color:'white', lineHeight:1.2, letterSpacing:'0.04em' }}>NO</p>
            <p style={{ fontSize:10, fontWeight:900, color:'white', letterSpacing:'0.04em' }}>INVESTMENT</p>
            <div style={{
              background:'#1e1b4b', borderRadius:5, padding:'2px 4px', marginTop:3,
            }}>
              <p style={{ fontSize:8.5, fontWeight:900, color:'#eab308', letterSpacing:'0.06em' }}>100% WORK</p>
            </div>
          </div>
        </div>

        {/* ── 7. REFERRAL CODE CARD ────────────────────────────── */}
        <div className="s6">
          <Card className="border border-white/10 shadow-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 overflow-hidden relative rounded-3xl">
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
            <Card className="glass-premium border border-white/10 shadow-lg rounded-2xl mt-3">
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

        {/* ── 8. PASSIVE BALANCE CARD ─────────────────────────── */}
        <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <p className="text-white/80 font-medium text-sm">Available Passive Balance</p>
            <h2 className="text-4xl font-black text-white mt-1">
              ₹{passiveBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        {/* ── 9. TEAM NETWORK ─────────────────────────────────── */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Team Network &amp; Passive Income</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-premium border border-white/10 shadow-xl rounded-3xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/15" />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Level 1 • Direct (7.5%)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Users className="w-4 h-4 text-indigo-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Direct Referral Earnings</p>
                <p className="text-2xl font-black text-white mt-1">
                  <CountUpAmount value={income?.breakdown?.direct ?? 0} />
                </p>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Referred Partners</span>
                  <span className="font-bold text-indigo-300">
                    {downline?.meta?.levelBreakdown?.find(lb => lb.level === 1)?.count ?? 0} Active
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-premium border border-white/10 shadow-xl rounded-3xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-pink-500/15" />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-fuchsia-500/20 border border-fuchsia-400/30 text-fuchsia-300 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Level 2 • Passive (2.5%)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-fuchsia-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Indirect Referral Earnings</p>
                <p className="text-2xl font-black text-white mt-1">
                  <CountUpAmount value={income?.breakdown?.level2 ?? 0} />
                </p>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Referred Partners</span>
                  <span className="font-bold text-fuchsia-300">
                    {downline?.meta?.levelBreakdown?.find(lb => lb.level === 2)?.count ?? 0} Active
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 10. QUICK ACTIONS ───────────────────────────────── */}
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 mb-3 tracking-widest uppercase">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { page: 'submit-report' as const, icon: FileText, label: 'Submit Report', from:'from-violet-400', to:'to-fuchsia-500', shadow:'shadow-violet-500/20', hover:'hover:border-violet-500/40' },
              { page: 'active-links' as const, icon: Link2, label: 'Active Links', from:'from-fuchsia-400', to:'to-pink-500', shadow:'shadow-fuchsia-500/25', hover:'hover:border-fuchsia-500/40' },
              { page: 'payout' as const, icon: Wallet, label: 'Payout', from:'from-indigo-400', to:'to-violet-500', shadow:'shadow-indigo-500/25', hover:'hover:border-indigo-500/40' },
            ].map(({ page, icon: Icon, label, from, to, shadow, hover }) => (
              <button
                key={page}
                onClick={() => setPage(page)}
                className={`flex flex-col items-center p-4 glass-premium border border-white/10 rounded-2xl shadow-lg hover:shadow-xl ${hover} transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-lg ${shadow} mb-2`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-semibold text-slate-200">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 11. TRUSTED FOOTER PILL ─────────────────────────── */}
        <div className="flex justify-center pt-2">
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'#10b981', color:'#022c22',
            borderRadius:999, padding:'6px 20px',
            fontSize:9, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase',
            boxShadow:'0 0 20px rgba(16,185,129,0.4)',
          }}>
            TRUSTED &bull; TRANSPARENT ⭐ &bull; SUCCESS
          </div>
        </div>

      </div>

      {/* PASSIVE WITHDRAW MODAL */}
      {showPassiveModal && (
        <PassiveWithdrawModal
          onClose={() => setShowPassiveModal(false)}
          availableBalance={passiveBalance}
          onSuccess={() => triggerRefresh()}
        />
      )}
    </>
  );
}
