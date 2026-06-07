'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useSettingsStore } from '@/stores/settings-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { FileText, MessageCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface ReportItem {
  id: string;
  name: string;
  phone: string;
  accountOpenDate: string;
  status: string;
  amount: number;
  tradeSubmitted: boolean;
  adminNotes: string;
  createdAt: string;
  app?: { appName: string; amount: number };
  statusHistory?: { oldStatus: string; newStatus: string; createdAt: string; notes: string }[];
}

export function ReportStatusPage() {
  const { user, refreshTrigger } = useAppStore();
  const { settings } = useSettingsStore();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const data = await apiFetch(`/reports?userId=${user?.id}`);
        setReports(data.data || []);
      } catch {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchReports();
  }, [user?.id, refreshTrigger]);

  if (loading) return <LoadingSpinner text="Loading reports..." />;

  if (reports.length === 0) {
    return <EmptyState icon={FileText} title="No Reports Yet" description="Submit your first report to get started" />;
  }

  function handleTradeSubmit() {
    window.open(settings.whatsappLink, '_blank');
    toast.success('Redirecting to WhatsApp for trade submission');
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <FileText className="w-6 h-6 text-violet-400" /> Report Status
        </h1>
        <p className="text-sm text-slate-400 mt-1">Track all your submitted reports</p>
      </div>

      <div className="space-y-4">
        {reports.map((report) => {
          const isExpanded = expandedId === report.id;
          return (
            <Card key={report.id} className="glass-premium border border-white/10 shadow-lg hover:shadow-xl hover:border-violet-500/30 transition-all duration-300 overflow-hidden card-hover-3d rounded-2xl relative">
              <CardContent className="p-0">
                <div
                  className="p-4 sm:p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{report.app?.appName || 'Unknown App'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{report.name} &bull; {new Date(report.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-fuchsia-400 mr-1">₹{report.amount}</span>
                      <StatusBadge status={report.status} />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-white/5 bg-slate-950/20">
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                        <div><span className="text-slate-400">Phone:</span> <span className="font-semibold text-slate-200">{report.phone}</span></div>
                        <div><span className="text-slate-400">Amount:</span> <span className="font-black text-fuchsia-400">₹{report.amount}</span></div>
                        {report.accountOpenDate && (
                          <div className="col-span-2"><span className="text-slate-400">Account Opening Date:</span> <span className="font-semibold text-slate-200">{report.accountOpenDate}</span></div>
                        )}
                      </div>

                      {report.adminNotes && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                          <p className="text-xs font-bold text-amber-400">Admin Notes:</p>
                          <p className="text-sm text-amber-200 mt-0.5">{report.adminNotes}</p>
                        </div>
                      )}

                      {/* Status Timeline */}
                      {report.statusHistory && report.statusHistory.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status Timeline</p>
                          <div className="space-y-2">
                            {report.statusHistory.map((h, idx) => (
                              <div key={idx} className="flex items-start gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/25 flex items-center justify-center shrink-0 mt-0.5">
                                  <Clock className="w-3 h-3 text-violet-300" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-200">{h.oldStatus || 'Created'} &rarr; {h.newStatus}</p>
                                  <p className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Submit Trade button if accepted */}
                      {report.status === 'accepted' && !report.tradeSubmitted && (
                        <Button
                          onClick={handleTradeSubmit}
                          className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-2"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Submit Trade via WhatsApp
                        </Button>
                      )}

                      {/* Complete Trade button if trade_pending */}
                      {report.status === 'trade_pending' && (
                        <Button
                          onClick={() => {
                            window.open('https://wa.link/hyp54r', '_blank');
                            toast.success('Redirecting to WhatsApp to complete your trade');
                          }}
                          className="w-full h-11 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-2"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Complete Trade
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
