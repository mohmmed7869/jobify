import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend, FiMessageSquare, FiUser, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const { name, email, subject, message } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      // Using the support endpoint as it's the closest available
      const res = await axios.post('/api/support/tickets', {
        subject: `[Contact Form] ${subject}`,
        message: `From: ${name} (${email})\n\n${message}`
      });

      if (res.data.success) {
        toast.success('تم إرسال رسالتك بنجاح. سنرد عليك قريباً.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل في إرسال الرسالة. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-12 min-h-screen mesh-bg relative overflow-hidden" dir="rtl">
      {/* Background Decorations */}
      <div className="blur-circle w-[400px] h-[400px] bg-primary-500/10 top-[-100px] right-[-100px]"></div>
      <div className="blur-circle w-[300px] h-[300px] bg-accent/10 bottom-[-50px] left-[-50px]"></div>

      <div className="premium-container max-w-7xl relative z-10">
        <div className="text-center mb-16 animate-slide-down">
          <h1 className="text-4xl md:text-6xl font-black premium-gradient-text mb-6 tracking-tight">تواصل معنا</h1>
          <p className="text-themed-text-sec text-lg md:text-xl max-w-2xl mx-auto font-bold leading-relaxed">
            نحن هنا للإجابة على استفساراتكم ومساعدتكم في بناء مستقبل مهني ذكي. لا تتردد في مراسلتنا في أي وقت.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6 animate-slide-up">
            <ContactInfoCard 
              icon={<FiMail size={24} />} 
              title="البريد الإلكتروني" 
              content="support@smartjobs.ai" 
              subContent="نرد خلال 24 ساعة"
            />
            <ContactInfoCard 
              icon={<FiPhone size={24} />} 
              title="رقم التواصل" 
              content="+967 773988932" 
              subContent="متاح من 9 صباحاً حتى 5 مساءً"
              dir="ltr"
            />
            <ContactInfoCard 
              icon={<FiMapPin size={24} />} 
              title="الموقع الرئيسي" 
              content="صنعاء، اليمن" 
              subContent="مركز تكنولوجيا المعلومات"
            />
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="premium-glass-panel p-8 md:p-12 rounded-[2.5rem] shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
              
              <h2 className="text-2xl md:text-3xl font-black text-themed-text mb-8 flex items-center gap-3">
                <FiMessageSquare className="text-primary" /> أرسل رسالة مباشرة
              </h2>

              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-themed-text-ter uppercase tracking-widest flex items-center gap-2">
                      <FiUser className="text-primary" /> الاسم الكامل
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={name}
                      onChange={onChange}
                      className="premium-input w-full"
                      placeholder="أدخل اسمك هنا..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-themed-text-ter uppercase tracking-widest flex items-center gap-2">
                      <FiMail className="text-primary" /> البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      className="premium-input w-full text-left"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-themed-text-ter uppercase tracking-widest flex items-center gap-2">
                    <FiInfo className="text-primary" /> عنوان الموضوع
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={subject}
                    onChange={onChange}
                    className="premium-input w-full"
                    placeholder="بماذا يمكننا مساعدتك؟"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-themed-text-ter uppercase tracking-widest flex items-center gap-2">
                    <FiMessageSquare className="text-primary" /> تفاصيل الرسالة
                  </label>
                  <textarea
                    name="message"
                    value={message}
                    onChange={onChange}
                    rows="6"
                    className="premium-textarea w-full"
                    placeholder="اكتب رسالتك هنا بكل وضوح..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-formal-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-lg group shimmer-sweep"
                >
                  {loading ? (
                    <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>إرسال الرسالة الآن</span>
                      <FiSend className="group-hover:translate-x-[-5px] group-hover:translate-y-[-5px] transition-transform rotate-180" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactInfoCard = ({ icon, title, content, subContent, dir = 'rtl' }) => (
  <div className="premium-glass-panel p-6 rounded-[1.5rem] border border-primary-100/10 hover:border-primary-500/30 transition-all group hover:translate-y-[-5px] shadow-sm hover:shadow-glow-sm">
    <div className="flex items-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-themed-text-ter uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-themed-text font-black text-lg md:text-xl truncate ${dir === 'ltr' ? 'font-sans' : ''}`} dir={dir}>{content}</p>
        <p className="text-xs text-themed-text-sec font-bold opacity-70">{subContent}</p>
      </div>
    </div>
  </div>
);

export default Contact;
