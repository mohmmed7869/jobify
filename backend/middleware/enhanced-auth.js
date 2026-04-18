/**
 * Enhanced Authentication & Authorization Middleware
 * نظام المصادقة والتفويض المحسن
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const User = require('../models/User');
const winston = require('winston');
const useragent = require('express-useragent');
const geoip = require('geoip-lite');

// Enhanced logging for security events
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.File({ filename: 'logs/security-error.log', level: 'error' })
  ]
});

// Advanced Rate Limiting Configuration
const createRateLimiters = () => {
  const redisClient = process.env.REDIS_URL ? require('redis').createClient(process.env.REDIS_URL) : null;
  
  const RateLimiter = redisClient ? RateLimiterRedis : RateLimiterMemory;
  const rateLimiterConfig = redisClient ? { storeClient: redisClient } : {};

  return {
    // General API rate limiting
    general: new RateLimiter({
      ...rateLimiterConfig,
      keyPrefix: 'general_rl',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60 // Block for 60 seconds
    }),

    // Strict rate limiting for authentication
    auth: new RateLimiter({
      ...rateLimiterConfig,
      keyPrefix: 'auth_rl',
      points: 5, // 5 attempts
      duration: 300, // Per 5 minutes
      blockDuration: 900 // Block for 15 minutes
    }),

    // Password reset rate limiting
    passwordReset: new RateLimiter({
      ...rateLimiterConfig,
      keyPrefix: 'pwd_reset_rl',
      points: 3, // 3 attempts
      duration: 3600, // Per hour
      blockDuration: 3600 // Block for 1 hour
    }),

    // Registration rate limiting
    registration: new RateLimiter({
      ...rateLimiterConfig,
      keyPrefix: 'reg_rl',
      points: 3, // 3 registrations
      duration: 3600, // Per hour
      blockDuration: 7200 // Block for 2 hours
    }),

    // File upload rate limiting
    fileUpload: new RateLimiter({
      ...rateLimiterConfig,
      keyPrefix: 'upload_rl',
      points: 10, // 10 uploads
      duration: 600, // Per 10 minutes
      blockDuration: 1800 // Block for 30 minutes
    })
  };
};

const rateLimiters = createRateLimiters();

// Enhanced JWT Configuration
const JWT_CONFIG = {
  accessTokenExpiry: process.env.JWT_EXPIRE || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRE || '7d',
  issuer: process.env.JWT_ISSUER || 'smart-recruitment-platform',
  audience: process.env.JWT_AUDIENCE || 'smart-recruitment-users'
};

// Encryption utilities
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const { encrypted, iv, authTag } = encryptedData;
    const decipher = crypto.createDecipher(this.algorithm, this.key, Buffer.from(iv, 'hex'));
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

const encryptionService = new EncryptionService();

// Device fingerprinting
const generateDeviceFingerprint = (req) => {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const acceptEncoding = req.get('Accept-Encoding') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`;
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
};

// Session management
class SessionManager {
  constructor() {
    this.activeSessions = new Map(); // In production, use Redis
    this.maxSessionsPerUser = 5;
  }

  createSession(userId, deviceFingerprint, ipAddress, userAgent) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session = {
      id: sessionId,
      userId,
      deviceFingerprint,
      ipAddress,
      userAgent: useragent.parse(userAgent),
      location: geoip.lookup(ipAddress),
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    // Check if user has too many active sessions
    const userSessions = Array.from(this.activeSessions.values())
      .filter(s => s.userId === userId && s.isActive);

    if (userSessions.length >= this.maxSessionsPerUser) {
      // Remove oldest session
      const oldestSession = userSessions.sort((a, b) => a.lastActivity - b.lastActivity)[0];
      this.revokeSession(oldestSession.id);
    }

    this.activeSessions.set(sessionId, session);
    
    // Log session creation
    securityLogger.info('Session created', {
      userId,
      sessionId,
      ipAddress,
      userAgent: session.userAgent,
      location: session.location
    });

    return session;
  }

  validateSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    this.activeSessions.set(sessionId, session);

    return session;
  }

  revokeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.set(sessionId, session);
      
      securityLogger.info('Session revoked', {
        userId: session.userId,
        sessionId
      });
    }
  }

  revokeAllUserSessions(userId) {
    const userSessions = Array.from(this.activeSessions.values())
      .filter(s => s.userId === userId);

    userSessions.forEach(session => {
      this.revokeSession(session.id);
    });

    securityLogger.info('All user sessions revoked', { userId });
  }

  getUserSessions(userId) {
    return Array.from(this.activeSessions.values())
      .filter(s => s.userId === userId && s.isActive);
  }

  // Cleanup expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.revokeSession(sessionId);
      }
    }
  }
}

const sessionManager = new SessionManager();

// Cleanup expired sessions every hour
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);

// Enhanced JWT utilities
const jwtUtils = {
  generateTokens(payload) {
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: JWT_CONFIG.accessTokenExpiry,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      }
    );

    const refreshToken = jwt.sign(
      { userId: payload.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      {
        expiresIn: JWT_CONFIG.refreshTokenExpiry,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      }
    );

    return { accessToken, refreshToken };
  },

  verifyToken(token, isRefreshToken = false) {
    try {
      const secret = isRefreshToken 
        ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
        : process.env.JWT_SECRET;

      return jwt.verify(token, secret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });
    } catch (error) {
      return null;
    }
  },

  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }
};

// Security middleware functions
const securityMiddleware = {
  // Rate limiting middleware
  rateLimit: (limiterName = 'general') => {
    return async (req, res, next) => {
      try {
        const limiter = rateLimiters[limiterName];
        if (!limiter) {
          return next();
        }

        const key = `${req.ip}_${req.user?.id || 'anonymous'}`;
        await limiter.consume(key);
        next();
      } catch (rejRes) {
        const msBeforeNext = Math.round(rejRes.msBeforeNext) || 60000;
        
        securityLogger.warn('Rate limit exceeded', {
          ip: req.ip,
          endpoint: req.path,
          limiter: limiterName,
          retryAfter: msBeforeNext
        });

        res.set('Retry-After', Math.round(msBeforeNext / 1000));
        res.status(429).json({
          success: false,
          message: 'تم تجاوز حد الطلبات المسموح به. يرجى المحاولة مرة أخرى لاحقاً.',
          retryAfter: msBeforeNext
        });
      }
    };
  },

  // Enhanced authentication middleware
  authenticate: async (req, res, next) => {
    try {
      let token = null;
      
      // Extract token from header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      
      // Extract token from cookie
      if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'لم يتم العثور على رمز المصادقة'
        });
      }

      // Verify token
      const decoded = jwtUtils.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'رمز المصادقة غير صحيح أو منتهي الصلاحية'
        });
      }

      // Validate session if sessionId is present
      if (decoded.sessionId) {
        const session = sessionManager.validateSession(decoded.sessionId);
        if (!session) {
          return res.status(401).json({
            success: false,
            message: 'الجلسة غير صحيحة أو منتهية الصلاحية'
          });
        }

        // Verify device fingerprint for additional security
        const currentFingerprint = generateDeviceFingerprint(req);
        if (session.deviceFingerprint !== currentFingerprint) {
          securityLogger.warn('Device fingerprint mismatch', {
            userId: decoded.id,
            sessionId: decoded.sessionId,
            expectedFingerprint: session.deviceFingerprint,
            actualFingerprint: currentFingerprint
          });
          
          // For security, revoke the session
          sessionManager.revokeSession(decoded.sessionId);
          
          return res.status(401).json({
            success: false,
            message: 'تم اكتشاف نشاط مشبوه. يرجى تسجيل الدخول مرة أخرى.'
          });
        }
      }

      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'الحساب غير نشط'
        });
      }

      // Add user to request
      req.user = user;
      req.token = token;
      req.sessionId = decoded.sessionId;

      next();
    } catch (error) {
      securityLogger.error('Authentication error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        success: false,
        message: 'خطأ في المصادقة'
      });
    }
  },

  // Authorization middleware
  authorize: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً'
        });
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        securityLogger.warn('Authorization failed', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
          endpoint: req.path
        });

        return res.status(403).json({
          success: false,
          message: 'غير مخول للوصول لهذا المورد'
        });
      }

      next();
    };
  },

  // Input sanitization middleware
  sanitizeInput: (req, res, next) => {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        // Remove potential XSS attacks
        return value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '')
          .trim();
      }
      return value;
    };

    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) {
        return sanitizeValue(obj);
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    };

    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  },

  // CSRF protection
  csrfProtection: (req, res, next) => {
    // Skip CSRF for GET requests and API calls with valid JWT
    if (req.method === 'GET' || req.path.startsWith('/api/')) {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!token || token !== sessionToken) {
      securityLogger.warn('CSRF token validation failed', {
        ip: req.ip,
        endpoint: req.path,
        providedToken: token,
        expectedToken: sessionToken
      });

      return res.status(403).json({
        success: false,
        message: 'رمز الحماية من CSRF غير صحيح'
      });
    }

    next();
  },

  // Login attempt monitoring
  monitorLoginAttempts: async (req, res, next) => {
    const { email } = req.body;
    const ip = req.ip;
    
    if (!email) {
      return next();
    }

    try {
      // Check for suspicious login patterns
      const recentAttempts = await getRecentLoginAttempts(email, ip);
      
      if (recentAttempts.failed > 5) {
        securityLogger.warn('Multiple failed login attempts detected', {
          email,
          ip,
          failedAttempts: recentAttempts.failed
        });

        // Implement additional security measures
        // For example, require CAPTCHA or temporarily block
        req.requireAdditionalVerification = true;
      }

      next();
    } catch (error) {
      securityLogger.error('Login attempt monitoring error', error);
      next(); // Continue even if monitoring fails
    }
  },

  // Suspicious activity detection
  detectSuspiciousActivity: (req, res, next) => {
    const suspiciousPatterns = [
      // SQL injection patterns
      /(\bunion\b|\bselect\b|\binsert\b|\bdelete\b|\bupdate\b|\bdrop\b)/i,
      // Script injection patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      // Path traversal patterns
      /\.\.\//g,
      // Command injection patterns
      /(\b(cat|ls|ps|pwd|id|whoami)\b|[;&|`])/i
    ];

    const checkForSuspiciousContent = (obj, path = '') => {
      if (typeof obj === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(obj)) {
            securityLogger.warn('Suspicious content detected', {
              ip: req.ip,
              endpoint: req.path,
              suspiciousContent: obj,
              fieldPath: path,
              userAgent: req.get('User-Agent')
            });
            return true;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (checkForSuspiciousContent(value, path ? `${path}.${key}` : key)) {
            return true;
          }
        }
      }
      return false;
    };

    // Check request body and query parameters
    const hasSuspiciousContent = 
      checkForSuspiciousContent(req.body, 'body') ||
      checkForSuspiciousContent(req.query, 'query');

    if (hasSuspiciousContent) {
      return res.status(400).json({
        success: false,
        message: 'تم اكتشاف محتوى مشبوه في الطلب'
      });
    }

    next();
  }
};

// Helper functions
async function getRecentLoginAttempts(email, ip) {
  // Implementation would query database for recent login attempts
  // This is a placeholder
  return {
    failed: 0,
    successful: 0
  };
}

// Enhanced login function with security features
const enhancedLogin = async (req, res, next) => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const deviceFingerprint = generateDeviceFingerprint(req);
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Log failed attempt
      securityLogger.warn('Login attempt with non-existent email', {
        email,
        ip: ipAddress,
        userAgent
      });
      
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed attempt
      securityLogger.warn('Failed login attempt', {
        userId: user._id,
        email,
        ip: ipAddress,
        userAgent
      });

      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير نشط'
      });
    }

    // Create session
    const session = sessionManager.createSession(
      user._id,
      deviceFingerprint,
      ipAddress,
      userAgent
    );

    // Generate tokens
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    };

    const { accessToken, refreshToken } = jwtUtils.generateTokens(tokenPayload);

    // Update user's last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days or 1 day
    };

    res.cookie('token', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
    });

    // Log successful login
    securityLogger.info('Successful login', {
      userId: user._id,
      email,
      ip: ipAddress,
      userAgent,
      sessionId: session.id
    });

    // Send response
    res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      tokens: {
        accessToken,
        refreshToken
      },
      session: {
        id: session.id,
        location: session.location,
        device: session.userAgent
      }
    });

  } catch (error) {
    securityLogger.error('Login error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الدخول'
    });
  }
};

// Enhanced logout function
const enhancedLogout = async (req, res) => {
  try {
    const { sessionId } = req;
    
    if (sessionId) {
      sessionManager.revokeSession(sessionId);
    }

    // Clear cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    // Log logout
    securityLogger.info('User logged out', {
      userId: req.user?.id,
      sessionId,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });

  } catch (error) {
    securityLogger.error('Logout error', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الخروج'
    });
  }
};

module.exports = {
  securityMiddleware,
  sessionManager,
  jwtUtils,
  encryptionService,
  enhancedLogin,
  enhancedLogout,
  generateDeviceFingerprint,
  rateLimiters
};