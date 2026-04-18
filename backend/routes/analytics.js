const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

const router = express.Router();

// @desc    إحصائيات عامة للمنصة
// @route   GET /api/analytics/overview
// @access  Private (Admin only)
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    // إحصائيات أساسية
    const totalUsers = await User.countDocuments();
    const totalJobSeekers = await User.countDocuments({ role: 'jobseeker' });
    const totalEmployers = await User.countDocuments({ role: 'employer' });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'نشط' });
    const totalApplications = await Application.countDocuments();

    // إحصائيات النمو (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const newJobsLast30Days = await Job.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const newApplicationsLast30Days = await Application.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // معدل التحويل
    const conversionRate = totalJobs > 0 ? (totalApplications / totalJobs) : 0;

    // أكثر الصناعات طلباً
    const topIndustries = await Job.aggregate([
      { $match: { status: 'نشط' } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // أكثر المدن طلباً للوظائف
    const topCities = await Job.aggregate([
      { $match: { status: 'نشط' } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // إحصائيات التطبيقات حسب الحالة
    const applicationsByStatus = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalJobSeekers,
          totalEmployers,
          totalJobs,
          activeJobs,
          totalApplications,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        growth: {
          newUsersLast30Days,
          newJobsLast30Days,
          newApplicationsLast30Days
        },
        topIndustries,
        topCities,
        applicationsByStatus
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    إحصائيات المستخدمين
// @route   GET /api/analytics/users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    // إحصائيات التسجيل الشهرية
    const userRegistrationTrends = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // توزيع المستخدمين حسب الدور
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // المستخدمون النشطون (سجلوا دخول في آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // المستخدمون المحققون
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    // توزيع المستخدمين حسب الموقع
    const usersByLocation = await User.aggregate([
      { $match: { 'profile.location.country': { $exists: true } } },
      {
        $group: {
          _id: '$profile.location.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        registrationTrends: userRegistrationTrends,
        usersByRole,
        activeUsers,
        verifiedUsers,
        usersByLocation
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    إحصائيات الوظائف
// @route   GET /api/analytics/jobs
// @access  Private (Admin only)
router.get('/jobs', protect, authorize('admin'), async (req, res) => {
  try {
    // اتجاهات نشر الوظائف
    const jobPostingTrends = await Job.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // توزيع الوظائف حسب النوع
    const jobsByType = await Job.aggregate([
      {
        $group: {
          _id: '$jobType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // توزيع الوظائف حسب مستوى الخبرة
    const jobsByExperience = await Job.aggregate([
      {
        $group: {
          _id: '$experienceLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // متوسط المشاهدات والتطبيقات
    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: null,
          avgViews: { $avg: '$stats.views' },
          avgApplications: { $avg: '$stats.applications' },
          totalViews: { $sum: '$stats.views' },
          totalApplications: { $sum: '$stats.applications' }
        }
      }
    ]);

    // أكثر الوظائف مشاهدة
    const mostViewedJobs = await Job.find()
      .sort('-stats.views')
      .limit(10)
      .select('title companyName stats.views stats.applications')
      .populate('company', 'name');

    // الوظائف الأكثر تنافسية (أكثر تطبيقات)
    const mostCompetitiveJobs = await Job.find()
      .sort('-stats.applications')
      .limit(10)
      .select('title companyName stats.views stats.applications')
      .populate('company', 'name');

    res.status(200).json({
      success: true,
      data: {
        postingTrends: jobPostingTrends,
        jobsByType,
        jobsByExperience,
        averageStats: jobStats[0] || {
          avgViews: 0,
          avgApplications: 0,
          totalViews: 0,
          totalApplications: 0
        },
        mostViewedJobs,
        mostCompetitiveJobs
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    إحصائيات التطبيقات
// @route   GET /api/analytics/applications
// @access  Private (Admin only)
router.get('/applications', protect, authorize('admin'), async (req, res) => {
  try {
    // اتجاهات التطبيقات
    const applicationTrends = await Application.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // معدل النجاح (التطبيقات المقبولة)
    const successRate = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalApps = successRate.reduce((sum, item) => sum + item.count, 0);
    const acceptedApps = successRate.find(item => item._id === 'مقبول')?.count || 0;
    const hiredApps = successRate.find(item => item._id === 'تم التوظيف')?.count || 0;
    
    const overallSuccessRate = totalApps > 0 ? ((acceptedApps + hiredApps) / totalApps * 100) : 0;

    // متوسط درجات المطابقة
    const matchingScores = await Application.aggregate([
      { $match: { 'aiAnalysis.matchingScore': { $exists: true } } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$aiAnalysis.matchingScore' },
          minScore: { $min: '$aiAnalysis.matchingScore' },
          maxScore: { $max: '$aiAnalysis.matchingScore' }
        }
      }
    ]);

    // توزيع درجات المطابقة
    const scoreDistribution = await Application.aggregate([
      { $match: { 'aiAnalysis.matchingScore': { $exists: true } } },
      {
        $bucket: {
          groupBy: '$aiAnalysis.matchingScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'أخرى',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // أكثر المهارات طلباً (من التطبيقات المقبولة)
    const topSkillsFromAccepted = await Application.aggregate([
      { $match: { status: { $in: ['مقبول', 'تم التوظيف'] } } },
      { $lookup: { from: 'users', localField: 'applicant', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $unwind: '$user.jobseekerProfile.skills' },
      {
        $group: {
          _id: '$user.jobseekerProfile.skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        applicationTrends,
        successRate: {
          overall: Math.round(overallSuccessRate * 100) / 100,
          byStatus: successRate
        },
        matchingScores: matchingScores[0] || {
          avgScore: 0,
          minScore: 0,
          maxScore: 0
        },
        scoreDistribution,
        topSkillsFromAccepted
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    إحصائيات صاحب العمل
// @route   GET /api/analytics/employer
// @access  Private (Employers only)
router.get('/employer', protect, authorize('employer', 'company'), async (req, res) => {
  try {
    // إحصائيات الوظائف المنشورة
    const jobStats = await Job.aggregate([
      { $match: { company: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // إجمالي المشاهدات والتطبيقات
    const totalStats = await Job.aggregate([
      { $match: { company: req.user._id } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$stats.views' },
          totalApplications: { $sum: '$stats.applications' },
          avgViews: { $avg: '$stats.views' },
          avgApplications: { $avg: '$stats.applications' }
        }
      }
    ]);

    // إحصائيات التطبيقات
    const applicationStats = await Application.aggregate([
      { $match: { employer: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // أفضل الوظائف أداءً
    const topPerformingJobs = await Job.find({ company: req.user._id })
      .sort('-stats.applications')
      .limit(5)
      .select('title stats createdAt');

    // اتجاهات التطبيقات الشهرية
    const monthlyApplications = await Application.aggregate([
      { $match: { employer: req.user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // متوسط درجات المطابقة للمتقدمين
    const avgMatchingScore = await Application.aggregate([
      { 
        $match: { 
          employer: req.user._id,
          'aiAnalysis.matchingScore': { $exists: true }
        } 
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$aiAnalysis.matchingScore' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        jobStats,
        totalStats: totalStats[0] || {
          totalViews: 0,
          totalApplications: 0,
          avgViews: 0,
          avgApplications: 0
        },
        applicationStats,
        topPerformingJobs,
        monthlyApplications,
        avgMatchingScore: avgMatchingScore[0]?.avgScore || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    إحصائيات الباحث عن عمل
// @route   GET /api/analytics/jobseeker
// @access  Private (Job Seekers only)
router.get('/jobseeker', protect, authorize('jobseeker'), async (req, res) => {
  try {
    // إحصائيات التطبيقات
    const applicationStats = await Application.aggregate([
      { $match: { applicant: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // اتجاهات التطبيقات الشهرية
    const monthlyApplications = await Application.aggregate([
      { $match: { applicant: req.user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // متوسط درجة المطابقة
    const avgMatchingScore = await Application.aggregate([
      { 
        $match: { 
          applicant: req.user._id,
          'aiAnalysis.matchingScore': { $exists: true }
        } 
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$aiAnalysis.matchingScore' },
          maxScore: { $max: '$aiAnalysis.matchingScore' },
          minScore: { $min: '$aiAnalysis.matchingScore' }
        }
      }
    ]);

    // أفضل التطبيقات (أعلى درجة مطابقة)
    const bestApplications = await Application.find({
      applicant: req.user._id,
      'aiAnalysis.matchingScore': { $exists: true }
    })
    .sort('-aiAnalysis.matchingScore')
    .limit(5)
    .populate('job', 'title companyName')
    .select('job aiAnalysis.matchingScore status createdAt');

    // الصناعات المتقدم لها
    const industriesAppliedTo = await Application.aggregate([
      { $match: { applicant: req.user._id } },
      { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobInfo' } },
      { $unwind: '$jobInfo' },
      {
        $group: {
          _id: '$jobInfo.industry',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // معدل الاستجابة
    const totalApplications = await Application.countDocuments({ applicant: req.user._id });
    const respondedApplications = await Application.countDocuments({
      applicant: req.user._id,
      status: { $nin: ['مرسل'] }
    });

    const responseRate = totalApplications > 0 ? (respondedApplications / totalApplications * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        applicationStats,
        monthlyApplications,
        matchingScores: avgMatchingScore[0] || {
          avgScore: 0,
          maxScore: 0,
          minScore: 0
        },
        bestApplications,
        industriesAppliedTo,
        responseRate: Math.round(responseRate * 100) / 100,
        profileViews: req.user.stats.profileViews || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    تقرير مخصص
// @route   POST /api/analytics/custom-report
// @access  Private (Admin only)
router.post('/custom-report', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      dateRange, 
      metrics, 
      filters,
      groupBy 
    } = req.body;

    // بناء استعلام التاريخ
    let dateQuery = {};
    if (dateRange && dateRange.start && dateRange.end) {
      dateQuery.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    const report = {};

    // جمع البيانات حسب المقاييس المطلوبة
    if (metrics.includes('users')) {
      report.users = await User.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: groupBy === 'month' ? {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            } : '$role',
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
    }

    if (metrics.includes('jobs')) {
      report.jobs = await Job.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: groupBy === 'month' ? {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            } : '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
    }

    if (metrics.includes('applications')) {
      report.applications = await Application.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: groupBy === 'month' ? {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            } : '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

module.exports = router;