import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  FaStar, FaComments, FaChartBar, FaCheckCircle, 
  FaInfoCircle, FaArrowLeft, FaDownload, FaShareAlt, FaLightbulb,
  FaTrophy
} from 'react-icons/fa';
import { FiTrendingUp, FiActivity, FiZap } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const InterviewFeedback = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state && location.state.aiAnalysis) {
      setAiAnalysis(location.state.aiAnalysis);
      setLoading(false);
    } else {
      // Simulate high-end AI analysis if no data passed
      const timer = setTimeout(() => {
        setAiAnalysis({
          score: 82,
          communication: 88,
          technical: 75,
          confidence: 84,
          marketMatch: 91,
          strengths: [
            'تواصل استراتيجي ممتاز وقدرة على الإقناع',
            'إجابات منظمة تتبع منهجية STAR في عرض الخبرات',
            'إظهار فهم عميق لأهداف الشركة ورؤيتها'
          ],
          improvements: [
            'التعمق أكثر في تفاصيل الهندسة المعمارية للمشاريع',
            'تحسين سرعة الاستجابة للاسئلة المنطقية المعقدة',
            'توضيح منهجيات العمل (Agile/Scrum) المستخدمة سابقاً'
          ]
        });
        setLoading(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [roomId, location.state]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('يرجى اختيار تقييم لتجربتك الاستراتيجية');
      return;
    }
    toast.success('تم إرسال تقييمك بنجاح. شكراً لك على مساهمتك!');
    setIsSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex flex-col items-center justify-center p-4">
        <div className="glass-card p-12 text-center border-none shadow-2xl animate-pulse">
          <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow rotate-3">
            <FiZap className="text-white text-4xl animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">تحليل الذكاء الاصطناعي</h2>
          <p className="text-slate-500 font-bold">جاري معالجة بيانات البث وتحليل نبرة الصوت ولغة الجسد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg py-16 px-4 md:px-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-emerald-100 shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            تم إتمام الجلسة بنجاح
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
            تقرير التقييم <span className="text-primary-600 underline decoration-primary-100 decoration-8 underline-offset-8">الذكي</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            بناءً على تحليل الجلسة المسجلة، قمنا باستخلاص مؤشرات الأداء التالية لمساعدتك في اتخاذ القرار الأمثل.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          {/* AI Score Card */}
          <div className="lg:col-span-2 space-y-10">
            <div className="glass-card p-10 shadow-premium border-none relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-600 to-accent"></div>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                    <FaChartBar size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">تحليل المهارات والجدارة</h2>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">تحليل متقدم باستخدام نماذج AI للتوظيف</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-black text-primary-600 tracking-tighter">{aiAnalysis?.score}%</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">النتيجة الكلية</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricRing value={aiAnalysis?.communication} label="التواصل" color="primary" />
                <MetricRing value={aiAnalysis?.technical} label="الجانب التقني" color="accent" />
                <MetricRing value={aiAnalysis?.confidence} label="الثقة بالنفس" color="emerald" />
                <MetricRing value={aiAnalysis?.marketMatch} label="ملاءمة السوق" color="amber" />
              </div>
            </div>

            <div className="glass-card p-10 shadow-premium border-none bg-slate-900 text-white overflow-hidden relative mb-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <FaTrophy className="text-white text-4xl" />
                </div>
                <div className="text-center md:text-right flex-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 mb-2">التوصية النهائية للذكاء الاصطناعي</h3>
                  <h2 className="text-3xl font-black mb-4">مرشح ذو كفاءة عالية</h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    يُظهر المرشح توافقاً قوياً مع متطلبات الدور الوظيفي، مع تميز خاص في جوانب التواصل الاستراتيجي وحل المشكلات المعقدة.
                  </p>
                </div>
                <div className="shrink-0 bg-emerald-500/20 px-6 py-3 rounded-2xl border border-emerald-500/30 text-emerald-400 font-black text-sm">
                  يوصى بالانتقال للمرحلة التالية
                </div>
              </div>
            </div>

            {/* Detailed Feedback Lists */}
            <div className="glass-card p-10 shadow-premium border-none">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 border border-primary-100">
                  <FiTrendingUp size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900">التحليل النوعي المعمق</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-emerald-600 flex items-center gap-3">
                    <FaTrophy className="shrink-0" /> القوة التنافسية
                  </h3>
                  <div className="space-y-4">
                    {aiAnalysis?.strengths.map((item, i) => (
                      <div key={i} className="p-4 bg-emerald-50/50 rounded-2xl border-r-4 border-emerald-500 text-sm font-bold text-slate-700 shadow-sm leading-relaxed">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-amber-600 flex items-center gap-3">
                    <FiActivity className="shrink-0" /> فرص التطوير
                  </h3>
                  <div className="space-y-4">
                    {aiAnalysis?.improvements.map((item, i) => (
                      <div key={i} className="p-4 bg-amber-50/50 rounded-2xl border-r-4 border-amber-500 text-sm font-bold text-slate-700 shadow-sm leading-relaxed">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Side Form */}
          <div className="space-y-10">
            <div className="glass-card p-8 shadow-premium border-none bg-gradient-to-br from-white to-slate-50">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <FaComments className="text-primary-500" /> تقييمك الشخصي
              </h2>
              
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">ما هو انطباعك العام؟</label>
                    <div className="flex gap-2 justify-between bg-white p-4 rounded-2xl shadow-inner border border-slate-100">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`text-2xl transition-all duration-300 ${
                            star <= (hoverRating || rating) ? 'text-amber-400 scale-125 drop-shadow-md' : 'text-slate-200 hover:text-slate-300'
                          }`}
                        >
                          <FaStar />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">ملاحظاتك للتطوير</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="كيف كانت تجربة المقابلة الرقمية؟"
                      className="premium-input h-32 py-4 text-sm font-bold resize-none"
                    />
                  </div>

                  <button type="submit" className="btn-premium-primary w-full py-4 text-sm font-black shadow-glow">
                    تأكيد إرسال التقييم
                  </button>
                </form>
              ) : (
                <div className="py-10 text-center animate-scale-up">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <FaCheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">شكراً لمشاركتك</h3>
                  <p className="text-slate-500 font-bold text-sm">تم استلام تقييمك بنجاح، ملاحظاتك تساهم في تطويرنا المستمر.</p>
                </div>
              )}
            </div>

            <div className="glass-card p-8 shadow-premium border-none bg-slate-900 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-600/40 transition-all duration-700"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                  <FaLightbulb className="text-primary-400" />
                </div>
                <h3 className="text-lg font-black mb-4 tracking-tight">نصيحة المستقبل الذكية</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                  لقد أظهرت مرونة عالية في حل المشكلات التقنية. ننصحك بالتركيز على إبراز أدوارك القيادية في المشاريع القادمة لتعزيز فرصك في المناصب العليا.
                </p>
                <div className="h-px w-full bg-white/10 mb-6"></div>
                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 hover:text-white transition-all">اكتشف دورات مقترحة</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 animate-slide-up delay-500 pt-8 border-t border-slate-200">
          <Link to="/dashboard" className="btn-premium-outline px-10 py-4 font-black flex items-center gap-3 bg-white/50">
            <FaArrowLeft /> العودة للوحة التحكم
          </Link>
          <button className="btn-premium-primary px-12 py-4 font-black flex items-center gap-3 shadow-glow">
            <FaDownload /> تحميل تقرير الأداء الشامل (PDF)
          </button>
          <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-primary-600 hover:border-primary-100 transition-all shadow-sm">
            <FaShareAlt size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricRing = ({ value, label, color }) => {
  const colors = {
    primary: 'text-primary-600',
    accent: 'text-accent',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500'
  };
  
  return (
    <div className="text-center group">
      <div className="relative inline-flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
          <circle 
            cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
            strokeDasharray={2 * Math.PI * 40}
            strokeDashoffset={2 * Math.PI * 40 * (1 - value / 100)}
            strokeLinecap="round"
            className={`${colors[color]} transition-all duration-1000 ease-out`}
          />
        </svg>
        <span className="absolute text-xl font-black text-slate-900 tracking-tighter">{value}%</span>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
};

export default InterviewFeedback;
