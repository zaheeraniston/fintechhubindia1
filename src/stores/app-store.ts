import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Page =
  | 'landing'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'active-links'
  | 'submit-report'
  | 'report-status'
  | 'payout'
  | 'trainings'
  | 'qnas'
  | 'leaderboard'
  | 'customer-care'
  | 'seasons'
  | 'downline-report'
  | 'profile'
  | 'notifications'
  | 'passive-income'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-reports'
  | 'admin-apps'
  | 'admin-links'
  | 'admin-payouts'
  | 'admin-passive-payouts'
  | 'admin-trainings'
  | 'admin-qnas'
  | 'admin-leaderboard'
  | 'admin-seasons'
  | 'admin-settings'
  | 'admin-audit'
  | 'admin-notifications'
  | 'admin-passive-withdrawals';

export interface AuthUserType {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  processId: string;
  referralId: string;  // User's own unique referral code (e.g. FHI5A7K9)
  sponsorId: string;   // The referral code of the person who invited this user
  role: string;
  status: string;
  profilePhoto: string;
}

export interface CelebrationData {
  name: string;
  email: string;
  password: string;
  referralId?: string;
  userData: AuthUserType;
}

interface AppState {
  currentPage: Page;
  setPage: (page: Page) => void;
  user: AuthUserType | null;
  setUser: (user: AuthUserType | null) => void;
  logout: () => void;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: (count: number) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  // Celebration overlay — stored globally so it survives auth-triggered remounts
  pendingCelebration: CelebrationData | null;
  setPendingCelebration: (data: CelebrationData | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'landing',
  setPage: (page) => set({ currentPage: page }),
  user: null,
  setUser: (user) => set({ user }),
  unreadNotificationsCount: 0,
  setUnreadNotificationsCount: (unreadNotificationsCount) => set({ unreadNotificationsCount }),
  refreshTrigger: 0,
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
  pendingCelebration: null,
  setPendingCelebration: (data) => set({ pendingCelebration: data }),
  logout: () => {
    supabase.auth.signOut();
    localStorage.removeItem('fintech_token');
    set({ user: null, currentPage: 'landing', unreadNotificationsCount: 0, refreshTrigger: 0, pendingCelebration: null });
  },
}));
