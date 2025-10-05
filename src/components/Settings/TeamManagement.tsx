
import { useEffect, useState } from 'react';
import { supabase, User } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Shield, Check, X, Trash2, Slash } from 'lucide-react';

export const TeamManagement = () => {
  const { user: adminUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    const originalTeamMembers = [...teamMembers];
    setTeamMembers(prev => prev.map(m => m.id === userId ? { ...m, status: newStatus } : m));
    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', userId);
    if (error) {
      setTeamMembers(originalTeamMembers);
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) {
      return;
    }
    const originalTeamMembers = [...teamMembers];
    setTeamMembers(prev => prev.filter(m => m.id !== userId));
    const { error } = await supabase.functions.invoke('delete-user', { body: { user_id_to_delete: userId } });
    if (error) {
      setTeamMembers(originalTeamMembers);
      alert(`Error deleting user: ${error.message}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const originalTeamMembers = [...teamMembers];
    setTeamMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (error) {
      setTeamMembers(originalTeamMembers);
      alert(`Error updating role: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Active</span>;
      case 'pending_approval': return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pending</span>;
      case 'banned': return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Banned</span>;
      default: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">{status}</span>;
    }
  };

  if (loading) return <div className="text-center p-4">Loading team members...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-[#212529] mb-2 flex items-center gap-3"><Users /> Team Management</h2>
      <p className="text-gray-600 mb-6">Approve new members and manage their roles and status.</p>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-200">
        {teamMembers.map((member) => (
          <div key={member.id} className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className={`font-semibold text-[#212529] ${member.id === adminUser?.id ? 'font-bold' : ''}`}>{member.name}{member.id === adminUser?.id && ' (You)'}</p>
                {getStatusBadge(member.status || 'pending_approval')}
              </div>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
              {member.id !== adminUser?.id && member.status === 'pending_approval' && (
                <>
                  <button onClick={() => handleUpdateStatus(member.id, 'active')} className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"> <Check size={16} /> Approve </button>
                  <button onClick={() => handleDeleteUser(member.id, member.name)} className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"> <X size={16} /> Reject </button>
                </>
              )}
              {member.id !== adminUser?.id && member.status === 'active' && (
                <>
                  <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c8f031]">
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="analyst">Analyst</option>
                    <option value="sales">Sales</option>
                  </select>
                  <button onClick={() => handleUpdateStatus(member.id, 'banned')} className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"> <Slash size={16} /> Ban </button>
                  <button onClick={() => handleDeleteUser(member.id, member.name)} className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"> <Trash2 size={16} /> Delete </button>
                </>
              )}
              {member.id !== adminUser?.id && member.status === 'banned' && (
                 <>
                  <button onClick={() => handleUpdateStatus(member.id, 'active')} className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"> Unban </button>
                  <button onClick={() => handleDeleteUser(member.id, member.name)} className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"> <Trash2 size={16} /> Delete </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
