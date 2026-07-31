'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { Trophy, Sparkles } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  userId: string;
  earnings: number;
  rank: number;
  period: string;
  user?: { fullName: string; profilePhoto?: string };
}

const style = `
@keyframes lb-float {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-7px); }
}
@keyframes lb-crown-float {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-5px) rotate(4deg); }
}
@keyframes lb-gold-glow {
  0%,100% { box-shadow: 0 0 18px rgba(251,191,36,0.6), 0 0 35px rgba(251,191,36,0.3); }
  50%      { box-shadow: 0 0 30px rgba(251,191,36,1),   0 0 60px rgba(251,191,36,0.5); }
}
@keyframes lb-silver-glow {
  0%,100% { box-shadow: 0 0 14px rgba(148,163,184,0.5), 0 0 28px rgba(148,163,184,0.2); }
  50%      { box-shadow: 0 0 24px rgba(148,163,184,0.9), 0 0 45px rgba(148,163,184,0.4); }
}
@keyframes lb-bronze-glow {
  0%,100% { box-shadow: 0 0 14px rgba(251,146,60,0.5), 0 0 28px rgba(251,146,60,0.2); }
  50%      { box-shadow: 0 0 24px rgba(251,146,60,0.9), 0 0 45px rgba(251,146,60,0.4); }
}
@keyframes lb-rays {
  0%   { transform: rotate(0deg);   opacity:0.6; }
  100% { transform: rotate(360deg); opacity:0.6; }
}
@keyframes lb-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%);  }
}
.lb-float       { animation: lb-float 3.5s ease-in-out infinite; }
.lb-crown-float { animation: lb-crown-float 2.2s ease-in-out infinite; }
.lb-gold-ring   { animation: lb-gold-glow 2.5s ease-in-out infinite; }
.lb-silver-ring { animation: lb-silver-glow 2.5s ease-in-out infinite 0.3s; }
.lb-bronze-ring { animation: lb-bronze-glow 2.5s ease-in-out infinite 0.6s; }
.lb-rays        { animation: lb-rays 12s linear infinite; }
.lb-row-shimmer { position:relative; overflow:hidden; }
.lb-row-shimmer::after {
  content:'';
  position:absolute; top:0; bottom:0; left:0; width:50%;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: lb-shimmer 3s ease-in-out infinite;
  pointer-events:none;
}
`;

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function LeaderboardPage() {
  const { refreshTrigger } = useAppStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [allTimeEntries, setAllTimeEntries] = useState<any[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<any[]>([]);
  const [allMonthlyRaw, setAllMonthlyRaw] = useState<any[]>([]);
  const [monthsList, setMonthsList] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dailyRes, allTimeRes, monthlyRes] = await Promise.all([
          apiFetch('/leaderboard'),
          apiFetch('/leaderboard/all-time'),
          apiFetch('/leaderboard/monthly')
        ]);
        setEntries(dailyRes.data || []);
        setAllTimeEntries(allTimeRes.data || []);
        
        const rawMonthly = monthlyRes.data || [];
        setAllMonthlyRaw(rawMonthly);
        
        const months = monthlyRes.months || [];
        setMonthsList(months);
        
        const currentMonthStr = new Date().toISOString().split('T')[0].slice(0, 7);
        const lastMonth = months.find((m: string) => m !== currentMonthStr) || months[0] || '';
        setSelectedMonth(lastMonth);
      } catch (err) {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (selectedMonth) {
      const filtered = allMonthlyRaw.filter((m) => m.monthLabel === selectedMonth);
      setMonthlyEntries(filtered);
    } else {
      setMonthlyEntries([]);
    }
  }, [selectedMonth, allMonthlyRaw]);

  function formatMonthLabel(label: string) {
    if (!label) return '';
    const [year, month] = label.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  if (loading) return <LoadingSpinner text="Loading leaderboard..." />;
  if (entries.length === 0 && allTimeEntries.length === 0 && monthlyEntries.length === 0) {
    return <EmptyState icon={Trophy} title="No Leaderboard Data" description="Leaderboard updates will appear here" />;
  }

  const first  = entries.find(e => e.rank === 1);
  const second = entries.find(e => e.rank === 2);
  const third  = entries.find(e => e.rank === 3);
  const rest   = entries.filter(e => e.rank > 3).sort((a, b) => a.rank - b.rank);

  return (
    <>
      <style>{style}</style>
      <div style={{ padding:'0 14px 28px', maxWidth:480, margin:'0 auto' }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:16, paddingBottom:8 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:26 }}>🏆</span>
              <h1 style={{
                fontSize:26, fontWeight:900,
                background:'linear-gradient(90deg, #a78bfa, #c084fc, #e879f9)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                backgroundClip:'text',
              }}>Leaderboard</h1>
            </div>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:12, marginTop:2 }}>Top earners today</p>
          </div>
          {/* LIVE UPDATES pill */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:5,
            border:'1.5px solid #ca8a04', borderRadius:999,
            padding:'6px 14px', background:'rgba(202,138,4,0.08)',
          }}>
            <span style={{ color:'#fde68a', fontSize:11 }}>✦</span>
            <span style={{ color:'#fde68a', fontSize:10, fontWeight:900, letterSpacing:'0.12em' }}>LIVE UPDATES</span>
          </div>
        </div>

        {/* ── PODIUM SECTION ─────────────────────────────────── */}
        {entries.length > 0 && (
          <div style={{
            position:'relative', borderRadius:24, overflow:'hidden',
            background:'linear-gradient(160deg, #0a0520 0%, #130835 40%, #0d0628 100%)',
            border:'1px solid rgba(139,92,246,0.2)',
            padding:'12px 8px 20px',
            marginBottom:14,
            minHeight:320,
          }}>
          {/* Star dots background */}
          {[[8,'10%'],[85,'6%'],[45,'4%'],[20,'45%'],[90,'35%'],[60,'55%'],[30,'70%'],[75,'65%']].map(([l,t],i) => (
            <span key={i} style={{
              position:'absolute', left:`${l}%`, top:t as string,
              width:i%3===0?3:2, height:i%3===0?3:2, borderRadius:'50%', background:'white',
              opacity:0.3, animation:`lb-float ${2.5+i*0.4}s ease-in-out ${i*0.3}s infinite`,
            }} />
          ))}

          {/* 1st place radial spotlight */}
          <div style={{
            position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
            width:200, height:200,
            background:'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)',
            pointerEvents:'none',
          }} />

          {/* Rotating rays behind 1st place avatar */}
          <div className="lb-rays" style={{
            position:'absolute', top:30, left:'50%', transform:'translateX(-50%)',
            width:200, height:200, pointerEvents:'none',
            backgroundImage:'conic-gradient(from 0deg, transparent 0deg, rgba(251,191,36,0.12) 15deg, transparent 30deg, transparent 60deg, rgba(251,191,36,0.10) 75deg, transparent 90deg, transparent 120deg, rgba(251,191,36,0.12) 135deg, transparent 150deg, transparent 180deg, rgba(251,191,36,0.10) 195deg, transparent 210deg, transparent 240deg, rgba(251,191,36,0.12) 255deg, transparent 270deg, transparent 300deg, rgba(251,191,36,0.10) 315deg, transparent 330deg, transparent 360deg)',
            borderRadius:'50%',
          }} />

          {/* PODIUM ROW: 2nd | 1st | 3rd */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:6, paddingTop:60 }}>

            {/* ── 2ND PLACE (LEFT) ─────────────────────────── */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:110 }}>
              {/* Avatar circle */}
              <div className="lb-silver-ring" style={{
                width:70, height:70, borderRadius:'50%',
                background:'linear-gradient(135deg, #475569, #334155)',
                border:'3px solid #94a3b8',
                display:'flex', alignItems:'center', justifyContent:'center',
                marginBottom:6, flexShrink:0, position:'relative',
              }}>
                {second?.user?.profilePhoto ? (
                  <img src={second.user.profilePhoto} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                ) : (
                  <span style={{ fontSize:22, fontWeight:900, color:'white' }}>{getInitials(second?.user?.fullName)}</span>
                )}
                {/* RANK 2 badge */}
                <div style={{
                  position:'absolute', bottom:-10, left:'50%', transform:'translateX(-50%)',
                  background:'#475569', border:'1.5px solid #64748b',
                  borderRadius:999, padding:'2px 8px',
                  fontSize:8, fontWeight:900, color:'white', letterSpacing:'0.06em', whiteSpace:'nowrap',
                }}>RANK 2</div>
              </div>

              {/* Pedestal card */}
              <div style={{
                width:'100%', marginTop:12, borderRadius:'16px 16px 0 0',
                background:'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                border:'1.5px solid #334155', borderBottom:'none',
                display:'flex', flexDirection:'column', alignItems:'center',
                padding:'12px 8px 14px', height:100,
                justifyContent:'space-between',
              }}>
                {/* Number circle */}
                <div style={{
                  width:32, height:32, borderRadius:'50%',
                  border:'2px solid #475569', background:'rgba(71,85,105,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <span style={{ fontSize:14, fontWeight:900, color:'#94a3b8' }}>2</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:95 }}>
                    {second?.user?.fullName || 'Unknown'}
                  </p>
                  <p style={{ fontSize:13, fontWeight:900, color:'#cbd5e1', marginTop:2 }}>
                    {second ? fmt(second.earnings) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 1ST PLACE (CENTER, ELEVATED) ─────────────── */}
            <div className="lb-float" style={{ display:'flex', flexDirection:'column', alignItems:'center', width:130, zIndex:10 }}>
              {/* Crown */}
              <div className="lb-crown-float" style={{
                fontSize:36, lineHeight:1, marginBottom:4,
                filter:'drop-shadow(0 0 12px rgba(251,191,36,0.9)) drop-shadow(0 0 24px rgba(251,191,36,0.5))',
                textAlign:'center',
              }}>👑</div>

              {/* Avatar circle with glow */}
              <div style={{ position:'relative', marginBottom:10 }}>
                {/* Outer glow halo */}
                <div style={{
                  position:'absolute', inset:-8, borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)',
                  filter:'blur(6px)',
                }} />
                <div className="lb-gold-ring" style={{
                  width:86, height:86, borderRadius:'50%',
                  background:'linear-gradient(135deg, #d97706, #b45309)',
                  border:'3.5px solid #fbbf24',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  position:'relative',
                }}>
                  {first?.user?.profilePhoto ? (
                    <img src={first.user.profilePhoto} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                  ) : (
                    <span style={{ fontSize:26, fontWeight:900, color:'white' }}>{getInitials(first?.user?.fullName)}</span>
                  )}
                </div>
                {/* 1ST PLACE badge */}
                <div style={{
                  position:'absolute', bottom:-12, left:'50%', transform:'translateX(-50%)',
                  background:'linear-gradient(90deg, #d97706, #f59e0b)',
                  border:'1.5px solid #fbbf24', borderRadius:999,
                  padding:'3px 10px', fontSize:8, fontWeight:900, color:'#1c1917',
                  letterSpacing:'0.08em', whiteSpace:'nowrap',
                }}>1ST PLACE</div>
              </div>

              {/* Pedestal card — tallest */}
              <div style={{
                width:'100%', marginTop:14, borderRadius:'18px 18px 0 0',
                background:'linear-gradient(180deg, rgba(120,53,15,0.4) 0%, #0f172a 60%)',
                border:'2px solid rgba(251,191,36,0.4)', borderBottom:'none',
                display:'flex', flexDirection:'column', alignItems:'center',
                padding:'14px 8px 16px', height:130,
                justifyContent:'space-between',
                boxShadow:'0 0 20px rgba(251,191,36,0.08)',
                position:'relative', overflow:'hidden',
              }}>
                {/* Shimmer */}
                <div style={{
                  position:'absolute', inset:0,
                  background:'linear-gradient(90deg, transparent 30%, rgba(251,191,36,0.06) 50%, transparent 70%)',
                  animation:'lb-shimmer 4s ease-in-out infinite',
                  pointerEvents:'none',
                }} />
                {/* Laurel wreath circle with 1 */}
                <div style={{ position:'relative' }}>
                  <div style={{
                    width:42, height:42, borderRadius:'50%',
                    border:'2px solid rgba(251,191,36,0.5)', background:'rgba(251,191,36,0.12)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 0 10px rgba(251,191,36,0.3)',
                  }}>
                    <span style={{ fontSize:18, fontWeight:900, color:'#fbbf24' }}>1</span>
                  </div>
                  {/* Simple laurel leaves */}
                  <div style={{ position:'absolute', top:'50%', left:-16, transform:'translateY(-50%)', fontSize:14, opacity:0.7 }}>🌿</div>
                  <div style={{ position:'absolute', top:'50%', right:-16, transform:'translateY(-50%) scaleX(-1)', fontSize:14, opacity:0.7 }}>🌿</div>
                </div>

                <div style={{ textAlign:'center', zIndex:1 }}>
                  <p style={{ fontSize:12, fontWeight:800, color:'#fef3c7', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:115 }}>
                    {first?.user?.fullName || 'Unknown'}
                  </p>
                  <p style={{ fontSize:15, fontWeight:900, color:'#fbbf24', marginTop:3 }}>
                    {first ? fmt(first.earnings) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 3RD PLACE (RIGHT) ────────────────────────── */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:110 }}>
              {/* Avatar circle */}
              <div className="lb-bronze-ring" style={{
                width:64, height:64, borderRadius:'50%',
                background:'linear-gradient(135deg, #78350f, #92400e)',
                border:'3px solid #fb923c',
                display:'flex', alignItems:'center', justifyContent:'center',
                marginBottom:6, flexShrink:0, position:'relative',
              }}>
                {third?.user?.profilePhoto ? (
                  <img src={third.user.profilePhoto} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                ) : (
                  <span style={{ fontSize:20, fontWeight:900, color:'white' }}>{getInitials(third?.user?.fullName)}</span>
                )}
                {/* RANK 3 badge */}
                <div style={{
                  position:'absolute', bottom:-10, left:'50%', transform:'translateX(-50%)',
                  background:'#78350f', border:'1.5px solid #fb923c',
                  borderRadius:999, padding:'2px 8px',
                  fontSize:8, fontWeight:900, color:'white', letterSpacing:'0.06em', whiteSpace:'nowrap',
                }}>RANK 3</div>
              </div>

              {/* Pedestal card */}
              <div style={{
                width:'100%', marginTop:12, borderRadius:'16px 16px 0 0',
                background:'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                border:'1.5px solid rgba(251,146,60,0.35)', borderBottom:'none',
                display:'flex', flexDirection:'column', alignItems:'center',
                padding:'12px 8px 14px', height:80,
                justifyContent:'space-between',
              }}>
                {/* Number circle */}
                <div style={{
                  width:28, height:28, borderRadius:'50%',
                  border:'2px solid rgba(251,146,60,0.5)', background:'rgba(251,146,60,0.1)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <span style={{ fontSize:12, fontWeight:900, color:'#fb923c' }}>3</span>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:10, fontWeight:700, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:95 }}>
                    {third?.user?.fullName || 'Unknown'}
                  </p>
                  <p style={{ fontSize:12, fontWeight:900, color:'#cbd5e1', marginTop:1 }}>
                    {third ? fmt(third.earnings) : '—'}
                  </p>
                </div>
              </div>
            </div>

            </div>
          </div>
        )}

        {/* ── WHY THIS WORK IS BEST ──────────────────────────── */}
        <div style={{
          borderRadius:20, border:'1.5px solid rgba(139,92,246,0.45)',
          background:'linear-gradient(160deg, #120830 0%, #0e0627 100%)',
          padding:'18px 16px 16px',
          marginBottom:14,
          boxShadow:'0 0 20px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
          {/* Title */}
          <p style={{
            textAlign:'center', fontSize:12, fontWeight:900,
            color:'#4ade80', letterSpacing:'0.14em', marginBottom:16,
          }}>
            WHY THIS WORK IS BEST?
          </p>

          {/* 4 feature icons */}
          <div style={{ display:'flex', justifyContent:'space-around', gap:4, marginBottom:16 }}>
            {/* Safe & Secure */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1 }}>
              <div style={{
                width:42, height:42, borderRadius:'50%',
                border:'2px solid #22c55e', background:'rgba(34,197,94,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9,12 11,14 15,10"/>
                </svg>
              </div>
              <span style={{ fontSize:8, fontWeight:800, color:'#4ade80', textAlign:'center', lineHeight:1.25, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                100% SAFE<br/>&amp; SECURE
              </span>
            </div>

            {/* No Investment */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1 }}>
              <div style={{
                width:42, height:42, borderRadius:'50%',
                border:'2px solid #e879f9', background:'rgba(232,121,249,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="20" x2="12" y2="10"/>
                  <line x1="18" y1="20" x2="18" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
              </div>
              <span style={{ fontSize:8, fontWeight:800, color:'#e879f9', textAlign:'center', lineHeight:1.25, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                NO INVESTMENT<br/>REQUIRED
              </span>
            </div>

            {/* Daily Income */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1 }}>
              <div style={{
                width:42, height:42, borderRadius:'50%',
                border:'2px solid #38bdf8', background:'rgba(56,189,248,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
                </svg>
              </div>
              <span style={{ fontSize:8, fontWeight:800, color:'#38bdf8', textAlign:'center', lineHeight:1.25, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                DAILY INCOME<br/>OPPORTUNITY
              </span>
            </div>

            {/* Work from Anywhere */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1 }}>
              <div style={{
                width:42, height:42, borderRadius:'50%',
                border:'2px solid #fbbf24', background:'rgba(251,191,36,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
                </svg>
              </div>
              <span style={{ fontSize:8, fontWeight:800, color:'#fbbf24', textAlign:'center', lineHeight:1.25, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                WORK FROM<br/>ANYWHERE
              </span>
            </div>
          </div>

          {/* EARN DAILY pill */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            border:'1.5px solid rgba(139,92,246,0.4)', borderRadius:999,
            padding:'8px 16px', background:'rgba(139,92,246,0.06)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            <span style={{ fontSize:10, fontWeight:900, color:'rgba(255,255,255,0.85)', letterSpacing:'0.1em' }}>
              EARN DAILY &bull; NO RISK &bull; NO INVESTMENT
            </span>
          </div>
        </div>

        {/* ── REST OF RANKINGS ────────────────────────────────── */}
        {rest.length > 0 && (
          <div>
            <p style={{ fontSize:12, fontWeight:900, color:'rgba(255,255,255,0.7)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>
              REST OF RANKINGS
            </p>

            <div style={{
              background:'rgba(15,10,30,0.8)', borderRadius:20,
              border:'1px solid rgba(255,255,255,0.06)',
              overflow:'hidden',
            }}>
              {rest.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="lb-row-shimmer"
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'12px 14px',
                    borderBottom: idx < rest.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  {/* Rank number */}
                  <div style={{
                    width:32, height:32, borderRadius:10, flexShrink:0,
                    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>{entry.rank}</span>
                  </div>

                  {/* Initials avatar */}
                  <div style={{
                    width:36, height:36, borderRadius:'50%', flexShrink:0,
                    background:'linear-gradient(135deg, #1e293b, #334155)',
                    border:'1px solid rgba(255,255,255,0.1)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {entry.user?.profilePhoto ? (
                      <img src={entry.user.profilePhoto} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                    ) : (
                      <span style={{ fontSize:12, fontWeight:800, color:'#94a3b8' }}>{getInitials(entry.user?.fullName)}</span>
                    )}
                  </div>

                  {/* Name + progress bar */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {entry.user?.fullName || 'Unknown'}
                    </p>
                    {/* Purple progress bar */}
                    {first && (
                      <div style={{ marginTop:4, height:4, borderRadius:999, background:'rgba(255,255,255,0.07)', overflow:'hidden', maxWidth:130 }}>
                        <div style={{
                          height:'100%', borderRadius:999,
                          background:'linear-gradient(90deg, #7c3aed, #a855f7)',
                          width:`${Math.max(8, Math.min(100, (entry.earnings / first.earnings) * 100))}%`,
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Earnings */}
                  <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                    {/* Coin icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    <span style={{ fontSize:13, fontWeight:900, color:'#e879f9' }}>{fmt(entry.earnings)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MONTHLY LEADERBOARD ────────────────────────────── */}
        {monthsList.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                📅 Monthly Leaderboard
              </p>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: 'rgba(15,10,30,0.8)',
                  color: '#fbbf24',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 8px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {monthsList.map((m) => (
                  <option key={m} value={m} style={{ background: '#0a0520', color: 'white' }}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              background: 'rgba(15,10,30,0.8)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden'
            }}>
              {monthlyEntries.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  No rankings for this month.
                </div>
              ) : (
                monthlyEntries.slice(0, 3).map((entry, idx) => (
                  <div
                    key={entry.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderBottom: idx < Math.min(monthlyEntries.length, 3) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 900,
                      background: idx === 0 ? 'rgba(251,191,36,0.15)' : idx === 1 ? 'rgba(148,163,184,0.15)' : 'rgba(251,146,60,0.15)',
                      border: idx === 0 ? '1px solid #fbbf24' : idx === 1 ? '1px solid #94a3b8' : '1px solid #fb923c',
                      color: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : '#fb923c'
                    }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>

                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1e293b, #334155)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {entry.profilePhoto ? (
                        <img src={entry.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>{getInitials(entry.fullName)}</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.fullName}
                      </p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        Rank {idx + 1}
                      </p>
                    </div>

                    <span style={{ fontSize: 13, fontWeight: 900, color: '#4ade80' }}>
                      {fmt(entry.earnings)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ALL-TIME LEADERBOARD ───────────────────────────── */}
        {allTimeEntries.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                ⭐ All-Time Leaderboard
              </p>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 999, padding: '3px 8px', letterSpacing: '0.05em' }}>
                TOP 3 EARNERS
              </span>
            </div>

            <div style={{
              background: 'linear-gradient(160deg, #120830 0%, #0e0627 100%)',
              borderRadius: 20,
              border: '1.5px solid rgba(139,92,246,0.3)',
              overflow: 'hidden',
              boxShadow: '0 0 15px rgba(139,92,246,0.08)'
            }}>
              {allTimeEntries.slice(0, 3).map((entry, idx) => (
                <div
                  key={entry.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderBottom: idx < Math.min(allTimeEntries.length, 3) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    background: idx === 0 ? 'rgba(253,224,71,0.1)' : idx === 1 ? 'rgba(241,245,249,0.05)' : 'rgba(251,146,60,0.05)',
                    border: idx === 0 ? '1px solid #fde047' : idx === 1 ? '1px solid #cbd5e1' : '1px solid #f97316',
                  }}>
                    {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                  </div>

                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e293b, #334155)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {entry.profilePhoto ? (
                      <img src={entry.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>{getInitials(entry.fullName)}</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: idx === 0 ? '#fde047' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.fullName}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      All-Time Ranking #{idx + 1}
                    </p>
                  </div>

                  <span style={{ fontSize: 13, fontWeight: 900, color: idx === 0 ? '#fde047' : '#e879f9' }}>
                    {fmt(entry.earnings)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom marquee banner */}
        <div style={{
          marginTop: 20, padding: '10px 16px', borderRadius: 14,
          background: 'rgba(15,10,30,0.6)', border: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}>
            🚀 <span style={{ color: '#4ade80' }}>START TODAY</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}> &bull; </span>
            <span style={{ color: 'white' }}>BUILD YOUR FUTURE</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}> &bull; </span>
            <span style={{ color: '#4ade80' }}>EARN EVERYDAY</span>
            {' '}🚀
          </span>
        </div>

      </div>
    </>
  );
}
