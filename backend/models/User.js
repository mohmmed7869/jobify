const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'البريد الإلكتروني غير صحيح']
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['jobseeker', 'employer', 'admin', 'individual', 'company'],
    default: 'jobseeker'
  },
  profile: {
    avatar: String,
    phone: String,
    idCardImage: String, // صورة بطاقة الشخصية
    location: {
      city: String,
      country: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
        validate: {
          validator: function(v) {
            if (!v || v.length === 0) return true; // السماح بالقيم الفارغة
            return v.length === 2 && v.every(val => typeof val === 'number' && !isNaN(val));
          },
          message: 'يجب أن تكون الإحداثيات مصفوفة من رقمين [خط الطول، خط العرض]'
        }
      }
    },
    bio: String,
    website: String,
    socialLinks: {
      linkedin: String,
      github: String,
      twitter: String
    }
  },
  // للباحثين عن عمل
  jobseekerProfile: {
    resume: String, // رابط ملف السيرة الذاتية
    skills: [String],
    experience: [{
      title: String,
      company: String,
      location: String,
      startDate: Date,
      endDate: Date,
      current: Boolean,
      description: String
    }],
    education: [{
      degree: String,
      school: String,
      fieldOfStudy: String,
      startDate: Date,
      endDate: Date,
      grade: String
    }],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ['مبتدئ', 'متوسط', 'متقدم', 'طليق']
      }
    }],
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      credentialId: String
    }],
    preferences: {
      jobTypes: [String],
      salaryRange: {
        min: Number,
        max: Number,
        currency: String
      },
      locations: [String],
      remoteWork: Boolean
    }
  },
  // لأصحاب العمل
  employerProfile: {
    companyName: String,
    companySize: String,
    industry: String,
    companyDescription: String,
    companyLogo: String,
    companyWebsite: String,
    establishedYear: Number,
    headquarters: String
  },
  // إعدادات الذكاء الاصطناعي
  aiSettings: {
    enableRecommendations: {
      type: Boolean,
      default: true
    },
    enableAutoMatching: {
      type: Boolean,
      default: true
    },
    enableChatbot: {
      type: Boolean,
      default: true
    }
  },
  // الإحصائيات
  stats: {
    profileViews: {
      type: Number,
      default: 0
    },
    jobsApplied: {
      type: Number,
      default: 0
    },
    jobsPosted: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  // ميزات التواصل الاجتماعي والتوثيق الخارجي
  socialAuth: {
    facebookId: String,
    linkedinId: String,
    githubId: String,
    googleId: String
  },
  settings: {
    language: {
      type: String,
      default: 'ar'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      showExperience: { type: Boolean, default: true },
      showContact: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// مقارنة كلمة المرور
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// إنشاء فهارس للبحث السريع
userSchema.index({ role: 1 });
userSchema.index({ 'jobseekerProfile.skills': 1 });
userSchema.index({ 'employerProfile.industry': 1 });

module.exports = mongoose.model('User', userSchema);