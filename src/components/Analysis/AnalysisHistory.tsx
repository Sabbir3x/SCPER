import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../common/Modal';
import { AnalysisDetailView } from './AnalysisDetailView';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

// Expanded interface to include all details for the modal view
interface AnalysisHistoryItem {
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
  } | null;
}

export const AnalysisHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('analyses')
          .select(`
            id,
            overall_score,
            need_decision,
            analysis_date,
            rationale,
            confidence_score,
            issues,
            suggestions,
            pages ( name, url, profile_image_url )
          `)
          .eq('analyzed_by', user.id)
          .order('analysis_date', { ascending: false });

        if (error) throw error;
        setHistory(data as AnalysisHistoryItem[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const handleViewDetails = (item: AnalysisHistoryItem) => {
    setSelectedAnalysis(item);
  };

  const handleCloseModal = () => {
    setSelectedAnalysis(null);
  };

  const promptDelete = (analysisId: string) => {
    setItemToDelete(analysisId);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const toastId = toast.loading('Deleting analysis...');

    try {
      const { error } = await supabase.from('analyses').delete().eq('id', itemToDelete);

      if (error) {
        throw error;
      }

      setHistory(history.filter((item) => item.id !== itemToDelete));
      toast.success('Analysis deleted successfully', { id: toastId });
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`, { id: toastId });
    } finally {
      setItemToDelete(null); // Close the modal
    }
  };

  if (loading) return <div className="p-8 text-center">Loading analysis history...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-[#212529] mb-6">Analysis History</h1>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.pages?.name}</div>
                    <div className="text-sm text-gray-500">{item.pages?.url}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.overall_score < 50 ? 'bg-red-100 text-red-800' : item.overall_score < 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {item.overall_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.need_decision}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.analysis_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleViewDetails(item)} className="text-[#212529] font-semibold hover:underline">
                      View
                    </button>
                    <button onClick={() => promptDelete(item.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAnalysis && (
        <Modal isOpen={!!selectedAnalysis} onClose={handleCloseModal} title={`Analysis for: ${selectedAnalysis.pages?.name}`}>
          <AnalysisDetailView analysis={selectedAnalysis} />
        </Modal>
      )}

      {itemToDelete && (
        <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirm Deletion">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-gray-900">Are you sure?</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                        Do you really want to delete this analysis? This action will also delete any associated drafts. This process cannot be undone.
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
                        onClick={confirmDelete}
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
