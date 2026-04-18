import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaServer, FaRobot, FaSave, FaShieldAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    aiProvider: 'local',
    openaiModel: 'gpt-3.5-turbo',
    openaiApiKey: '',
    aiTemperature: 0.7,
    maxTokens: 800,
    serverMaintenance: false,
    enableRegistration: true,
    supportEmail: '',
    supportPhone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (error) {
      toast.error('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/admin/settings', settings);
      if (res.data.success) {
        toast.success('تم حفظ الإعدادات بنجاح');
      }
    } catch (error) {
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary-600 p-3 rounded-xl text-white shadow-glow">
          <FaServer size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">إدارة السيرفر والذكاء الاصطناعي</h1>
          <p className="text-slate-500 text-sm">تحكم في إعدادات المنصة المتقدمة ونماذج AI</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <FaRobot className="text-primary-600" />
            <h2 className="font-bold text-slate-800">إعدادات الذكاء الاصطناعي</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">مزود الخدمة</label>
              <select 
                className="premium-input w-full"
                value={settings.aiProvider}
                onChange={(e) => setSettings({...settings, aiProvider: e.target.value})}
              >
                <option value="local">محلي (Local Logic)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="python-service">خدمة Python المتقدمة</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">نموذج OpenAI</label>
              <input 
                type="text"
                className="premium-input w-full"
                value={settings.openaiModel}
                onChange={(e) => setSettings({...settings, openaiModel: e.target.value})}
                placeholder="gpt-3.5-turbo"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">OpenAI API Key</label>
              <input 
                type="password"
                className="premium-input w-full"
                value={settings.openaiApiKey}
                onChange={(e) => setSettings({...settings, openaiApiKey: e.target.value})}
                placeholder="sk-..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">درجة الحرارة (Temperature)</label>
              <input 
                type="number"
                step="0.1"
                min="0"
                max="1"
                className="premium-input w-full"
                value={settings.aiTemperature}
                onChange={(e) => setSettings({...settings, aiTemperature: parseFloat(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">أقصى عدد للكلمات (Max Tokens)</label>
              <input 
                type="number"
                className="premium-input w-full"
                value={settings.maxTokens}
                onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </div>

        {/* Server Management */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <FaShieldAlt className="text-accent" />
            <h2 className="font-bold text-slate-800">إدارة السيرفر والأمان</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-700">وضع الصيانة</p>
                <p className="text-xs text-slate-500">منع الوصول العام للمنصة</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.serverMaintenance}
                  onChange={(e) => setSettings({...settings, serverMaintenance: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-700">تفعيل التسجيل</p>
                <p className="text-xs text-slate-500">السماح للمستخدمين الجدد بالانضمام</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.enableRegistration}
                  onChange={(e) => setSettings({...settings, enableRegistration: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Support Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <FaEnvelope className="text-emerald-500" />
            <h2 className="font-bold text-slate-800">معلومات الدعم الفني</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FaEnvelope /> بريد الدعم
              </label>
              <input 
                type="email"
                className="premium-input w-full"
                value={settings.supportEmail}
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FaPhone /> هاتف الدعم
              </label>
              <input 
                type="text"
                className="premium-input w-full"
                value={settings.supportPhone}
                onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-700 transition-all shadow-glow disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : <><FaSave /> حفظ التغييرات الاستراتيجية</>}
        </button>
      </form>
    </div>
  );
};

export default SystemSettings;
