'use client';

import { useAppStore, type Page } from '@/stores/app-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiFetch } from '@/lib/api';
import {
  LayoutDashboard,
  Link2,
  FileText,
  Wallet,
  GraduationCap,
  Trophy,
  Calendar,
  MessageCircle,
  MessageSquareMore,
  Users,
  UserCircle,
  MoreHorizontal,
  X,
  LogOut,
  Bell,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  page: Page;
  label: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { page: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { page: 'active-links', label: 'Links', icon: Link2 },
  { page: 'submit-report', label: 'Report', icon: FileText },
  { page: 'payout', label: 'Payout', icon: Wallet },
  { page: 'trainings', label: 'Learn', icon: GraduationCap },
];

const moreNavItems: NavItem[] = [
  { page: 'report-status', label: 'Status', icon: ClipboardList },
  { page: 'notifications', label: 'Notifications', icon: Bell },
  { page: 'passive-income', label: 'Passive', icon: TrendingUp },
  { page: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { page: 'qnas', label: 'Q&A', icon: MessageSquareMore },
  { page: 'seasons', label: 'Seasons', icon: Calendar },
  { page: 'customer-care', label: 'Support', icon: MessageCircle },
  { page: 'downline-report', label: 'Downline', icon: Users },
  { page: 'profile', label: 'Profile', icon: UserCircle },
];

export function CustomerNav() {
  const { currentPage, setPage, user, unreadNotificationsCount, setUnreadNotificationsCount } = useAppStore();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function fetchUnread() {
      if (!user?.id) return;
      try {
        const res = await apiFetch(`/notifications?userId=${user.id}`);
        // Fetch read broadcasts from localStorage
        const saved = localStorage.getItem(`read_broadcasts_${user.id}`);
        let localRead: string[] = [];
        if (saved) {
          try { localRead = JSON.parse(saved); } catch {}
        }
        const unread = res.data?.filter((n: any) => {
          if (n.userId === null) {
            return !localRead.includes(n.id);
          }
          return !n.isRead;
        }).length || 0;
        setUnreadNotificationsCount(unread);
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [user?.id, currentPage]);

  function handlePageChange(page: Page) {
    setPage(page);
    setSheetOpen(false);
  }

  function handleSignOut() {
    localStorage.removeItem('fintech_token');
    useAppStore.getState().logout();
    setSheetOpen(false);
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  // Mobile: Top header + Bottom tab bar with "More" sheet
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/65 backdrop-blur-2xl border-b border-violet-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between px-4 py-2.5">
            {/* Left Logo (Hamburger removed) */}
            <div className="flex items-center justify-start flex-1 min-w-0">
              <img src="/logo.png" alt="FINTECH HUB INDIA" className="h-16 w-auto object-contain" />
            </div>

            {/* Right: Currency & Avatar */}
            <div className="flex items-center gap-2">
              {/* Currency Button (₹ IND ▼) */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-black text-slate-200 select-none shadow-lg">
                <span>₹ IND</span>
                <span className="text-[8px] text-slate-400">▼</span>
              </div>

              {/* Profile Avatar Button */}
              <button
                onClick={() => handlePageChange('profile')}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-violet-500/30 flex items-center justify-center bg-slate-900 cursor-pointer active:scale-95"
              >
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user?.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold w-full h-full flex items-center justify-center">
                    {initials}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>


        {/* Bottom Floating Glass Dock */}
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-2xl shadow-[0_10px_40px_-10px_rgba(139,92,246,0.3)] transition-all duration-300">
          <div className="flex items-center justify-around px-2 py-2">
            {mainNavItems.map((item) => {
              const isActive = currentPage === item.page;
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => handlePageChange(item.page)}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 min-w-[56px] relative cursor-pointer active:scale-90 ${
                    isActive
                      ? 'bg-gradient-to-b from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_-3px_rgba(139,92,246,0.25)] scale-105'
                      : 'text-slate-400 hover:text-violet-400 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : ''}`} />
                  <span className={`text-[9px] mt-0.5 font-bold tracking-wide ${isActive ? 'text-violet-200' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa] animate-pulse" />
                  )}
                </button>
              );
            })}

            {/* More Button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 min-w-[56px] relative cursor-pointer active:scale-90 ${
                    moreNavItems.some((i) => i.page === currentPage)
                      ? 'bg-gradient-to-b from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30 text-violet-300 shadow-[0_0_15px_-3px_rgba(139,92,246,0.25)] scale-105'
                      : 'text-slate-400 hover:text-violet-400 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                  <span className={`text-[9px] mt-0.5 font-bold tracking-wide ${moreNavItems.some((i) => i.page === currentPage) ? 'text-violet-200' : ''}`}>
                    More
                  </span>
                  {unreadNotificationsCount > 0 ? (
                    <span className="absolute top-1.5 right-2.5 flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 shadow-md border border-slate-950 animate-pulse animate-bounce" />
                  ) : (
                    moreNavItems.some((i) => i.page === currentPage) && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa] animate-pulse" />
                    )
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl border-t border-violet-500/20 bg-slate-950/95 backdrop-blur-2xl text-white shadow-[0_-10px_40px_-5px_rgba(139,92,246,0.25)] h-auto max-h-[80vh] p-6">
                <SheetTitle className="sr-only">More Navigation</SheetTitle>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-violet-500/30 shadow-lg">
                      <AvatarImage src={user?.profilePhoto} alt={user?.fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm text-white">{user?.fullName}</p>
                      <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">{user?.processId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-white" />
                  </button>
                </div>
                <Separator className="bg-white/5 mb-4" />
                <div className="grid grid-cols-3 gap-3 pb-4">
                  {moreNavItems.map((item) => {
                    const isActive = currentPage === item.page;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.page}
                        onClick={() => handlePageChange(item.page)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 cursor-pointer active:scale-95 border relative ${
                          isActive
                            ? 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-200 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.25)] scale-105'
                            : 'bg-white/5 text-violet-300 hover:bg-white/10 hover:text-white border-white/5'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]' : ''}`} />
                        <span className="text-xs font-semibold">{item.label}</span>
                        {item.page === 'notifications' && unreadNotificationsCount > 0 && (
                          <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-[10px] font-black text-white shadow-lg border border-slate-950 animate-bounce">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Sign Out in More sheet */}
                <Separator className="bg-white/5 mb-4" />
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full justify-center border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 mb-2 cursor-pointer rounded-xl py-5"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>

                {/* Developer / Neurox Details */}
                <div className="mt-2 rounded-xl border border-white/5 bg-slate-900/40 p-3 text-center">
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
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Spacer to prevent content from being hidden behind bottom nav */}
        <div className="h-24" />
      </>
    );
  }

  // Desktop: Sidebar navigation
  return (
    <aside className="w-64 min-h-screen bg-slate-950/45 border-r border-white/10 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)] relative z-20 backdrop-blur-2xl">
      {/* Logo / Brand */}
      <div className="p-5 flex items-center justify-between gap-2">
        <div className="h-16 w-auto flex items-center shrink-0">
          <img src="/logo.png" alt="FINTECH HUB INDIA" className="h-14 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-[10px] font-black text-slate-200 select-none shadow-lg">
          <span>₹ IND</span>
          <span className="text-[7px] text-slate-400">▼</span>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* User Profile Card */}
      <div className="p-4">
        <button
          onClick={() => handlePageChange('profile')}
          className="group w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-white/5"
        >
          <Avatar className="w-9 h-9 border-2 border-violet-500/30 group-hover:border-violet-400 transition-colors">
            <AvatarImage src={user?.profilePhoto} alt={user?.fullName} />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-left min-w-0">
            <p className="font-bold text-sm text-white truncate group-hover:text-violet-300 transition-colors">{user?.fullName}</p>
            <p className="text-[10px] text-slate-400 truncate uppercase font-semibold mt-0.5 tracking-wider">{user?.processId}</p>
          </div>
        </button>
      </div>

      <Separator className="bg-white/5" />

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Main Menu</p>
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => handlePageChange(item.page)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-transparent text-white border-l-2 border-violet-500 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.05),0_0_15px_-5px_rgba(139,92,246,0.15)]'
                    : 'text-slate-400 hover:text-violet-300 hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]' : 'text-slate-400 group-hover:text-violet-300'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3 mt-6">More Options</p>
        <div className="space-y-1">
          {moreNavItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => handlePageChange(item.page)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-transparent text-white border-l-2 border-violet-500 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.05),0_0_15px_-5px_rgba(139,92,246,0.15)]'
                    : 'text-slate-400 hover:text-violet-300 hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]' : 'text-slate-400 group-hover:text-violet-300'}`} />
                {item.label}
                {item.page === 'notifications' && unreadNotificationsCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-600 text-[10px] font-black text-white shadow-lg border border-slate-950">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <Separator className="bg-white/5" />

      {/* Logout */}
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
    </aside>
  );
}
