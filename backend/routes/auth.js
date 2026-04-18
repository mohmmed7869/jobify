const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');
const { protect, rateLimit } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

// إعداد Multer لرفع الصور أثناء التسجيل
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'avatar') uploadPath += 'avatars';
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
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb(new Error('يُسمح فقط بملفات الصور (JPEG, JPG, PNG)'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// إنشاء رمز JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// إرسال الرمز المميز مع الكوكيز
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      profile: user.profile,
      employerProfile: user.employerProfile,
      jobseekerProfile: user.jobseekerProfile
    }
  });
};

// @desc    تسجيل مستخدم جديد
// @route   POST /api/auth/register
// @access  Public
router.post('/register', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'idCardImage', maxCount: 1 }
]), rateLimit(15 * 60 * 1000, 10), async (req, res) => {
  try {
    // التحقق من إعدادات التسجيل
    const settings = await SystemSettings.findOne();
    if (settings && settings.enableRegistration === false) {
      return res.status(403).json({
        success: false,
        message: 'التسجيل مغلق حالياً من قبل الإدارة'
      });
    }

    const { 
      name, 
      email, 
      password, 
      role,
      phone,
      location,
      companyName,
      industry,
      size,
      address,
      description
    } = req.body;

    // التحقق من الحقول المطلوبة
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تقديم الاسم والبريد الإلكتروني وكلمة المرور'
      });
    }

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'هذا البريد الإلكتروني مسجل بالفعل'
      });
    }

    // معالجة الملفات المرفوعة
    const avatar = req.files && req.files['avatar'] ? req.files['avatar'][0].path : undefined;
    const idCardImage = req.files && req.files['idCardImage'] ? req.files['idCardImage'][0].path : undefined;

    // توحيد الأدوار
    let userRole = 'jobseeker';
    if (role === 'employer' || role === 'company') {
      userRole = 'employer';
    } else if (role === 'admin') {
      userRole = 'admin'; // يجب التحقق من صلاحية إنشاء أدمن في الإنتاج
    }

    // إعداد بيانات الملف الشخصي
    const profileData = {
      name,
      phone: phone || '',
      avatar,
      idCardImage,
      location: {
        city: location || address || '',
        country: 'اليمن'
      }
    };

    // إعداد بيانات صاحب العمل
    let employerData = undefined;
    if (userRole === 'employer') {
      employerData = {
        companyName: companyName || name,
        industry: industry || '',
        companySize: size || '',
        headquarters: address || '',
        companyDescription: description || ''
      };
    }

    // إنشاء رمز التحقق أولاً
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // إنشاء المستخدم
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      profile: profileData,
      employerProfile: employerData,
      isActive: true,
      isVerified: false,
      verificationToken: hashedVerificationToken
    });

    // التحقق من إعدادات البريد الإلكتروني
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'placeholder_user' || process.env.EMAIL_USER.includes('example')) {
      console.warn('⚠️ إعدادات البريد الإلكتروني غير مكتملة، تم تخطي إرسال بريد التحقق');
      return res.status(201).json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح (بيئة التطوير: تم تخطي التحقق من البريد)'
      });
    }

    // إرسال بريد التحقق
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify/${verificationToken}`;
    
    const message = `
      مرحباً ${name}،
      
      شكراً لتسجيلك في Jobify!
      
      يرجى النقر على الرابط التالي للتحقق من حسابك:
      ${verifyUrl}
      
      إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'تحقق من حسابك - Jobify',
        message
      });

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني'
      });
    } catch (err) {
      console.error('Email error:', err);
      return res.status(201).json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح. (فشل إرسال بريد التحقق)'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في الخادم'
    });
  }
});

// @desc    تسجيل الدخول
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    // التحقق من وجود البريد وكلمة المرور
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
      });
    }

    // البحث عن المستخدم
    console.log(`Searching for user with email: ${email}`);
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log(`LOGIN ERROR: User NOT found in database: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    console.log(`User found: ${user.name} (${user._id}). Checking password...`);

    // التحقق من كلمة المرور
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log(`LOGIN ERROR: Password mismatch for user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    console.log(`Password matched! Checking if active: ${user.isActive}`);

    // التحقق من نشاط الحساب
    if (!user.isActive) {
      console.log(`LOGIN ERROR: Account is INACTIVE for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'الحساب غير نشط'
      });
    }

    // تحديث آخر تسجيل دخول دون استدعاء hooks
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    console.log(`Login SUCCESS: ${email} (${user.role}) - Generating token...`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في الخادم (المصادقة)'
    });
  }
});

// @desc    تسجيل الخروج
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

// @desc    الحصول على المستخدم الحالي
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في الخادم (المصادقة)'
    });
  }
});

// @desc    تحديث تفاصيل المستخدم
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put('/updatedetails', protect, async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في الخادم (المصادقة)'
    });
  }
});

// @desc    تحديث كلمة المرور
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // التحقق من كلمة المرور الحالية
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في الخادم (المصادقة)'
    });
  }
});

// @desc    نسيان كلمة المرور
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', rateLimit(15 * 60 * 1000, 3), async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'لا يوجد مستخدم بهذا البريد الإلكتروني'
      });
    }

    // إنشاء رمز إعادة تعيين كلمة المرور
    const resetToken = crypto.randomBytes(20).toString('hex');

    // تشفير الرمز وحفظه في قاعدة البيانات
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // تعيين انتهاء صلاحية الرمز (10 دقائق)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // إنشاء رابط إعادة التعيين
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

    const message = `
      تم طلب إعادة تعيين كلمة المرور لحسابك.
      
      يرجى النقر على الرابط التالي لإعادة تعيين كلمة المرور:
      ${resetUrl}
      
      إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'إعادة تعيين كلمة المرور',
        message,
      });

      res.status(200).json({
        success: true,
        message: 'تم إرسال بريد إعادة تعيين كلمة المرور'
      });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'فشل في إرسال البريد الإلكتروني'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في الخادم (المصادقة)'
    });
  }
});

// @desc    إعادة تعيين كلمة المرور
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', async (req, res) => {
  try {
    // تشفير الرمز المرسل
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية'
      });
    }

    // تعيين كلمة المرور الجديدة
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في الخادم (المصادقة)'
    });
  }
});

// @desc    التحقق من البريد الإلكتروني
// @route   GET /api/auth/verify/:token
// @access  Public
router.get('/verify/:token', async (req, res) => {
  try {
    const verificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken
    });

    if (!user) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=invalid_token`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?verified=true`);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطأ في الخادم (المصادقة)'
    });
  }
});

// ==================================================
// Social Login Routes
// ==================================================

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = signToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-auth-success?token=${token}`);
  }
);

// LinkedIn Auth
router.get('/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
router.get('/linkedin/callback', 
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  (req, res) => {
    const token = signToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-auth-success?token=${token}`);
  }
);

// Facebook Auth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    const token = signToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-auth-success?token=${token}`);
  }
);

// Twitter Auth
router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  (req, res) => {
    const token = signToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-auth-success?token=${token}`);
  }
);

// GitHub Auth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    const token = signToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-auth-success?token=${token}`);
  }
);

module.exports = router;