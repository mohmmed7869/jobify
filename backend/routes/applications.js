const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { analyzeResume, calculateMatchingScore, analyzeInterview } = require('../utils/aiHelpers');
const sendEmail = require('../utils/sendEmail');
const { sendNotification } = require('../utils/notificationHelper');

const router = express.Router();

// إعداد Multer لرفع الملفات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/resumes';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('يُسمح فقط بملفات PDF و DOC و DOCX'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// @desc    التقدم لوظيفة
// @route   POST /api/applications
// @access  Private (Job Seekers only)
router.post('/', protect, authorize('jobseeker', 'individual'), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    // التحقق من وجود الوظيفة
    const job = await Job.findById(jobId).populate('company');
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'الوظيفة غير موجودة'
      });
    }

    // التحقق من حالة الوظيفة
    if (job.status !== 'نشط') {
      return res.status(400).json({
        success: false,
        message: 'هذه الوظيفة غير متاحة للتقديم'
      });
    }

    // التحقق من انتهاء موعد التقديم
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'انتهى موعد التقديم لهذه الوظيفة'
      });
    }

    // التحقق من عدم التقديم المسبق
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'لقد تقدمت لهذه الوظيفة من قبل'
      });
    }

    // إعداد بيانات الطلب
    const applicationData = {
      job: jobId,
      applicant: req.user._id,
      employer: job.company._id,
      coverLetter
    };

    // إضافة معلومات السيرة الذاتية إذا تم رفعها
    if (req.file) {
      applicationData.resume = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      };
    }

    // إنشاء الطلب
    const application = await Application.create(applicationData);

    // تحليل السيرة الذاتية والمطابقة بالذكاء الاصطناعي
    try {
      let resumeAnalysis = null;
      let matchingScore = null;

      if (req.file) {
        resumeAnalysis = await analyzeResume(req.file.path);
        application.resumeAnalysis = resumeAnalysis;
      }

      // حساب درجة المطابقة
      const applicantProfile = await User.findById(req.user._id);
      matchingScore = await calculateMatchingScore(job, applicantProfile, resumeAnalysis);
      application.aiAnalysis = matchingScore;

      await application.save();
    } catch (aiError) {
      console.error('خطأ في تحليل الذكاء الاصطناعي:', aiError);
    }

    // إرسال إشعار بالبريد الإلكتروني لصاحب العمل
    try {
      await sendEmail({
        email: job.company.email,
        subject: `طلب توظيف جديد - ${job.title}`,
        message: `
          تم استلام طلب توظيف جديد للوظيفة: ${job.title}
          
          المتقدم: ${req.user.name}
          البريد الإلكتروني: ${req.user.email}
          
          يمكنك مراجعة الطلب من خلال لوحة التحكم.
        `
      });

      // إرسال إشعار داخل المنصة
      const io = req.app.get('io');
      await sendNotification({
        recipient: job.company._id,
        sender: req.user._id,
        type: 'application',
        title: 'طلب توظيف جديد',
        message: `تقدم ${req.user.name} لوظيفة ${job.title}`,
        link: `/employer/jobs/${job._id}/applications`
      }, io);
    } catch (emailError) {
      console.error('خطأ في إرسال البريد الإلكتروني:', emailError);
    }

    // تحديث إحصائيات الوظيفة
    await Job.findByIdAndUpdate(jobId, {
      $inc: { 'stats.applications': 1 }
    });

    // إرجاع الطلب مع التفاصيل
    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title companyName')
      .populate('applicant', 'name email profile');

    res.status(201).json({
      success: true,
      data: populatedApplication
    });
  } catch (error) {
    console.error(error);
    
    // حذف الملف في حالة الخطأ
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : error.name === 'CastError'
        ? `خطأ في نوع البيانات: القيمة غير صالحة للحقل ${error.path}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    التحقق مما إذا كان المستخدم قد تقدم لهذه الوظيفة
// @route   GET /api/applications/check/:jobId
// @access  Private
router.get('/check/:jobId', protect, async (req, res) => {
  try {
    const application = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user._id
    });

    res.status(200).json({
      success: true,
      hasApplied: !!application,
      application: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : error.name === 'CastError'
        ? `خطأ في نوع البيانات: القيمة غير صالحة للحقل ${error.path}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    الحصول على طلبات المستخدم
// @route   GET /api/applications/my
// @access  Private (Job Seekers)
router.get('/my', protect, authorize('jobseeker', 'individual'), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = { applicant: req.user._id };

    // تصفية حسب الحالة
    if (req.query.status) {
      query.status = req.query.status;
    }

    const applications = await Application.find(query)
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit)
      .populate('job', 'title companyName location jobType salary status')
      .populate('employer', 'name employerProfile.companyName');

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      data: applications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : error.name === 'CastError'
        ? `خطأ في نوع البيانات: القيمة غير صالحة للحقل ${error.path}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    الحصول على طلبات التوظيف للوظائف الخاصة بصاحب العمل
// @route   GET /api/applications/employer
// @access  Private (Employers)
router.get('/employer', protect, authorize('employer', 'company', 'admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = { employer: req.user._id };

    // تصفية حسب الوظيفة
    if (req.query.jobId) {
      query.job = req.query.jobId;
    }

    // تصفية حسب الحالة
    if (req.query.status) {
      query.status = req.query.status;
    }

    // ترتيب حسب درجة المطابقة أو التاريخ
    let sortBy = '-createdAt';
    if (req.query.sort === 'matching_score') {
      sortBy = '-aiAnalysis.matchingScore';
    }

    const applications = await Application.find(query)
      .sort(sortBy)
      .skip(startIndex)
      .limit(limit)
      .populate('job', 'title')
      .populate('applicant', 'name email profile jobseekerProfile');

    const total = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      data: applications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : error.name === 'CastError'
        ? `خطأ في نوع البيانات: القيمة غير صالحة للحقل ${error.path}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    الحصول على طلب توظيف واحد
// @route   GET /api/applications/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant', '-password')
      .populate('employer', 'name email employerProfile');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'طلب التوظيف غير موجود'
      });
    }

    // التحقق من الصلاحية
    if (
      application.applicant._id.toString() !== req.user._id.toString() &&
      application.employer._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لعرض هذا الطلب'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : error.name === 'CastError'
        ? `خطأ في نوع البيانات: القيمة غير صالحة للحقل ${error.path}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    تحديث حالة طلب التوظيف
// @route   PUT /api/applications/:id/status
// @access  Private (Employers only)
router.put('/:id/status', protect, authorize('employer', 'company', 'admin'), async (req, res) => {
  try {
    const { status, reason } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'طلب التوظيف غير موجود'
      });
    }

    // التحقق من الصلاحية
    if (application.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لتحديث هذا الطلب'
      });
    }

    // تحديث الحالة
    const oldStatus = application.status;
    application.status = status;

    // إضافة سجل تغيير الحالة
    application.statusHistory.push({
      status,
      changedBy: req.user._id,
      reason
    });

    await application.save();

    // إرسال إشعار للمتقدم
    try {
      let emailSubject = '';
      let emailMessage = '';
      let notificationTitle = 'تحديث على طلب التوظيف';
      let notificationMessage = '';

      switch (status) {
        case 'قيد المراجعة':
          emailSubject = 'طلبك قيد المراجعة';
          emailMessage = `طلب التوظيف الخاص بك للوظيفة "${application.job.title}" قيد المراجعة حالياً.`;
          notificationMessage = `طلبك لوظيفة ${application.job.title} أصبح قيد المراجعة`;
          break;
        case 'مقبول':
          emailSubject = 'تم قبول طلبك!';
          emailMessage = `تهانينا! تم قبول طلب التوظيف الخاص بك للوظيفة "${application.job.title}".`;
          notificationTitle = 'تهانينا! تم قبولك';
          notificationMessage = `تم قبول طلبك لوظيفة ${application.job.title}`;
          break;
        case 'مرفوض':
          emailSubject = 'تحديث على طلب التوظيف';
          emailMessage = `نشكرك على اهتمامك بالوظيفة "${application.job.title}". لم يتم اختيارك هذه المرة.`;
          notificationMessage = `للأسف لم يتم اختيارك لوظيفة ${application.job.title}`;
          break;
        case 'مقابلة':
          emailSubject = 'دعوة لمقابلة عمل';
          emailMessage = `تهانينا! تم دعوتك لمقابلة عمل للوظيفة "${application.job.title}".`;
          notificationTitle = 'دعوة لمقابلة عمل';
          notificationMessage = `تمت دعوتك لمقابلة عمل لوظيفة ${application.job.title}`;
          break;
      }

      if (emailSubject) {
        await sendEmail({
          email: application.applicant.email,
          subject: emailSubject,
          message: emailMessage
        });

        // إرسال إشعار داخل المنصة
        const io = req.app.get('io');
        await sendNotification({
          recipient: application.applicant._id,
          sender: req.user._id,
          type: 'application',
          title: notificationTitle,
          message: notificationMessage,
          link: '/my-applications'
        }, io);
      }
    } catch (emailError) {
      console.error('خطأ في إرسال البريد الإلكتروني/الإشعار:', emailError);
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : error.name === 'CastError'
        ? `خطأ في نوع البيانات: القيمة غير صالحة للحقل ${error.path}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    جدولة مقابلة فيديو
// @route   POST /api/applications/:id/schedule-video-interview
// @access  Private (Employers only)
router.post('/:id/schedule-video-interview', protect, authorize('employer', 'company', 'admin'), async (req, res) => {
  try {
    const { date, time, notes } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('applicant');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'طلب التوظيف غير موجود'
      });
    }

    // التحقق من الصلاحية
    if (application.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لجدولة مقابلة لهذا الطلب'
      });
    }

    const roomId = crypto.randomBytes(16).toString('hex');
    const meetingLink = `/smart-interview/${roomId}`;

    // تحديث البيانات باستخدام findOneAndUpdate لتجنب مشاكل middleware و validation المعقدة
    const updatedApplication = await Application.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          interview: {
            scheduled: true,
            date: new Date(date),
            time: time,
            type: 'فيديو',
            meetingLink: meetingLink,
            notes: notes,
            videoInterview: {
              roomId: roomId,
              status: 'waiting'
            }
          },
          status: 'مقابلة'
        },
        $push: {
          statusHistory: {
            status: 'مقابلة',
            changedBy: req.user._id,
            reason: 'تم تحديد موعد للمقابلة'
          }
        }
      },
      { new: true, runValidators: false }
    ).populate('job').populate('applicant');

    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: 'فشل تحديث طلب التوظيف'
      });
    }

    // محاولة إرسال الإشعارات (اختياري)
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await sendEmail({
          email: updatedApplication.applicant.email,
          subject: 'دعوة لمقابلة فيديو - ' + updatedApplication.job.title,
          message: `تمت دعوتك لمقابلة عمل فيديو للوظيفة "${updatedApplication.job.title}".
        
التاريخ: ${date}
الوقت: ${time}
الرابط: ${process.env.FRONTEND_URL || 'http://localhost:3000'}${meetingLink}

نتمنى لك التوفيق!`
        }).catch(err => console.error('فشل إرسال البريد الإلكتروني:', err.message));
      }

      const io = req.app.get('io');
      await sendNotification({
        recipient: updatedApplication.applicant._id,
        sender: req.user._id,
        type: 'application',
        title: 'موعد مقابلة فيديو',
        message: `تم تحديد موعد مقابلة فيديو لوظيفة ${updatedApplication.job.title} في ${date} الساعة ${time}`,
        link: '/my-applications'
      }, io).catch(err => console.error('فشل إرسال الإشعار الداخلي:', err.message));
    } catch (notifyError) {
      console.error('خطأ غير متوقع في نظام الإشعارات:', notifyError);
    }

    res.status(200).json({
      success: true,
      message: 'تمت جدولة المقابلة بنجاح',
      data: updatedApplication
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message})`
    });
  }
});

module.exports = router;
