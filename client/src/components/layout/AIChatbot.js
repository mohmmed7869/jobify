import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { FaRobot, FaPaperPlane, FaTimes, FaMinus, FaMagic, FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const QUICK_ACTIONS = [
  '✨ ابحث لي عن وظيفة',
  '✨ حسّن سيرتي الذاتية',
  '✨ أنشئ Cover Letter',
  '✨ جهّزني للمقابلة'
];

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `مرحباً ${user?.name?.split(' ')[0] || ''}! كيف أستطيع مساعدتك اليوم؟`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (text) => {
    const messageText = typeof text === 'string' ? text : input;
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/assistant/chat', {
        message: messageText,
        context: {
          userRole: user?.role,
          userName: user?.name,
          currentPath: window.location.pathname
        }
      });

      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.data.response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('عذراً، حدث خطأ في الاتصال بالمساعد الذكي');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center justify-center z-40 hover:scale-105 transition-all group"
        title="المساعد الذكي"
      >
        <span className="text-2xl group-hover:rotate-12 transition-transform">✨</span>
        <span className="absolute -top-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full"></span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-96 max-h-[600px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[500px] sm:h-[600px]'}`} dir="rtl">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between text-white shrink-0 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">
            ✨
          </div>
          <div>
            <h3 className="font-bold text-sm">المساعد الذكي</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-300 font-medium">متصل ومستعد للمساعدة</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300">
            <FaMinus size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300">
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, index) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
                    msg.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {msg.sender === 'user' ? <FaUser size={12} /> : '✨'}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-primary-600 text-white rounded-tl-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tr-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Quick Actions (only show if last message is from AI and no loading) */}
            {!loading && messages[messages.length - 1].sender === 'ai' && (
              <div className="flex flex-wrap gap-2 mt-4">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action)}
                    className="bg-white border border-primary-200 text-primary-700 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary-50 transition-colors shadow-sm"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm shrink-0">
                    ✨
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tr-sm flex gap-1 shadow-sm items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <FaPaperPlane size={14} className="rotate-180" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AIChatbot;
