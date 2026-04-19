import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { getFileUrl } from '../utils/fileUrl';
import {
  FiSend, FiSearch, FiMessageSquare, FiArrowRight,
  FiMoreVertical, FiSettings, FiX
} from 'react-icons/fi';

// ================================================================
// يجب أن تكون هذه المكونات خارج Chat لمنع re-mount عند كل render
// ================================================================

const ConversationItem = ({ chat, isActive, isOnline, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
      isActive ? 'bg-primary-600 text-white' : 'hover:bg-slate-50 active:bg-slate-100'
    }`}
  >
    <div className="relative shrink-0">
      {chat.otherUserAvatar ? (
        <img
          src={getFileUrl(chat.otherUserAvatar)}
          alt={chat.otherUserName}
          className="w-12 h-12 rounded-full object-cover"
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
      }`} style={{ display: chat.otherUserAvatar ? 'none' : 'flex' }}>
        {chat.otherUserName?.charAt(0) || '؟'}
      </div>
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center gap-1">
        <span className={`font-black text-sm truncate ${!isActive && 'text-slate-900'}`}>
          {chat.otherUserName || 'مستخدم'}
        </span>
        {chat.lastMessage?.timestamp && (
          <span className={`text-[10px] font-bold shrink-0 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
            {new Date(chat.lastMessage.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <p className={`text-xs truncate font-medium mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
        {chat.lastMessage?.message || 'ابدأ المحادثة...'}
      </p>
    </div>
    {chat.unreadCount > 0 && (
      <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
      </div>
    )}
  </div>
);

const MessageBubble = ({ msg, myId }) => {
  const isMine = msg.senderId === myId || msg.senderId?._id === myId;
  const time = msg.timestamp || msg.createdAt;
  return (
    <div className={`flex ${isMine ? 'justify-start' : 'justify-end'} mb-2 px-1`}>
      <div className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl text-sm font-medium break-words ${
        isMine
          ? 'bg-primary-600 text-white rounded-tr-sm'
          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-sm'
      } ${msg.isTemp ? 'opacity-60' : ''}`}>
        <p className="leading-relaxed">{msg.message}</p>
        {time && (
          <p className={`text-[10px] mt-1 font-bold ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
            {new Date(time).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

const UserSearchItem = ({ u, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-all"
  >
    <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-black text-base shrink-0">
      {u.name?.charAt(0)?.toUpperCase()}
    </div>
    <div className="min-w-0">
      <p className="font-black text-slate-900 text-sm truncate">{u.name}</p>
      <p className="text-xs text-slate-400 font-medium capitalize">{u.role}</p>
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

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const activeChatRef = useRef(null); // لتجنب stale closure في socket

  const myId = user?._id || user?.id;

  // تزامن activeChat مع الـ ref
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // ======= جلب المحادثات =======
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

  // ======= بحث المستخدمين =======
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

  // ======= فتح المحادثة =======
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

  // ======= Socket =======
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

  // ======= URL params =======
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

  // ======= Auto scroll =======
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ======= إرسال رسالة =======
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

  const goBackToList = () => { setMobileView('list'); };

  // ================================================================
  // الواجهة
  // ================================================================
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col" style={{ top: 0, bottom: 0, left: 0, right: 0, zIndex: 10 }} dir="rtl">

      {/* ======= رأس الموبايل ======= */}
      <div className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-100 z-30">
        {mobileView === 'chat' && activeChat ? (
          <>
            <button
              onClick={goBackToList}
              className="p-2 -mr-1 text-slate-600 active:bg-slate-100 rounded-xl"
            >
              <FiArrowRight size={22} />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                {activeChat.otherUserName?.charAt(0)?.toUpperCase() || '؟'}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-sm truncate">{activeChat.otherUserName}</p>
                <p className={`text-[10px] font-bold ${onlineUsers?.includes(activeChat.otherUserId) ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {onlineUsers?.includes(activeChat.otherUserId) ? 'متصل الآن' : 'غير متصل'}
                </p>
              </div>
            </div>
            <button className="p-2 text-slate-400"><FiMoreVertical size={18} /></button>
          </>
        ) : (
          <>
            <img src="/logo.png" alt="Jobify" className="w-7 h-7 object-contain" />
            <span className="font-black text-slate-900 text-base">الرسائل</span>
            <div className="flex-1" />
            <button className="p-2 text-slate-400"><FiSettings size={18} /></button>
          </>
        )}
      </div>

      {/* ======= محتوى الصفحة ======= */}
      <div className="flex flex-1 overflow-hidden">

        {/* ======= الشريط الجانبي ======= */}
        <aside
          className={`flex-shrink-0 flex flex-col bg-white border-l border-slate-100 overflow-hidden transition-all
            ${mobileView === 'chat' ? 'hidden md:flex md:w-80 lg:w-96' : 'flex w-full md:w-80 lg:w-96'}
          `}
        >
          {/* رأس ديسكتوب */}
          <div className="hidden md:flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-xl font-black text-slate-900">الرسائل</h2>
            <button className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all">
              <FiSettings size={15} />
            </button>
          </div>

          {/* البحث */}
          <div className="px-3 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="ابحث عن مستخدم..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* القائمة */}
          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim().length >= 2 ? (
              <div className="p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">نتائج البحث</p>
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <UserSearchItem key={u._id} u={u} onClick={() => handleStartChat(u)} />
                  ))
                ) : (
                  <p className="text-center text-sm text-slate-400 font-bold py-8">لا توجد نتائج</p>
                )}
              </div>
            ) : conversations.length > 0 ? (
              <div className="p-2 space-y-1">
                {conversations.map(chat => (
                  <ConversationItem
                    key={chat.conversationId}
                    chat={chat}
                    isActive={activeChat?.conversationId === chat.conversationId}
                    isOnline={onlineUsers?.includes(chat.otherUserId)}
                    onClick={() => openChat(chat)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                  <FiMessageSquare size={28} />
                </div>
                <p className="font-black text-slate-600 text-sm mb-1">لا توجد محادثات بعد</p>
                <p className="text-xs text-slate-400 font-medium">ابحث عن مستخدم لبدء محادثة</p>
              </div>
            )}
          </div>
        </aside>

        {/* ======= منطقة الرسائل ======= */}
        <main
          className={`flex-1 flex flex-col bg-white overflow-hidden min-w-0
            ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
          `}
        >
          {activeChat ? (
            <>
              {/* رأس ديسكتوب فقط */}
              <div className="hidden md:flex flex-shrink-0 items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {activeChat.otherUserAvatar ? (
                      <img 
                        src={getFileUrl(activeChat.otherUserAvatar)}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 text-white flex items-center justify-center font-black text-lg"
                         style={{ display: activeChat.otherUserAvatar ? 'none' : 'flex' }}>
                      {activeChat.otherUserName?.charAt(0)?.toUpperCase() || '؟'}
                    </div>
                    {onlineUsers?.includes(activeChat.otherUserId) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-base">{activeChat.otherUserName}</p>
                    <p className={`text-xs font-bold ${onlineUsers?.includes(activeChat.otherUserId) ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {onlineUsers?.includes(activeChat.otherUserId) ? 'متصل الآن' : 'غير متصل'}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-primary-600 rounded-xl hover:bg-slate-50 transition-all">
                  <FiMoreVertical size={20} />
                </button>
              </div>

              {/* الرسائل */}
              <div className="flex-1 overflow-y-auto py-4 bg-slate-50/30">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-3 text-primary-400">
                      <FiMessageSquare size={24} />
                    </div>
                    <p className="font-black text-slate-600 text-sm">لا توجد رسائل بعد</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">ابدأ المحادثة الآن!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <MessageBubble key={msg._id || i} msg={msg} myId={myId} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* حقل الإرسال */}
              <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition-all"
                  >
                    <FiSend size={15} className="rotate-180" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mb-5 text-primary-400">
                <FiMessageSquare size={36} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">ابدأ محادثة</h3>
              <p className="text-slate-400 text-sm font-medium max-w-xs leading-relaxed">
                اختر محادثة من القائمة أو ابحث عن مستخدم لبدء التواصل
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
