import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiBell, FiCheck, FiTrash2, FiClock } from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/dateUtils';

const NotificationDropdown = ({ socket }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      if (socket) socket.off('new_notification');
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => 
      n._id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await axios.put(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on failure
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, read: false } : n
      ));
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id); // Don't await, do it optimistically
    }
    const path = notification.route || notification.link;
    if (path) {
      setIsOpen(false);
      navigate(path);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      const n = notifications.find(notif => notif._id === id);
      if (n && !n.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-themed-text-sec hover:bg-primary-500/10 rounded-xl transition-all"
      >
        <FiBell className="text-xl md:text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-themed-bg animate-bounce-slow">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-3 w-80 md:w-96 glass-premium rounded-2xl md:rounded-3xl shadow-glow-lg border themed-border z-50 overflow-hidden animate-scale-up origin-top-left">
            <div className="p-4 border-b themed-border flex justify-between items-center bg-primary-500/5">
              <h3 className="font-black themed-text flex items-center gap-2">
                <FiBell className="text-primary-500" /> الإشعارات
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] md:text-xs font-black text-primary-600 hover:underline flex items-center gap-1"
                >
                  <FiCheck /> تحديد الكل كمقروء
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center themed-text-sec font-bold opacity-60">جاري التحميل...</div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-primary-500/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBell className="text-3xl themed-text-ter opacity-30" />
                  </div>
                  <p className="themed-text-sec font-bold opacity-60">لا يوجد إشعارات جديدة</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b themed-border transition-all cursor-pointer group hover:bg-primary-500/5 ${!notification.read ? 'bg-primary-500/10 border-r-4 border-r-primary-500' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${!notification.read ? 'bg-primary-500' : 'bg-transparent'}`}></span>
                          <h4 className={`text-sm font-black ${!notification.read ? 'themed-text' : 'themed-text-sec opacity-80'}`}>
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-xs themed-text-sec opacity-70 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] themed-text-ter font-bold">
                          <FiClock className="text-primary-500" />
                          {formatRelativeTime(notification.createdAt)}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => deleteNotification(e, notification._id)}
                        className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="block p-4 text-center text-sm font-black text-primary-600 bg-primary-500/5 hover:bg-primary-500/10 transition-colors"
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
