'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  userId: string;
  earnings: number;
  rank: number;
  period: string;
  user?: { fullName: string; profilePhoto: string };
}

export function LeaderboardPage() {
  const { refreshTrigger } = useAppStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await apiFetch('/leaderboard');
        setEntries(data.data || []);
      } catch {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshTrigger]);

  if (loading) return <LoadingSpinner text="Loading leaderboard..." />;

  if (entries.length === 0) {
    return <EmptyState icon={Trophy} title="No Leaderboard Data" description="Leaderboard updates will appear here" />;
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  const rankColors = [
    'from-yellow-400 to-amber-500 shadow-yellow-500/30',
    'from-gray-300 to-gray-400 shadow-gray-400/30',
    'from-amber-600 to-orange-700 shadow-orange-600/30',
  ];

  const rankLabels = ['🥇', '🥈', '🥉'];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <Trophy className="w-6 h-6 text-violet-400" /> Leaderboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">Top earners today</p>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {top3.map((entry, i) => (
            <Card key={entry.id} className={`glass-premium border border-white/10 shadow-xl card-hover-3d rounded-2xl relative transition-all duration-300 ${i === 0 ? 'scale-105 z-10 border-violet-500/50 shadow-violet-500/10' : ''}`}>
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{rankLabels[i]}</div>
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${rankColors[i]} mx-auto flex items-center justify-center shadow-lg mb-2`}>
                  <span className="text-white font-bold text-lg">{entry.user?.fullName?.charAt(0) || '?'}</span>
                </div>
                <p className="font-bold text-sm text-slate-100 truncate">{entry.user?.fullName || 'Unknown'}</p>
                <p className="text-lg font-black text-fuchsia-400 mt-1">{fmt(entry.earnings)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <Card className="glass-premium border border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
          <CardContent className="p-0">
            {rest.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 p-4 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-slate-300 border border-white/5">
                  {i + 4}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-200 truncate">{entry.user?.fullName || 'Unknown'}</p>
                </div>
                <p className="font-bold text-fuchsia-400 text-sm">{fmt(entry.earnings)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
