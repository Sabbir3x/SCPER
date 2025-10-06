import { LayoutDashboard, Search, FileText, Send, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const { signOut, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Page', icon: Search },
    { id: 'drafts', label: 'Drafts Queue', icon: FileText },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'messages', label: 'Message Center', icon: MessageSquare },
    { id: 'minichat', label: 'Mini Chat', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-64 bg-[#212529] text-white h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Minimind</h1>
        <p className="text-xs text-gray-400 mt-1">Outreach Agent</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;

          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#c8f031] text-[#212529]'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
          <button 
            onClick={() => onViewChange('history')}
            className="w-full text-left text-sm text-gray-400 hover:text-white hover:underline"
          >
            Analysis History
          </button>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="mb-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-[#c8f031] text-[#212529] text-xs font-semibold rounded">
            {user?.role}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
