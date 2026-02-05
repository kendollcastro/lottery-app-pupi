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

function App() {
  const { user, selectedBusinessId } = useAppStore();
  const [selectedWeekId, setSelectedWeekId] = React.useState<string | null>(null);
  const [currentView, setCurrentView] = React.useState<'weeks' | 'sales' | 'reports' | 'profile'>('weeks');

  // Reset week selection if business changes
  React.useEffect(() => {
    setSelectedWeekId(null);
  }, [selectedBusinessId]);

  if (!user) {
    return (
      <div className="bg-[#F8F9FB] min-h-screen text-gray-900 font-sans">
        <LoginPage />
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
