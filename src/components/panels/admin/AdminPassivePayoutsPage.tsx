'use client';

import { TrendingUp } from 'lucide-react';

export function AdminPassivePayoutsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-400 to-violet-500 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-4 h-4 text-white" />
          </span>
          Passive Payout Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage passive income withdrawal requests from members</p>
      </div>

      {/* Under Construction */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Animated Construction Block */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 border border-amber-400/20 flex items-center justify-center text-6xl shadow-2xl shadow-amber-500/10">
            🚧
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-amber-400/30 animate-ping opacity-30" />
        </div>

        {/* Coming Soon badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          Coming Soon
        </div>

        <h2 className="text-2xl font-black text-white mb-3">Under Construction</h2>
        <p className="text-slate-400 text-sm max-w-md leading-relaxed mb-8">
          The <span className="text-fuchsia-300 font-bold">Passive Payout</span> section is being developed.
          Once customers submit passive income withdrawal requests, they will appear here for you to process — just like the regular Payout Management.
        </p>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-center">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-xs font-bold text-slate-300">View Requests</p>
            <p className="text-[10px] text-slate-500 mt-1">See all passive withdrawal requests</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-xs font-bold text-slate-300">Approve / Reject</p>
            <p className="text-[10px] text-slate-500 mt-1">Process each request with notes</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/3 p-4 text-center">
            <div className="text-2xl mb-2">💸</div>
            <p className="text-xs font-bold text-slate-300">Transfer Funds</p>
            <p className="text-[10px] text-slate-500 mt-1">Bank & UPI payment details shown</p>
          </div>
        </div>
      </div>
    </div>
  );
}
