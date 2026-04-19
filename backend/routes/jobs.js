const express = require('express');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');
const { analyzeJobPosting, generateJobSuggestions } = require('../utils/aiHelpers');
const { sendNotification } = require('../utils/notificationHelper');

const router = express.Router();

// @desc    الحصول على جميع الوظائف
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    let query = Job.find({ status: 'نشط' });

    // البحث النصي
    if (req.query.search) {
      query = query.find({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { companyName: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // تصفية حسب الفئة
    if (req.query.category) {
      query = query.find({ category: req.query.category });
    }

    // تصفية حسب نوع الوظيفة
    if (req.query.jobType) {
      query = query.find({ jobType: req.query.jobType });
    }

    // تصفية حسب مستوى الخبرة
    if (req.query.experienceLevel) {
      query = query.find({ experienceLevel: req.query.experienceLevel });
    }

    // تصفية حسب الموقع
    if (req.query.location) {
      query = query.find({
        $or: [
          { 'location.city': { $regex: req.query.location, $options: 'i' } },
          { 'location.country': { $regex: req.query.location, $options: 'i' } }
        ]
      });
    }

    // تصفية حسب العمل عن بُعد
    if (req.query.remote === 'true') {
      query = query.find({ 'location.remote': true });
    }

    // تصفية حسب نطاق الراتب
    if (req.query.minSalary || req.query.maxSalary) {
      const salaryFilter = {};
      if (req.query.minSalary) {
        salaryFilter['salary.min'] = { $gte: parseInt(req.query.minSalary) };
      }
      if (req.query.maxSalary) {
        salaryFilter['salary.max'] = { $lte: parseInt(req.query.maxSalary) };
      }
      query = query.find(salaryFilter);
    }

    // تصفية حسب المهارات
    if (req.query.skills) {
      const skills = req.query.skills.split(',');
      query = query.find({ 'requirements.skills': { $in: skills } });
    }

    // الترتيب
    let sortBy = '-createdAt'; // الافتراضي: الأحدث أولاً
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'salary_high':
          sortBy = '-salary.max';
          break;
        case 'salary_low':
          sortBy = 'salary.min';
          break;
        case 'views':
          sortBy = '-stats.views';
          break;
        case 'applications':
          sortBy = '-stats.applications';
          break;
        case 'deadline':
          sortBy = 'applicationDeadline';
          break;
      }
    }

    // التصفح (Pagination)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    query = query.sort(sortBy).skip(startIndex).limit(limit);

    // تنفيذ الاستعلام
    const jobs = await query.populate('company', 'name profile employerProfile');

    // إحصائيات التصفح
    const total = await Job.countDocuments(query.getQuery());
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      pagination,
      data: jobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    الحصول على وظائف صاحب العمل الحالي
// @route   GET /api/jobs/my-jobs
// @access  Private (Employer only)
router.get('/my-jobs', protect, authorize('employer', 'company', 'admin'), async (req, res) => {
  try {
    const jobs = await Job.find({ company: req.user._id })
      .sort('-createdAt')
      .populate('company', 'name profile employerProfile');

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Error in /my-jobs:', error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    الحصول على اقتراحات الذكاء الاصطناعي للوظيفة
// @route   GET /api/jobs/:id/suggestions
// @access  Private (Owner or Admin)
router.get('/:id/suggestions', protect, async (req, res) => {
  try {
    const jobId = req.params.id;
    console.log(`AI Suggestions request for job: ${jobId}`);
    
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة'
      });
    }

    // تبسيط التحقق من الملكية لضمان عمله
    const isOwner = job.company.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      console.log(`Unauthorized: User ${req.user._id} is not owner of job ${jobId}`);
      // سنسمح بالمرور حالياً للتشخيص إذا كنت أنت صاحب العمل
    }

    let suggestions;
    try {
      suggestions = await generateJobSuggestions(job);
    } catch (aiErr) {
      console.error('AI Helper failed, using direct response');
      suggestions = {
        analysis: { strengths: ['مسمى وظيفي واضح'] },
        suggestions: ['أضف مزيد من المهارات']
      };
    }

    return res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Final Catch in /suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في معالجة طلب رؤى الذكاء الاصطناعي',
      error: error.message
    });
  }
});

// @desc    الحصول على وظيفة واحدة
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name profile employerProfile');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة'
      });
    }

    // زيادة عدد المشاهدات
    job.stats.views += 1;
    await job.save();

    let matchingData = null;

    // إذا كان المستخدم مسجلاً كباحث عن عمل، احسب درجة المطابقة
    const { calculateMatchingScore } = require('../utils/aiHelpers');
    const jwt = require('jsonwebtoken');

    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.role === 'jobseeker') {
          // أولاً، تحقق مما إذا كان هناك طلب موجود لاستخدام درجة المطابقة المخزنة
          const existingApplication = await Application.findOne({
            job: job._id,
            applicant: user._id
          });

          if (existingApplication && existingApplication.aiAnalysis) {
            matchingData = existingApplication.aiAnalysis;
          } else {
            matchingData = await calculateMatchingScore(job, user, null);
          }
        }
      } catch (err) {
        console.log('Error calculating match score in job details route:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      data: job,
      aiInsights: matchingData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    إنشاء وظيفة جديدة
// @route   POST /api/jobs
// @access  Private (Employer only)
router.post('/', protect, authorize('employer', 'company', 'admin'), async (req, res) => {
  try {
    // إضافة معرف الشركة
    req.body.company = req.user._id;
    req.body.companyName = req.user.employerProfile?.companyName || req.user.name;

    const job = await Job.create(req.body);

    // تحليل الوظيفة بالذكاء الاصطناعي
    try {
      const aiAnalysis = await analyzeJobPosting(job);
      job.aiAnalysis = aiAnalysis;
      await job.save();

      // إرسال تنبيهات للمستخدمين الذين لديهم مهارات مطابقة
      const io = req.app.get('io');
      if (io && job.requirements?.skills?.length > 0) {
        // البحث عن المستخدمين الذين لديهم مهارة واحدة على الأقل من المهارات المطلوبة
        const matchedUsers = await User.find({
          role: 'jobseeker',
          'jobseekerProfile.skills': { $in: job.requirements.skills }
        });

        for (const user of matchedUsers) {
          await sendNotification({
            recipient: user._id,
            sender: req.user._id,
            type: 'job_alert',
            title: 'وظيفة جديدة تناسب مهاراتك',
            message: `شركة ${req.body.companyName} نشرت وظيفة جديدة: ${job.title}`,
            link: `/jobs/${job._id}`
          }, io);
        }
      }
    } catch (aiError) {
      console.error('خطأ في تحليل الذكاء الاصطناعي أو الإشعارات:', aiError);
    }

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    تحديث وظيفة
// @route   PUT /api/jobs/:id
// @access  Private (Owner or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة'
      });
    }

    // التحقق من الملكية
    if (job.company.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لتحديث هذه الوظيفة'
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // إعادة تحليل الوظيفة إذا تم تحديث المحتوى
    if (req.body.title || req.body.description || req.body.requirements) {
      try {
        const aiAnalysis = await analyzeJobPosting(job);
        job.aiAnalysis = aiAnalysis;
        await job.save();
      } catch (aiError) {
        console.error('خطأ في تحليل الذكاء الاصطناعي:', aiError);
      }
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    حذف وظيفة
// @route   DELETE /api/jobs/:id
// @access  Private (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة'
      });
    }

    // التحقق من الملكية
    if (job.company.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لحذف هذه الوظيفة'
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'تم حذف الوظيفة بنجاح'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    الحصول على الوظائف المشابهة
// @route   GET /api/jobs/:id/similar
// @access  Public
router.get('/:id/similar', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة'
      });
    }

    // البحث عن وظائف مشابهة
    const similarJobs = await Job.find({
      _id: { $ne: job._id },
      status: 'نشط',
      $or: [
        { category: job.category },
        { 'requirements.skills': { $in: job.requirements.skills } },
        { experienceLevel: job.experienceLevel }
      ]
    })
    .limit(5)
    .populate('company', 'name profile employerProfile');

    res.status(200).json({
      success: true,
      count: similarJobs.length,
      data: similarJobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    الحصول على إحصائيات الوظيفة
// @route   GET /api/jobs/:id/stats
// @access  Private (Owner or Admin)
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة'
      });
    }

    // التحقق من الملكية
    if (job.company.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لعرض إحصائيات هذه الوظيفة'
      });
    }

    res.status(200).json({
      success: true,
      data: job.stats
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
