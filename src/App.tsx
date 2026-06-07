import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { subscribeToPush } from '@/lib/push';
import { Toaster } from '@/components/ui/sonner';
import { useSettingsStore } from '@/stores/settings-store';
import { FullScreenLoader } from '@/components/shared/LoadingStates';

// Shared Components
import { LandingPage } from '@/components/panels/LandingPage';

// Auth Pages
import { LoginPage } from '@/components/panels/LoginPage';
import { SignupPage } from '@/components/panels/SignupPage';

// Customer Pages
import { CustomerNav } from '@/components/panels/customer/CustomerNav';
import { DashboardPage } from '@/components/panels/customer/DashboardPage';
import { ActiveLinksPage } from '@/components/panels/customer/ActiveLinksPage';
import { SubmitReportPage } from '@/components/panels/customer/SubmitReportPage';
import { ReportStatusPage } from '@/components/panels/customer/ReportStatusPage';
import { PayoutPage } from '@/components/panels/customer/PayoutPage';
import { TrainingsPage } from '@/components/panels/customer/TrainingsPage';
import { LeaderboardPage } from '@/components/panels/customer/LeaderboardPage';
import { SeasonsPage } from '@/components/panels/customer/SeasonsPage';
import { CustomerCarePage } from '@/components/panels/customer/CustomerCarePage';
import { DownlineReportPage } from '@/components/panels/customer/DownlineReportPage';
import { ProfilePage } from '@/components/panels/customer/ProfilePage';
import { NotificationsPage } from '@/components/panels/customer/NotificationsPage';
import { PassiveIncomePage } from '@/components/panels/customer/PassiveIncomePage';

// Admin Pages
import { AdminNav } from '@/components/panels/admin/AdminNav';
import { AdminDashboardPage } from '@/components/panels/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/components/panels/admin/AdminUsersPage';
import { AdminReportsPage } from '@/components/panels/admin/AdminReportsPage';
import { AdminAppsPage } from '@/components/panels/admin/AdminAppsPage';
import { AdminLinksPage } from '@/components/panels/admin/AdminLinksPage';
import { AdminPayoutsPage } from '@/components/panels/admin/AdminPayoutsPage';
import { AdminTrainingsPage } from '@/components/panels/admin/AdminTrainingsPage';
import { AdminLeaderboardPage } from '@/components/panels/admin/AdminLeaderboardPage';
import { AdminSeasonsPage } from '@/components/panels/admin/AdminSeasonsPage';
import { AdminSettingsPage } from '@/components/panels/admin/AdminSettingsPage';
import { AdminAuditPage } from '@/components/panels/admin/AdminAuditPage';
import { AdminNotificationsPage } from '@/components/panels/admin/AdminNotificationsPage';
import { AdminPassivePayoutsPage } from '@/components/panels/admin/AdminPassivePayoutsPage';

export default function App() {
  const { currentPage, user, setUser, setPage, triggerRefresh } = useAppStore();
  const [loading, setLoading] = useState(true);

  // Auto-subscribe customer to Web Push after login
  useEffect(() => {
    if (user?.id && user.role === 'customer') {
      subscribeToPush(user.id).catch(() => {});
    }
  }, [user?.id, user?.role]);

  // Realtime database listener for instant invalidation
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          console.log('[REALTIME] reports changed');
          triggerRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'income_ledger' },
        () => {
          console.log('[REALTIME] income_ledger changed');
          triggerRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leaderboard_entries' },
        () => {
          console.log('[REALTIME] leaderboard_entries changed');
          triggerRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'passive_income_transactions' },
        () => {
          console.log('[REALTIME] passive_income_transactions changed');
          triggerRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          console.log('[REALTIME] notifications changed');
          triggerRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, triggerRefresh]);

  // Auto-login from Supabase Session & handle URL sponsor referral
  useEffect(() => {
    // 1. Check for referral code in URL (e.g., ?ref=FHI5A7K9)
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      sessionStorage.setItem('pending_sponsor_id', refCode);
      // Clean query parameter from browser bar
      window.history.replaceState({}, '', window.location.pathname);
    }

    let isMounted = true;
    let initialCheckDone = false;

    // Helper to load user profile
    const loadProfile = async (sessionUser: any) => {
      try {
        const profile = await apiFetch('/auth/me');
        if (isMounted) {
          setUser(profile);
          
          // Re-route based on role if on login/signup/landing page
          const currentPath = useAppStore.getState().currentPage;
          if (currentPath === 'login' || currentPath === 'signup' || currentPath === 'landing') {
            if (profile.role === 'admin') {
              setPage('admin-dashboard');
            } else {
              setPage('dashboard');
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setUser(null);
          setPage('login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // 2. Initial explicit check of session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setUser(null);
          setPage('landing');
          setLoading(false);
        }
      } catch (err) {
        console.error('Initial session check error:', err);
        if (isMounted) {
          setUser(null);
          setPage('login');
          setLoading(false);
        }
      } finally {
        initialCheckDone = true;
      }
    };

    // Load Global Settings once on mount
    const loadSettings = async () => {
      try {
        const data = await apiFetch('/settings');
        if (isMounted && data.map) {
          const store = useSettingsStore.getState();
          const newSettings = { ...store.settings };
          if (data.map.founderName) newSettings.founderName = data.map.founderName;
          if (data.map.founderPhoto) newSettings.founderPhoto = data.map.founderPhoto;
          if (data.map.customerCareLink) newSettings.customerCareLink = data.map.customerCareLink;
          if (data.map.whatsappLink) newSettings.whatsappLink = data.map.whatsappLink;
          store.setSettings(newSettings);
        }
      } catch (err) {
        console.error('Failed to fetch global settings:', err);
      }
    };

    loadSettings();
    initSession();

    // 3. Listen for auth changes, ignoring initial trigger until getSession completes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (!initialCheckDone) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const currentUser = useAppStore.getState().user;
        // Skip if user was already loaded by LoginPage/SignupPage (avoids double-fetch & loading spinner)
        if (currentUser && currentUser.id === session.user.id) {
          return;
        }
        // Only show loading for fresh sign-ins not already handled
        setLoading(true);
        await loadProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPage('landing');
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Silent token refresh — no loading spinner, just update profile quietly
        const currentUser = useAppStore.getState().user;
        if (!currentUser) {
          await loadProfile(session.user);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <FullScreenLoader />;
  }

  // 1. Auth & Landing pages (no layouts)
  if (currentPage === 'landing') return <><LandingPage /><Toaster /></>;
  if (currentPage === 'login') return <><LoginPage /><Toaster /></>;
  if (currentPage === 'signup') return <><SignupPage /><Toaster /></>;

  // 2. Admin Layout
  if (user?.role === 'admin' && currentPage.startsWith('admin')) {
    const adminPages: Record<string, React.ReactNode> = {
      'admin-dashboard': <AdminDashboardPage />,
      'admin-users': <AdminUsersPage />,
      'admin-reports': <AdminReportsPage />,
      'admin-apps': <AdminAppsPage />,
      'admin-links': <AdminLinksPage />,
      'admin-payouts': <AdminPayoutsPage />,
      'admin-trainings': <AdminTrainingsPage />,
      'admin-leaderboard': <AdminLeaderboardPage />,
      'admin-seasons': <AdminSeasonsPage />,
      'admin-settings': <AdminSettingsPage />,
      'admin-audit': <AdminAuditPage />,
      'admin-notifications': <AdminNotificationsPage />,
      'admin-passive-payouts': <AdminPassivePayoutsPage />,
    };

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-slate-100 relative overflow-hidden">
        {/* Glow backdrop orbs */}
        <div className="glow-orb orb-purple w-[400px] h-[400px] top-[-10%] left-[-10%] animate-drift-slow" />
        <div className="glow-orb orb-fuchsia w-[400px] h-[400px] bottom-[-10%] right-[-10%] animate-drift-reverse" />
        <div className="glow-orb orb-cyan w-[300px] h-[300px] top-[40%] right-[10%]" />
        <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
          <AdminNav />
          <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
            <main className="flex-1 pt-14 md:pt-0 pb-8">
              {adminPages[currentPage] || <AdminDashboardPage />}
            </main>
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  // 3. Customer Layout
  const customerPages: Record<string, React.ReactNode> = {
    'dashboard': <DashboardPage />,
    'active-links': <ActiveLinksPage />,
    'submit-report': <SubmitReportPage />,
    'report-status': <ReportStatusPage />,
    'payout': <PayoutPage />,
    'trainings': <TrainingsPage />,
    'leaderboard': <LeaderboardPage />,
    'seasons': <SeasonsPage />,
    'customer-care': <CustomerCarePage />,
    'downline-report': <DownlineReportPage />,
    'profile': <ProfilePage />,
    'notifications': <NotificationsPage />,
    'passive-income': <PassiveIncomePage />,
  };

  // Prevent customer accessing admin pages, fallback to customer dashboard
  const activePage = customerPages[currentPage] || <DashboardPage />;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-slate-100 relative overflow-hidden">
      {/* Glow backdrop orbs */}
      <div className="glow-orb orb-purple w-[400px] h-[400px] top-[-10%] left-[-10%] animate-drift-slow" />
      <div className="glow-orb orb-fuchsia w-[400px] h-[400px] bottom-[-10%] right-[-10%] animate-drift-reverse" />
      <div className="glow-orb orb-cyan w-[300px] h-[300px] top-[40%] right-[10%]" />
      
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        <CustomerNav />
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          <main className="flex-1 pt-14 md:pt-0 pb-24 md:pb-8">
            {activePage}
          </main>
        </div>
        <Toaster />
      </div>
    </div>
  );
}
