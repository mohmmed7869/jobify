import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FaRobot, FaPaperPlane, FaUser, FaMagic, FaFileUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `مرحباً ${user?.name || ''}! أنا مساعدك الذكي في Jobify. كيف يمكنني مساعدتك اليوم؟ يمكنك إرسال رسالة أو رفع سيرتك الذاتية لتحليلها.`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/assistant/chat', {
        message: input,
        context: {
          userRole: user?.role,
          userName: user?.name
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
      toast.error('عذراً، واجهت مشكلة في الاتصال بالذكاء الاصطناعي');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // في الواقع سنقوم باستخراج النص من الملف أو رفعه
    // للتبسيط، سنطلب من المستخدم لصق النص حالياً أو نقوم بمحاكاة التحليل
    toast.success('تم اختيار الملف. جاري التحليل...');
    setAnalyzing(true);

    try {
      // محاكاة استخراج النص (في بيئة حقيقية نستخدم FileReader أو نرفع الملف)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        
        const userMsg = {
          id: Date.now(),
          text: `تحليل ملف السيرة الذاتية: ${file.name}`,
          sender: 'user',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        try {
          const response = await axios.post('/api/ai/analyze-resume', {
            resumeText: text.substring(0, 5000) // تحديد الطول
          });

          const analysis = response.data.data.analysis;
          const aiMsg = {
            id: Date.now() + 1,
            text: `تم تحليل سيرتك الذاتية بنجاح!
الدرجة الكلية: ${analysis.overallScore}/100

أهم المهارات المكتشفة: ${analysis.skills.join(', ')}
نقاط القوة:
${analysis.strengths.map(s => `• ${s}`).join('\n')}

مجالات التحسين:
${analysis.improvements.map(i => `• ${i}`).join('\n')}`,
            sender: 'ai',
            timestamp: new Date(),
            isAnalysis: true
          };
          setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
          toast.error('فشل في تحليل السيرة الذاتية');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setAnalyzing(false);
      toast.error('خطأ في معالجة الملف');
    }
  };

  return (
    <div className="mesh-bg h-screen pt-16 sm:pt-20 pb-0 flex flex-col animate-fade-in overflow-hidden relative" dir="rtl">
      {/* Background Ornaments */}
      <div className="blur-circle w-[400px] h-[400px] bg-primary-500/10 top-0 left-0"></div>
      <div className="blur-circle w-[300px] h-[300px] bg-accent/10 bottom-0 right-0"></div>

      <div className="flex-1 premium-container max-w-5xl h-full flex flex-col px-0 sm:px-4 py-4 sm:py-6 overflow-hidden relative z-10">
        {/* Header */}
        <div className="premium-glass-panel bg-gradient-to-r from-primary-600 via-primary-700 to-accent p-6 sm:p-10 flex items-center justify-between mb-6 sm:mb-8 text-white overflow-hidden relative shadow-glow-primary mx-4 sm:mx-0 rounded-[2rem] sm:rounded-[3rem] border-none">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
          
          <div className="flex items-center gap-4 sm:gap-6 relative z-10">
            <div className="bg-white/20 p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] backdrop-blur-xl shadow-inner border border-white/20 floating-element">
              <FaRobot className="text-2xl sm:text-4xl text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight mb-1">المساعد الذكي الفائق</h1>
              <p className="text-primary-100 text-[11px] sm:text-sm font-black uppercase tracking-[0.2em] mt-0.5 opacity-90 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-sm"></span> GPT-4 Omni & DeepSeek Enabled
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
            <span className="flex h-3 w-3 rounded-full bg-green-400 animate-pulse shadow-glow-sm"></span>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">الذكاء الاصطناعي متصل</span>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 premium-glass-panel overflow-hidden flex flex-col mb-6 sm:mb-10 shadow-premium mx-4 sm:mx-0 rounded-[2.5rem] sm:rounded-[3.5rem] border-white/40">
          <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-8 sm:space-y-10 scrollbar-hide bg-slate-50/20 bg-pattern-dots">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-4 sm:gap-6 max-w-[90%] sm:max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <motion.div 
                      className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-glow-sm transition-all hover:scale-110 ${
                        msg.sender === 'user' ? 'bg-gradient-to-br from-accent to-accent-dark text-white' : 'bg-gradient-to-br from-primary-600 to-primary-700 text-white'
                      }`}
                    >
                      {msg.sender === 'user' ? <FaUser className="text-sm sm:text-lg" /> : <FaMagic className="text-sm sm:text-lg" />}
                    </motion.div>
                    <motion.div
                      layout
                      className={`p-5 sm:p-8 rounded-[1.8rem] sm:rounded-[2.5rem] shadow-sm text-sm sm:text-lg font-bold leading-relaxed whitespace-pre-wrap transition-all hover:shadow-premium-xl ${
                        msg.sender === 'user'
                          ? 'bg-accent text-white rounded-tr-none shadow-glow-sm'
                          : 'bg-white border border-primary-100/20 text-slate-700 rounded-tl-none premium-card p-6'
                      }`}
                    >
                      {msg.text}
                      <div className={`text-[9px] sm:text-xs mt-4 font-black uppercase tracking-[0.2em] opacity-60 ${msg.sender === 'user' ? 'text-white' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-4 sm:gap-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-glow-sm">
                    <FaMagic className="text-sm sm:text-lg animate-spin" />
                  </div>
                  <div className="bg-white border border-primary-100/20 p-6 sm:p-8 rounded-[2rem] rounded-tl-none flex gap-2.5 sm:gap-3 premium-card">
                    {[0, 0.1, 0.2].map((delay, i) => (
                      <motion.span 
                        key={i}
                        animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay }}
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary-400 rounded-full"
                      ></motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-10 bg-white/60 backdrop-blur-2xl border-t border-primary-100/10 relative z-10">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4 sm:gap-8 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-white rounded-2xl sm:rounded-3xl transition-all border border-transparent hover:border-primary-100 shadow-sm shrink-0"
                title="رفع سيرة ذاتية للتحليل"
              >
                <FaFileUpload size={24} className="sm:text-3xl" />
              </button>
              
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="كيف يمكنني تطوير مساري المهني اليوم؟"
                  className="w-full premium-input py-4 sm:py-6 px-8 sm:px-10 text-sm sm:text-xl bg-white border-primary-100/20 focus:shadow-glow-primary transition-all duration-500 rounded-2xl sm:rounded-3xl"
                />
              </div>
              <button
                type="submit"
                disabled={loading || analyzing || !input.trim()}
                className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-r from-primary-600 to-accent text-white rounded-2xl sm:rounded-3xl hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:grayscale shadow-glow-sm active:scale-95 shrink-0 magnetic-lift"
              >
                {loading || analyzing ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                ) : (
                  <FaPaperPlane className="rotate-180 text-base sm:text-2xl" />
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-slate-400 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] justify-center mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-ping"></div>
          <span>المساعد الذكي الفائق متاح ٢٤/٧ لدعم طموحاتك العالمية</span>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
