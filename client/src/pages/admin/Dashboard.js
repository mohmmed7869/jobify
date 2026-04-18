import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiUsers, FiBriefcase, FiBarChart2, FiSettings, 
  FiCheckCircle, FiXCircle, FiTrash2, FiActivity,
  FiMail, FiShield, FiMoreVertical
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import SystemSettings from './SystemSettings';
import CustomerSupport from './CustomerSupport';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, action: 'دخول النظام', user: 'المهندس هشام', time: 'منذ دقيقة', status: 'success' },
    { id: 2, action: 'تحديث خوارزمية AI', user: 'نظام آلي', time: 'منذ 5 دقائق', status: 'info' },
    { id: 3, action: 'حظر مستخدم مخالف', user: 'المسؤول', time: 'منذ ساعة', status: 'warning' },
  ]);
  const [aiConfig, setAiConfig] = useState({
    model: 'GPT-4.0 Turbo',
    status: 'Active',
    accuracy: '98.5%',
    lastTraining: '2026-01-05'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview') {
        const res = await axios.get('/api/analytics/overview');
        setStats(res.data.data);
      } else if (activeTab === 'users') {
        const res = await axios.get('/api/admin/users');
        setUsers(res.data.data);
      } else if (activeTab === 'jobs') {
        const res = await axios.get('/api/admin/jobs');
        setJobs(res.data.data);
      }
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success('تم تحديث حالة المستخدم');
      fetchData();
    } catch (error) {
      toast.error('فشل تحديث الحالة');
    }
  };

  const toggleUserVerification = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/verify`, { isVerified: !currentStatus });
      toast.success('تم تحديث حالة توثيق المستخدم');
      fetchData();
    } catch (error) {
      toast.error('فشل تحديث التوثيق');
    }
  };

  const deleteJob = async (jobId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) {
      try {
        await axios.delete(`/api/admin/jobs/${jobId}`);
        toast.success('تم حذف الوظيفة');
        fetchData();
      } catch (error) {
        toast.error('فشل حذف الوظيفة');
      }
    }
  };

  const SidebarItem = ({ icon: Icon, label, id }) => (
    <button
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-6 py-4 transition-all relative group ${
        activeTab === id 
        ? 'bg-primary-500/10 text-primary-600 font-black' 
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
    >
      {activeTab === id && <div className="absolute right-0 top-0 h-full w-1.5 bg-primary-600 rounded-l-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>}
      <Icon size={20} className={activeTab === id ? 'animate-pulse' : ''} />
      <span className="text-sm tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen mesh-bg overflow-hidden" dir="rtl">
      {/* Premium Admin Sidebar - Desktop */}
      <div className="w-72 bg-white/80 backdrop-blur-xl border-l border-white/20 shadow-premium z-30 sticky top-0 h-screen hidden lg:block">
        <div className="p-10 border-b border-slate-100/50 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-glow rotate-3">
            <FiShield size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tighter">
            إدارة المنصة <span className="text-primary-600 font-medium">3.0</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Control Center</p>
        </div>
        <nav className="mt-8 px-2 space-y-1">
          <SidebarItem icon={FiBarChart2} label="نظرة عامة والتحليلات" id="overview" />
          <SidebarItem icon={FiUsers} label="إدارة المستخدمين" id="users" />
          <SidebarItem icon={FiBriefcase} label="الرقابة على الوظائف" id="jobs" />
          <SidebarItem icon={FiMail} label="خدمة العملاء" id="support" />
          <SidebarItem icon={FiSettings} label="إعدادات النظام" id="settings" />
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isSidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-8 border-b border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-glow">
                <FiShield size={24} />
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <FiXCircle size={20} />
              </button>
            </div>
            <h2 className="text-xl font-black text-slate-900">مركز الإدارة</h2>
          </div>
          <nav className="mt-6 px-2">
            <SidebarItem icon={FiBarChart2} label="التحليلات" id="overview" />
            <SidebarItem icon={FiUsers} label="المستخدمين" id="users" />
            <SidebarItem icon={FiBriefcase} label="الوظائف" id="jobs" />
            <SidebarItem icon={FiMail} label="الدعم" id="support" />
            <SidebarItem icon={FiSettings} label="الإعدادات" id="settings" />
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/60 backdrop-blur-xl border-b border-white/20 h-20 sm:h-24 flex items-center justify-between px-4 sm:px-10 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-600"
            >
              <FiActivity size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {activeTab === 'overview' && 'لوحة التحكم الاستراتيجية'}
                {activeTab === 'users' && 'المستخدمين'}
                {activeTab === 'jobs' && 'إدارة الوظائف'}
                {activeTab === 'support' && 'الدعم الفني'}
                {activeTab === 'settings' && 'الإعدادات'}
              </h1>
              <p className="hidden sm:block text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
            </div>
            <button className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all border border-slate-100 relative shadow-sm">
              <FiMail size={18} className="sm:text-xl" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-10 max-w-[1600px] mx-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <LoadingSpinner />
              <p className="text-slate-400 font-black text-xs animate-pulse tracking-widest uppercase">جاري مزامنة البيانات...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && stats && (
                <div className="space-y-10 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard icon={FiUsers} label="إجمالي المواهب" value={stats.overview.totalUsers} color="from-blue-600 to-indigo-600" />
                    <StatCard icon={FiBriefcase} label="الفرص المتاحة" value={stats.overview.activeJobs} color="from-green-600 to-emerald-600" />
                    <StatCard icon={FiActivity} label="الطلبات المعالجة" value={stats.overview.totalApplications} color="from-purple-600 to-accent" />
                    <StatCard icon={FiCheckCircle} label="دقة المطابقة" value={`${stats.overview.conversionRate}%`} color="from-orange-600 to-amber-600" />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 glass-card p-10">
                      <div className="flex justify-between items-center mb-10">
                        <h3 className="font-black text-xl text-slate-900">توزيع الطلبات حسب المدن</h3>
                        <div className="p-2 bg-slate-50 rounded-lg"><FiBarChart2 className="text-slate-400" /></div>
                      </div>
                      <div className="space-y-8">
                        {stats.topCities.map(city => (
                          <div key={city._id} className="group">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-black text-slate-700">{city._id || 'غير محدد'}</span>
                              <span className="text-sm font-black text-primary-600">{city.count} طلب</span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className="h-full bg-gradient-to-r from-primary-600 to-accent group-hover:shadow-[0_0_10px_rgba(14,165,233,0.5)] transition-all duration-1000" 
                                style={{ width: `${(city.count / stats.overview.totalJobs) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl"></div>
                      <h3 className="font-black text-xl mb-8 relative z-10">النشاط الأخير</h3>
                      <div className="space-y-6 relative z-10">
                        {logs.map(log => (
                          <div key={log.id} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                            <div className={`w-2 h-10 rounded-full ${
                              log.status === 'success' ? 'bg-green-500' : 
                              log.status === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}></div>
                            <div>
                              <p className="font-black text-sm">{log.action}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">بواسطة: {log.user}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-8 py-3 bg-primary-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-500 transition-all shadow-glow">
                        تصدير التقرير الكامل
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white rounded-[2rem] shadow-premium border border-slate-100 overflow-hidden animate-slide-up">
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-5 font-black text-slate-600 uppercase tracking-widest text-[10px]">المستخدم</th>
                          <th className="hidden md:table-cell px-6 py-5 font-black text-slate-600 uppercase tracking-widest text-[10px]">الدور</th>
                          <th className="px-6 py-5 font-black text-slate-600 uppercase tracking-widest text-[10px]">الحالة</th>
                          <th className="hidden lg:table-cell px-6 py-5 font-black text-slate-600 uppercase tracking-widest text-[10px]">تاريخ الانضمام</th>
                          <th className="px-6 py-5 font-black text-slate-600 uppercase tracking-widest text-[10px]">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.map(user => (
                          <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-black shadow-inner border border-primary-200/20">
                                  {user.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-slate-900 truncate max-w-[120px] sm:max-w-[200px]">{user.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold truncate max-w-[120px] sm:max-w-[200px]">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-6 py-5">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black w-fit uppercase tracking-tighter ${user.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                  {user.isActive ? 'نشط' : 'محظور'}
                                </span>
                                {user.isVerified && (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 w-fit uppercase tracking-tighter">
                                    موثق
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="hidden lg:table-cell px-6 py-5 text-slate-400 font-bold text-xs">
                              {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => toggleUserVerification(user._id, user.isVerified)}
                                  className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center border ${user.isVerified ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-blue-600 hover:border-blue-100'}`}
                                  title={user.isVerified ? 'إلغاء التوثيق' : 'توثيق المستخدم'}
                                >
                                  <FiShield size={16} />
                                </button>
                                <button 
                                  onClick={() => toggleUserStatus(user._id, user.isActive)}
                                  className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center border ${user.isActive ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'}`}
                                  title={user.isActive ? 'حظر' : 'تنشيط'}
                                >
                                  {user.isActive ? <FiXCircle size={16} /> : <FiCheckCircle size={16} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'jobs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6 animate-slide-up">
                  {jobs.map(job => (
                    <div key={job._id} className="glass-card bg-white p-5 sm:p-8 flex flex-col justify-between group hover:shadow-glow-primary transition-all duration-500 border-white/60">
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <FiBriefcase size={24} />
                          </div>
                          <button 
                            onClick={() => deleteJob(job._id)}
                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white shadow-sm"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                        <h4 className="font-black text-lg sm:text-xl text-slate-900 mb-1 tracking-tight group-hover:text-primary transition-colors">{job.title}</h4>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">{job.companyName}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">المتقدمين</p>
                            <p className="font-black text-slate-900">{job.stats?.applications || 0}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">الحالة</p>
                            <span className="text-[10px] font-black text-emerald-600 uppercase">نشط</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مراقب من النظام</span>
                        </div>
                        <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">
                          عرض التفاصيل
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'support' && (
                <CustomerSupport />
              )}

              {activeTab === 'settings' && (
                <SystemSettings />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card bg-white p-6 sm:p-8 flex items-center gap-6 shadow-premium hover:shadow-glow-primary transition-all duration-500 border-white/60">
    <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${color} text-white rounded-2xl flex items-center justify-center shadow-glow-sm transform group-hover:scale-110 transition-transform`}>
      <Icon size={28} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-[0.2em] mb-1 truncate">{label}</p>
      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

const FiCpu = (props) => (
  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="15" x2="23" y2="15"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="15" x2="4" y2="15"></line>
  </svg>
);

export default AdminDashboard;