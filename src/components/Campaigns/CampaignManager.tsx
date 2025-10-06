import { useEffect, useState } from 'react';
import { supabase, Campaign, Draft } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Send, Pause, Archive, Trash2, RotateCw, AlertTriangle } from 'lucide-react';
import { CampaignDetailView } from './CampaignDetailView';
import { ProposalEditor } from '../Drafts/ProposalEditor';
import { Modal } from '../common/Modal'; // Import the Modal component

interface DraftWithRelations extends Draft {
  pages: { name: string; url: string; contact_email?: string; };
  analyses: { overall_score: number; need_decision: string; };
}

export const CampaignManager = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '' });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftWithRelations | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (!selectedCampaign) {
      loadCampaigns();
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name.trim()) return;
    try {
      const { data: newCampaignData, error } = await supabase.from('campaigns').insert({ name: newCampaign.name, description: newCampaign.description, status: 'active', created_by: user?.id }).select().single();
      if (error) throw error;
      await supabase.from('audit_logs').insert({ user_id: user?.id, action: 'Campaign Created', entity_type: 'campaign', entity_id: newCampaignData.id, details: { name: newCampaign.name } });
      setNewCampaign({ name: '', description: '' });
      setShowCreate(false);
      loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const { error } = await supabase.from('campaigns').update({ status }).eq('id', campaignId);
      if (error) throw error;
      loadCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const confirmDeleteCampaign = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      await supabase.from('audit_logs').insert({ user_id: user?.id, action: 'Campaign Deleted', entity_type: 'campaign', entity_id: itemToDelete.id, details: { name: itemToDelete.name } });
      loadCampaigns();
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      alert(`Failed to delete campaign: ${error.message}`);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleAction = async (draftId: string, action: 'approve' | 'reject' | 'send') => {
    try {
      const updates: any = { reviewed_by: user?.id, reviewed_at: new Date().toISOString() };
      if (action === 'approve') updates.status = 'approved';
      else if (action === 'reject') updates.status = 'rejected';
      const { error } = await supabase.from('drafts').update(updates).eq('id', draftId);
      if (error) throw error;
      setSelectedDraft(null);
    } catch (error) {
      console.error(`Error ${action}ing draft:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = { active: 'bg-green-100 text-green-800', paused: 'bg-yellow-100 text-yellow-800', completed: 'bg-blue-100 text-blue-800', archived: 'bg-gray-100 text-gray-800' };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const canManage = user?.role === 'admin';

  if (selectedDraft) {
    return <ProposalEditor draft={selectedDraft} onClose={() => setSelectedDraft(null)} onApprove={() => handleAction(selectedDraft.id, 'approve')} onReject={() => handleAction(selectedDraft.id, 'reject')} onSend={() => handleAction(selectedDraft.id, 'send')} canModerate={canManage} />;
  }

  if (selectedCampaign) {
    return <CampaignDetailView campaign={selectedCampaign} onBack={() => setSelectedCampaign(null)} onSelectDraft={(draft) => setSelectedDraft(draft as DraftWithRelations)} />;
  }

  if (loading) return <div className="p-8 text-center">Loading campaigns...</div>;

  return (
    <>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div><h1 className="text-3xl font-bold text-[#212529] mb-2">Campaigns</h1><p className="text-gray-600">Manage outreach campaigns</p></div>
          {canManage && <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-6 py-3 bg-[#c8f031] text-[#212529] font-semibold rounded-lg hover:bg-[#b8e021] transition-colors"><Plus size={20} />New Campaign</button>}
        </div>

        {showCreate && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <h3 className="font-semibold text-[#212529] mb-4">Create New Campaign</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-[#212529] mb-2">Campaign Name</label><input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031]" placeholder="Q4 2025 Outreach" /></div>
              <div><label className="block text-sm font-medium text-[#212529] mb-2">Description</label><textarea value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031] resize-none" placeholder="Campaign description..."></textarea></div>
              <div className="flex gap-3"><button onClick={createCampaign} className="px-6 py-2 bg-[#c8f031] text-[#212529] font-semibold rounded-lg hover:bg-[#b8e021]">Create</button><button onClick={() => setShowCreate(false)} className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.length === 0 ? (
            <div className="col-span-full bg-white border border-gray-200 rounded-xl p-12 shadow-sm text-center"><Send size={48} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No campaigns yet</p></div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="flex flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div onClick={() => setSelectedCampaign(campaign)} className="flex-grow cursor-pointer">
                  <div className="flex items-start justify-between mb-4"><h3 className="font-semibold text-[#212529] text-lg">{campaign.name}</h3><span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(campaign.status)}`}>{campaign.status}</span></div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">{campaign.description || 'No description'}</p>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-gray-50 p-2 rounded"><p className="text-xs text-gray-500">Pages</p><p className="text-lg font-semibold text-[#212529]">{campaign.pages_count}</p></div>
                    <div className="bg-gray-50 p-2 rounded"><p className="text-xs text-gray-500">Sent</p><p className="text-lg font-semibold text-[#212529]">{campaign.sent_count}</p></div>
                    <div className="bg-gray-50 p-2 rounded"><p className="text-xs text-gray-500">Replies</p><p className="text-lg font-semibold text-[#212529]">{campaign.reply_count}</p></div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    {campaign.status === 'active' && <button onClick={() => updateCampaignStatus(campaign.id, 'paused')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-yellow-100 text-yellow-800 font-semibold rounded-lg hover:bg-yellow-200"> <Pause size={16} /> Pause </button>}
                    {campaign.status === 'paused' && <button onClick={() => updateCampaignStatus(campaign.id, 'active')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200"> <Send size={16} /> Resume </button>}
                    {campaign.status === 'archived' ? (
                      <button onClick={() => updateCampaignStatus(campaign.id, 'paused')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-800 font-semibold rounded-lg hover:bg-blue-200"> <RotateCw size={16} /> Un-archive </button>
                    ) : (
                      <button onClick={() => updateCampaignStatus(campaign.id, 'archived')} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200"> <Archive size={16} /> Archive </button>
                    )}
                    <button onClick={() => setItemToDelete({id: campaign.id, name: campaign.name})} className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-100 text-red-800 font-semibold rounded-lg hover:bg-red-200"> <Trash2 size={16} /> </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {itemToDelete && (
        <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirm Campaign Deletion">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-gray-900">Delete Campaign: "{itemToDelete.name}"?</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete this campaign? All associated data will be removed. This action cannot be undone.
                    </p>
                </div>
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        onClick={() => setItemToDelete(null)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        onClick={confirmDeleteCampaign}
                    >
                        Confirm Delete
                    </button>
                </div>
            </div>
        </Modal>
      )}
    </>
  );
};