import { useState } from 'react';
import { supabase, Analysis } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, AlertCircle, CheckCircle, XCircle, Lightbulb, TrendingUp, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3001";

interface PageAnalysisProps {
  onViewChange: (view: string) => void;
}

export const PageAnalysis = ({ onViewChange }: PageAnalysisProps) => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [pageData, setPageData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a Facebook Page URL');
      return;
    }
    setError('');
    setLoading(true);
    setAnalysis(null);
    setPageData(null);

    try {
      if (!user?.id) throw new Error("User not found. Please log in again.");

      const response = await fetch(`${BACKEND_API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUrl: url, pageName: url.split('/').pop()?.split('?').shift() || 'Unknown Page' }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Analysis failed with status: ${response.status}`);
      }

      const result = await response.json();
      const { metadata, ...analysisData } = result;

      const pagePayload = {
        url,
        name: metadata.title || url.split('/').pop()?.split('?').shift() || 'Unknown Page',
        about: metadata.description,
        profile_image_url: metadata.imageUrl,
        cover_image_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
        created_by: user.id,
      };

      const { data: pageToAnalyze, error: pageError } = await supabase.from('pages').upsert(pagePayload, { onConflict: 'url' }).select().single();
      if (pageError) throw pageError;
      setPageData(pageToAnalyze);

      const need_decision = analysisData.overall_score < 65 ? 'yes' : (analysisData.overall_score < 85 ? 'maybe' : 'no');
      const analysisToSave = {
        page_id: pageToAnalyze.id,
        overall_score: analysisData.overall_score,
        issues: analysisData.issues || [],
        suggestions: analysisData.suggestions || [],
        images_analyzed: 0,
        need_decision,
        confidence_score: Math.random() * 0.3 + 0.7,
        rationale: analysisData.rationale || "AI analysis could not generate a rationale.",
        analyzed_by: user.id,
      };

      const { data: savedAnalysis, error: saveError } = await supabase.from('analyses').insert(analysisToSave).select().single();
      if (saveError) throw saveError;

      setAnalysis(savedAnalysis);

      await supabase.from('pages').update({ last_analyzed_at: new Date().toISOString() }).eq('id', pageToAnalyze.id);
      await supabase.from('audit_logs').insert({ user_id: user.id, action: 'Page Analyzed', entity_type: 'page', entity_id: pageToAnalyze.id, details: { page_name: pageToAnalyze.name, score: analysisData.overall_score } });

    } catch (err: any) {
      setError(err.message || 'Failed to analyze page');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!analysis || !user) return;
    setProposalLoading(true);
    const toastId = toast.loading('Generating proposal draft...');
    try {
      const response = await fetch(`${BACKEND_API_URL}/create-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: analysis.id, userId: user.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create proposal');
      }

      await response.json(); // We don't need the draft data here, just confirmation
      toast.success('Proposal draft created successfully!', { id: toastId });
      onViewChange('drafts'); // Navigate to drafts queue

    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setProposalLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 50) return 'text-red-600';
    if (score < 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getNeedIcon = (decision: string) => {
    if (decision === 'yes') return <CheckCircle className="text-green-600" size={24} />;
    if (decision === 'maybe') return <AlertCircle className="text-yellow-600" size={24} />;
    return <XCircle className="text-gray-600" size={24} />;
  };

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="text-3xl font-bold text-[#212529] mb-2">Analyze Page</h1><p className="text-gray-600">Enter a Facebook Page URL to analyze design quality</p></div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8"><div className="flex gap-3"><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://facebook.com/pagename" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031] focus:border-transparent" /><button onClick={handleAnalyze} disabled={loading || proposalLoading} className="px-6 py-3 bg-[#c8f031] text-[#212529] font-semibold rounded-lg hover:bg-[#b8e021] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Search size={20} />{loading ? 'Analyzing...' : 'Analyze'}</button></div>{error && <div className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">{error}</div>}</div>
      {loading && <div className="bg-white border border-gray-200 rounded-xl p-12 shadow-sm text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8f031] mb-4"></div><p className="text-gray-600">Analyzing page... (This may take up to 30 seconds)</p></div>}
      {analysis && pageData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"><h3 className="font-semibold text-[#212529] mb-4">Page Information</h3><img src={pageData.profile_image_url || pageData.cover_image_url} alt="Page Image" className="w-full h-32 object-cover rounded-lg mb-4" /><div className="space-y-2 text-sm"><p className="font-semibold text-[#212529]">{pageData.name}</p><p className="text-gray-600">{pageData.category}</p><p className="text-gray-500 text-xs">{pageData.about}</p>{pageData.contact_email && <p className="text-gray-600">{pageData.contact_email}</p>}</div></div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"><h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2"><TrendingUp size={20} />AI Scorecard</h3><div className="flex items-center gap-6 mb-6"><div className="relative w-32 h-32"><svg className="w-full h-full transform -rotate-90"><circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" /><circle cx="64" cy="64" r="56" stroke="#c8f031" strokeWidth="8" fill="none" strokeDasharray={`${(analysis.overall_score / 100) * 351.86} 351.86`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center"><span className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>{analysis.overall_score}</span></div></div><div className="flex-1"><div className="flex items-center gap-2 mb-2">{getNeedIcon(analysis.need_decision)}<span className="font-semibold text-[#212529]">{analysis.need_decision === 'yes' ? 'Needs Design Help' : analysis.need_decision === 'maybe' ? 'Could Use Improvement' : 'Design Quality Good'}</span></div><p className="text-sm text-gray-600 mb-2">{analysis.rationale}</p><p className="text-xs text-gray-500">Confidence: {(analysis.confidence_score * 100).toFixed(0)}%</p></div></div></div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"><h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2"><AlertCircle size={20} />Issues Detected</h3><div className="space-y-3">{analysis.issues.map((issue, idx) => (<div key={idx} className="border-l-4 border-red-400 bg-red-50 p-3 rounded"><p className="font-semibold text-sm text-[#212529]">{issue.type}</p><p className="text-xs text-gray-600 mt-1">{issue.description}</p><span className="inline-block mt-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs font-semibold rounded">{issue.severity}</span></div>))}</div></div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"><h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2"><Lightbulb size={20} />Suggested Improvements</h3><div className="space-y-3">{analysis.suggestions.map((suggestion, idx) => (<div key={idx} className="border-l-4 border-[#c8f031] bg-green-50 p-3 rounded"><p className="font-semibold text-sm text-[#212529]">{suggestion.title}</p><p className="text-xs text-gray-600 mt-1">{suggestion.description}</p></div>))}</div></div>
            {(analysis.need_decision === 'yes' || analysis.need_decision === 'maybe') && (<button onClick={handleCreateProposal} disabled={proposalLoading || loading} className="w-full bg-[#212529] text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><FileText size={18} />{proposalLoading ? 'Generating...' : 'Create Proposal'}</button>)}
          </div>
        </div>
      )}
    </div>
  );
};