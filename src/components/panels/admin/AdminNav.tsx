'use client';

import { useAppStore, type Page } from '@/stores/app-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard,
  Users,
  FileText,
  AppWindow,
  Link2,
  Wallet,
  GraduationCap,
  MessageSquareMore,
  Trophy,
  Calendar,
  Settings,
  ScrollText,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  page: Page;
  label: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { page: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'admin-users', label: 'Users', icon: Users },
  { page: 'admin-reports', label: 'Reports', icon: FileText },
  { page: 'admin-apps', label: 'Apps', icon: AppWindow },
  { page: 'admin-links', label: 'Links', icon: Link2 },
  { page: 'admin-payouts', label: 'Payouts', icon: Wallet },
  { page: 'admin-passive-payouts', label: 'Passive Incomes', icon: TrendingUp },
  { page: 'admin-passive-withdrawals', label: 'Passive Withdrawals', icon: Wallet },
  { page: 'admin-trainings', label: 'Trainings', icon: GraduationCap },
  { page: 'admin-qnas', label: 'Q&A', icon: MessageSquareMore },
  { page: 'admin-leaderboard', label: 'Leaderboard', icon: Trophy },
  { page: 'admin-seasons', label: 'Seasons', icon: Calendar },
  { page: 'admin-notifications', label: 'Announcements', icon: Bell },
  { page: 'admin-settings', label: 'Settings', icon: Settings },
  { page: 'admin-audit', label: 'Audit Logs', icon: ScrollText },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentPage, setPage, user, logout } = useAppStore();

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  function handleNav(page: Page) {
    setPage(page);
    onNavigate?.();
  }

  function handleSignOut() {
    localStorage.removeItem('fintech_token');
    logout();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 flex items-center justify-between gap-2">
        <div className="h-14 w-auto flex flex-col justify-center shrink-0">
          <img src="/logo.png" alt="FINTECH HUB INDIA" className="h-11 w-auto object-contain" />
          <div className="flex items-center gap-1 mt-1">
            <ShieldCheck className="w-2.5 h-2.5 text-violet-400 animate-pulse" />
            <span className="text-[8px] font-black tracking-widest text-violet-400 uppercase">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-[10px] font-black text-slate-200 select-none shadow-lg">
          <span>₹ IND</span>
          <span className="text-[7px] text-slate-400">▼</span>
        </div>
      </div>

      <Separator className="bg-violet-500/10" />

      {/* Admin Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/15">
          <Avatar className="w-9 h-9 border-2 border-violet-500/40">
            <AvatarImage src={user?.profilePhoto} alt={user?.fullName} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white truncate">{user?.fullName}</p>
            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Administrator</p>
          </div>
        </div>
      </div>

      <Separator className="bg-violet-500/10" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Admin Menu</p>
        {adminNavItems.map((item) => {
          const isActive = currentPage === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => handleNav(item.page)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-transparent text-white border-l-2 border-violet-500 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.05),0_0_15px_-5px_rgba(139,92,246,0.15)]'
                  : 'text-slate-400 hover:text-violet-300 hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]' : 'text-slate-400 group-hover:text-violet-300'}`} />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      <Separator className="bg-violet-500/10" />

      <div className="p-4 pb-2">
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full justify-center border-red-500/25 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 cursor-pointer rounded-xl py-5"
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      {/* Developer / Neurox Details */}
      <div className="px-4 pb-4">
        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3 text-center">
          <p className="text-[8px] font-black tracking-widest text-slate-500 uppercase mb-1">
            Developed &amp; Maintained By
          </p>
          <p className="text-xs font-black bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent leading-none">
            Neurox Technology
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Zaheer Abbas</p>
          
          <div className="flex gap-2 mt-2 justify-center">
            <a
              href="https://wa.me/+918453031680"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold transition-all duration-300 active:scale-95"
            >
              WhatsApp
            </a>
            <a
              href="https://www.instagram.com/neuroxtechnology/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-300 text-[10px] font-bold transition-all duration-300 active:scale-95"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminNav() {
  const { logout } = useAppStore();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleSignOut() {
    localStorage.removeItem('fintech_token');
    logout();
  }

  // Mobile: Top bar with hamburger + sheet sidebar
  if (isMobile) {
    return (
      <>
        {/* Top Header Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/65 backdrop-blur-2xl border-b border-violet-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer active:scale-95">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-slate-950/95 backdrop-blur-2xl border-r border-violet-500/15 text-white">
                  <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                  <NavContent onNavigate={() => setSheetOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Center Logo */}
            <div className="flex items-center justify-center flex-1 mx-2">
              <img src="/logo.png" alt="FINTECH HUB INDIA" className="h-12 w-auto object-contain" />
            </div>

            {/* Right Currency & Sign Out */}
            <div className="flex items-center gap-2">
              {/* Currency Button (₹ IND ▼) */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-black text-slate-200 select-none shadow-lg">
                <span>₹ IND</span>
                <span className="text-[8px] text-slate-400">▼</span>
              </div>
              
              <button
                onClick={handleSignOut}
                className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 text-red-300 transition-all duration-300 cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop: Sidebar
  return (
    <aside className="w-64 min-h-screen bg-slate-950/45 border-r border-white/10 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)] relative z-20 backdrop-blur-2xl shrink-0">
      <NavContent />
    </aside>
  );
}
