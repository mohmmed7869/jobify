/**
 * Enhanced Dashboard Component
 * لوحة تحكم محسنة مع ميزات متقدمة
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon,
  StarIcon,
  TrendingUpIcon,
  EyeIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { useRealTimeData } from '../../hooks/useRealTimeData';
import LoadingSpinner from '../common/LoadingSpinner';
import StatCard from '../common/StatCard';
import ProgressChart from '../charts/ProgressChart';
import ActivityTimeline from '../common/ActivityTimeline';
import QuickActions from '../common/QuickActions';
import AIInsights from '../ai/AIInsights';
import PersonalizedRecommendations from '../ai/PersonalizedRecommendations';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time data updates
  const realTimeData = useRealTimeData(`dashboard_${user?.id}`, {
    refreshInterval: 30000, // 30 seconds
    onUpdate: (data) => {
      setDashboardData(prev => ({ ...prev, ...data }));
    }
  });

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, user?.id]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/${user.role}?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      showNotification('خطأ في تحميل بيانات لوحة التحكم', 'error');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role, timeRange, showNotification]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!dashboardData) return null;

    let filtered = { ...dashboardData };

    // Apply search filter
    if (searchQuery) {
      filtered = {
        ...filtered,
        recentActivity: filtered.recentActivity?.filter(item =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      };
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = {
        ...filtered,
        recentActivity: filtered.recentActivity?.filter(item =>
          item.category === filterCategory
        )
      };
    }

    return filtered;
  }, [dashboardData, searchQuery, filterCategory]);

  // Get dashboard configuration based on user role
  const getDashboardConfig = useCallback(() => {
    const baseConfig = {
      jobseeker: {
        mainStats: [
          { key: 'applicationsCount', label: 'التقديمات', icon: DocumentTextIcon, color: 'blue' },
          { key: 'profileViews', label: 'مشاهدات الملف الشخصي', icon: EyeIcon, color: 'green' },
          { key: 'interviewsScheduled', label: 'المقابلات المجدولة', icon: CalendarIcon, color: 'purple' },
          { key: 'jobMatches', label: 'الوظائف المطابقة', icon: BriefcaseIcon, color: 'yellow' }
        ],
        sections: ['quickStats', 'jobRecommendations', 'applicationStatus', 'skillInsights', 'recentActivity']
      },
      employer: {
        mainStats: [
          { key: 'jobPostings', label: 'الوظائف المنشورة', icon: BriefcaseIcon, color: 'blue' },
          { key: 'totalApplications', label: 'إجمالي التقديمات', icon: DocumentTextIcon, color: 'green' },
          { key: 'candidatesInterviewed', label: 'المرشحون المقابلون', icon: UserIcon, color: 'purple' },
          { key: 'positionsFilled', label: 'المناصب المملوءة', icon: StarIcon, color: 'yellow' }
        ],
        sections: ['quickStats', 'topCandidates', 'hiringFunnel', 'companyInsights', 'recentActivity']
      },
      admin: {
        mainStats: [
          { key: 'totalUsers', label: 'إجمالي المستخدمين', icon: UserIcon, color: 'blue' },
          { key: 'activeJobs', label: 'الوظائف النشطة', icon: BriefcaseIcon, color: 'green' },
          { key: 'systemHealth', label: 'صحة النظام', icon: CogIcon, color: 'purple' },
          { key: 'platformGrowth', label: 'نمو المنصة', icon: TrendingUpIcon, color: 'yellow' }
        ],
        sections: ['quickStats', 'systemOverview', 'userAnalytics', 'platformInsights', 'recentActivity']
      }
    };

    return baseConfig[user?.role] || baseConfig.jobseeker;
  }, [user?.role]);

  const dashboardConfig = getDashboardConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!filteredData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            لا توجد بيانات متاحة
          </h2>
          <p className="text-gray-600 mb-4">
            يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني
          </p>
          <button
            onClick={fetchDashboardData}
            className="btn btn-primary"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                مرحباً، {user?.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {getDashboardGreeting()}
              </p>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="form-select text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="7d">آخر 7 أيام</option>
                <option value="30d">آخر 30 يوم</option>
                <option value="90d">آخر 90 يوم</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                  <BellIcon className="w-6 h-6" />
                  {filteredData.unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {filteredData.unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في الأنشطة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-select border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">جميع الفئات</option>
              <option value="applications">التقديمات</option>
              <option value="interviews">المقابلات</option>
              <option value="messages">الرسائل</option>
              <option value="profile">الملف الشخصي</option>
            </select>

            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              إعادة تعيين
            </button>
          </div>
        </div>

        {/* Main Stats */}
        <div className={`grid gap-6 mb-8 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {dashboardConfig.mainStats.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard
                title={stat.label}
                value={filteredData[stat.key]?.value || 0}
                change={filteredData[stat.key]?.change || 0}
                changeType={filteredData[stat.key]?.changeType || 'neutral'}
                icon={stat.icon}
                color={stat.color}
                viewMode={viewMode}
              />
            </motion.div>
          ))}
        </div>

        {/* Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Insights */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AIInsights
                userRole={user.role}
                data={filteredData.aiInsights}
                timeRange={timeRange}
              />
            </motion.section>

            {/* Progress Chart */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                تحليل الأداء
              </h3>
              <ProgressChart
                data={filteredData.progressData}
                timeRange={timeRange}
                userRole={user.role}
              />
            </motion.section>

            {/* Quick Actions */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <QuickActions
                userRole={user.role}
                data={filteredData.quickActions}
                onActionClick={handleQuickAction}
              />
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Personalized Recommendations */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <PersonalizedRecommendations
                userRole={user.role}
                data={filteredData.recommendations}
                onRecommendationClick={handleRecommendationClick}
              />
            </motion.section>

            {/* Activity Timeline */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <ActivityTimeline
                activities={filteredData.recentActivity}
                maxItems={10}
                showSearch={false}
              />
            </motion.section>

            {/* Upcoming Events */}
            {filteredData.upcomingEvents?.length > 0 && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  الأحداث القادمة
                </h3>
                <div className="space-y-3">
                  {filteredData.upcomingEvents.slice(0, 5).map((event, index) => (
                    <div
                      key={event.id}
                      className="flex items-center space-x-3 space-x-reverse p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <CalendarIcon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {event.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Helper Functions
  function getDashboardGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير! نتمنى لك يوماً مثمراً';
    if (hour < 17) return 'مساء الخير! كيف يسير عملك اليوم؟';
    return 'مساء الخير! نتمنى أن تكون قد أنجزت أهدافك اليوم';
  }

  function handleQuickAction(action) {
    // Handle quick action clicks
    console.log('Quick action clicked:', action);
    // Navigate or perform action based on the action type
  }

  function handleRecommendationClick(recommendation) {
    // Handle recommendation clicks
    console.log('Recommendation clicked:', recommendation);
    // Navigate or perform action based on the recommendation
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'غداً';
    if (diffDays < 7) return `خلال ${diffDays} أيام`;
    
    return date.toLocaleDateString('ar-SA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

export default EnhancedDashboard;