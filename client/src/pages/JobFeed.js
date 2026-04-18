import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import JobCard from '../components/feed/JobCard';
import PostCard from '../components/feed/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiPlus, FiFilter, FiSearch, FiTrendingUp, FiUsers, FiBookmark } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const JobFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, jobs, posts
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFeed();
  }, [filter]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const jobsRes = await axios.get('/api/jobs');
      const postsRes = await axios.get('/api/posts');
      
      let items = [];
      if (filter === 'all' || filter === 'jobs') {
        items = [...items, ...jobsRes.data.data.map(j => ({ ...j, type: 'job' }))];
      }
      if (filter === 'all' || filter === 'posts') {
        items = [...items, ...postsRes.data.data.map(p => ({ ...p, type: 'post' }))];
      }

      // Sort by creation date
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFeedItems(items);
    } catch (error) {
      toast.error('فشل في تحميل الخلاصة');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = feedItems.filter(item => {
    const title = item.type === 'job' ? item.title : item.content;
    return title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="mesh-bg min-h-screen pb-12 animate-fade-in">
      <div className="premium-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="glass-card overflow-hidden sticky top-24 hover-card group">
              <div className="h-24 bg-gradient-to-r from-primary-600 to-accent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              </div>
              <div className="px-6 pb-6 relative">
                <div className="relative -mt-12 mb-6 flex justify-center">
                  <div className="w-24 h-24 glass-card p-1.5 shadow-xl group-hover:scale-105 transition-transform">
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent rounded-xl flex items-center justify-center text-white font-black text-3xl shadow-inner">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-black text-slate-900 text-xl mb-1">أهلاً بك، {user?.name?.split(' ')[0]}!</h3>
                  <p className="text-slate-500 text-sm font-medium mb-6">مستشار التوظيف الذكي جاهز</p>
                </div>
                
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-bold">مشاهدات الملف</span>
                    <span className="text-primary-600 font-black">124</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-bold">ظهور في البحث</span>
                    <span className="text-primary-600 font-black">56</span>
                  </div>
                </div>

                <button className="w-full mt-8 btn-premium-outline flex items-center justify-center gap-2 text-sm">
                  <FiBookmark className="text-lg" /> الوظائف المحفوظة
                </button>
              </div>
            </div>
          </div>

          {/* Main Feed Content */}
          <div className="lg:col-span-6 space-y-5 md:space-y-8 px-4 md:px-0">
            {/* Mobile Profile Summary - Shown only on small screens */}
            <div className="lg:hidden glass-premium p-4 flex items-center gap-4 animate-slide-up shadow-premium-sm rounded-2xl border-primary-100/20">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black themed-text text-sm truncate leading-tight">أهلاً، {user?.name?.split(' ')[0]}!</h3>
                <p className="themed-text-ter text-[10px] font-bold truncate">مستشارك الذكي جاهز</p>
              </div>
              <button className="p-2.5 bg-primary-50 text-primary-600 rounded-xl border border-primary-100/50">
                <FiBookmark />
              </button>
            </div>

            {/* Search & Filter Bar - Moved to top */}
            <div className="glass-premium p-2 md:p-3 flex flex-col md:flex-row gap-2 md:gap-3 items-stretch md:items-center animate-slide-up delay-100 rounded-2xl md:rounded-[2rem] border-primary-100/20 shadow-premium-lg sticky top-20 md:relative z-40 bg-white/95 backdrop-blur-xl">
              <div className="relative flex-1 group">
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-themed-text-ter text-base md:text-lg group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="ابحث في عالم الفرص والمنشورات..."
                  className="w-full bg-themed-bg-ter border-none focus:ring-2 focus:ring-primary/20 pr-10 md:pr-12 py-3 md:py-4 text-[11px] md:text-sm font-black rounded-xl md:rounded-2xl transition-all shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex bg-themed-bg-ter p-1 rounded-xl md:rounded-2xl border themed-border">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'jobs', label: 'الوظائف' },
                  { id: 'posts', label: 'المجتمع' }
                ].map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex-1 md:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black transition-all ${filter === f.id ? 'bg-white shadow-premium-sm text-primary scale-105' : 'themed-text-ter hover:themed-text'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Post Section */}
            <div className="glass-premium p-4 md:p-6 animate-slide-up rounded-2xl md:rounded-[2rem] border-primary-100/20 shadow-premium-sm">
              <div className="flex gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100/50 rounded-xl flex items-center justify-center text-primary-600 font-black text-base md:text-lg shadow-inner shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <button 
                  className="flex-1 bg-themed-bg-ter hover:bg-themed-bg-sec text-right px-4 md:px-6 py-2 md:py-3 rounded-xl text-themed-text-ter text-[11px] md:text-sm font-bold transition-all border themed-border outline-none truncate"
                  onClick={() => {/* Open Create Post Modal */}}
                >
                  بمَ تفكر يا {user?.name?.split(' ')[0]}؟
                </button>
              </div>
              <div className="flex justify-between items-center pt-3 md:pt-4 border-t themed-border overflow-x-auto no-scrollbar gap-2">
                {[
                  { icon: <FiPlus className="text-primary-500" />, label: 'صورة' },
                  { icon: <FiPlus className="text-emerald-500" />, label: 'فيديو' },
                  { icon: <FiPlus className="text-accent" />, label: 'مقال' }
                ].map((btn, i) => (
                  <button key={i} className="flex items-center gap-1.5 md:gap-2 text-themed-text-sec hover:bg-themed-bg-ter px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all text-[10px] md:text-xs font-black whitespace-nowrap">
                    {btn.icon} {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="space-y-4">
                {filteredItems.map(item => (
                  item.type === 'job' ? (
                    <JobCard key={item._id} job={item} />
                  ) : (
                    <PostCard key={item._id} post={item} />
                  )
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <FiFilter size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">لا توجد نتائج</h3>
                <p className="text-gray-500">حاول تغيير معايير البحث أو الفلترة</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Trending & Suggestions */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="space-y-6 sticky top-24">
              {/* Trending Section */}
              <div className="glass-card p-6 hover-card border-none shadow-premium">
                <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <FiTrendingUp className="text-primary-600" /> الرائج الآن
                </h3>
                <div className="space-y-4">
                  {['#الذكاء_الاصطناعي', '#توظيف_2026', '#تطوير_الويب', '#فرص_عمل'].map(tag => (
                    <a key={tag} href="#" className="block group/tag">
                      <div className="text-sm font-black text-slate-700 group-hover/tag:text-primary-600 transition-colors">
                        {tag}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">1.2 ألف منشور</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Suggestions Section */}
              <div className="glass-card p-6 hover-card border-none shadow-premium">
                <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-lg">
                  <FiUsers className="text-accent" /> اقتراحات
                </h3>
                <div className="space-y-6">
                  {[
                    { name: 'علي محمد', title: 'مطور واجهات' },
                    { name: 'سارة أحمد', title: 'خبير توظيف' }
                  ].map(person => (
                    <div key={person.name} className="flex items-center gap-3 group/person">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black group-hover/person:bg-primary-50 group-hover/person:text-primary-600 transition-colors shadow-inner shrink-0">
                        {person.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{person.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate">{person.title}</p>
                      </div>
                      <button className="text-primary-600 font-black text-[10px] hover:bg-primary-50 px-3 py-1.5 rounded-full transition-all border border-transparent hover:border-primary-100">
                        متابعة
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center px-4">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  © 2026 منصة التوظيف الذكية <br/>
                  <span className="font-black text-slate-500">Ultra-Premium Edition</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button - Mobile Only */}
      <button className="lg:hidden fixed bottom-6 left-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition-all z-50">
        <FiPlus size={24} />
      </button>
    </div>
  );
};

export default JobFeed;