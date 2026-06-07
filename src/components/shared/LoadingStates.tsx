'use client';

import { Loader2 } from 'lucide-react';

/** Professional full-screen / inline logo loader with spinning rings */
export function LoadingSpinner({ size = 'md', text = '' }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const dims = { sm: 80, md: 120, lg: 160 };
  const d = dims[size];
  const logoSize = Math.round(d * 0.4);
  const ringStroke = size === 'sm' ? 2 : 3;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      {/* Logo with animated rings */}
      <div className="logo-loader" style={{ width: d, height: d }}>
        <svg viewBox="0 0 120 120" width={d} height={d} className="logo-loader-svg">
          {/* Outer dashed ring – spins clockwise */}
          <circle
            cx="60" cy="60" r="56"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth={ringStroke}
            strokeDasharray="12 8"
            className="logo-ring-outer"
          />
          {/* Middle solid arc – spins counter-clockwise */}
          <circle
            cx="60" cy="60" r="48"
            fill="none"
            stroke="url(#grad2)"
            strokeWidth={ringStroke + 1}
            strokeDasharray="80 200"
            strokeLinecap="round"
            className="logo-ring-middle"
          />
          {/* Inner dot ring – slow clockwise */}
          <circle
            cx="60" cy="60" r="40"
            fill="none"
            stroke="url(#grad3)"
            strokeWidth={ringStroke}
            strokeDasharray="4 12"
            className="logo-ring-inner"
          />
          {/* Gradient defs */}
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        {/* Logo image centered */}
        <img
          src="/logo.png"
          alt="FINTECH HUB INDIA"
          className="logo-loader-img"
          style={{ width: logoSize, height: logoSize }}
        />
      </div>
      {text && <p className="text-sm text-violet-400/80 animate-pulse tracking-wide">{text}</p>}
    </div>
  );
}

/** Full-screen loader – used in App.tsx initial auth check */
export function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden">
      {/* Subtle glow backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb orb-purple w-[300px] h-[300px] top-1/4 left-1/4 animate-drift-slow" />
        <div className="glow-orb orb-fuchsia w-[250px] h-[250px] bottom-1/4 right-1/4 animate-drift-reverse" />
      </div>

      <div className="flex flex-col items-center gap-5 relative z-10">
        {/* Animated logo loader */}
        <div className="logo-loader" style={{ width: 160, height: 160 }}>
          <svg viewBox="0 0 120 120" width={160} height={160} className="logo-loader-svg">
            {/* Outer dashed ring */}
            <circle cx="60" cy="60" r="56" fill="none" stroke="url(#fsg1)" strokeWidth="2" strokeDasharray="12 8" className="logo-ring-outer" />
            {/* Middle solid arc */}
            <circle cx="60" cy="60" r="48" fill="none" stroke="url(#fsg2)" strokeWidth="3" strokeDasharray="80 200" strokeLinecap="round" className="logo-ring-middle" />
            {/* Inner dot ring */}
            <circle cx="60" cy="60" r="40" fill="none" stroke="url(#fsg3)" strokeWidth="2" strokeDasharray="4 12" className="logo-ring-inner" />
            {/* Pulsating glow ring */}
            <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="8" className="logo-ring-pulse" />
            <defs>
              <linearGradient id="fsg1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="fsg2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="fsg3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <img src="/logo.png" alt="FINTECH HUB INDIA" className="logo-loader-img" style={{ width: 64, height: 64 }} />
        </div>
        <p className="text-violet-400 font-bold tracking-[0.25em] text-sm animate-pulse uppercase">Loading...</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950/30 dark:to-fuchsia-950/30 flex items-center justify-center mb-4 border border-violet-200 dark:border-violet-500/20">
        <Icon className="w-8 h-8 text-violet-500 dark:text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card/50 border border-white/5 p-4 animate-pulse ${className}`}>
      <div className="h-4 bg-muted/60 rounded w-1/3 mb-3" />
      <div className="h-8 bg-muted/60 rounded w-2/3 mb-2" />
      <div className="h-3 bg-muted/60 rounded w-1/2" />
    </div>
  );
}
