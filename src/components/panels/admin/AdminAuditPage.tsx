'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditEntry { id: string; action: string; target: string; details: string; userId: string | null; createdAt: string; user?: { fullName: string }; }

export function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchAudit(); }, [page]);

  async function fetchAudit() {
    setLoading(true);
    try {
      const data = await apiFetch(`/audit?page=${page}&limit=50`);
      setEntries(data.data || []);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  }

  const actionColors: Record<string, string> = {
    create: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    update: 'text-violet-300 bg-violet-500/15 border-violet-500/30',
    delete: 'text-red-300 bg-red-500/15 border-red-500/30',
    approve: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
    reject: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
  };

  function getActionColor(action: string) {
    const lower = action.toLowerCase();
    for (const [key, cls] of Object.entries(actionColors)) {
      if (lower.includes(key)) return cls;
    }
    return 'text-slate-300 bg-slate-500/15 border-slate-500/30';
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto relative z-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-400 to-violet-500 flex items-center justify-center shadow-lg">
            <ScrollText className="w-4 h-4 text-white" />
          </span>
          Audit Logs
        </h1>
        <p className="text-sm text-slate-400 mt-1">Track all admin actions • Page {page}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <Card className="glass-premium border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/30">
                  <th className="text-left p-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Action</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Target</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-300 uppercase tracking-wider hidden md:table-cell">Details</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-300 uppercase tracking-wider">User</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getActionColor(e.action)}`}>
                        {e.action}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-300">{e.target}</td>
                    <td className="p-3 text-xs text-slate-500 hidden md:table-cell max-w-xs truncate">{e.details}</td>
                    <td className="p-3 text-sm text-slate-300">{e.user?.fullName || 'System'}</td>
                    <td className="p-3 text-xs text-slate-400">{new Date(e.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-center gap-3 mt-4">
        <Button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          variant="outline"
          size="sm"
          className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer rounded-xl"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <span className="text-sm text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">Page {page}</span>
        <Button
          onClick={() => setPage(page + 1)}
          variant="outline"
          size="sm"
          className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer rounded-xl"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
