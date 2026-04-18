import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaHeadset, FaReply, FaCheckCircle, FaExclamationCircle, FaUser, FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/admin/tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (error) {
      toast.error('فشل في تحميل التذاكر');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    setSending(true);
    try {
      const res = await axios.post(`/api/admin/tickets/${selectedTicket._id}/reply`, {
        message: reply,
        status: 'resolved'
      });
      if (res.data.success) {
        toast.success('تم إرسال الرد بنجاح');
        setReply('');
        fetchTickets();
        setSelectedTicket(null);
      }
    } catch (error) {
      toast.error('فشل في إرسال الرد');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-red-100 text-red-600',
      in_progress: 'bg-amber-100 text-amber-600',
      resolved: 'bg-green-100 text-green-600',
      closed: 'bg-slate-100 text-slate-600'
    };
    const labels = {
      open: 'جديدة',
      in_progress: 'قيد المعالجة',
      resolved: 'تم الحل',
      closed: 'مغلقة'
    };
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badges[status]}`}>{labels[status]}</span>;
  };

  if (loading) return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-accent p-3 rounded-xl text-white shadow-glow">
          <FaHeadset size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">مركز خدمة العملاء</h1>
          <p className="text-slate-500 text-sm">إدارة استفسارات المستخدمين والرد على تذاكر الدعم</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          {tickets.length === 0 ? (
            <div className="text-center py-12 glass-card">
              <p className="text-slate-400 font-bold">لا توجد تذاكر حالياً</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <motion.div
                key={ticket._id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-2xl cursor-pointer transition-all ${
                  selectedTicket?._id === ticket._id 
                    ? 'bg-primary-600 text-white shadow-lg border-primary-500' 
                    : 'bg-white border border-slate-100 hover:border-primary-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-sm truncate max-w-[150px]">{ticket.subject}</h3>
                  {getStatusBadge(ticket.status)}
                </div>
                <p className={`text-xs mb-3 line-clamp-2 ${selectedTicket?._id === ticket._id ? 'text-primary-100' : 'text-slate-500'}`}>
                  {ticket.message}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold opacity-80">
                  <FaUser /> {ticket.user?.name}
                  <span className="mx-1">•</span>
                  <FaClock /> {new Date(ticket.createdAt).toLocaleDateString('ar-EG')}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Ticket Detail & Reply */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key={selectedTicket._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card flex flex-col h-full min-h-[500px]"
              >
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">{selectedTicket.subject}</h2>
                    <p className="text-xs text-slate-500">بواسطة: {selectedTicket.user?.email}</p>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">إغلاق</button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[400px]">
                  {/* Original Message */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                      <FaUser />
                    </div>
                    <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none">
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedTicket.message}</p>
                      <span className="text-[10px] text-slate-400 mt-2 block">{new Date(selectedTicket.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>

                  {/* Replies */}
                  {selectedTicket.replies?.map((reply, i) => (
                    <div key={i} className={`flex gap-4 ${reply.sender === selectedTicket.user?._id ? '' : 'flex-row-reverse'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        reply.sender === selectedTicket.user?._id ? 'bg-slate-100 text-slate-500' : 'bg-primary-100 text-primary-600'
                      }`}>
                        {reply.sender === selectedTicket.user?._id ? <FaUser /> : <FaHeadset />}
                      </div>
                      <div className={`p-4 rounded-2xl ${
                        reply.sender === selectedTicket.user?._id ? 'bg-slate-100 rounded-tl-none' : 'bg-primary-50 rounded-tr-none border border-primary-100'
                      }`}>
                        <p className="text-sm text-slate-700 leading-relaxed">{reply.message}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block">{new Date(reply.timestamp).toLocaleString('ar-EG')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleReply} className="p-6 bg-slate-50/50 border-t">
                  <div className="relative">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="اكتب ردك هنا لمساعدة المستخدم..."
                      className="premium-input w-full min-h-[100px] py-4 pr-12"
                    />
                    <FaReply className="absolute right-4 top-5 text-slate-400" />
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      type="submit"
                      disabled={sending || !reply.trim()}
                      className="px-8 py-3 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary-700 transition-all shadow-glow disabled:opacity-50"
                    >
                      {sending ? 'جاري الإرسال...' : <><FaReply /> إرسال الرد وإغلاق التذكرة</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="glass-card flex flex-col items-center justify-center h-full min-h-[500px] text-center p-12">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                  <FaHeadset size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">اختر تذكرة للبدء</h3>
                <p className="text-slate-500 max-w-xs">يرجى اختيار تذكرة من القائمة الجانبية لعرض التفاصيل والرد على المستخدمين</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;
