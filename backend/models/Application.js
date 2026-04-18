const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['مرسل', 'قيد المراجعة', 'مقبول', 'مرفوض', 'مقابلة', 'عرض عمل', 'تم التوظيف'],
    default: 'مرسل'
  },
  coverLetter: {
    type: String,
    maxlength: 2000
  },
  resume: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  // تحليل الذكاء الاصطناعي للطلب
  aiAnalysis: {
    matchingScore: {
      type: Number,
      min: 0,
      max: 100
    },
    skillsMatch: {
      matched: [String],
      missing: [String],
      additional: [String],
      score: Number
    },
    experienceMatch: {
      required: Number,
      candidate: Number,
      score: Number
    },
    educationMatch: {
      required: String,
      candidate: String,
      score: Number
    },
    locationMatch: {
      score: Number,
      distance: Number
    },
    overallRecommendation: {
      type: String,
      enum: ['موصى بشدة', 'موصى', 'مقبول', 'غير موصى']
    },
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    lastAnalyzed: {
      type: Date,
      default: Date.now
    }
  },
  // تحليل السيرة الذاتية
  resumeAnalysis: {
    extractedText: String,
    skills: [String],
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String
    }],
    education: [{
      degree: String,
      institution: String,
      year: String
    }],
    languages: [String],
    certifications: [String],
    contactInfo: {
      email: String,
      phone: String,
      linkedin: String
    },
    keywords: [String],
    sentiment: {
      score: Number,
      label: String
    }
  },
  // تتبع التفاعلات
  interactions: [{
    type: {
      type: String,
      enum: ['عرض', 'رسالة', 'مقابلة', 'ملاحظة', 'تقييم']
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // معلومات المقابلة
  interview: {
    scheduled: Boolean,
    date: Date,
    time: String,
    type: {
      type: String,
      enum: ['وجهاً لوجه', 'فيديو', 'هاتف']
    },
    location: String,
    meetingLink: String,
    notes: String,
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      strengths: [String],
      weaknesses: [String],
      recommendation: String
    },
    // بيانات مقابلة الفيديو
    videoInterview: {
      roomId: String,
      status: {
        type: String,
        enum: ['waiting', 'active', 'completed', 'failed'],
        default: 'waiting'
      },
      recordingUrl: String,
      startTime: Date,
      endTime: Date,
      aiAnalysis: {
        sentimentScore: Number,
        confidenceLevel: Number,
        keyKeywords: [String]
      }
    },
    aiMetrics: {
      score: Number,
      feedback: String,
      metrics: mongoose.Schema.Types.Mixed
    }
  },
  // تقييم صاحب العمل
  employerRating: {
    communication: Number,
    qualifications: Number,
    experience: Number,
    cultural_fit: Number,
    overall: Number,
    notes: String
  },
  // الملاحظات الداخلية
  internalNotes: [{
    note: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    private: {
      type: Boolean,
      default: true
    }
  }],
  // تتبع التغييرات في الحالة
  statusHistory: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],
  priority: {
    type: String,
    enum: ['عالي', 'متوسط', 'منخفض'],
    default: 'متوسط'
  },
  source: {
    type: String,
    default: 'منصة'
  }
}, {
  timestamps: true
});

// إنشاء فهارس للبحث السريع
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ employer: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ 'aiAnalysis.matchingScore': -1 });

// Middleware لتحديث الإحصائيات عند إنشاء طلب جديد فقط
applicationSchema.post('save', async function(doc, next) {
  // التحقق مما إذا كان هذا هو الحفظ الأول (إنشاء)
  // ملاحظة: في mongoose، الحقل _isNew يكون true قبل الحفظ و false بعد الحفظ في post-save
  // لذا سنستخدم منطقاً آخر أو نعتمد على أن الزيادة يجب أن تحدث مرة واحدة فقط
  // الطريقة الأفضل هي استخدام pre-save أو التحقق من وجود الحقل في الـ context
  next();
});

// بدلاً من post save المعقد، سنستخدم logic بسيط في الـ route عند الإنشاء فقط
// سأقوم بتعطيل هذا الـ middleware لأنه يسبب تكرار الإحصائيات عند كل تحديث للحالة أو جدولة مقابلة
/*
applicationSchema.post('save', async function() {
  ...
});
*/

module.exports = mongoose.model('Application', applicationSchema);