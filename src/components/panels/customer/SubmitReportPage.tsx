'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { FileText, Send, IndianRupee } from 'lucide-react';

interface AppItem {
  id: string;
  appName: string;
  amount: number;
}

export function SubmitReportPage() {
  const { user, setPage } = useAppStore();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', accountOpenDate: '' });

  useEffect(() => {
    async function fetchApps() {
      try {
        const data = await apiFetch('/apps?status=active');
        setApps(data.data || []);
      } catch {
        toast.error('Failed to load apps');
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, []);

  const selectedApp = apps.find((a) => a.id === selectedAppId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppId || !form.name || !form.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          appId: selectedAppId,
          name: form.name,
          phone: form.phone,
          accountOpenDate: form.accountOpenDate,
          amount: selectedApp?.amount || 0,
        }),
      });
      toast.success('Report submitted successfully!');
      setPage('report-status');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading apps..." />;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <FileText className="w-6 h-6 text-violet-400" /> Submit Report
        </h1>
        <p className="text-sm text-slate-400 mt-1">Select an app and fill in the details</p>
      </div>

      <Card className="glass-premium border border-white/10 shadow-2xl rounded-3xl relative overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Select App *</Label>
              <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger className="h-11 bg-slate-950/40 border-white/10 text-white focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all">
                  <SelectValue placeholder="Choose an app..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 text-slate-100">
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id} className="focus:bg-violet-600 focus:text-white">
                      {app.appName} — ₹{app.amount}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedApp && (
              <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl p-4 border border-violet-500/20">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Earning Amount:</span>
                  <span className="text-lg font-black text-fuchsia-400">₹{selectedApp.amount}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your name"
                required
                className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Phone Number *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
                required
                className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Account Opening Date</Label>
              <Input
                type="date"
                value={form.accountOpenDate}
                onChange={(e) => setForm({ ...form, accountOpenDate: e.target.value })}
                className="h-11 bg-slate-950/40 border-white/10 text-white focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !selectedAppId}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {submitting ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</span>
              ) : (
                <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Submit Report</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
