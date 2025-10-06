import { useEffect, useState } from 'react';
import { supabase, Draft, Analysis, Campaign } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Check, X, Send, Eye, Sparkles, FolderPlus } from 'lucide-react';
import { ProposalEditor } from './ProposalEditor';
import toast from 'react-hot-toast'; // Import toast

interface DraftWithRelations extends Draft {
  pages: { name: string; url: string; contact_email?: string; };
  analyses: { overall_score: number; need_decision: string; };
}

interface AnalysisWithPage extends Analysis {
  pages: { name: string; url: string; };
}

export const DraftsQueue = () => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<DraftWithRelations[]>([]);
  const [readyAnalyses, setReadyAnalyses] = useState<AnalysisWithPage[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<DraftWithRelations | null>(null);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    loadAllData();
  }, [filter]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const { data: campaignData, error: campaignError } = await supabase.from('campaigns').select('id, name').eq('status', 'active');
      if (campaignError) throw campaignError;
      setCampaigns(campaignData || []);

      const { data: allDraftsData, error: allDraftsError } = await supabase.from('drafts').select(`analysis_id`);
      if (allDraftsError) throw allDraftsError;
      const draftAnalysisIds = new Set((allDraftsData || []).map((d) => d.analysis_id).filter(id => id));

      const { data: analysisData, error: analysisError } = await supabase.from('analyses').select(`*, pages(name, url)`).in('need_decision', ['yes', 'maybe']);
      if (analysisError) throw analysisError;
      setReadyAnalyses((analysisData as any)?.filter((a: any) => !draftAnalysisIds.has(a.id)) || []);

      const query = supabase.from('drafts').select(`*, pages(name, url, contact_email), analyses(overall_score, need_decision)`).order('created_at', { ascending: false });
      if (filter !== 'all') query.eq('status', filter);
      const { data: filteredDraftData, error: filteredDraftError } = await query;
      if (filteredDraftError) throw filteredDraftError;
      setDrafts((filteredDraftData as any) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3001";

  const handleGenerateProposal = async (analysisId: string) => {
    setGenerating(prev => [...prev, analysisId]);
    const toastId = toast.loading('Generating AI Proposal...');
    try {
      const response = await fetch(`${BACKEND_API_URL}/create-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: analysisId, userId: user?.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate proposal');
      }

      toast.success('Proposal generated and added to queue!', { id: toastId });
      await loadAllData(); // Refresh the data to show the new draft
    } catch (error: any) {
      console.error(error);
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setGenerating(prev => prev.filter(id => id !== analysisId));
    }
  };

  const handleAssignCampaign = async (draftId: string, campaignId: string) => {
    if (!campaignId) return;
    const toastId = toast.loading('Assigning to campaign...');
    try {
      const { error } = await supabase.from('drafts').update({ campaign_id: campaignId }).eq('id', draftId);
      if (error) throw error;
      setDrafts(drafts.filter(d => d.id !== draftId)); // Optimistically remove from the current view
      toast.success('Draft assigned to campaign!', { id: toastId });
    } catch (error: any) {
      console.error('Error assigning campaign:', error);
      toast.error(`Failed to assign campaign: ${error.message}`, { id: toastId });
    }
  };

  const handleAction = async (draftId: string, action: 'approve' | 'reject' | 'send') => {
    try {
      const updates: any = { reviewed_by: user?.id, reviewed_at: new Date().toISOString() };
      if (action === 'approve') updates.status = 'approved';
      else if (action === 'reject') updates.status = 'rejected';
      else if (action === 'send') {
        updates.status = 'sent';
        const draft = drafts.find((d) => d.id === draftId);
        if (draft) {
          await supabase.from('messages').insert({ draft_id: draftId, page_id: draft.page_id, platform: 'email', status: 'sent', sent_by: user?.id });
          await supabase.from('audit_logs').insert({ user_id: user?.id, action: 'Message Sent', entity_type: 'message', entity_id: draftId, details: { page_name: draft.pages?.name, platform: 'email' } });
        }
      }
      const { error } = await supabase.from('drafts').update(updates).eq('id', draftId);
      if (error) throw error;
      await supabase.from('audit_logs').insert({ user_id: user?.id, action: `Draft ${action}ed`, entity_type: 'draft', entity_id: draftId, details: { action } });
      loadAllData();
      setSelectedDraft(null);
    } catch (error) {
      console.error(`Error ${action}ing draft:`, error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', sent: 'bg-blue-100 text-blue-800', scheduled: 'bg-purple-100 text-purple-800' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>{status}</span>;
  };

  const canModerate = user?.role === 'moderator' || user?.role === 'admin';

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (selectedDraft) {
    return <ProposalEditor draft={selectedDraft} onClose={() => setSelectedDraft(null)} onApprove={() => handleAction(selectedDraft.id, 'approve')} onReject={() => handleAction(selectedDraft.id, 'reject')} onSend={() => handleAction(selectedDraft.id, 'send')} canModerate={canModerate} />;
  }

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="text-3xl font-bold text-[#212529] mb-2">Drafts & Proposals</h1><p className="text-gray-600">Generate proposals from analyses and manage draft queue</p></div>
      <div className="mb-12"><h2 className="text-2xl font-bold text-[#212529] mb-4">Ready for Proposal</h2><div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-200">{readyAnalyses.length === 0 ? <div className="p-12 text-center text-gray-500"><p>No new pages to create proposals for.</p></div> : readyAnalyses.map((analysis) => (<div key={analysis.id} className="p-4 flex items-center justify-between"><div className="flex-1"><h3 className="font-semibold text-[#212529]">{analysis?.pages?.name || 'Unknown Page'}</h3><p className="text-sm text-gray-500">Score: {analysis.overall_score} | AI Decision: {analysis.need_decision}</p></div><button onClick={() => handleGenerateProposal(analysis.id)} disabled={generating.includes(analysis.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-wait"><Sparkles size={18} />{generating.includes(analysis.id) ? 'Generating...' : 'Generate Proposal'}</button></div>))}</div></div>
      <div><h2 className="text-2xl font-bold text-[#212529] mb-4">Drafts Queue</h2><div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6"><div className="p-4 border-b border-gray-200 flex gap-2 flex-wrap">{['pending', 'approved', 'sent', 'rejected', 'all'].map((status) => (<button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${filter === status ? 'bg-[#c8f031] text-[#212529]' : 'text-gray-600 hover:bg-gray-100'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</button>))}</div><div className="divide-y divide-gray-200">{drafts.length === 0 ? <div className="p-12 text-center text-gray-500"><FileText size={48} className="mx-auto mb-4 text-gray-300" /><p>No drafts found for this filter.</p></div> : drafts.map((draft) => (<div key={draft.id} className="p-4 hover:bg-gray-50 transition-colors"><div className="flex items-start gap-4"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><h3 className="font-semibold text-[#212529]">{draft?.pages?.name || 'Unknown Page'}</h3>{getStatusBadge(draft.status)}<span className="text-xs text-gray-500">Score: {draft?.analyses?.overall_score || 'N/A'}</span></div><p className="text-sm text-gray-600 mb-2">{draft?.pages?.url || 'No URL'}</p><p className="text-sm text-gray-700 line-clamp-2">{draft.email_subject || draft.fb_message}</p><p className="text-xs text-gray-500 mt-2">Created: {new Date(draft.created_at).toLocaleString()}</p></div><div className="flex items-center gap-2">{draft.status === 'pending' && !draft.campaign_id && canModerate && (<div className="flex items-center gap-1"><FolderPlus size={16} className="text-gray-500"/><select onChange={(e) => handleAssignCampaign(draft.id, e.target.value)} className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c8f031]"><option value="">Assign to Campaign...</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>)}{canModerate && (<button onClick={() => setSelectedDraft(draft)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="View & Edit"><Eye size={20} /></button>)}{canModerate && draft.status === 'pending' && (<><button onClick={() => handleAction(draft.id, 'approve')} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Approve"><Check size={20} /></button><button onClick={() => handleAction(draft.id, 'reject')} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Reject"><X size={20} /></button></>)}{canModerate && draft.status === 'approved' && (<button onClick={() => handleAction(draft.id, 'send')} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Send"><Send size={20} /></button>)}</div></div></div>))}</div></div></div>
    </div>
  );
};