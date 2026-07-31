'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Star, Trophy, ArrowRight, Copy, CheckCircle2, Mail, Lock, User } from 'lucide-react';

interface WelcomeCelebrationProps {
  userName: string;
  email: string;
  password: string;
  referralId?: string;
  onContinue: () => void;
}

// Confetti particle
function ConfettiPiece({ style }: { style: React.CSSProperties }) {
  return <div className="absolute top-0 rounded-sm pointer-events-none" style={style} />;
}

function generateConfetti(count: number) {
  const colors = [
    '#8b5cf6', '#a78bfa', '#c4b5fd',  // violet
    '#ec4899', '#f472b6', '#f9a8d4',  // pink
    '#06b6d4', '#22d3ee', '#67e8f9',  // cyan
    '#fbbf24', '#fcd34d', '#fde68a',  // yellow
    '#34d399', '#6ee7b7',              // green
    '#f87171', '#fca5a5',              // red
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      width: `${Math.random() * 10 + 6}px`,
      height: `${Math.random() * 14 + 8}px`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${Math.random() * 2 + 2}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
      opacity: Math.random() * 0.8 + 0.2,
    } as React.CSSProperties,
  }));
}

export function WelcomeCelebration({ userName, email, password, referralId, onContinue }: WelcomeCelebrationProps) {
  const [phase, setPhase] = useState<'burst' | 'show' | 'ready'>('burst');
  const [copied, setCopied] = useState<string | null>(null);
  const confetti = useRef(generateConfetti(80));
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate floating stars
    setStars(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 14 + 6,
        delay: Math.random() * 3,
      }))
    );

    // Phase transitions
    const t1 = setTimeout(() => setPhase('show'), 400);
    const t2 = setTimeout(() => setPhase('ready'), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const maskedPassword = '•'.repeat(Math.min(password.length, 8));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      {/* Full-screen dark overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/90 to-slate-950"
        style={{
          animation: 'fadeInBg 0.4s ease forwards',
        }}
      />

      {/* Animated radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(139,92,246,0.25) 0%, transparent 70%)',
          animation: 'glowPulse 2.5s ease-in-out infinite alternate',
        }}
      />

      {/* Confetti rain */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.current.map((c) => (
          <div
            key={c.id}
            className="absolute top-[-20px]"
            style={{
              ...c.style,
              animation: `confettiFall ${c.style.animationDuration} ${c.style.animationDelay} ease-in forwards`,
            }}
          />
        ))}
      </div>

      {/* Floating Stars */}
      {stars.map((s) => (
        <Star
          key={s.id}
          className="absolute text-yellow-300/60 pointer-events-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animation: `starFloat 3s ${s.delay}s ease-in-out infinite alternate`,
            fill: 'currentColor',
          }}
        />
      ))}

      {/* Main Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{
          animation: phase === 'burst'
            ? 'cardBurst 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            : 'none',
          transform: phase === 'burst' ? 'scale(0) rotate(-10deg)' : 'scale(1) rotate(0deg)',
          opacity: phase === 'burst' ? 0 : 1,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Glowing border container */}
        <div
          className="relative rounded-3xl p-[2px]"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #8b5cf6, #06b6d4)',
            backgroundSize: '300% 300%',
            animation: 'borderGlow 3s linear infinite',
          }}
        >
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/80 rounded-3xl p-7 sm:p-9 relative overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

            {/* Trophy + Sparkles header */}
            <div className="flex justify-center mb-5 relative">
              <div
                className="relative"
                style={{ animation: 'trophyBounce 1s 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
              >
                {/* Outer ring glow */}
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.4), rgba(236,72,153,0.2))',
                    boxShadow: '0 0 40px rgba(139,92,246,0.6), 0 0 80px rgba(236,72,153,0.3)',
                    animation: 'ringPulse 2s ease-in-out infinite',
                  }}
                >
                  <Trophy
                    className="w-12 h-12"
                    style={{
                      color: '#fbbf24',
                      filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.8))',
                      fill: '#fbbf24',
                    }}
                  />
                </div>

                {/* Orbiting sparkles */}
                {[0, 72, 144, 216, 288].map((deg, i) => (
                  <Sparkles
                    key={i}
                    className="absolute w-5 h-5 text-yellow-300"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-52px)`,
                      animation: `orbitSpark 4s ${i * 0.2}s linear infinite`,
                      filter: 'drop-shadow(0 0 4px rgba(253,224,71,0.9))',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Congratulations text */}
            <div
              className="text-center mb-6"
              style={{ animation: 'slideUp 0.6s 0.8s ease both' }}
            >
              <p
                className="text-xs font-bold tracking-[0.3em] uppercase mb-2"
                style={{
                  background: 'linear-gradient(90deg, #a78bfa, #f472b6, #22d3ee)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                🎉 Congratulations 🎉
              </p>
              <h1
                className="text-2xl sm:text-3xl font-black leading-tight mb-3"
                style={{
                  background: 'linear-gradient(135deg, #f8fafc, #c4b5fd, #f9a8d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                You're finally a Member of
              </h1>
              <div
                className="text-xl sm:text-2xl font-black"
                style={{
                  background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6)',
                  backgroundSize: '200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'textShimmer 2s linear infinite',
                }}
              >
                FINTECH HUB INDIA
              </div>
            </div>

            {/* Welcome name */}
            <div
              className="text-center mb-6"
              style={{ animation: 'slideUp 0.6s 1s ease both' }}
            >
              <p className="text-slate-300 text-sm mb-1">Welcome aboard,</p>
              <div
                className="text-2xl font-black"
                style={{
                  background: 'linear-gradient(90deg, #fbbf24, #f472b6, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.4))',
                }}
              >
                {userName} 👋
              </div>
            </div>

            {/* Account details card */}
            <div
              className="rounded-2xl border border-white/10 overflow-hidden mb-6"
              style={{
                background: 'rgba(255,255,255,0.04)',
                animation: 'slideUp 0.6s 1.1s ease both',
              }}
            >
              <div className="px-4 py-2.5 border-b border-white/5">
                <p className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase">Your Account Details</p>
              </div>

              {/* Email row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 mb-0.5">Email</p>
                  <p className="text-sm text-white font-medium truncate">{email}</p>
                </div>
                <button
                  onClick={() => handleCopy(email, 'email')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Copy email"
                >
                  {copied === 'email' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Password row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5 text-fuchsia-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 mb-0.5">Password</p>
                  <p className="text-sm text-white font-medium tracking-wider">{maskedPassword}</p>
                </div>
                <button
                  onClick={() => handleCopy(password, 'password')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Copy password"
                >
                  {copied === 'password' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Referral ID row */}
              {referralId && (
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 mb-0.5">Your Referral ID</p>
                    <p className="text-sm text-cyan-300 font-bold font-mono tracking-widest">{referralId}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(referralId, 'referral')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                    title="Copy referral ID"
                  >
                    {copied === 'referral' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={onContinue}
              className="w-full relative overflow-hidden rounded-2xl py-4 px-6 font-bold text-white cursor-pointer group"
              style={{
                animation: 'slideUp 0.6s 1.3s ease both',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                boxShadow: '0 8px 32px rgba(139,92,246,0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(139,92,246,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,92,246,0.4)';
              }}
            >
              {/* Shimmer effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  animation: 'btnShimmer 1.5s linear infinite',
                }}
              />
              <span className="relative flex items-center justify-center gap-2 text-base">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            {/* Bottom note */}
            <p
              className="text-center text-[11px] text-slate-500 mt-4"
              style={{ animation: 'slideUp 0.6s 1.4s ease both' }}
            >
              Save your login details safely. Welcome to the family! 🚀
            </p>
          </div>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeInBg {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes cardBurst {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          60% { transform: scale(1.05) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes trophyBounce {
          0% { transform: scale(0) translateY(20px); opacity: 0; }
          70% { transform: scale(1.15) translateY(-5px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes ringPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(139,92,246,0.5), 0 0 60px rgba(236,72,153,0.2); }
          50% { box-shadow: 0 0 50px rgba(139,92,246,0.8), 0 0 100px rgba(236,72,153,0.4); }
        }
        @keyframes orbitSpark {
          0% { transform: translate(-50%, -50%) rotate(var(--start-deg)) translateY(-52px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(calc(var(--start-deg) + 360deg)) translateY(-52px) rotate(-360deg); }
        }
        @keyframes glowPulse {
          from { opacity: 0.6; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1.05); }
        }
        @keyframes borderGlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes textShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes starFloat {
          from { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.4; }
          to { transform: translateY(-15px) rotate(20deg) scale(1.3); opacity: 0.8; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes btnShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
