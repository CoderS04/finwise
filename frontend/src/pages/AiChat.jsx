import { useState } from 'react'
import { Send, Plus, MessageCircle } from 'lucide-react'
import Header from '../components/Header'

export default function AiChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi there! 👋 I\'m your AI Finance Assistant. I can help you with budgeting, savings advice, investment recommendations, and much more. What would you like to know today?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')

  const suggestedQuestions = [
    "How can I save ₹1 lakh in 6 months?",
    "Should I take a loan for a bike?",
    "Best mutual funds under ₹500 SIP",
    "My budget breakdown suggestions",
    "I want to cut my subscriptions",
  ]

  const handleSendMessage = (text = inputValue) => {
    if (!text.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: text,
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    setInputValue('')

    // Simulate bot response (replace with actual API call later)
    setTimeout(() => {
      const botResponses = [
        'That\'s a great question! Based on your spending patterns, I can help you create a structured savings plan.',
        'Let me analyze your financial data to give you personalized advice...',
        'I\'d recommend checking your recent expenses first. Would you like me to show you a breakdown?',
        'Great! Let me provide some recommendations based on your goals and current financial situation.',
        'I can help you with that! Let me calculate the best options for you.',
      ]

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    }, 1000)
  }

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <Header title="AI Finance Assistant" subtitle="Ask me anything about your finances" />

      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 1 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-6">Start a conversation with your AI Assistant</p>
                
                {/* Suggested Questions */}
                <div className="space-y-2 mb-6">
                  <p className="text-gray-600 font-semibold mb-3">Suggested questions:</p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="text-sm lg:text-base">{message.text}</p>
                <span className={`text-xs mt-1 block ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask your AI assistant..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSendMessage()}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700">
              <Plus size={16} /> New Chat
            </button>
            <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700">
              💰 Budget Help
            </button>
            <button className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700">
              💡 Savings Tips
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
