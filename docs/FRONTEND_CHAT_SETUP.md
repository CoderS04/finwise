"""
Finwise AI Chat Frontend Integration Guide

Add chat UI to the React frontend.
"""

# Step 1: Create Chat API Wrapper
# frontend/src/api/chatApi.js

import axios from './axios';

export async function sendChatMessage(message) {
    try {
        const response = await axios.post('/chat/', {
            user_message: message
        });
        return response.data;
    } catch (error) {
        console.error('Chat error:', error);
        throw error;
    }
}


# Step 2: Create Chat Component
# frontend/src/pages/AiChat.jsx

import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import { sendChatMessage } from '../api/chatApi';

export default function AiChat() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I\'m Finwise, your financial assistant. Ask me about your budgets, spending, savings, or goals.',
            safe: true
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setError(null);

        setMessages(prev => [...prev, {
            role: 'user',
            content: userMessage,
            safe: true
        }]);

        try {
            setLoading(true);
            const response = await sendChatMessage(userMessage);
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.response,
                safe: response.safe
            }]);
        } catch (err) {
            console.error('Failed to get response:', err);
            setError('Failed to get response. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 flex flex-col h-screen">
            <Header 
                title="AI Financial Assistant" 
                subtitle="Ask Finwise about your budgets, spending, and goals"
            />

            {/* Chat Messages */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            <p className="text-sm">{msg.content}</p>
                            {!msg.safe && (
                                <p className="text-xs mt-1 text-orange-600">⚠️ Safety checked</p>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                            <p className="text-sm">Finwise is thinking...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
                    <AlertCircle size={20} />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Ask about your finances..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    💡 Ask about: budgets • spending • savings • goals
                </p>
            </form>
        </div>
    );
}


# Step 3: Add Route
# frontend/src/App.jsx

import AiChat from './pages/AiChat';

// In your routing:
{
    path: '/ai-chat',
    element: <AiChat />
}


# Step 4: Add Navigation Link
# frontend/src/components/Sidebar.jsx

<NavLink 
    to="/ai-chat" 
    className="flex items-center gap-2"
>
    <MessageCircle size={20} />
    AI Chat
</NavLink>


# Step 5: Style (Tailwind included in default)
# No additional styling needed - uses Tailwind classes

---

## Features

✅ Real-time messaging UI
✅ User/Assistant message distinction
✅ Loading state
✅ Error handling
✅ Auto-scroll to latest message
✅ Disabled input during loading
✅ Safety indicator

## Example Messages

User: "Why am I overspending on food?"
Finwise: "Your food spending is ₹8,000, 33% over your ₹6,000 budget. Try reducing dining-out frequency."

User: "Should I invest in stocks?"
Finwise: "I can help with budgeting, spending, savings, and goals. I cannot provide investment advice."

User: "How am I doing with my emergency fund goal?"
Finwise: "Your Emergency Fund goal is at ₹25,000 / ₹50,000 (50% complete). At your current savings rate, you'll reach it in about 6 months."

## Mobile Responsive

- Full-width on mobile
- Optimized message width
- Touch-friendly buttons
- Scrollable chat history

## Accessibility

- ARIA labels (optional enhancement)
- Keyboard navigation (Enter to send)
- Focus states
- Semantic HTML
