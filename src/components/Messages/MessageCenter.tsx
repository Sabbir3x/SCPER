import { useEffect, useState } from 'react';
import { supabase, Message, Reply, Draft } from '../../lib/supabase';
import { MessageSquare, Mail, ThumbsUp, AlertCircle, XCircle } from 'lucide-react';

interface MessageWithDetails extends Message {
  pages: { name: string };
  replies: Reply[];
  drafts: Draft; // Add drafts to the interface
}

export const MessageCenter = () => {
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithDetails | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          pages(name),
          replies(*),
          drafts(fb_message, email_subject, email_body)
        `
        )
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setMessages(data as any);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassificationIcon = (classification: string) => {
    // ... (existing function is good)
  };

  const getClassificationColor = (classification: string) => {
    // ... (existing function is good)
  };

  if (loading) {
    return <div className="p-8 text-center">Loading messages...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#212529] mb-2">Message Center</h1>
        <p className="text-gray-600">Track sent messages and replies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50"><h2 className="font-semibold text-[#212529]">Conversations</h2></div>
          <div className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-12 text-center text-gray-500"><MessageSquare size={48} className="mx-auto mb-4 text-gray-300" /><p>No messages sent yet</p></div>
            ) : (
              messages.map((message) => (
                <div key={message.id} onClick={() => setSelectedMessage(message)} className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?.id === message.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">{message.platform === 'email' ? <Mail size={20} /> : <MessageSquare size={20} />}</div>
                    <div className="flex-1"><p className="font-semibold text-[#212529] mb-1">{message.pages.name}</p><p className="text-xs text-gray-500">{new Date(message.sent_at).toLocaleString()}</p></div>
                    {message.replies.length > 0 && <span className="text-xs font-bold text-white bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center">{message.replies.length}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50"><h2 className="font-semibold text-[#212529]">Message Thread</h2></div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {selectedMessage ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-[#212529] mb-2">Original Message Sent</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800 mb-2">{selectedMessage.drafts?.email_subject || 'Facebook Message'}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedMessage.drafts?.email_body || selectedMessage.drafts?.fb_message || 'Message content not found.'}</p>
                    <p className="text-xs text-gray-500 mt-3">Sent via {selectedMessage.platform} at {new Date(selectedMessage.sent_at).toLocaleString()}</p>
                  </div>
                </div>

                {selectedMessage.replies.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-[#212529] mb-3">Replies ({selectedMessage.replies.length})</h4>
                    <div className="space-y-4">
                      {selectedMessage.replies.map((reply) => (
                        <div key={reply.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                          <div className="flex items-center gap-2 mb-2">
                            {getClassificationIcon(reply.classification)}
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getClassificationColor(reply.classification)}`}>{reply.classification}</span>
                            {reply.confidence_score && <span className="text-xs text-gray-500">({(reply.confidence_score * 100).toFixed(0)}% confidence)</span>}
                          </div>
                          <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{reply.content}</p>
                          <p className="text-xs text-gray-500">Received: {new Date(reply.received_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No replies yet for this message.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to view the thread</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};