const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { analyzeResume } = require('../utils/aiHelpers');

const router = express.Router();

// إعداد Multer لرفع الصور والوثائق
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'avatar') uploadPath += 'avatars';
    else if (file.fieldname === 'companyLogo') uploadPath += 'company-logos';
    else if (file.fieldname === 'resume') uploadPath += 'resumes';
    else if (file.fieldname === 'idCardImage') uploadPath += 'id-cards';
    else uploadPath += 'others';

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
  if (file.fieldname === 'avatar' || file.fieldname === 'companyLogo' || file.fieldname === 'idCardImage') {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('يُسمح فقط بملفات الصور (JPEG, JPG, PNG, GIF)'));
  } else if (file.fieldname === 'resume') {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf' || 
                   file.mimetype === 'application/msword' || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (mimetype && extname) return cb(null, true);
    cb(new Error('يُسمح فقط بملفات (PDF, DOC, DOCX)'));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// @desc    الحصول على جميع المستخدمين
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = {};

    // تصفية حسب الدور
    if (req.query.role) {
      query.role = req.query.role;
    }

    // تصفية حسب الحالة
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // البحث
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    الحصول على مستخدم واحد
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من الصلاحية (المستخدم نفسه أو الأدمن أو طلب لملف شخصي عام)
    // نستخدم محاولة للحصول على المستخدم الحالي من الرمز المميز إذا وجد
    let currentUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = await User.findById(decoded.id);
      } catch (err) {
        // الرمز غير صالح، نستمر كمستخدم زائر
      }
    }

    // إذا كان المستخدم يطلب ملفه الشخصي أو هو أدمن، نعطيه البيانات كاملة
    if (currentUser && (currentUser._id.toString() === req.params.id || currentUser.role === 'admin')) {
      return res.status(200).json({
        success: true,
        data: user
      });
    }

    // إذا كان يطلب ملف شخصي لمستخدم آخر، نخفي البيانات الحساسة
    const publicUser = {
      _id: user._id,
      name: user.name,
      role: user.role,
      profile: {
        avatar: user.profile?.avatar,
        bio: user.profile?.bio,
        location: user.profile?.location ? {
          city: user.profile.location.city,
          country: user.profile.location.country
        } : undefined,
        socialLinks: user.profile?.socialLinks
      },
      jobseekerProfile: user.role === 'jobseeker' ? {
        skills: user.jobseekerProfile?.skills,
        experience: user.jobseekerProfile?.experience,
        education: user.jobseekerProfile?.education,
        languages: user.jobseekerProfile?.languages
      } : undefined,
      employerProfile: user.role === 'employer' ? {
        companyName: user.employerProfile?.companyName,
        industry: user.employerProfile?.industry,
        companyDescription: user.employerProfile?.companyDescription,
        companySize: user.employerProfile?.companySize,
        headquarters: user.employerProfile?.headquarters
      } : undefined,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      data: publicUser
    });
  } catch (error) {
    console.error('Error in GET /api/users/:id:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم غير صحيح'
      });
    }
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    تحديث الملف الشخصي
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'idCardImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التأكد من وجود كائن profile
    if (!user.profile) {
      user.profile = {};
    }

    // تحديث المعلومات الأساسية
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.set('profile.phone', req.body.phone);
    if (req.body.bio) user.set('profile.bio', req.body.bio);
    if (req.body.website) user.set('profile.website', req.body.website);

    // تحديث الموقع
    if (req.body.location) {
      try {
        const locationData = typeof req.body.location === 'string' 
          ? JSON.parse(req.body.location) 
          : req.body.location;
        
        // التأكد من تهيئة الكائن لتجنب أخطاء Cast
        if (!user.profile.location) user.profile.location = {};
        
        if (locationData.city !== undefined) user.set('profile.location.city', locationData.city);
        if (locationData.country !== undefined) user.set('profile.location.country', locationData.country);
        
        // معالجة الإحداثيات بحذر شديد (منع كلمة "undefined" تماماً)
        if (locationData.coordinates && locationData.coordinates !== "undefined" && locationData.coordinates !== "null" && locationData.coordinates !== null) {
          let coords = null;
          
          // إذا كان مصفوفة [lng, lat]
          if (Array.isArray(locationData.coordinates) && locationData.coordinates.length === 2) {
            const lng = parseFloat(locationData.coordinates[0]);
            const lat = parseFloat(locationData.coordinates[1]);
            if (!isNaN(lng) && !isNaN(lat)) coords = [lng, lat];
          } 
          // إذا كان كائن {lat, lng}
          else if (typeof locationData.coordinates === 'object') {
            const lat = parseFloat(locationData.coordinates.lat);
            const lng = parseFloat(locationData.coordinates.lng);
            if (!isNaN(lat) && !isNaN(lng)) coords = [lng, lat];
          }

          if (coords) {
            user.set('profile.location.coordinates', coords);
          } else {
            // حذف الحقل تماماً إذا كانت القيمة غير صالحة لمنع خطأ Cast
            user.set('profile.location.coordinates', undefined);
          }
        } else {
          // إذا كانت القيمة "undefined" أو غير موجودة، نتأكد من عدم محاولة حفظها
          user.set('profile.location.coordinates', undefined);
        }
      } catch (e) {
        console.error('Error parsing location:', e);
      }
    }

    // تحديث الروابط الاجتماعية
    if (req.body.socialLinks) {
      try {
        const socialLinks = JSON.parse(req.body.socialLinks);
        user.set('profile.socialLinks', {
          ...user.profile?.socialLinks || {},
          ...socialLinks
        });
      } catch (e) {
        console.error('Error parsing socialLinks:', e);
      }
    }
    
    user.markModified('profile');

    // تحديث الصورة الشخصية أو شعار الشركة
    if (req.files && req.files['avatar']) {
      const avatarPath = req.files['avatar'][0].path.replace(/\\/g, '/');
      
      // إذا كان المستخدم صاحب عمل، نحفظ الصورة كشعار للشركة
      if (user.role === 'employer' || user.role === 'company') {
        if (!user.employerProfile) user.employerProfile = {};
        
        // حذف الشعار القديم
        if (user.employerProfile.companyLogo && fs.existsSync(user.employerProfile.companyLogo)) {
          try { fs.unlinkSync(user.employerProfile.companyLogo); } catch(e) {}
        }
        user.employerProfile.companyLogo = avatarPath;
        user.markModified('employerProfile');
      } else {
        // حذف الصورة القديمة للباحث عن عمل
        if (user.profile.avatar && fs.existsSync(user.profile.avatar)) {
          try { fs.unlinkSync(user.profile.avatar); } catch(e) {}
        }
        user.profile.avatar = avatarPath;
        user.markModified('profile');
      }
    }

    // تحديث صورة البطاقة
    if (req.files && req.files['idCardImage']) {
      // حذف الصورة القديمة
      if (user.profile.idCardImage && fs.existsSync(user.profile.idCardImage)) {
        try { fs.unlinkSync(user.profile.idCardImage); } catch(e) {}
      }
      user.profile.idCardImage = req.files['idCardImage'][0].path.replace(/\\/g, '/');
      user.markModified('profile');
    }

    // تحديث ملف تعريف صاحب العمل إذا تم توفيره
    if (req.body.employerProfile) {
      try {
        const employerProfileData = JSON.parse(req.body.employerProfile);
        
        if (!user.employerProfile) user.employerProfile = {};

        // تحديث الحقول بشكل مباشر لضمان تتبع التغييرات
        Object.keys(employerProfileData).forEach(key => {
          if (employerProfileData[key] !== undefined) {
            user.set(`employerProfile.${key}`, employerProfileData[key]);
          }
        });
        user.markModified('employerProfile');
      } catch (e) {
        console.error('Error parsing employerProfile:', e);
      }
    }

    // تحديث ملف تعريف الباحث عن عمل إذا تم توفيره
    if (req.body.jobseekerProfile) {
      try {
        let jobseekerProfileData = JSON.parse(req.body.jobseekerProfile);
        
        if (!user.jobseekerProfile) {
          user.jobseekerProfile = {};
        }

        const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

        // تحديث الحقول الأساسية
        if (jobseekerProfileData.skills) {
          user.set('jobseekerProfile.skills', jobseekerProfileData.skills);
        }
        
        if (jobseekerProfileData.languages) {
          user.set('jobseekerProfile.languages', jobseekerProfileData.languages);
        }
        
        // تنظيف وتحديث الخبرات
        if (jobseekerProfileData.experience) {
          user.set('jobseekerProfile.experience', jobseekerProfileData.experience.map(exp => {
            const start = exp.startDate && exp.startDate !== '' ? new Date(exp.startDate) : null;
            const end = exp.endDate && exp.endDate !== '' ? new Date(exp.endDate) : null;
            return {
              title: exp.title || '',
              company: exp.company || '',
              location: exp.location || '',
              startDate: isValidDate(start) ? start : null,
              endDate: isValidDate(end) ? end : null,
              current: !!exp.current,
              description: exp.description || ''
            };
          }));
        }

        // تنظيف وتحديث التعليم
        if (jobseekerProfileData.education) {
          user.set('jobseekerProfile.education', jobseekerProfileData.education.map(edu => {
            const start = edu.startDate && edu.startDate !== '' ? new Date(edu.startDate) : null;
            const end = edu.endDate && edu.endDate !== '' ? new Date(edu.endDate) : null;
            return {
              degree: edu.degree || '',
              school: edu.school || '',
              fieldOfStudy: edu.fieldOfStudy || '',
              startDate: isValidDate(start) ? start : null,
              endDate: isValidDate(end) ? end : null,
              grade: edu.grade || ''
            };
          }));
        }

        // تنظيف وتحديث الشهادات
        if (jobseekerProfileData.certifications) {
          user.set('jobseekerProfile.certifications', jobseekerProfileData.certifications.map(cert => {
            const issue = cert.issueDate && cert.issueDate !== '' ? new Date(cert.issueDate) : null;
            const expiry = cert.expiryDate && cert.expiryDate !== '' ? new Date(cert.expiryDate) : null;
            return {
              name: cert.name || '',
              issuer: cert.issuer || '',
              issueDate: isValidDate(issue) ? issue : null,
              expiryDate: isValidDate(expiry) ? expiry : null,
              credentialId: cert.credentialId || ''
            };
          }));
        }

        // تحديث التفضيلات
        if (jobseekerProfileData.preferences) {
          const pref = jobseekerProfileData.preferences;
          
          if (!user.jobseekerProfile.preferences) {
            user.jobseekerProfile.preferences = {};
          }

          if (pref.jobTypes) user.set('jobseekerProfile.preferences.jobTypes', pref.jobTypes);
          if (pref.locations) user.set('jobseekerProfile.preferences.locations', pref.locations);
          if (pref.remoteWork !== undefined) user.set('jobseekerProfile.preferences.remoteWork', pref.remoteWork);

          if (pref.salaryRange) {
            user.set('jobseekerProfile.preferences.salaryRange', {
              min: Number(pref.salaryRange.min) || 0,
              max: Number(pref.salaryRange.max) || 0,
              currency: pref.salaryRange.currency || 'USD'
            });
          }
        }

        user.markModified('jobseekerProfile');
      } catch (e) {
        console.error('Error processing jobseekerProfile:', e);
      }
    }

    // تحديث الإعدادات
    if (req.body.settings) {
      try {
        const settingsData = JSON.parse(req.body.settings);
        if (settingsData.language) user.set('settings.language', settingsData.language);
        if (settingsData.notifications) {
          Object.keys(settingsData.notifications).forEach(key => {
            user.set(`settings.notifications.${key}`, settingsData.notifications[key]);
          });
        }
        if (settingsData.privacy) {
          Object.keys(settingsData.privacy).forEach(key => {
            user.set(`settings.privacy.${key}`, settingsData.privacy[key]);
          });
        }
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }

    await user.save();

    // استعادة نسخة كاملة من المستخدم بعد الحفظ لضمان عدم فقدان البيانات
    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Profile Update Error Details:', {
      message: error.message,
      stack: error.stack,
      errors: error.errors // لعرض أخطاء Mongoose Validation إذا وجدت
    });
    
    // حذف الملفات في حالة الخطأ
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        req.files[key].forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }

    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : error.name === 'CastError'
        ? `خطأ في نوع البيانات: القيمة غير صالحة للحقل ${error.path}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      errors: error.errors,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    رفع السيرة الذاتية
// @route   POST /api/users/upload-resume
// @access  Private (Job Seekers only)
router.post('/upload-resume', protect, authorize('jobseeker'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار ملف'
      });
    }

    const user = await User.findById(req.user.id);

    // التأكد من وجود كائن jobseekerProfile
    if (!user.jobseekerProfile) user.jobseekerProfile = {};

    // حذف السيرة الذاتية القديمة
    if (user.jobseekerProfile.resume && fs.existsSync(user.jobseekerProfile.resume)) {
      try {
        fs.unlinkSync(user.jobseekerProfile.resume);
      } catch (err) {
        console.error('Error deleting old resume:', err);
      }
    }

    user.jobseekerProfile.resume = req.file.path.replace(/\\/g, '/');
    user.markModified('jobseekerProfile');
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'تم رفع السيرة الذاتية بنجاح'
    });
  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم أثناء رفع السيرة الذاتية: ${error.message}`
    });
  }
});

// @desc    تحديث ملف الباحث عن عمل
// @route   PUT /api/users/jobseeker-profile
// @access  Private (Job Seekers only)
router.put('/jobseeker-profile', protect, authorize('jobseeker', 'individual'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    if (!user.jobseekerProfile) user.jobseekerProfile = {};

    const isValidDate = (d) => d instanceof Date && !isNaN(d);

    if (req.body.skills) user.jobseekerProfile.skills = req.body.skills;

    if (req.body.experience) {
      user.jobseekerProfile.experience = req.body.experience.map(exp => {
        const start = exp.startDate ? new Date(exp.startDate) : null;
        const end = exp.endDate ? new Date(exp.endDate) : null;
        return {
          ...exp,
          startDate: isValidDate(start) ? start : null,
          endDate: isValidDate(end) ? end : null
        };
      });
    }

    if (req.body.education) {
      user.jobseekerProfile.education = req.body.education.map(edu => {
        const start = edu.startDate ? new Date(edu.startDate) : null;
        const end = edu.endDate ? new Date(edu.endDate) : null;
        return {
          ...edu,
          startDate: isValidDate(start) ? start : null,
          endDate: isValidDate(end) ? end : null
        };
      });
    }

    if (req.body.languages) user.jobseekerProfile.languages = req.body.languages;

    if (req.body.certifications) {
      user.jobseekerProfile.certifications = req.body.certifications.map(cert => {
        const issue = cert.issueDate ? new Date(cert.issueDate) : null;
        const expiry = cert.expiryDate ? new Date(cert.expiryDate) : null;
        return {
          ...cert,
          issueDate: isValidDate(issue) ? issue : null,
          expiryDate: isValidDate(expiry) ? expiry : null
        };
      });
    }

    if (req.body.preferences) user.jobseekerProfile.preferences = req.body.preferences;

    user.markModified('jobseekerProfile');
    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Jobseeker Profile Update Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      errors: error.errors
    });
  }
});

// @desc    تحديث ملف صاحب العمل
// @route   PUT /api/users/employer-profile
// @access  Private (Employers only)
router.put('/employer-profile', protect, authorize('employer', 'company'), upload.single('companyLogo'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تحديث معلومات الشركة
    if (req.body.companyName) user.employerProfile.companyName = req.body.companyName;
    if (req.body.companySize) user.employerProfile.companySize = req.body.companySize;
    if (req.body.industry) user.employerProfile.industry = req.body.industry;
    if (req.body.companyDescription) user.employerProfile.companyDescription = req.body.companyDescription;
    if (req.body.companyWebsite) user.employerProfile.companyWebsite = req.body.companyWebsite;
    if (req.body.establishedYear) user.employerProfile.establishedYear = req.body.establishedYear;
    if (req.body.headquarters) user.employerProfile.headquarters = req.body.headquarters;

    // تحديث شعار الشركة
    if (req.file) {
      // حذف الشعار القديم
      if (user.employerProfile.companyLogo && fs.existsSync(user.employerProfile.companyLogo)) {
        fs.unlinkSync(user.employerProfile.companyLogo);
      }
      user.employerProfile.companyLogo = req.file.path.replace(/\\/g, '/');
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    
    // حذف الملف في حالة الخطأ
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    تحديث إعدادات الذكاء الاصطناعي
// @route   PUT /api/users/ai-settings
// @access  Private
router.put('/ai-settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تحديث إعدادات الذكاء الاصطناعي
    if (req.body.enableRecommendations !== undefined) {
      user.aiSettings.enableRecommendations = req.body.enableRecommendations;
    }
    if (req.body.enableAutoMatching !== undefined) {
      user.aiSettings.enableAutoMatching = req.body.enableAutoMatching;
    }
    if (req.body.enableChatbot !== undefined) {
      user.aiSettings.enableChatbot = req.body.enableChatbot;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    البحث عن المستخدمين
// @route   GET /api/users/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q, role, skills, location, experience } = req.query;

    let query = {};

    // البحث النصي
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'profile.bio': { $regex: q, $options: 'i' } },
        { 'jobseekerProfile.skills': { $regex: q, $options: 'i' } },
        { 'employerProfile.companyName': { $regex: q, $options: 'i' } }
      ];
    }

    // تصفية حسب الدور
    if (role) {
      query.role = role;
    }

    // تصفية حسب المهارات (للباحثين عن عمل)
    if (skills && role === 'jobseeker') {
      const skillsArray = skills.split(',');
      query['jobseekerProfile.skills'] = { $in: skillsArray };
    }

    // تصفية حسب الموقع
    if (location) {
      query.$or = [
        { 'profile.location.city': { $regex: location, $options: 'i' } },
        { 'profile.location.country': { $regex: location, $options: 'i' } }
      ];
    }

    // تصفية حسب سنوات الخبرة
    if (experience && role === 'jobseeker') {
      const expYears = parseInt(experience);
      query['jobseekerProfile.experience'] = { $size: { $gte: expYears } };
    }

    // إضافة شرط النشاط والتحقق
    query.isActive = true;
    query.isVerified = true;

    const users = await User.find(query)
      .select('-password -resetPasswordToken -verificationToken')
      .limit(20)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    الحصول على إحصائيات المستخدم
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    let stats = {
      profileViews: user.stats.profileViews,
      joinDate: user.createdAt,
      lastLogin: user.lastLogin,
      isVerified: user.isVerified
    };

    if (user.role === 'jobseeker') {
      const Application = require('../models/Application');
      
      const applicationStats = await Application.aggregate([
        { $match: { applicant: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      stats.jobsApplied = user.stats.jobsApplied;
      stats.applicationsByStatus = applicationStats;
    } else if (user.role === 'employer') {
      const Job = require('../models/Job');
      const Application = require('../models/Application');

      const jobStats = await Job.aggregate([
        { $match: { company: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const applicationStats = await Application.aggregate([
        { $match: { employer: user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      stats.jobsPosted = user.stats.jobsPosted;
      stats.jobsByStatus = jobStats;
      stats.applicationsByStatus = applicationStats;
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    حذف المستخدم
// @route   DELETE /api/users/:id
// @access  Private (Admin only or own account)
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من الصلاحية
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لحذف هذا المستخدم'
      });
    }

    // حذف الملفات المرتبطة
    if (user.profile.avatar && fs.existsSync(user.profile.avatar)) {
      fs.unlinkSync(user.profile.avatar);
    }
    if (user.employerProfile?.companyLogo && fs.existsSync(user.employerProfile.companyLogo)) {
      fs.unlinkSync(user.employerProfile.companyLogo);
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? `خطأ في التحقق من البيانات: ${Object.values(error.errors).map(val => val.message).join(', ')}`
        : `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;