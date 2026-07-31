import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/stores/app-store';
import { toast } from 'sonner';
import { X, Building2, Smartphone, ArrowUpRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface PassiveWithdrawModalProps {
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

export function PassiveWithdrawModal({ onClose, availableBalance, onSuccess }: PassiveWithdrawModalProps) {
  const { user } = useAppStore();
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [method, setMethod] = useState('bank');
  const [form, setForm] = useState({
    amount: '',
    accountNumber: '', ifscCode: '', accountHolderName: '', branchName: '',
    upiId: '', upiName: '',
  });

  const fetchHistory = async () => {
    try {
      const res = await apiFetch(`/passive-payouts?userId=${user?.id}`);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchHistory();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > availableBalance) {
      toast.error('Insufficient passive balance');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/passive-payouts', {
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
      toast.success('Passive payout request submitted!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit passive payout');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="relative bg-slate-900 border border-violet-500/30 rounded-3xl w-full max-w-xl shadow-[0_25px_80px_rgba(139,92,246,0.35)] my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white">Withdraw Passive Income</h2>
            <p className="text-sm text-slate-400 mt-1">Available: {fmt(availableBalance)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 mb-8">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Amount (₹) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Enter amount"
                required
                className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Payment Method *</Label>
              <RadioGroup value={method} onValueChange={setMethod} className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="bank" id="bank-modal" className="border-violet-500 text-violet-500" />
                  <Label htmlFor="bank-modal" className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-sm">
                    <Building2 className="w-4 h-4 text-violet-400" /> Bank Account
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="upi" id="upi-modal" className="border-violet-500 text-violet-500" />
                  <Label htmlFor="upi-modal" className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-sm">
                    <Smartphone className="w-4 h-4 text-violet-400" /> UPI
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {method === 'bank' ? (
              <div className="space-y-3">
                <div><Label className="text-xs font-medium text-slate-300">Account Number *</Label><Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} required className="h-10 bg-slate-950/40 border-white/10 text-white rounded-xl" /></div>
                <div><Label className="text-xs font-medium text-slate-300">IFSC Code *</Label><Input value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} required className="h-10 bg-slate-950/40 border-white/10 text-white rounded-xl" /></div>
                <div><Label className="text-xs font-medium text-slate-300">Account Holder Name *</Label><Input value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} required className="h-10 bg-slate-950/40 border-white/10 text-white rounded-xl" /></div>
                <div><Label className="text-xs font-medium text-slate-300">Branch Name</Label><Input value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className="h-10 bg-slate-950/40 border-white/10 text-white rounded-xl" /></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div><Label className="text-xs font-medium text-slate-300">UPI ID *</Label><Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} required className="h-10 bg-slate-950/40 border-white/10 text-white rounded-xl" /></div>
                <div><Label className="text-xs font-medium text-slate-300">Name *</Label><Input value={form.upiName} onChange={(e) => setForm({ ...form, upiName: e.target.value })} required className="h-10 bg-slate-950/40 border-white/10 text-white rounded-xl" /></div>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg rounded-xl mt-4">
              {submitting ? 'Submitting...' : <span className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4" /> Request Payout</span>}
            </Button>
          </form>

          {/* History Section inside modal */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><History className="w-4 h-4 text-violet-400" /> Recent Requests</h3>
            {loadingHistory ? (
              <p className="text-xs text-slate-400">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/10">No withdrawal requests yet.</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="font-bold text-sm text-slate-100">{fmt(h.amount)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{h.method === 'bank' ? 'Bank Transfer' : 'UPI'} &bull; {new Date(h.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <StatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
