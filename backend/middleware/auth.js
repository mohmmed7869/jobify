const jwt = require('jsonwebtoken');
const User = require('../models/User');

// حماية المسارات
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // الحصول على الرمز المميز من الهيدر
      token = req.headers.authorization.split(' ')[1];

      // التحقق من الرمز المميز
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // الحصول على المستخدم من قاعدة البيانات
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'الحساب غير نشط'
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: `غير مخول للوصول (${error.message})`
      });
    }
  } else if (req.cookies && req.cookies.token) {
    try {
      token = req.cookies.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'الحساب غير نشط'
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: `غير مخول للوصول (${error.message})`
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مخول للوصول، لا يوجد رمز مميز'
    });
  }
};

// التحقق من الأدوار
const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user.role === 'admin' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `دور المستخدم ${req.user.role} غير مخول للوصول لهذا المسار`
    });
  };
};

// التحقق من ملكية المورد
const checkOwnership = (Model, resourceField = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params[resourceField]);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      // التحقق من الملكية أو الصلاحية (الأدمن له صلاحية كاملة)
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      if (resource.user && resource.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'غير مخول للوصول لهذا المورد'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
      });
    }
  };
};

// تسجيل آخر نشاط للمستخدم
const updateLastActivity = async (req, res, next) => {
  if (req.user) {
    try {
      await User.findByIdAndUpdate(req.user.id, {
        lastLogin: new Date()
      });
    } catch (error) {
      console.error('خطأ في تحديث آخر نشاط:', error);
    }
  }
  next();
};

// التحقق من التحقق من البريد الإلكتروني
const requireVerification = (req, res, next) => {
  // السماح للأدمن أو إذا كان الحساب موثقاً
  if (req.user.role === 'admin' || req.user.isVerified) {
    return next();
  }
  
  // ملاحظة: تم تسهيل هذا الشرط مؤقتاً لفتح الشاشات
  // return next();

  return res.status(403).json({
    success: false,
    message: 'يجب التحقق من البريد الإلكتروني أولاً'
  });
};

// حد معدل الطلبات
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // تنظيف الطلبات القديمة
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    const currentRequests = requests.get(key) || [];

    if (currentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'تم تجاوز حد الطلبات المسموح'
      });
    }

    currentRequests.push(now);
    requests.set(key, currentRequests);

    next();
  };
};

module.exports = {
  protect,
  authorize,
  checkOwnership,
  updateLastActivity,
  requireVerification,
  rateLimit
};