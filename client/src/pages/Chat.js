import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiSend, FiSearch, FiUser, FiCircle, 
  FiMoreVertical, FiSmile, FiPaperclip, FiMessageSquare,
  FiArrowRight, FiActivity, FiClock, FiSettings
} from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (activeChat) {
      setMobileView('chat');
    }
  }, [activeChat]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers();
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setIsSearching(true);
      const res = await axios.get(`/api/users/search?q=${searchQuery}`);
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (err) {
      console.error('Error searching users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = (otherUser) => {
    const existingChat = conversations.find(c => c.otherUserId === otherUser._id);
    if (existingChat) {
      handleSelectChat(existingChat);
    } else {
      const tempChat = {
        otherUserId: otherUser._id,
        otherUserName: otherUser.name,
        conversationId: [user.id, otherUser._id].sort().join('-'),
        isTemp: true
      };
      setActiveChat(tempChat);
      setMessages([]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    // التحقق من وجود معاملات في الرابط لبدء محادثة جديدة
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');
    const userName = params.get('userName');

    if (userId && conversations.length > 0) {
      const existingChat = conversations.find(c => c.otherUserId === userId);
      if (existingChat) {
        handleSelectChat(existingChat);
      } else {
        // إنشاء محادثة مؤقتة إذا لم تكن موجودة
        const tempChat = {
          otherUserId: userId,
          otherUserName: userName || `مستخدم #${userId.slice(-4)}`,
          conversationId: [user.id, userId].sort().join('-'),
          isTemp: true
        };
        setActiveChat(tempChat);
        setMessages([]);
      }
    }
  }, [location.search, conversations, user.id]);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message) => {
        if (activeChat && (message.senderId === activeChat.otherUserId || message.senderId === user.id)) {
          setMessages(prev => [...prev, message]);
        }
        fetchConversations();
      });
    }
    return () => socket?.off('new_message');
  }, [socket, activeChat, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await axios.get('/api/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching conversations');
    }
  };

  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/chat/conversation/${userId}`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      toast.error('خطأ في تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    fetchMessages(chat.otherUserId);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const res = await axios.post('/api/chat/send', {
        recipientId: activeChat.otherUserId,
        message: newMessage
      });

      if (res.data.success) {
        setMessages([...messages, res.data.data]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (err) {
      toast.error('خطأ في إرسال الرسالة');
    }
  };

  return (
    <div className="h-screen mesh-bg pt-16 sm:pt-20 pb-0 overflow-hidden flex flex-col relative" dir="rtl">
      <div className="blur-circle w-[300px] h-[300px] bg-primary-500/5 top-20 right-0"></div>
      <div className="blur-circle w-[250px] h-[250px] bg-accent/5 bottom-10 left-0"></div>
      
      <div className="flex-1 premium-container max-w-7xl h-full flex gap-0 sm:gap-4 lg:gap-6 relative py-4 sm:py-6 overflow-hidden z-10">
        {/* Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 premium-glass-panel overflow-hidden flex flex-col animate-slide-up transition-all duration-500 rounded-[2rem] shadow-premium ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="p-6 sm:p-8 border-b border-primary-100/20 bg-white/40 backdrop-blur-2xl">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-black premium-gradient-text tracking-tighter">المحادثات</h2>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-xl bg-white/50 text-slate-400 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 transition-all border border-primary-100/10 shadow-sm">
                  <FiSettings size={18} />
                </button>
              </div>
            </div>
            <div className="relative group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="ابحث عن اسم أو رسالة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="premium-input pr-12 bg-white/60 text-sm py-3.5 rounded-2xl border-primary-100/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-2 sm:p-3 space-y-1 sm:space-y-2">
            {searchQuery.trim() ? (
              <>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 px-2">نتائج البحث</p>
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((userResult) => (
                    <div
                      key={userResult._id}
                      onClick={() => handleStartChat(userResult)}
                      className="p-3 sm:p-4 rounded-xl sm:rounded-2xl flex gap-3 sm:gap-4 cursor-pointer hover:bg-primary-50 border border-transparent hover:border-primary-100 transition-all group"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-black shrink-0">
                        {userResult.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">{userResult.name}</h4>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase truncate">{userResult.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 font-bold text-sm">
                    لا يوجد نتائج
                  </div>
                )}
              </>
            ) : conversations.length > 0 ? (
              conversations.map((chat) => (
                <div
                  key={chat.conversationId}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl flex gap-3 sm:gap-4 cursor-pointer transition-all duration-300 group ${
                    activeChat?.conversationId === chat.conversationId 
                      ? 'bg-primary-600 text-white shadow-glow' 
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl font-black shadow-inner ${
                      activeChat?.conversationId === chat.conversationId ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {chat.otherUserName?.charAt(0) || 'م'}
                    </div>
                    {onlineUsers.includes(chat.otherUserId) && (
                      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5 sm:mb-1">
                      <h4 className="font-black text-sm sm:text-base truncate">
                        {chat.otherUserName || `مستخدم #${chat.otherUserId.slice(-4)}`}
                      </h4>
                      <span className={`text-[8px] sm:text-[10px] font-bold shrink-0 ${activeChat?.conversationId === chat.conversationId ? 'text-white/70' : 'text-slate-400'}`}>
                        {chat.lastMessage ? new Date(chat.lastMessage.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className={`text-[10px] sm:text-xs truncate font-medium ${activeChat?.conversationId === chat.conversationId ? 'text-white/80' : 'text-slate-500'}`}>
                      {chat.lastMessage?.message || 'لا توجد رسائل'}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="bg-accent text-white text-[9px] sm:text-[10px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-glow shrink-0">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <FiMessageSquare size={24} />
                </div>
                <p className="text-slate-400 font-bold text-xs sm:text-sm">لا توجد محادثات</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Main Area */}
        <div className={`flex-1 premium-glass-panel overflow-hidden flex flex-col animate-slide-up transition-all duration-700 rounded-[2.5rem] shadow-premium ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`} style={{ animationDelay: '0.1s' }}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 sm:p-7 bg-white/60 border-b border-primary-100/10 flex justify-between items-center backdrop-blur-2xl relative z-10 shadow-sm">
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                  <button 
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-2.5 text-slate-500 hover:bg-primary-50 rounded-xl transition-all border border-transparent hover:border-primary-100"
                  >
                    <FiArrowRight size={24} className="rotate-0" />
                  </button>
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.2rem] sm:rounded-[1.5rem] bg-gradient-to-br from-primary-600 to-accent flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-glow-sm luxury-border">
                      {activeChat.otherUserName?.charAt(0) || 'م'}
                    </div>
                    {onlineUsers.includes(activeChat.otherUserId) && (
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-base sm:text-xl truncate tracking-tight">
                      {activeChat.otherUserName || `مستخدم #${activeChat.otherUserId.slice(-4)}`}
                    </h4>
                    <p className={`text-[10px] sm:text-xs font-black flex items-center gap-1.5 uppercase tracking-[0.2em] ${onlineUsers.includes(activeChat.otherUserId) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {onlineUsers.includes(activeChat.otherUserId) ? <><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-sm"></span> متصل الآن</> : 'غير متصل'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button className="hidden sm:flex p-3 text-slate-400 hover:text-primary-600 hover:bg-white rounded-[1rem] transition-all border border-transparent hover:border-primary-100/20 shadow-sm">
                    <FiActivity size={22} />
                  </button>
                  <button className="p-3 text-slate-400 hover:text-primary-600 hover:bg-white rounded-[1rem] transition-all border border-transparent hover:border-primary-100/20 shadow-sm">
                    <FiMoreVertical size={22} />
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-6 sm:space-y-8 bg-slate-50/20 scrollbar-hide bg-pattern-dots">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.senderId === user.id ? 'justify-start' : 'justify-end'} animate-scale-in`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[70%] p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2.5rem] text-sm sm:text-lg font-bold shadow-sm transition-all hover:shadow-premium-xl group ${
                      msg.senderId === user.id 
                        ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-tr-none shadow-glow-primary' 
                        : 'bg-white text-slate-700 border border-primary-100/20 rounded-tl-none premium-card p-5'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <div className={`text-[9px] sm:text-xs mt-3 sm:mt-4 font-black uppercase tracking-[0.2em] ${msg.senderId === user.id ? 'text-white/60' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-center py-6">
                    <LoadingSpinner size="md" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Area */}
              <div className="p-4 sm:p-8 bg-white/60 backdrop-blur-2xl border-t border-primary-100/10 relative z-10">
                <form onSubmit={handleSendMessage} className="flex gap-3 sm:gap-6 items-center max-w-5xl mx-auto">
                  <div className="flex gap-2 sm:gap-3">
                    <button type="button" className="p-3 text-slate-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-primary-100/20">
                      <FiPaperclip size={24} />
                    </button>
                  </div>
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك بذكاء..."
                      className="w-full premium-input bg-white py-4 sm:py-5 px-6 sm:px-8 rounded-2xl sm:rounded-3xl border-primary-100/20 text-sm sm:text-lg focus:shadow-glow-primary transition-all duration-500"
                    />
                    <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 p-2 rounded-lg transition-all">
                      <FiSmile size={22} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-r from-primary-600 to-accent text-white rounded-2xl sm:rounded-3xl shadow-glow-lg magnetic-lift hover:scale-110 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all shrink-0"
                  >
                    <FiSend size={24} className="rotate-180" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
              <div className="blur-circle w-[400px] h-[400px] bg-primary-500/5 -top-20 -right-20"></div>
              <div className="w-24 h-24 sm:w-40 sm:h-40 bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-premium flex items-center justify-center mb-10 animate-float relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 group-hover:opacity-20 transition-opacity"></div>
                <FiMessageSquare className="text-primary-600 text-5xl sm:text-7xl relative z-10 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-2xl sm:text-4xl font-black premium-gradient-text mb-6 tracking-tight">ابدأ تواصلك المهني الراقي</h3>
              <p className="text-slate-500 text-base sm:text-xl max-w-lg font-bold leading-relaxed opacity-80">
                اختر محادثة من القائمة الجانبية أو ابحث عن مستخدمين جدد لبناء شبكة علاقاتك المهنية القوية في بيئة تليق بذكائك.
              </p>
              <div className="mt-12 flex gap-4">
                <div className="px-8 py-4 premium-glass-panel rounded-2xl text-primary-600 font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-sm border border-primary-100/30">
                  تشفير تام ومعايير أمان عالمية
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

