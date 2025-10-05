import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Check, X, Send, Save } from 'lucide-react';

interface ProposalEditorProps {
  draft: any;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSend: () => void;
  canModerate: boolean;
}

export const ProposalEditor = ({
  draft,
  onClose,
  onApprove,
  onReject,
  onSend,
  canModerate,
}: ProposalEditorProps) => {
  const [fbMessage, setFbMessage] = useState(draft.fb_message || '');
  const [emailSubject, setEmailSubject] = useState(draft.email_subject || '');
  const [emailBody, setEmailBody] = useState(draft.email_body || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('drafts')
        .update({
          fb_message: fbMessage,
          email_subject: emailSubject,
          email_body: emailBody,
          version: (draft.version || 1) + 1, // Increment version on save
        })
        .eq('id', draft.id);

      if (error) throw error;

      alert('Changes saved successfully!');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-gray-600 hover:text-[#212529] mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Queue
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm self-start">
          <h3 className="font-semibold text-[#212529] mb-4">Page Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-1">Page Name</p>
              <p className="font-semibold text-[#212529]">{draft.pages?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">URL</p>
              <p className="text-gray-700 break-all">{draft.pages?.url || 'N/A'}</p>
            </div>
            {draft.pages?.contact_email && (
              <div>
                <p className="text-gray-500 text-xs mb-1">Contact Email</p>
                <p className="text-gray-700">{draft.pages.contact_email}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs mb-1">Design Score</p>
              <p className="font-semibold text-[#212529]">{draft.analyses?.overall_score || 'N/A'}/100</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Need Assessment</p>
              <span className="inline-block px-2 py-1 bg-[#c8f031] text-[#212529] text-xs font-semibold rounded">
                {draft.analyses?.need_decision || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#212529] mb-4">Facebook Message</h3>
            <textarea
              value={fbMessage}
              onChange={(e) => setFbMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031] focus:border-transparent resize-none"
              placeholder="Enter Facebook message..."
              readOnly={!canModerate}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-[#212529] mb-4">Email Proposal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#212529] mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031] focus:border-transparent"
                  placeholder="Email subject..."
                  readOnly={!canModerate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#212529] mb-2">
                  Email Body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031] focus:border-transparent resize-none"
                  placeholder="Enter email body..."
                  readOnly={!canModerate}
                />
              </div>
            </div>
          </div>

          {canModerate && (
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={20} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>

              {draft.status === 'pending' && (
                <>
                  <button
                    onClick={onApprove}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check size={20} />
                    Approve
                  </button>
                  <button
                    onClick={onReject}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X size={20} />
                    Reject
                  </button>
                </>
              )}

              {draft.status === 'approved' && (
                <button
                  onClick={onSend}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#c8f031] text-[#212529] font-semibold rounded-lg hover:bg-[#b8e021] transition-colors"
                >
                  <Send size={20} />
                  Send Message
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};