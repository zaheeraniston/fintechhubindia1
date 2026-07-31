'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, ArrowLeft, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const { setPage, setUser } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password wizard states
  const [view, setView] = useState<'login' | 'forgot' | 'sent' | 'reset'>('login');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('fintech_token', data.token);
      setUser(data.user);
      
      const hour = new Date().getHours();
      let greeting = 'Welcome back';
      if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
      } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
      } else if (hour >= 17 && hour < 22) {
        greeting = 'Good Evening';
      } else {
        greeting = 'Good Night';
      }
      const firstName = data.user.fullName ? data.user.fullName.split(' ')[0] : 'User';
      toast.success(`${greeting}, ${firstName}!`);

      if (data.user.role === 'admin') {
        setPage('admin-dashboard');
      } else {
        setPage('dashboard');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResetToken(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast.success('Reset token sent successfully!');
      setView('sent');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset token');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token || token.trim().length < 6 || token.trim().length > 8) {
      toast.error('Please enter a valid reset token (6 to 8 digits)');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token: token.trim(), password: newPassword }),
      });
      toast.success('Password reset successfully! Please sign in with your new password.');
      setPassword('');
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
      setView('login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  }

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
        <div className="text-center mb-8 flex flex-col items-center">
          <button onClick={() => setPage('landing')} className="inline-flex items-center justify-center h-26 w-auto mb-4 cursor-pointer hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="FINTECH HUB INDIA" className="h-24 w-auto object-contain" />
          </button>
        </div>

        <Card className="glass-premium border border-white/10 shadow-2xl relative">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-white tracking-wide">
              {view === 'login' && 'Welcome Back'}
              {view === 'forgot' && 'Reset Password'}
              {view === 'sent' && 'Reset Token Sent'}
              {view === 'reset' && 'Set New Password'}
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              {view === 'login' && 'Sign in to your account'}
              {view === 'forgot' && 'Enter your email to request a reset token'}
              {view === 'sent' && 'We have sent a verification code to your mail'}
              {view === 'reset' && 'Enter your reset token and new password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-200">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-200">Password</Label>
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs text-violet-400 hover:text-violet-300 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all pr-10"
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</span>
                  ) : (
                    <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Sign In</span>
                  )}
                </Button>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleSendResetToken} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-slate-200">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</span>
                  ) : (
                    <span className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Send Reset Token</span>
                  )}
                </Button>
              </form>
            )}

            {view === 'sent' && (
              <div className="space-y-5 text-center">
                <div className="flex justify-center py-2">
                  <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    <MailCheck className="w-8 h-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Reset token has been sent to <span className="text-white font-semibold">{email}</span>.
                  </p>
                  <p className="text-slate-400 text-xs">
                    Please check your inbox (including spam folder) for the verification code.
                  </p>
                </div>

                <Button
                  onClick={() => setView('reset')}
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue
                </Button>
              </div>
            )}

            {view === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="readonly-email" className="text-sm font-medium text-slate-400">Email Address</Label>
                  <Input
                    id="readonly-email"
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    className="h-11 bg-slate-950/20 border-white/5 text-slate-400 rounded-xl cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-token" className="text-sm font-medium text-slate-200">Reset Token</Label>
                  <Input
                    id="reset-token"
                    type="text"
                    maxLength={8}
                    placeholder="Enter reset token"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    required
                    className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all text-center tracking-[0.3em] font-mono text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-slate-200">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-slate-200">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPass ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting...</span>
                  ) : (
                    <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Reset Password</span>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center space-y-3">
              {view !== 'login' && (
                <button
                  onClick={() => setView('login')}
                  className="text-sm text-slate-400 hover:text-white font-semibold hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto animate-fade-in"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              )}

              {view === 'login' && (
                <p className="text-sm text-slate-400">
                  Don&apos;t have an account?{' '}
                  <button onClick={() => setPage('signup')} className="text-violet-400 font-semibold hover:text-violet-300 hover:underline cursor-pointer">
                    Create Account
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
