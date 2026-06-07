'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner, EmptyState } from '@/components/shared/LoadingStates';
import { toast } from 'sonner';
import { Wallet, Building2, Smartphone, ArrowUpRight, History } from 'lucide-react';

interface IncomeData {
  lifetime: { credits: number; debits: number; net: number; availableBalance: number };
}

interface PayoutItem {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  accountNumber: string;
  upiId: string;
}

export function PayoutPage() {
  const { user, refreshTrigger } = useAppStore();
  const [income, setIncome] = useState<IncomeData | null>(null);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState('bank');
  const [form, setForm] = useState({
    amount: '',
    // Bank
    accountNumber: '', ifscCode: '', accountHolderName: '', branchName: '',
    // UPI
    upiId: '', upiName: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [incData, payData] = await Promise.all([
          apiFetch('/income/summary'),
          apiFetch(`/payouts?userId=${user?.id}`),
        ]);
        setIncome(incData.data);
        setPayouts(payData.data || []);
      } catch {
        toast.error('Failed to load payout data');
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchData();
  }, [user?.id, refreshTrigger]);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > (income?.lifetime?.availableBalance || 0)) {
      toast.error('Insufficient balance');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/payouts', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.id,
          amount,
          method,
          accountNumber: form.accountNumber,
          ifscCode: form.ifscCode,
          accountHolderName: form.accountHolderName,
          branchName: form.branchName,
          upiId: form.upiId,
          upiName: form.upiName,
        }),
      });
      toast.success('Payout request submitted!');
      setForm({ amount: '', accountNumber: '', ifscCode: '', accountHolderName: '', branchName: '', upiId: '', upiName: '' });
      // Refresh
      const payData = await apiFetch(`/payouts?userId=${user?.id}`);
      setPayouts(payData.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit payout');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading payout data..." />;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <Wallet className="w-6 h-6 text-violet-400" /> Payout
        </h1>
        <p className="text-sm text-slate-400 mt-1">Request withdrawal of your earnings</p>
      </div>

      {/* Available Balance */}
      <Card className="border border-white/10 shadow-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 overflow-hidden relative rounded-2xl card-hover-3d mb-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
        <CardContent className="p-5 relative">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Available Balance</p>
          <p className="text-3xl font-black text-white mt-1.5">{fmt(income?.lifetime?.availableBalance ?? 0)}</p>
        </CardContent>
      </Card>

      {/* Payout Form */}
      <Card className="glass-premium border border-white/10 shadow-2xl rounded-2xl relative overflow-hidden mb-6">
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-base font-black text-white mb-4 tracking-wide uppercase text-xs">Request Payout</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Amount (₹) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Enter amount"
                required
                className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Payment Method *</Label>
              <RadioGroup value={method} onValueChange={setMethod} className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="bank" id="bank" className="border-violet-500 text-violet-500 focus:ring-violet-500/20" />
                  <Label htmlFor="bank" className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-sm">
                    <Building2 className="w-4 h-4 text-violet-400" /> Bank Account
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="upi" id="upi" className="border-violet-500 text-violet-500 focus:ring-violet-500/20" />
                  <Label htmlFor="upi" className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white text-sm">
                    <Smartphone className="w-4 h-4 text-violet-400" /> UPI
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {method === 'bank' ? (
              <div className="space-y-3">
                <div><Label className="text-xs font-medium text-slate-300">Account Number *</Label><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Account number" required className="h-10 bg-slate-950/40 border-white/10 text-white focus:border-violet-500 rounded-xl" /></div>
                <div><Label className="text-xs font-medium text-slate-300">IFSC Code *</Label><Input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} placeholder="IFSC code" required className="h-10 bg-slate-950/40 border-white/10 text-white focus:border-violet-500 rounded-xl" /></div>
                <div><Label className="text-xs font-medium text-slate-300">Account Holder Name *</Label><Input value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} placeholder="Name" required className="h-10 bg-slate-950/40 border-white/10 text-white focus:border-violet-500 rounded-xl" /></div>
                <div><Label className="text-xs font-medium text-slate-300">Branch Name</Label><Input value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} placeholder="Branch name" className="h-10 bg-slate-950/40 border-white/10 text-white focus:border-violet-500 rounded-xl" /></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div><Label className="text-xs font-medium text-slate-300">UPI ID *</Label><Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} placeholder="yourname@upi" required className="h-10 bg-slate-950/40 border-white/10 text-white focus:border-violet-500 rounded-xl" /></div>
                <div><Label className="text-xs font-medium text-slate-300">Name *</Label><Input value={form.upiName} onChange={(e) => setForm({ ...form, upiName: e.target.value })} placeholder="Name" required className="h-10 bg-slate-950/40 border-white/10 text-white focus:border-violet-500 rounded-xl" /></div>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-2">
              {submitting ? 'Submitting...' : <span className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4" /> Request Payout</span>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payout History */}
      <div>
        <h2 className="text-base font-black text-white mb-4 tracking-wide uppercase text-xs flex items-center gap-2"><History className="w-4.5 h-4.5 text-violet-400" /> Payout History</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No payout requests yet</p>
        ) : (
          <div className="space-y-3">
            {payouts.map((p) => (
              <Card key={p.id} className="glass-premium border border-white/10 shadow-lg hover:shadow-xl hover:border-violet-500/30 transition-all duration-300 card-hover-3d rounded-2xl relative">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-100">{fmt(p.amount)}</p>
                    <p className="text-xs text-slate-400 mt-1">{p.method === 'bank' ? 'Bank Transfer' : 'UPI'} &bull; {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
