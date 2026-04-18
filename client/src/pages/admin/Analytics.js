import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiTrendingUp, FiUsers, FiBriefcase, FiActivity, 
  FiPieChart, FiBarChart2, FiArrowUp, FiArrowDown,
  FiGlobe, FiTarget, FiZap, FiCalendar
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/analytics/overview');
        setStats(res.data.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="min-h-screen mesh-bg pb-20 pt-8" dir="rtl">
      <div className="premium-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-black text-slate-900 mb-2">تحليلات النظام الشاملة</h1>
            <p className="text-slate-500 font-bold flex items-center gap-2">
              <FiPieChart className="text-primary-500" /> رؤى عميقة حول أداء المنصة ونموها
            </p>
          </div>
          <div className="flex gap-4 animate-slide-up">
            <div className="glass-card px-6 py-2 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-black text-slate-700 uppercase tracking-widest">تحديث مباشر</span>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <AnalyticsCard 
            title="إجمالي المستخدمين" 
            value={stats?.overview?.totalUsers || 0} 
            trend="+12.5%" 
            icon={<FiUsers />} 
            color="primary"
          />
          <AnalyticsCard 
            title="الوظائف النشطة" 
            value={stats?.overview?.activeJobs || 0} 
            trend="+8.2%" 
            icon={<FiBriefcase />} 
            color="accent"
          />
          <AnalyticsCard 
            title="إجمالي الطلبات" 
            value={stats?.overview?.totalApplications || 0} 
            trend="+24.3%" 
            icon={<FiActivity />} 
            color="emerald"
          />
          <AnalyticsCard 
            title="معدل التحويل" 
            value={`${stats?.overview?.conversionRate || 0}%`} 
            trend="+2.1%" 
            icon={<FiTarget />} 
            color="indigo"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* User Distribution */}
          <div className="lg:col-span-1 glass-card p-8">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <FiUsers className="text-primary-500" /> توزيع المستخدمين
            </h3>
            <div className="space-y-6">
              <DistributionBar 
                label="باحثين عن عمل" 
                value={stats?.overview?.totalUsers > 0 ? Math.round((stats?.overview?.totalJobSeekers / stats?.overview?.totalUsers) * 100) : 0} 
                color="bg-primary-500" 
              />
              <DistributionBar 
                label="أصحاب عمل" 
                value={stats?.overview?.totalUsers > 0 ? Math.round((stats?.overview?.totalEmployers / stats?.overview?.totalUsers) * 100) : 0} 
                color="bg-accent" 
              />
              <DistributionBar 
                label="مسؤولين" 
                value={stats?.overview?.totalUsers > 0 ? Math.round(((stats?.overview?.totalUsers - stats?.overview?.totalJobSeekers - stats?.overview?.totalEmployers) / stats?.overview?.totalUsers) * 100) : 0} 
                color="bg-slate-900" 
              />
            </div>
            <div className="mt-10 p-6 bg-slate-50 rounded-3xl">
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                * يمثل الباحثون عن عمل الكتلة الأكبر من مستخدمي المنصة بنسبة نمو شهرية مستقرة.
              </p>
            </div>
          </div>

          {/* Activity Chart Placeholder */}
          <div className="lg:col-span-2 glass-card p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <FiBarChart2 className="text-primary-500" /> نشاط المنصة (آخر ٣٠ يوم)
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black">زيارات</span>
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-black">تقديمات</span>
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[40, 65, 45, 90, 55, 75, 85, 40, 60, 95, 70, 80, 45, 60].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all duration-500 group-hover:from-accent group-hover:to-accent/70"
                    style={{ height: `${h}%` }}
                  ></div>
                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
              <span>١ يناير</span>
              <span>١٥ يناير</span>
              <span>٣٠ يناير</span>
            </div>
          </div>
        </div>

        {/* Global Reach */}
        <div className="glass-card p-10 bg-slate-900 text-white border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-black mb-6 leading-tight">الانتشار الجغرافي <br/><span className="text-primary-400">والتأثير العالمي</span></h2>
              <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
                تغطي المنصة حالياً أكثر من ١٥ مدينة يمنية وتتوسع لتشمل فرصاً وظيفية عالمية بنظام العمل عن بعد، مما يوفر مرونة لا مثيل لها للمبدعين.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-black text-white mb-1">١٢+</div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest">مدينة مغطاة</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-primary-400 mb-1">٨٥٠+</div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest">وظيفة عن بعد</div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="glass-card bg-white/5 border-white/10 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shadow-glow">
                    <FiGlobe size={24} />
                  </div>
                  <h4 className="font-black text-lg">أعلى المدن نشاطاً</h4>
                </div>
                <div className="space-y-6">
                  {stats?.topCities && stats.topCities.length > 0 ? (
                    stats.topCities.slice(0, 4).map((city, index) => (
                      <CityStat 
                        key={index}
                        name={city._id || 'أخرى'} 
                        count={city.count} 
                        percentage={Math.round((city.count / (stats.overview?.totalJobs || 1)) * 100)} 
                      />
                    ))
                  ) : (
                    <>
                      <CityStat name="صنعاء" count="0" percentage={0} />
                      <CityStat name="عدن" count="0" percentage={0} />
                      <CityStat name="تعز" count="0" percentage={0} />
                      <CityStat name="حضرموت" count="0" percentage={0} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsCard = ({ title, value, trend, icon, color }) => {
  const colors = {
    primary: 'from-primary-600 to-primary-400 text-primary-600',
    accent: 'from-accent to-accent/70 text-accent',
    emerald: 'from-emerald-600 to-emerald-400 text-emerald-600',
    indigo: 'from-indigo-600 to-indigo-400 text-indigo-600'
  };

  return (
    <div className="glass-card p-8 hover-card group">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-all duration-500 bg-slate-50 group-hover:bg-gradient-to-br ${colors[color]} group-hover:text-white`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'} bg-white px-3 py-1 rounded-full shadow-sm`}>
          {trend.startsWith('+') ? <FiArrowUp /> : <FiArrowDown />} {trend}
        </div>
      </div>
      <h3 className="text-slate-500 font-bold text-sm mb-1">{title}</h3>
      <div className="text-4xl font-black text-slate-900 tracking-tighter">{value}</div>
    </div>
  );
};

const DistributionBar = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-black">
      <span className="text-slate-700">{label}</span>
      <span className="text-slate-500">{value}%</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const CityStat = ({ name, count, percentage }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-black">
      <span className="text-slate-300">{name}</span>
      <span className="text-primary-400">{count}</span>
    </div>
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

export default Analytics;
