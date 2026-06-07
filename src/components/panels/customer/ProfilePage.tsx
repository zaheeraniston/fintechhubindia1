'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { UserCircle, Save, Copy, Share2, Users, CheckCircle2 } from 'lucide-react';

export function ProfilePage() {
  const { user, setUser } = useAppStore();
  const [form, setForm] = useState({ fullName: user?.fullName || '', mobile: user?.mobile || '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ fullName: user.fullName, mobile: user.mobile });
    }
  }, [user]);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';



  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch(`/users/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify({ fullName: form.fullName, mobile: form.mobile }),
      });
      if (user) setUser({ ...user, fullName: form.fullName, mobile: form.mobile });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  function handleCopyReferralId() {
    if (!user?.referralId) return;
    navigator.clipboard.writeText(user.referralId);
    setCopied(true);
    toast.success('Referral ID copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareReferralId() {
    if (!user?.referralId) return;
    const shareUrl = `${window.location.origin}?ref=${user.referralId}`;
    const shareText = `Join FINTECH HUB INDIA! Use my referral code: ${user.referralId} or click this link: ${shareUrl}`;
    if (navigator.share) {
      navigator.share({ title: 'FINTECH HUB INDIA', text: shareText, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Referral link copied to clipboard!');
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto relative z-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wide flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-violet-400" /> Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account details</p>
      </div>

      {/* Referral ID Card - PROMINENT */}
      <Card className="border border-white/10 shadow-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 mb-6 overflow-hidden relative rounded-3xl card-hover-3d">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdi0yMGgtNjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30" />
        <CardContent className="p-5 sm:p-6 relative">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-white/70" />
            <p className="text-white/70 text-sm font-medium">Your Referral Code</p>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-3xl font-black text-white tracking-widest font-mono">{user?.referralId || '—'}</h2>
            <button
              onClick={handleCopyReferralId}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 cursor-pointer"
              title="Copy Referral ID"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={handleShareReferralId}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 cursor-pointer"
              title="Share Referral ID"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/60 text-xs">
            Share this code with friends. When they sign up with your code, they join your downline!
          </p>
        </CardContent>
      </Card>

      <Card className="glass-premium border border-white/10 shadow-2xl rounded-3xl relative overflow-hidden">
        <CardContent className="p-5 sm:p-6 relative z-10">
          {/* Avatar (Customer cannot upload their photo) */}
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-24 h-24 border-4 border-violet-500/30 shadow-xl">
              <AvatarImage src={user?.profilePhoto} alt={user?.fullName} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Email</Label>
              <Input value={user?.email || ''} disabled className="h-11 bg-slate-950/60 border-white/10 text-slate-300 cursor-not-allowed rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Full Name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Mobile</Label>
              <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Process ID</Label>
              <Input value={user?.processId || ''} disabled className="h-11 bg-slate-950/60 border-white/10 text-slate-300 cursor-not-allowed rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-200">Your Referral Code</Label>
              <div className="flex items-center gap-2">
                <Input value={user?.referralId || ''} disabled className="h-11 bg-slate-950/60 border-white/10 font-mono text-lg font-bold tracking-wider text-violet-300 rounded-xl cursor-not-allowed" />
                <Button variant="outline" onClick={handleCopyReferralId} className="h-11 px-3 border-white/10 text-violet-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/50 rounded-xl transition-all cursor-pointer">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {user?.sponsorId && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-200">Sponsor's Referral Code</Label>
                <Input value={user.sponsorId} disabled className="h-11 bg-slate-950/60 border-white/10 text-slate-300 cursor-not-allowed font-mono rounded-xl" />
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-2">
              {saving ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
