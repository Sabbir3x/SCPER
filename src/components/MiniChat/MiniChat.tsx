
import { useState } from 'react';
import { Send } from 'lucide-react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3001";

export const MiniChat = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: 'user' as const, content: input }];
        setMessages(newMessages);
        const userInput = input;
        setInput('');
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${BACKEND_API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userInput }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Request failed with status: ${response.status}`);
            }

            const data = await response.json();
            setMessages([...newMessages, { role: 'assistant' as const, content: data.reply }]);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 flex flex-col h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#212529] mb-2">Mini Chat</h1>
                <p className="text-gray-600">A simple interface to test the configured AI provider.</p>
            </div>

            <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-6 overflow-y-auto mb-6">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-[#c8f031] text-[#212529]' : 'bg-gray-100 text-gray-800'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="max-w-lg px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
                                <p className="text-sm">Thinking...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">Error: {error}</div>}

            <div className="flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask the AI anything..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8f031]"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={loading}
                    className="px-6 py-3 bg-[#212529] text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    <Send size={18} />
                    Send
                </button>
            </div>
        </div>
    );
};
