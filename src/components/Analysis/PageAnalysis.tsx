import { useState } from 'react';
import { supabase, Analysis } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, AlertCircle, CheckCircle, XCircle, Lightbulb, TrendingUp } from 'lucide-react';

export const PageAnalysis = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
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
      // Step 0: Check for user
      if (!user?.id) {
        throw new Error("User not found. Please log in again.");
      }

      // Step 1: Upsert the page data. This will create a new page or fetch the existing one.
      const pageName = url.split('/').pop()?.split('?').shift() || 'Unknown Page';
      const pagePayload = {
        url,
        name: pageName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        category: 'Local Business',
        cover_image_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
        profile_image_url: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
        created_by: user.id,
      };

      const { data: pageToAnalyze, error: pageError } = await supabase
        .from('pages')
        .upsert(pagePayload, { onConflict: 'url' })
        .select()
        .single();

      if (pageError) throw pageError;
      if (!pageToAnalyze) throw new Error('Failed to create or find page.');

      setPageData(pageToAnalyze);

      // Step 2: Invoke the deployed Supabase Edge Function
      const { data: analysisResult, error: functionError } = await supabase.functions.invoke(
        'analyze-page',
        {
          body: {
            page_id: pageToAnalyze.id,
            user_id: user.id,
            page_url: pageToAnalyze.url, // Add page_url
            page_name: pageToAnalyze.name, // Add page_name
          },
        }
      );

      if (functionError) {
        // Try to parse the error response from the function
        const errorBody = await functionError.context.json();
        throw new Error(`Function Error: ${errorBody.error || functionError.message}`);
      }

      setAnalysis(analysisResult);

      // Step 3: Update logs and metadata
      await supabase.from('pages').update({ last_analyzed_at: new Date().toISOString() }).eq('id', pageToAnalyze.id);

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'Page Analyzed',
        entity_type: 'page',
        entity_id: pageToAnalyze.id,
        details: { page_name: pageToAnalyze.name, score: analysisResult.overall_score },
      });

    } catch (err: any) {
      setError(err.message || 'Failed to analyze page');
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Analyze Page</h1>
        <p className="text-gray-600">Enter a Facebook Page URL to analyze design quality</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://facebook.com/pagename"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031] focus:border-transparent"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-3 bg-[#c8f031] text-[#212529] font-semibold rounded-lg hover:bg-[#b8e021] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search size={20} />
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 shadow-sm text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#c8f031] mb-4"></div>
          <p className="text-gray-600">Analyzing page design quality...</p>
        </div>
      )}

      {analysis && pageData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#212529] mb-4">Page Information</h3>
            <img
              src={pageData.cover_image_url}
              alt="Cover"
              className="w-full h-32 object-cover rounded-lg mb-4"
            />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-[#212529]">{pageData.name}</p>
              <p className="text-gray-600">{pageData.category}</p>
              <p className="text-gray-500 text-xs">{pageData.about}</p>
              {pageData.contact_email && (
                <p className="text-gray-600">{pageData.contact_email}</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                AI Scorecard
              </h3>

              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#c8f031"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(analysis.overall_score / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                      {analysis.overall_score}
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getNeedIcon(analysis.need_decision)}
                    <span className="font-semibold text-[#212529]">
                      {analysis.need_decision === 'yes'
                        ? 'Needs Design Help'
                        : analysis.need_decision === 'maybe'
                        ? 'Could Use Improvement'
                        : 'Design Quality Good'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{analysis.rationale}</p>
                  <p className="text-xs text-gray-500">
                    Confidence: {(analysis.confidence_score * 100).toFixed(0)}% | Images analyzed:{' '}
                    {analysis.images_analyzed}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2">
                <AlertCircle size={20} />
                Issues Detected
              </h3>
              <div className="space-y-3">
                {analysis.issues.map((issue, idx) => (
                  <div key={idx} className="border-l-4 border-red-400 bg-red-50 p-3 rounded">
                    <p className="font-semibold text-sm text-[#212529]">{issue.type}</p>
                    <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs font-semibold rounded">
                      {issue.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2">
                <Lightbulb size={20} />
                Suggested Improvements
              </h3>
              <div className="space-y-3">
                {analysis.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="border-l-4 border-[#c8f031] bg-green-50 p-3 rounded">
                    <p className="font-semibold text-sm text-[#212529]">{suggestion.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-green-200 text-green-800 text-xs font-semibold rounded">
                      {suggestion.priority} priority
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {(analysis.need_decision === 'yes' || analysis.need_decision === 'maybe') && (
              <button className="w-full bg-[#c8f031] text-[#212529] font-semibold py-3 rounded-lg hover:bg-[#b8e021] transition-colors">
                Create Proposal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
