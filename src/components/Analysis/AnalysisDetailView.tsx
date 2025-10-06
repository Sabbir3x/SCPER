import { AlertCircle, CheckCircle, XCircle, Lightbulb, TrendingUp } from 'lucide-react';

// This interface should be aligned with what the history query returns
interface AnalysisDetail {
  id: string;
  overall_score: number;
  need_decision: string;
  analysis_date: string;
  rationale: string;
  confidence_score: number;
  issues: Array<{ type: string; severity: string; description: string; }>;
  suggestions: Array<{ title: string; description: string; }>;
  pages: {
    name: string;
    url: string;
    profile_image_url?: string;
    cover_image_url?: string;
    category?: string;
    about?: string;
    contact_email?: string;
  } | null;
}

interface AnalysisDetailViewProps {
  analysis: AnalysisDetail;
}

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

export const AnalysisDetailView = ({ analysis }: AnalysisDetailViewProps) => {
  if (!analysis) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-[#212529] mb-4">Page Information</h3>
        {analysis.pages?.profile_image_url && <img src={analysis.pages.profile_image_url} alt="Page Image" className="w-full h-32 object-cover rounded-lg mb-4" />}
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-[#212529]">{analysis.pages?.name}</p>
          <p className="text-gray-600">{analysis.pages?.category}</p>
          <p className="text-gray-500 text-xs">{analysis.pages?.about}</p>
          {analysis.pages?.contact_email && <p className="text-gray-600">{analysis.pages?.contact_email}</p>}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2"><TrendingUp size={20} />AI Scorecard</h3>
          <div className="flex items-center gap-6 mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle cx="64" cy="64" r="56" stroke="#c8f031" strokeWidth="8" fill="none" strokeDasharray={`${(analysis.overall_score / 100) * 351.86} 351.86`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>{analysis.overall_score}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">{getNeedIcon(analysis.need_decision)}<span className="font-semibold text-[#212529]">{analysis.need_decision === 'yes' ? 'Needs Design Help' : analysis.need_decision === 'maybe' ? 'Could Use Improvement' : 'Design Quality Good'}</span></div>
              <p className="text-sm text-gray-600 mb-2">{analysis.rationale}</p>
              <p className="text-xs text-gray-500">Confidence: {(analysis.confidence_score * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2"><AlertCircle size={20} />Issues Detected</h3>
          <div className="space-y-3">{analysis.issues.map((issue, idx) => (<div key={idx} className="border-l-4 border-red-400 bg-red-50 p-3 rounded"><p className="font-semibold text-sm text-[#212529]">{issue.type}</p><p className="text-xs text-gray-600 mt-1">{issue.description}</p><span className="inline-block mt-2 px-2 py-0.5 bg-red-200 text-red-800 text-xs font-semibold rounded">{issue.severity}</span></div>))}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-[#212529] mb-4 flex items-center gap-2"><Lightbulb size={20} />Suggested Improvements</h3>
          <div className="space-y-3">{analysis.suggestions.map((suggestion, idx) => (<div key={idx} className="border-l-4 border-[#c8f031] bg-green-50 p-3 rounded"><p className="font-semibold text-sm text-[#212529]">{suggestion.title}</p><p className="text-xs text-gray-600 mt-1">{suggestion.description}</p></div>))}</div>
        </div>
      </div>
    </div>
  );
};
