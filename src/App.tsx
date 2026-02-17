import * as React from 'react';
import { useAppStore } from './lib/store';
import { Layout } from './components/Layout';
import { supabase } from './lib/supabase';
import { api } from './lib/api';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy Load Pages
const LoginPage = React.lazy(() => import('./pages/Login').then(module => ({ default: module.LoginPage })));
const BusinessSelectionPage = React.lazy(() => import('./pages/BusinessSelection').then(module => ({ default: module.BusinessSelectionPage })));
const WeekListPage = React.lazy(() => import('./pages/WeekList').then(module => ({ default: module.WeekListPage })));
const WeekViewPage = React.lazy(() => import('./pages/WeekView').then(module => ({ default: module.WeekViewPage })));
const ProfilePage = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.ProfilePage })));
const SalesPage = React.lazy(() => import('./pages/Sales').then(module => ({ default: module.SalesPage })));
const ReportsPage = React.lazy(() => import('./pages/Reports').then(module => ({ default: module.ReportsPage })));
const RegisterPage = React.lazy(() => import('./pages/Register').then(module => ({ default: module.RegisterPage })));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function App() {
  const { user, setUser, selectedBusinessId } = useAppStore();
  const [selectedWeekId, setSelectedWeekId] = React.useState<string | null>(null);
  const [currentView, setCurrentView] = React.useState<'weeks' | 'sales' | 'reports' | 'profile'>('weeks');
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [loading, setLoading] = React.useState(false); // Start false to show UI immediately

  // Initialize Auth Listener
  React.useEffect(() => {
    // Optimistic Load: If we have a user in store (from persistence), let them in immediately.
    // We only show loading if we really don't know who they are.
    if (!user) {
      setLoading(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);

      if (session?.user) {
        // Immediate UI Update (Stale-While-Revalidate pattern)
        // Construct a temporary user from the session so the UI loads instantly.
        const temporaryUser = {
          id: session.user.id,
          name: session.user.email?.split('@')[0] || 'Usuario',
          username: session.user.email || 'usuario',
          role: 'user' as const
        };

        // Set user immediately to unblock UI
        setUser(temporaryUser);
        useAppStore.getState().setSession(session);
        setLoading(false);

        // Background Fetch: Try to get the real profile
        api.getCurrentUser().then((profile) => {
          if (profile) {
            console.log("Profile hydration successful");
            setUser(profile);
          }
        }).catch((err) => {
          console.warn("Background profile fetch failed, using session fallback:", err);
        });

      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        useAppStore.getState().setSession(null);
        setLoading(false);
      } else if (event === 'INITIAL_SESSION' && !session) {
        setUser(null);
        setLoading(false);
      }
    });

    // Fallback safety
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Reset week selection if business changes
  React.useEffect(() => {
    setSelectedWeekId(null);
  }, [selectedBusinessId]);

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingScreen />}>
        {!user ? (
          <div className="bg-[#F8F9FB] min-h-screen text-gray-900 font-sans">
            {isRegistering ? (
              <RegisterPage onBack={() => setIsRegistering(false)} />
            ) : (
              <LoginPage onRegisterClick={() => setIsRegistering(true)} />
            )}
            <Toaster position="top-center" richColors />
          </div>
        ) : !selectedBusinessId ? (
          <Layout>
            <BusinessSelectionPage />
            <Toaster position="top-center" richColors />
          </Layout>
        ) : selectedWeekId ? (
          <Layout>
            <WeekViewPage
              weekId={selectedWeekId}
              onBack={() => setSelectedWeekId(null)}
              onNavigate={(page) => {
                setSelectedWeekId(null);
                setCurrentView(page);
              }}
            />
            <Toaster position="top-center" richColors />
          </Layout>
        ) : currentView === 'profile' ? (
          <Layout>
            <ProfilePage onNavigate={setCurrentView} />
            <Toaster position="top-center" richColors />
          </Layout>
        ) : currentView === 'sales' ? (
          <Layout>
            <SalesPage onNavigate={setCurrentView} />
            <Toaster position="top-center" richColors />
          </Layout>
        ) : currentView === 'reports' ? (
          <Layout>
            <ReportsPage onNavigate={setCurrentView} />
            <Toaster position="top-center" richColors />
          </Layout>
        ) : (
          <Layout>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => useAppStore.getState().setSelectedBusinessId(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                &larr; Cambiar Negocio
              </button>
            </div>
            <WeekListPage
              onSelectWeek={setSelectedWeekId}
              onNavigate={setCurrentView}
            />
            <Toaster position="top-center" richColors />
          </Layout>
        )}
      </React.Suspense>
      <Toaster position="top-center" richColors />
    </ErrorBoundary>
  );
}


export default App;
