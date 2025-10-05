import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PageAnalysis } from './components/Analysis/PageAnalysis';
import { DraftsQueue } from './components/Drafts/DraftsQueue';
import { CampaignManager } from './components/Campaigns/CampaignManager';
import { MessageCenter } from './components/Messages/MessageCenter';
import { Settings } from './components/Settings/Settings';
import { Toaster } from 'react-hot-toast'; // Import Toaster

const AppContent = () => {
  const { session, user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8f031] mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !user || user.status !== 'active') {
    return <LoginForm />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'analyze':
        return <PageAnalysis />;
      case 'drafts':
        return <DraftsQueue />;
      case 'campaigns':
        return <CampaignManager />;
      case 'messages':
        return <MessageCenter />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-y-auto">{renderView()}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" /> {/* Add Toaster component here */}
      <AppContent />
    </AuthProvider>
  );
}

export default App;