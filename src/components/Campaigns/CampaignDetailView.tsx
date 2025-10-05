import { useEffect, useState } from 'react';
import { supabase, Draft, Campaign } from '../../lib/supabase';
import { ArrowLeft, FileText, MoreVertical, Edit, Trash2, Move } from 'lucide-react';

interface CampaignDetailViewProps {
  campaign: any;
  onBack: () => void;
  onSelectDraft: (draft: any) => void; // Function to open the editor
}

interface DraftWithPage extends Draft {
  pages: { name: string; url: string; };
}

export const CampaignDetailView = ({ campaign, onBack, onSelectDraft }: CampaignDetailViewProps) => {
  const [drafts, setDrafts] = useState<DraftWithPage[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [campaign.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: draftData, error: draftError } = await supabase
        .from('drafts')
        .select('*, pages(name, url)')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });
      if (draftError) throw draftError;
      setDrafts(draftData as any || []);

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('status', 'active')
        .not('id', 'eq', campaign.id); // Exclude the current campaign
      if (campaignError) throw campaignError;
      setCampaigns(campaignData || []);

    } catch (error) {
      console.error('Error loading campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampaign = async (draftId: string, newCampaignId: string | null) => {
    try {
      const { error } = await supabase.from('drafts').update({ campaign_id: newCampaignId }).eq('id', draftId);
      if (error) throw error;
      // Refresh the list after moving/removing
      loadData();
    } catch (error: any) {
      alert(`Error updating draft: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', sent: 'bg-blue-100 text-blue-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>{status}</span>;
  };

  return (
    <div className="p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-[#212529] mb-6 transition-colors">
        <ArrowLeft size={20} />
        Back to All Campaigns
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">{campaign.name}</h1>
        <p className="text-gray-600 max-w-2xl">{campaign.description}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-[#212529] p-4 border-b border-gray-200">Drafts in this Campaign</h3>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-12 text-center">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No drafts have been added to this campaign yet.</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="p-4 group hover:bg-gray-50 flex items-center justify-between">
                <div onClick={() => onSelectDraft(draft)} className="flex-1 cursor-pointer">
                  <p className="font-semibold text-[#212529]">{draft.pages?.name || 'Unknown Page'}</p>
                  <p className="text-sm text-gray-500 line-clamp-1">{draft.fb_message || draft.email_subject}</p>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(draft.status)}
                  <div className="relative group">
                     <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"><MoreVertical size={20} /></button>
                     <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                        <button onClick={() => onSelectDraft(draft)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Edit size={16}/> View / Edit</button>
                        <button onClick={() => handleUpdateCampaign(draft.id, null)} className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-100 flex items-center gap-2"><Trash2 size={16}/> Remove from Campaign</button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <p className="px-4 pt-2 pb-1 text-xs text-gray-500">Move to...</p>
                        {campaigns.map(c => (
                           <button key={c.id} onClick={() => handleUpdateCampaign(draft.id, c.id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"><Move size={16}/> {c.name}</button>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};