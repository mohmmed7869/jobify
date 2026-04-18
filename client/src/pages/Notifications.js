import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBell, FiCheck, FiTrash2, FiClock, FiCheckCircle, 
  FiMessageSquare, FiBriefcase, FiZap, FiSettings, FiArrowRight
} from 'react-icons/fi';
import { formatRelativeTime } from '../utils/dateUtils';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
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
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('فشل في تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      toast.success('تم تحديد الكل كمقروء');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('فشل في تحديث الحالة');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(notifications.filter(notif => notif._id !== id));
      toast.success('تم حذف الإشعار');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('فشل في حذف الإشعار');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'application': return <FiBriefcase className="text-blue-500" />;
      case 'chat': return <FiMessageSquare className="text-emerald-500" />;
      case 'system': return <FiSettings className="text-slate-500" />;
      case 'match': return <FiZap className="text-amber-500" />;
      default: return <FiBell className="text-primary-500" />;
    }
  };

  return (
    <div className="min-h-screen luxury-aura pt-24 pb-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black themed-text flex items-center gap-3">
              <FiBell className="text-primary-500" /> الإشعارات
            </h1>
            <p className="themed-text-sec font-bold opacity-70 mt-2">ابقَ على اطلاع بكل جديد في رحلتك المهنية</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={markAllAsRead}
              className="px-6 py-3 glass-premium themed-text font-black text-sm rounded-2xl border themed-border hover:bg-primary-500/10 transition-all flex items-center gap-2"
            >
              <FiCheckCircle /> تحديد الكل كمقروء
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="glass-premium p-12 text-center rounded-3xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <p className="themed-text-sec font-black">جاري تحميل الإشعارات...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="glass-premium p-16 text-center rounded-3xl border-dashed border-2 themed-border">
              <div className="w-20 h-20 bg-primary-500/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiBell className="text-5xl themed-text-ter opacity-30" />
              </div>
              <h2 className="text-2xl font-black themed-text mb-2">لا توجد إشعارات</h2>
              <p className="themed-text-sec font-bold opacity-60 mb-8">عندما تتلقى إشعارات جديدة، ستظهر هنا</p>
              <Link to="/jobs" className="btn-formal-primary px-8 py-3 inline-flex items-center gap-2">
                تصفح الوظائف <FiArrowRight />
              </Link>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification._id}
                className={`glass-premium p-5 md:p-6 rounded-3xl border themed-border transition-all relative overflow-hidden group ${!notification.read ? 'bg-primary-500/5 border-r-4 border-r-primary-500' : ''}`}
              >
                <div className="flex gap-4 md:gap-6">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl ${!notification.read ? 'bg-primary-500/10' : 'bg-themed-bg-sec'} border themed-border`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h3 className={`text-lg md:text-xl font-black ${!notification.read ? 'themed-text' : 'themed-text-sec opacity-80'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs themed-text-ter font-bold flex items-center gap-1.5">
                        <FiClock /> {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="themed-text-sec font-medium leading-relaxed md:text-lg mb-4 opacity-80">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4">
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification._id)}
                          className="text-xs font-black text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
                        >
                          <FiCheck /> تحديد كمقروء
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notification._id)}
                        className="text-xs font-black text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                      >
                        <FiTrash2 /> حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
