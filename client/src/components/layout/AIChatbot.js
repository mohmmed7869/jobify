import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { FaRobot, FaPaperPlane, FaTimes, FaMinus, FaMagic, FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const AIChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Dynamic Initial Message based on Role
  const getInitialMessage = () => {
    if (!user) return 'مرحباً بك في Jobify الذكية! كيف أستطيع مساعدتك اليوم؟';
    if (user.role === 'employer') return `مرحباً ${user.name.split(' ')[0]}! أنا مساعد التوظيف الخاص بك. كيف يمكنني مساعدتك اليوم؟`;
    return `مرحباً ${user.name.split(' ')[0]}! كيف أستطيع مساعدتك في رحلة البحث عن عمل اليوم؟`;
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: getInitialMessage(),
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Dynamic Quick Actions based on Role
  const getQuickActions = () => {
    if (!user) return ['✨ كيف أبحث عن وظيفة؟', '✨ كيف أنشر وظيفة؟'];
    if (user.role === 'employer') return [
      '✨ صغ لي وصف وظيفي لمطور',
      '✨ اقترح أسئلة مقابلة',
      '✨ كيف أصل لمرشحين أفضل؟'
    ];
    return [
      '✨ ابحث لي عن وظيفة',
      '✨ حسّن سيرتي الذاتية',
      '✨ أنشئ Cover Letter',
      '✨ جهّزني للمقابلة'
    ];
  };

  const QUICK_ACTIONS = getQuickActions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Update initial message if user logs in/out while app is running
  useEffect(() => {
    if (messages.length === 1) {
      setMessages([{
        id: 1,
        text: getInitialMessage(),
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
  }, [user]);

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
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-600 to-accent text-white rounded-2xl shadow-glow flex items-center justify-center z-40 hover:scale-110 transition-all group lg:bottom-10"
        title="المساعد الذكي"
      >
        <span className="text-2xl group-hover:rotate-12 transition-transform">✨</span>
        <span className="absolute -top-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full"></span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-96 max-h-[600px] bg-white rounded-3xl shadow-premium z-50 flex flex-col overflow-hidden transition-all duration-300 lg:bottom-10 ${isMinimized ? 'h-20' : 'h-[500px] sm:h-[600px]'}`} dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent p-4 flex items-center justify-between text-white shrink-0 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            ✨
          </div>
          <div>
            <h3 className="font-black text-sm">المساعد الذكي</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold opacity-80">متصل ومستعد للمساعدة</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <FaMinus size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                    msg.sender === 'user' ? 'bg-accent text-white' : 'bg-primary-100 text-primary-600'
                  }`}>
                    {msg.sender === 'user' ? <FaUser size={12} /> : '✨'}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-accent text-white rounded-tr-none'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
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
                    className="bg-white border border-primary-200 text-primary-700 text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary-50 transition-colors shadow-sm"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                    ✨
                  </div>
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm items-center">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-all disabled:opacity-50"
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
