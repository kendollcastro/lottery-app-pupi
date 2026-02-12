import * as React from 'react';
import { useAppStore } from './lib/store';
import { LoginPage } from './pages/Login';
import { BusinessSelectionPage } from './pages/BusinessSelection';
import { WeekListPage } from './pages/WeekList';
import { WeekViewPage } from './pages/WeekView';
import { ProfilePage } from './pages/Profile';
import { SalesPage } from './pages/Sales';
import { ReportsPage } from './pages/Reports';
import { Layout } from './components/Layout';

import { RegisterPage } from './pages/Register';

import { supabase } from './lib/supabase';
import { api } from './lib/api';

function App() {
  const { user, setUser, selectedBusinessId } = useAppStore();
  const [selectedWeekId, setSelectedWeekId] = React.useState<string | null>(null);
  const [currentView, setCurrentView] = React.useState<'weeks' | 'sales' | 'reports' | 'profile'>('weeks');
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [loading, setLoading] = React.useState(false); // Start false to show UI immediately

  // Initialize Auth Listener
  React.useEffect(() => {
    // Check initial session
    // Check initial session safely
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch profile
          const profile = await api.getCurrentUser();
          if (profile) setUser(profile);
        }
      } catch (error) {
        console.error('Session init error:', error);
      } finally {
        setLoading(false);
      }
    };
    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await api.getCurrentUser();
        if (profile) setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Reset week selection if business changes
  React.useEffect(() => {
    setSelectedWeekId(null);
  }, [selectedBusinessId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    if (isRegistering) {
      return (
        <div className="bg-[#F8F9FB] min-h-screen text-gray-900 font-sans">
          <RegisterPage onBack={() => setIsRegistering(false)} />
        </div>
      );
    }
    return (
      <div className="bg-[#F8F9FB] min-h-screen text-gray-900 font-sans">
        <LoginPage onRegisterClick={() => setIsRegistering(true)} />
      </div>
    );
  }

  // Business Selection View
  if (!selectedBusinessId) {
    return (
      <Layout>
        <BusinessSelectionPage />
      </Layout>
    );
  }

  // If a specific week is selected, show that
  if (selectedWeekId) {
    return (
      <Layout>
        <WeekViewPage
          weekId={selectedWeekId}
          onBack={() => setSelectedWeekId(null)}
          onNavigate={(page) => {
            setSelectedWeekId(null);
            setCurrentView(page);
          }}
        />
      </Layout>
    );
  }

  // Note: We wrap pages in Layout here to preserve the "app shell" feel
  // In a real app with Router, Layout would likely wrap the Routes

  // Profile View
  if (currentView === 'profile') {
    return (
      <Layout>
        <ProfilePage onNavigate={setCurrentView} />
      </Layout>
    );
  }

  // Sales View
  if (currentView === 'sales') {
    return (
      <Layout>
        <SalesPage onNavigate={setCurrentView} />
      </Layout>
    );
  }

  // Reports View
  if (currentView === 'reports') {
    return (
      <Layout>
        <ReportsPage onNavigate={setCurrentView} />
      </Layout>
    );
  }

  // Default: Week List View (Dashboard)
  return (
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
    </Layout>
  );
}

export default App;
