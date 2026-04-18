const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان الوظيفة مطلوب'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'وصف الوظيفة مطلوب']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  location: {
    city: String,
    country: String,
    remote: {
      type: Boolean,
      default: false
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  jobType: {
    type: String,
    enum: ['دوام كامل', 'دوام جزئي', 'عقد', 'تدريب', 'عمل حر'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  industry: String,
  experienceLevel: {
    type: String,
    enum: ['مبتدئ', 'متوسط', 'خبير', 'مدير'],
    required: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    negotiable: {
      type: Boolean,
      default: false
    }
  },
  requirements: {
    skills: [String],
    education: String,
    experience: String,
    languages: [String],
    certifications: [String]
  },
  benefits: [String],
  responsibilities: [String],
  applicationDeadline: Date,
  status: {
    type: String,
    enum: ['نشط', 'مغلق', 'مسودة', 'منتهي الصلاحية'],
    default: 'نشط'
  },
  // إعدادات الذكاء الاصطناعي
  aiSettings: {
    enableAutoScreening: {
      type: Boolean,
      default: true
    },
    screeningCriteria: {
      requiredSkills: [String],
      minimumExperience: Number,
      educationLevel: String
    },
    matchingScore: {
      skillsWeight: {
        type: Number,
        default: 0.4
      },
      experienceWeight: {
        type: Number,
        default: 0.3
      },
      educationWeight: {
        type: Number,
        default: 0.2
      },
      locationWeight: {
        type: Number,
        default: 0.1
      }
    }
  },
  // الإحصائيات
  stats: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    shortlisted: {
      type: Number,
      default: 0
    },
    hired: {
      type: Number,
      default: 0
    }
  },
  // تحليل الذكاء الاصطناعي
  aiAnalysis: {
    keywordDensity: [{
      keyword: String,
      count: Number,
      relevance: Number
    }],
    difficultyScore: Number,
    competitivenessScore: Number,
    suggestions: [String],
    lastAnalyzed: Date
  },
  featured: {
    type: Boolean,
    default: false
  },
  urgent: {
    type: Boolean,
    default: false
  },
  // ميزات التواصل الاجتماعي
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  shares: {
    type: Number,
    default: 0
  },
  tags: [String],
  visibility: {
    type: String,
    enum: ['public', 'private', 'connections'],
    default: 'public'
  }
}, {
  timestamps: true
});

// إنشاء فهارس للبحث السريع
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ category: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ 'requirements.skills': 1 });

// Middleware لتحديث إحصائيات الشركة
jobSchema.post('save', async function() {
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.company, {
    $inc: { 'stats.jobsPosted': 1 }
  });
});

module.exports = mongoose.model('Job', jobSchema);