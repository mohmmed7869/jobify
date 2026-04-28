import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../utils/fileUrl';
import {
  FiSend, FiSearch, FiMessageSquare, FiArrowRight,
  FiMoreVertical, FiX, FiHome, FiEdit
} from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

// ================================================================
// مكون عنصر المحادثة
// ================================================================
const ConversationItem = ({ chat, isActive, isOnline, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 group ${
      isActive
        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20'
        : 'hover:bg-white/5'
    }`}
  >
    <div className="relative shrink-0">
      {chat.otherUserAvatar ? (
        <img
          src={getFileUrl(chat.otherUserAvatar)}
          alt={chat.otherUserName}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
          isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300'
        }`}
        style={{ display: chat.otherUserAvatar ? 'none' : 'flex' }}
      >
        {chat.otherUserName?.charAt(0)?.toUpperCase() || '؟'}
      </div>
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center gap-1">
        <span className={`font-black text-sm truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
          {chat.otherUserName || 'مستخدم'}
        </span>
        {chat.lastMessage?.timestamp && (
          <span className={`text-[10px] font-bold shrink-0 ${isActive ? 'text-white/60' : 'text-slate-500'}`}>
            {new Date(chat.lastMessage.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <p className={`text-xs truncate font-medium mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
        {chat.lastMessage?.message || 'ابدأ المحادثة...'}
      </p>
    </div>
    {chat.unreadCount > 0 && (
      <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">
        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
      </div>
    )}
  </div>
);

// ================================================================
// مكون فقاعة الرسالة
// ================================================================
const MessageBubble = ({ msg, myId }) => {
  const isMine = msg.senderId === myId || msg.senderId?._id === myId;
  const time = msg.timestamp || msg.createdAt;
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3 px-2`}>
      <div className={`max-w-[75%] sm:max-w-[60%] group ${msg.isTemp ? 'opacity-60' : ''}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm font-medium break-words leading-relaxed ${
          isMine
            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20'
            : 'bg-white/8 text-slate-200 rounded-bl-sm border border-white/10 backdrop-blur-sm'
        }`}>
          {msg.message}
        </div>
        {time && (
          <p className={`text-[10px] mt-1 font-bold px-1 ${isMine ? 'text-right text-slate-500' : 'text-left text-slate-500'}`}>
            {new Date(time).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

// ================================================================
// مكون بحث المستخدم
// ================================================================
const UserSearchItem = ({ u, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all"
  >
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-300 flex items-center justify-center font-black text-base shrink-0 border border-white/10">
      {u.name?.charAt(0)?.toUpperCase()}
    </div>
    <div className="min-w-0">
      <p className="font-black text-slate-200 text-sm truncate">{u.name}</p>
      <p className="text-xs text-slate-500 font-medium capitalize">{u.role}</p>
    </div>
  </div>
);

// ================================================================
// المكون الرئيسي
// ================================================================
const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileView, setMobileView] = useState('list');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const activeChatRef = useRef(null);

  const myId = user?._id || user?.id;

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // جلب المحادثات
  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get('/api/chat/conversations');
      if (res.data.success) setConversations(res.data.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, []);

  useEffect(() => {
    if (myId) fetchConversations();
  }, [myId, fetchConversations]);

  // بحث المستخدمين
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await axios.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) setSearchResults(res.data.data.filter(u => u._id !== myId));
      } catch { } finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, myId]);

  // فتح محادثة
  const openChat = useCallback((chat) => {
    setActiveChat(chat);
    setMobileView('chat');
    if (!chat.isTemp) fetchChatMessages(chat.otherUserId);
    else setMessages([]);
  }, []); // eslint-disable-line

  const fetchChatMessages = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/chat/conversation/${userId}`);
      if (res.data.success) {
        setMessages(res.data.data.map(m => ({
          ...m,
          senderId: m.senderId?._id || m.senderId || m.sender?._id || m.sender,
        })));
      }
    } catch { toast.error('خطأ في تحميل الرسائل'); }
    finally { setLoading(false); }
  };

  const handleStartChat = (otherUser) => {
    const existing = conversations.find(c => c.otherUserId === otherUser._id);
    if (existing) { openChat(existing); }
    else {
      openChat({
        conversationId: [myId, otherUser._id].sort().join('-'),
        otherUserId: otherUser._id,
        otherUserName: otherUser.name,
        isTemp: true,
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Socket
  useEffect(() => {
    if (!socket) return;
    const handleNewMsg = (msg) => {
      const normalized = {
        ...msg,
        senderId: msg.senderId?._id || msg.senderId || msg.sender?._id || msg.sender,
      };
      const current = activeChatRef.current;
      if (current && (normalized.senderId === current.otherUserId)) {
        setMessages(prev => {
          if (prev.some(m => m._id && m._id === normalized._id)) return prev;
          return [...prev, normalized];
        });
      }
      fetchConversations();
    };
    socket.on('new_message', handleNewMsg);
    return () => socket.off('new_message', handleNewMsg);
  }, [socket, fetchConversations]);

  // URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId') || params.get('user');
    const userName = params.get('userName');
    if (userId && myId && userId !== myId) {
      const existing = conversations.find(c => c.otherUserId === userId);
      if (existing) openChat(existing);
      else openChat({ conversationId: [myId, userId].sort().join('-'), otherUserId: userId, otherUserName: userName || 'مستخدم', isTemp: true });
    }
  }, [location.search, myId]); // eslint-disable-line

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // إرسال رسالة
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tempMsg = {
      _id: `temp-${Date.now()}`,
      senderId: myId,
      message: newMessage,
      timestamp: new Date(),
      isTemp: true,
    };
    setMessages(prev => [...prev, tempMsg]);
    const msgText = newMessage;
    setNewMessage('');
    inputRef.current?.focus();

    try {
      const res = await axios.post('/api/chat/send', {
        recipientId: activeChat.otherUserId,
        message: msgText,
      });
      if (res.data.success) {
        const real = {
          ...res.data.data,
          senderId: res.data.data.senderId?._id || res.data.data.senderId || res.data.data.sender?._id || myId,
          timestamp: res.data.data.createdAt || new Date(),
        };
        setMessages(prev => prev.map(m => m._id === tempMsg._id ? real : m));
        fetchConversations();
      }
    } catch {
      toast.error('فشل إرسال الرسالة');
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
    }
  };

  const isOtherOnline = activeChat && onlineUsers?.includes(activeChat.otherUserId);

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #141432 50%, #0d0d2b 100%)' }}
      dir="rtl"
    >
      {/* ===== شريط التنقل العلوي ===== */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 h-16 border-b border-white/5 bg-white/3 backdrop-blur-xl z-30">
        {/* زر العودة للرئيسية */}
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <FiHome size={18} />
        </button>

        {/* موبايل: عودة للقائمة أو عنوان المحادثة */}
        <div className="md:hidden flex items-center gap-3 flex-1 min-w-0">
          {mobileView === 'chat' && activeChat ? (
            <>
              <button
                onClick={() => setMobileView('list')}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <FiArrowRight size={18} />
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-sm">
                    {activeChat.otherUserName?.charAt(0)?.toUpperCase() || '؟'}
                  </div>
                  {isOtherOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-white text-sm truncate">{activeChat.otherUserName}</p>
                  <p className={`text-[10px] font-bold ${isOtherOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isOtherOnline ? '● متصل الآن' : '○ غير متصل'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                <FaRobot size={14} className="text-white" />
              </div>
              <span className="font-black text-white text-base">الرسائل</span>
            </>
          )}
        </div>

        {/* ديسكتوب: عنوان الصفحة */}
        <div className="hidden md:flex items-center gap-3 flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FiMessageSquare size={16} className="text-white" />
          </div>
          <span className="font-black text-white text-lg">الرسائل</span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-black">مباشر</span>
          </div>
        </div>

        <button
          onClick={() => setSearchQuery('')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          title="محادثة جديدة"
        >
          <FiEdit size={16} />
        </button>
      </div>

      {/* ===== المحتوى الرئيسي ===== */}
      <div className="flex flex-1 overflow-hidden">

        {/* ===== الشريط الجانبي ===== */}
        <aside
          className={`flex-shrink-0 flex flex-col border-l border-white/5 overflow-hidden transition-all
            ${mobileView === 'chat' ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80'}
          `}
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {/* حقل البحث */}
          <div className="px-4 py-4 flex-shrink-0 border-b border-white/5">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="text"
                placeholder="ابحث عن مستخدم..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* القائمة */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {searchQuery.trim().length >= 2 ? (
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 px-2">نتائج البحث</p>
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <UserSearchItem key={u._id} u={u} onClick={() => handleStartChat(u)} />
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-600 font-bold py-8">لا توجد نتائج</p>
                )}
              </div>
            ) : conversations.length > 0 ? (
              <>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 px-2">المحادثات</p>
                {conversations.map(chat => (
                  <ConversationItem
                    key={chat.conversationId}
                    chat={chat}
                    isActive={activeChat?.conversationId === chat.conversationId}
                    isOnline={onlineUsers?.includes(chat.otherUserId)}
                    onClick={() => openChat(chat)}
                  />
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                  <FiMessageSquare size={28} className="text-slate-600" />
                </div>
                <p className="font-black text-slate-500 text-sm mb-1">لا توجد محادثات بعد</p>
                <p className="text-xs text-slate-700 font-medium">ابحث عن مستخدم لبدء محادثة</p>
              </div>
            )}
          </div>
        </aside>

        {/* ===== منطقة الرسائل ===== */}
        <main
          className={`flex-1 flex flex-col overflow-hidden min-w-0
            ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
          `}
        >
          {activeChat ? (
            <>
              {/* رأس المحادثة - ديسكتوب */}
              <div className="hidden md:flex flex-shrink-0 items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {activeChat.otherUserAvatar ? (
                      <img
                        src={getFileUrl(activeChat.otherUserAvatar)}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-lg shadow-lg"
                      style={{ display: activeChat.otherUserAvatar ? 'none' : 'flex' }}
                    >
                      {activeChat.otherUserName?.charAt(0)?.toUpperCase() || '؟'}
                    </div>
                    {isOtherOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-white text-base">{activeChat.otherUserName}</p>
                    <p className={`text-xs font-bold ${isOtherOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isOtherOnline ? '● متصل الآن' : '○ غير متصل'}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-white/5 transition-all">
                  <FiMoreVertical size={20} />
                </button>
              </div>

              {/* منطقة الرسائل */}
              <div className="flex-1 overflow-y-auto py-6" style={{ background: 'rgba(0,0,0,0.1)' }}>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
                      <FiMessageSquare size={28} className="text-indigo-400" />
                    </div>
                    <p className="font-black text-slate-400 text-sm">لا توجد رسائل بعد</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">ابدأ المحادثة الآن!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <MessageBubble key={msg._id || i} msg={msg} myId={myId} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* حقل الإرسال */}
              <div className="flex-shrink-0 px-4 py-4 border-t border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95"
                  >
                    <FiSend size={16} className="rotate-180" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* شاشة البداية */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                <FiMessageSquare size={40} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">ابدأ محادثة</h3>
              <p className="text-slate-500 text-sm font-medium max-w-xs leading-relaxed">
                اختر محادثة من القائمة أو ابحث عن مستخدم لبدء التواصل
              </p>
              <div className="mt-8 flex items-center gap-3 px-5 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                <span className="text-indigo-400 text-xs font-black">
                  {onlineUsers?.length || 0} مستخدم متصل الآن
                </span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
