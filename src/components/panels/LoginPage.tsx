'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const { setPage, setUser } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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
            <CardTitle className="text-2xl font-bold text-white tracking-wide">Welcome Back</CardTitle>
            <CardDescription className="text-slate-400 text-sm">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
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
                <Label htmlFor="password" className="text-sm font-medium text-slate-200">Password</Label>
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

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <button onClick={() => setPage('signup')} className="text-violet-400 font-semibold hover:text-violet-300 hover:underline cursor-pointer">
                  Create Account
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
