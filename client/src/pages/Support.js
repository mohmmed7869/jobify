import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaHeadset, FaPaperPlane, FaClock, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      const res = await axios.get('/api/support/my-tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (error) {
      toast.error('فشل في تحميل تذاكر الدعم');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSending(true);
    try {
      const res = await axios.post('/api/support/tickets', { subject, message });
      if (res.data.success) {
        toast.success('تم إرسال طلبك بنجاح. سنرد عليك في أقرب وقت.');
        setSubject('');
        setMessage('');
        fetchMyTickets();
      }
    } catch (error) {
      toast.error('فشل في إرسال الطلب');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-themed-bg animate-fade-in">
      <div className="formal-container max-w-5xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-primary-600 p-3 rounded-2xl text-themed-on-primary shadow-glow rotate-3">
            <FaHeadset size={30} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-themed-text tracking-tight">مركز الدعم الفني</h1>
            <p className="text-themed-text-sec font-medium">نحن هنا لمساعدتك في أي وقت</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* New Ticket Form */}
          <div className="formal-card p-8 hover:translate-y-0">
            <h2 className="text-xl font-black text-themed-text mb-6 flex items-center gap-2">
              <FaPaperPlane className="text-primary-600" /> إرسال طلب جديد
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-themed-text-ter uppercase tracking-widest">عنوان الموضوع</label>
                <input
                  type="text"
                  className="formal-input w-full"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثلاً: مشكلة في رفع السيرة الذاتية"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-themed-text-ter uppercase tracking-widest">تفاصيل الرسالة</label>
                <textarea
                  className="formal-textarea w-full"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اشرح لنا المشكلة بالتفصيل..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="btn-formal-primary w-full"
              >
                {sending ? 'جاري الإرسال...' : 'إرسال الطلب الآن'}
              </button>
            </form>
          </div>

          {/* Previous Tickets */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-themed-text mb-6 flex items-center gap-2">
              <FaClock className="text-accent" /> طلباتي السابقة
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="loading-spinner w-10 h-10"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="formal-card p-10 text-center border-dashed border-2 border-primary-100">
                <FaInfoCircle className="mx-auto text-primary-200 mb-4" size={40} />
                <p className="text-themed-text-sec font-bold">لا توجد طلبات سابقة</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {tickets.map(ticket => (
                  <div key={ticket._id} className="formal-card p-5 hover:border-primary-400 transition-all group hover:translate-y-0">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-themed-text group-hover:text-primary-600 transition-colors">{ticket.subject}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        ticket.status === 'resolved' ? 'badge-success' : 
                        ticket.status === 'open' ? 'badge-error' : 'badge-warning'
                      }`}>
                        {ticket.status === 'resolved' ? 'تم الحل' : ticket.status === 'open' ? 'انتظار' : 'قيد المعالجة'}
                      </span>
                    </div>
                    <p className="text-xs text-themed-text-sec mb-4 line-clamp-2">{ticket.message}</p>
                    
                    {ticket.replies.length > 0 && (
                      <div className="bg-primary-50 p-3 rounded-xl border border-primary-100 mb-4">
                        <p className="text-[10px] font-black text-primary-600 uppercase mb-1 flex items-center gap-1">
                          <FaCheckCircle /> رد الدعم الفني:
                        </p>
                        <p className="text-xs text-themed-text-sec italic">"{ticket.replies[ticket.replies.length - 1].message}"</p>
                      </div>
                    )}
                    
                    <div className="text-[10px] font-bold text-themed-text-ter flex items-center gap-2">
                      <FaClock /> {new Date(ticket.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
