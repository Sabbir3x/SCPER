import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, FileText, Send, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  analyzed_pages: number;
  proposals_sent: number;
  replies: number;
  conversions: number;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  details: any; // Keep as any to be flexible
  user: { name: string } | null;
}

export const Dashboard = () => {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ analyzed_pages: 0, proposals_sent: 0, replies: 0, conversions: 0 });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [analysesRes, messagesRes, repliesRes, logsRes] = await Promise.all([
        supabase.from('analyses').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('replies').select('id', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*, user:users(name)').order('timestamp', { ascending: false }).limit(7),
      ]);

      setStats({
        analyzed_pages: analysesRes.count || 0, // Changed from pagesRes to analysesRes
        proposals_sent: messagesRes.count || 0,
        replies: repliesRes.count || 0,
        conversions: 0, // Placeholder for now
      });

      if (logsRes.data) {
        setActivities(logsRes.data as any);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatActivity = (activity: RecentActivity) => {
    const userName = activity.user?.name || 'A user';
    switch (activity.action) {
      case 'Campaign Created':
        return `${userName} created the campaign "${activity.details?.name || 'Untitled'}"`;
      case 'Page Analyzed':
        return `${userName} analyzed the page "${activity.details?.page_name || 'a page'}"`;
      case 'Draft Approved':
        return `${userName} approved a draft.`;
      case 'Draft Rejected':
        return `${userName} rejected a draft.`;
      case 'Message Sent':
        return `A message was sent to "${activity.details?.page_name || 'a page'}"`;
      default:
        return activity.action;
    }
  };

  const statCards = [
    { label: 'Analyzed Pages', value: stats.analyzed_pages, icon: Activity, color: 'bg-blue-50 text-blue-600' },
    { label: 'Proposals Sent', value: stats.proposals_sent, icon: Send, color: 'bg-[#c8f031] text-[#212529]' },
    { label: 'Replies', value: stats.replies, icon: MessageSquare, color: 'bg-green-50 text-green-600' },
    { label: 'Conversions', value: stats.conversions, icon: TrendingUp, color: 'bg-yellow-50 text-yellow-600' },
  ];

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Welcome, {currentUser?.name || 'User'}</h1>
        <p className="text-gray-600">Here's a summary of your outreach activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color}`}><Icon size={24} /></div>
              </div>
              <p className="text-3xl font-bold text-[#212529] mb-1">{card.value}</p>
              <p className="text-sm text-gray-600">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6"><FileText size={20} className="text-[#212529]" /><h2 className="text-xl font-semibold text-[#212529]">Recent Activity</h2></div>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-[#c8f031] rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#212529]">{formatActivity(activity)}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};