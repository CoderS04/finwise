import { useState, useEffect, useRef } from 'react'
import { Send, Plus, MessageCircle, Loader, AlertCircle } from 'lucide-react'
import Header from '../components/Header'
import { sendChatMessage } from '../api/chatApi'

export default function AiChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi there! 👋 I\'m your AI Finance Assistant. I can help you understand your spending, budgets, savings, and goals. What would you like to know today?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const suggestedQuestions = [
    "How much did I spend in January?",
    "What are my top spending categories?",
    "How much can I save this month?",
    "Tell me my budget breakdown",
    "How am I progressing toward my goals?",
  ]

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim() || isLoading) return

    setError(null)

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: text,
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call the backend API
      const result = await sendChatMessage(text)
      
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: result.response,
        timestamp: new Date(),
        safe: result.safe
      }

      setMessages(prev => [...prev, botMessage])
      
      if (!result.safe) {
        setError('Note: This response may contain sensitive information.')
      }
    } catch (err) {
      console.error('Chat error:', err)
      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
      setError('Failed to get response from AI assistant.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <Header title="AI Finance Assistant" subtitle="Ask me anything about your finances" />

      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 1 && !isLoading && (
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
                      disabled={isLoading}
                      className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded-lg transition-colors font-medium text-sm"
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
                  message.isError
                    ? 'bg-red-100 text-red-800 rounded-bl-none'
                    : message.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                {message.isError && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} />
                    <span className="font-semibold">Error</span>
                  </div>
                )}
                <p className="text-sm lg:text-base">{message.text}</p>
                <span className={`text-xs mt-1 block ${message.isError ? 'text-red-700' : message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-lg rounded-bl-none px-4 py-3 flex items-center gap-2">
                <Loader size={16} className="animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="border-t border-red-200 bg-red-50 px-6 py-3 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800 font-semibold text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask your AI assistant..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button 
              onClick={() => {
                setMessages([{
                  id: 1,
                  type: 'bot',
                  text: 'Hi there! 👋 I\'m your AI Finance Assistant. I can help you understand your spending, budgets, savings, and goals. What would you like to know today?',
                  timestamp: new Date()
                }])
                setInputValue('')
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm text-gray-700"
            >
              <Plus size={16} /> New Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
