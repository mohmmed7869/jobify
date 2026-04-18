import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SocialAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      toast.success('تم تسجيل الدخول بنجاح');
      setTimeout(() => {
        navigate('/feed');
      }, 2000);
    } else {
      toast.error('فشل تسجيل الدخول الاجتماعي');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full glass-card p-12 text-center animate-scale-up">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-accent rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-glow rotate-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-4">جاري التحقق...</h2>
        <p className="text-slate-500 font-bold mb-8 leading-relaxed">
          نقوم بمزامنة هويتك الرقمية وتأمين جلسة العمل الخاصة بك. لحظات وننقلك إلى عالم الفرص.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-100"></span>
            <span className="w-2 h-2 bg-primary-300 rounded-full animate-bounce delay-200"></span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Authentication Protocol Active</p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <p className="text-slate-900 font-black text-xs">بإشراف المهندس محمد علي - فريق Smart Solution</p>
          <p className="text-primary-600 font-bold text-[10px] mt-1">mohom77393@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default SocialAuthSuccess;