'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useSettingsStore } from '@/stores/settings-store';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, MessageCircle, Info, CheckCircle2, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';

export function SignupPage() {
  const { setPage, setPendingCelebration } = useAppStore();
  const { settings } = useSettingsStore();
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    processId: '',
    sponsorId: '',
    dailyAccessCode: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingSponsor, setValidatingSponsor] = useState(false);
  const [sponsorValid, setSponsorValid] = useState<boolean | null>(null);
  const [sponsorName, setSponsorName] = useState('');
  const [codeVerified, setCodeVerified] = useState<boolean | null>(null);
  const [codeMessage, setCodeMessage] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Auto-fill sponsor ID from URL params or sessionStorage (e.g. ?ref=FHI5A7K9)
  useEffect(() => {
    // Check URL params first
    const params = new URLSearchParams(window.location.search);
    let refCode = params.get('ref');

    // If not in URL, check sessionStorage (set by page.tsx for referral links)
    if (!refCode) {
      refCode = sessionStorage.getItem('pending_sponsor_id');
      if (refCode) {
        sessionStorage.removeItem('pending_sponsor_id');
      }
    }

    if (refCode) {
      setForm(prev => ({ ...prev, sponsorId: refCode }));
      // Validate the sponsor code
      validateSponsorId(refCode);
    }
  }, []);

  function updateForm(key: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'dailyAccessCode') {
        next.processId = value; // Keep processId and dailyAccessCode in sync
      }
      return next;
    });
    if (key === 'sponsorId') {
      setSponsorValid(null);
      setSponsorName('');
    }
    if (key === 'dailyAccessCode') {
      setCodeVerified(null);
      setCodeMessage('');
    }
  }

  function handleGetProcessId() {
    // Redirect to WhatsApp support to get today's Process ID
    window.open('https://wa.link/t3dwhx', '_blank');
    toast.info('WhatsApp pe support se aaj ka Process ID maango!');
  }

  async function verifyAccessCode() {
    const code = form.dailyAccessCode.trim();
    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit Process ID first');
      return;
    }
    setVerifyingCode(true);
    try {
      const data = await apiFetch('/auth/verify-access-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setCodeVerified(data.valid);
      setCodeMessage(data.message || '');
      if (data.valid) {
        toast.success('✅ Process ID verified!');
      } else {
        toast.error(data.message || 'Invalid Process ID');
      }
    } catch (err) {
      setCodeVerified(false);
      setCodeMessage('Verification failed. Try again.');
    } finally {
      setVerifyingCode(false);
    }
  }

  async function validateSponsorId(code: string) {
    if (!code || code.trim().length < 3) {
      setSponsorValid(null);
      setSponsorName('');
      return;
    }
    setValidatingSponsor(true);
    try {
      const data = await apiFetch(`/users/validate-sponsor?code=${encodeURIComponent(code.trim())}`);
      if (data.valid) {
        setSponsorValid(true);
        setSponsorName(data.name || '');
      } else {
        setSponsorValid(false);
        setSponsorName('');
      }
    } catch {
      setSponsorValid(false);
      setSponsorName('');
    } finally {
      setValidatingSponsor(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.mobile || !form.email || !form.password || !form.processId) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!form.dailyAccessCode || form.dailyAccessCode.trim().length !== 6) {
      toast.error('Process ID is required (6 digits)');
      return;
    }
    if (codeVerified === false) {
      toast.error('Your Process ID is invalid. Get the correct Process ID from WhatsApp support.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ ...form, dailyAccessCode: form.dailyAccessCode.trim() }),
      });
      localStorage.setItem('fintech_token', data.token);
      // ✅ Store celebration in GLOBAL store so it survives if App.tsx auth listener
      // triggers setLoading(true) and unmounts this component.
      // App.tsx will render WelcomeCelebration at top level when pendingCelebration is set.
      setPendingCelebration({
        name: data.user.fullName || form.fullName,
        email: form.email,
        password: form.password,
        referralId: data.user.referralId,
        userData: data.user,
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  // Celebration is now rendered globally in App.tsx — nothing to render here

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-4 relative overflow-hidden text-slate-100">
      {/* Floating Back to Home Button */}
      <button
        onClick={() => setPage('landing')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Background Glow Orbs */}
      <div className="glow-orb orb-purple w-[350px] h-[350px] top-[-10%] left-[-10%] animate-drift-slow" />
      <div className="glow-orb orb-fuchsia w-[300px] h-[300px] bottom-[-5%] right-[-5%] animate-drift-reverse" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-6 flex flex-col items-center">
          <button onClick={() => setPage('landing')} className="inline-flex items-center justify-center h-22 w-auto mb-3 cursor-pointer hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="FINTECH HUB INDIA" className="h-20 w-auto object-contain" />
          </button>
          <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent tracking-wider">
            Create Account
          </h1>
        </div>

        <Card className="glass-premium border border-white/10 shadow-2xl relative">
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-200">Full Name *</Label>
                <Input
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={(e) => updateForm('fullName', e.target.value)}
                  required
                  className="h-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-200">Mobile Number *</Label>
                <Input
                  placeholder="Enter mobile number"
                  value={form.mobile}
                  onChange={(e) => updateForm('mobile', e.target.value)}
                  required
                  className="h-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-200">Email *</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  required
                  className="h-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-200">Password *</Label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    required
                    className="h-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ━━━ DAILY PROCESS ID - MANDATORY ━━━ */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-violet-400" />
                  Process ID <span className="text-red-400">*</span>
                </Label>

                {/* Get Code CTA */}
                <button
                  type="button"
                  onClick={handleGetProcessId}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 hover:border-violet-400/50 hover:from-violet-600/30 hover:to-fuchsia-600/30 text-violet-200 text-sm font-semibold transition-all duration-300 cursor-pointer active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Get Process ID
                </button>

                {/* Code Input + Verify */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit Process ID"
                    value={form.dailyAccessCode}
                    onChange={(e) => updateForm('dailyAccessCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    className={`h-10 bg-slate-950/40 border text-white placeholder:text-slate-500 focus:ring-violet-500/20 rounded-xl transition-all text-center font-mono text-lg tracking-widest ${
                      codeVerified === true
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : codeVerified === false
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-white/10 focus:border-violet-500'
                    }`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={verifyAccessCode}
                    disabled={form.dailyAccessCode.length !== 6 || verifyingCode}
                    className="h-10 px-3 border-white/10 text-violet-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/50 shrink-0 transition-all rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {verifyingCode ? (
                      <span className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>

                {/* Verification feedback */}
                {codeVerified === true && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {codeMessage || 'Process ID verified!'}
                  </p>
                )}
                {codeVerified === false && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <Info className="w-3 h-3" /> {codeMessage || 'Invalid Process ID. Get the correct Process ID from WhatsApp.'}
                  </p>
                )}
                {codeVerified === null && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-violet-400" /> WhatsApp support se aaj ka 6-digit Process ID maango
                  </p>
                )}
              </div>

              {/* Sponsor ID (Referral Code) - OPTIONAL */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-200">
                  Sponsor ID <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Sponsor referral code (e.g. FHI5A7K9)"
                    value={form.sponsorId}
                    onChange={(e) => updateForm('sponsorId', e.target.value)}
                    onBlur={() => form.sponsorId.trim() && validateSponsorId(form.sponsorId)}
                    className="h-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.sponsorId.trim() && validateSponsorId(form.sponsorId)}
                    disabled={!form.sponsorId.trim() || validatingSponsor}
                    className="h-10 px-3 border-white/10 text-violet-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/50 shrink-0 transition-all rounded-xl cursor-pointer"
                  >
                    {validatingSponsor ? (
                      <span className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                {/* Sponsor validation feedback */}
                {sponsorValid === true && sponsorName && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Valid sponsor: <strong className="text-white">{sponsorName}</strong>
                  </p>
                )}
                {sponsorValid === false && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                    <Info className="w-3 h-3 text-rose-400" /> Invalid sponsor ID. No active user found.
                  </p>
                )}
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3 text-violet-400" /> Enter referral code if invited, or leave empty.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] mt-4"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account...</span>
                ) : (
                  <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Create Account</span>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <button onClick={() => setPage('login')} className="text-violet-400 font-semibold hover:text-violet-300 hover:underline cursor-pointer">
                  Sign In
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
