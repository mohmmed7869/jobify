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
    <div className="fixed inset-0 bg-gray-50" style={{ paddingTop: '56px' }} dir="rtl">
      <div className="h-full w-full flex">
        {/* Sidebar - قائمة المحادثات */}
        <div className={`${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 h-full flex-col bg-white border-l border-slate-100 overflow-hidden`}>
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-slate-900">الرسائل</h2>
              <button className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 transition-all border border-slate-100">
                <FiSettings size={16} />
              </button>
            </div>
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim() ? (
              <div className="p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">نتائج البحث</p>
                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((userResult) => (
                    <div
                      key={userResult._id}
                      onClick={() => handleStartChat(userResult)}
                      className="p-3 rounded-xl flex gap-3 cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div className="w-11 h-11 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-black text-lg shrink-0">
                        {userResult.name?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <h4 className="font-black text-slate-900 text-sm truncate">{userResult.name}</h4>
                        <p className="text-xs text-slate-500 font-medium truncate">{userResult.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 font-bold text-sm">لا يوجد نتائج</div>
                )}
              </div>
            ) : conversations.length > 0 ? (
              <div className="p-2">
                {conversations.map((chat) => (
                  <div
                    key={chat.conversationId}
                    onClick={() => handleSelectChat(chat)}
                    className={`p-3 rounded-xl flex gap-3 cursor-pointer transition-all mb-1 ${
                      activeChat?.conversationId === chat.conversationId
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black ${
                        activeChat?.conversationId === chat.conversationId ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {chat.otherUserName?.charAt(0) || 'م'}
                      </div>
                      {onlineUsers.includes(chat.otherUserId) && (
                        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-black text-sm truncate">
                          {chat.otherUserName || `مستخدم ${chat.otherUserId?.slice(-4)}`}
                        </h4>
                        <span className={`text-[10px] font-bold shrink-0 mr-1 ${
                          activeChat?.conversationId === chat.conversationId ? 'text-white/70' : 'text-slate-400'
                        }`}>
                          {chat.lastMessage ? new Date(chat.lastMessage.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate font-medium ${
                        activeChat?.conversationId === chat.conversationId ? 'text-white/80' : 'text-slate-500'
                      }`}>
                        {chat.lastMessage?.message || 'لا توجد رسائل'}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 self-center">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <FiMessageSquare size={28} />
                </div>
                <p className="text-slate-400 font-bold text-sm">لا توجد محادثات بعد</p>
                <p className="text-slate-300 font-medium text-xs mt-1">ابحث عن شخص ما لبدء محادثة</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Main Area */}
        <div className={`${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        } flex-1 h-full flex-col bg-white overflow-hidden`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 bg-white border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <button 
                    onClick={() => { setMobileView('list'); setActiveChat(null); }}
                    className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <FiArrowRight size={22} />
                  </button>
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md">
                      {activeChat.otherUserName?.charAt(0) || 'م'}
                    </div>
                    {onlineUsers.includes(activeChat.otherUserId) && (
                      <div className="absolute bottom-0 left-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-slate-900 text-sm sm:text-base truncate">
                      {activeChat.otherUserName || `مستخدم #${activeChat.otherUserId?.slice(-4)}`}
                    </h4>
                    <p className={`text-xs font-bold flex items-center gap-1 ${
                      onlineUsers.includes(activeChat.otherUserId) ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {onlineUsers.includes(activeChat.otherUserId)
                        ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> متصل الآن</>
                        : 'غير متصل'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-xl transition-all">
                    <FiMoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 bg-gray-50">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.senderId === user.id ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm ${
                      msg.senderId === user.id 
                        ? 'bg-primary-600 text-white rounded-tr-sm' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.message}</p>
                      <div className={`text-[10px] mt-1 font-bold ${
                        msg.senderId === user.id ? 'text-white/60' : 'text-slate-400'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Area */}
              <div className="p-3 sm:p-5 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-4 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك..."
                      className="w-full bg-gray-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md hover:scale-105 active:scale-95 disabled:opacity-40 disabled:grayscale transition-all shrink-0"
                  >
                    <FiSend size={18} className="rotate-180" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                <FiMessageSquare className="text-primary-400" size={32} />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">ابدأ محادثة</h3>
              <p className="text-slate-400 font-medium text-sm max-w-xs">
                اختر محادثة من القائمة أو ابحث عن شخص لبدء التواصل
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

