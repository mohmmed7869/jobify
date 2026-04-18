const fs = require('fs');
const path = require('path');

class SimpleDB {
  constructor() {
    this.dbPath = path.join(__dirname);
    this.ensureDbExists();
  }

  ensureDbExists() {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  // قراءة البيانات من ملف
  read(collection) {
    try {
      const filePath = path.join(this.dbPath, `${collection}.json`);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`خطأ في قراءة ${collection}:`, error);
      return [];
    }
  }

  // كتابة البيانات إلى ملف
  write(collection, data) {
    try {
      const filePath = path.join(this.dbPath, `${collection}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`خطأ في كتابة ${collection}:`, error);
      return false;
    }
  }

  // إضافة عنصر جديد
  insert(collection, item) {
    const data = this.read(collection);
    item.id = item.id || Date.now().toString();
    item.createdAt = new Date().toISOString();
    data.push(item);
    return this.write(collection, data) ? item : null;
  }

  // البحث عن عنصر
  findById(collection, id) {
    const data = this.read(collection);
    return data.find(item => item.id === id);
  }

  // البحث بشروط
  find(collection, query = {}) {
    const data = this.read(collection);
    if (Object.keys(query).length === 0) {
      return data;
    }
    
    return data.filter(item => {
      return Object.keys(query).every(key => {
        if (typeof query[key] === 'string' && typeof item[key] === 'string') {
          return item[key].toLowerCase().includes(query[key].toLowerCase());
        }
        return item[key] === query[key];
      });
    });
  }

  // تحديث عنصر
  update(collection, id, updates) {
    const data = this.read(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
    return this.write(collection, data) ? data[index] : null;
  }

  // حذف عنصر
  delete(collection, id) {
    const data = this.read(collection);
    const filteredData = data.filter(item => item.id !== id);
    return this.write(collection, filteredData);
  }

  // إحصائيات
  getStats() {
    return {
      users: this.read('users').length,
      jobs: this.read('jobs').length,
      applications: this.read('applications').length,
      companies: this.read('companies').length,
      jobSeekers: this.read('job_seekers').length,
      admins: this.read('admins').length,
      timestamp: new Date().toISOString()
    };
  }

  // تسجيل الدخول
  login(email, password, userType) {
    const collection = userType === 'company' ? 'companies' : 
                     userType === 'seeker' ? 'job_seekers' : 
                     userType === 'admin' ? 'admins' : 'users';
    
    const users = this.read(collection);
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      // تحديث آخر تسجيل دخول
      this.update(collection, user.id, { lastLogin: new Date().toISOString() });
      return { success: true, user: { ...user, password: undefined } };
    }
    
    return { success: false, message: 'بيانات الدخول غير صحيحة' };
  }

  // التحقق من الجلسة
  verifySession(token) {
    // محاكاة التحقق من الجلسة
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const sessionData = JSON.parse(decoded);
      return { success: true, user: sessionData };
    } catch {
      return { success: false, message: 'جلسة غير صالحة' };
    }
  }

  // إنشاء جلسة
  createSession(user) {
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      timestamp: new Date().toISOString()
    };
    
    const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    return token;
  }

  // البحث المتقدم في الوظائف
  searchJobs(filters = {}) {
    let jobs = this.read('jobs');
    
    // فلترة حسب العنوان
    if (filters.title) {
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(filters.title.toLowerCase())
      );
    }
    
    // فلترة حسب الشركة
    if (filters.company) {
      jobs = jobs.filter(job => 
        job.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    
    // فلترة حسب الموقع
    if (filters.location) {
      jobs = jobs.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    // فلترة حسب نوع العمل
    if (filters.type) {
      jobs = jobs.filter(job => job.type === filters.type);
    }
    
    // فلترة حسب المهارات
    if (filters.skills && filters.skills.length > 0) {
      jobs = jobs.filter(job => 
        job.requirements && job.requirements.some(req => 
          filters.skills.some(skill => 
            req.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
    
    // فلترة حسب نطاق الراتب
    if (filters.minSalary || filters.maxSalary) {
      jobs = jobs.filter(job => {
        if (!job.salary) return false;
        const salaryNumbers = job.salary.match(/\d+/g);
        if (!salaryNumbers) return false;
        
        const jobMinSalary = parseInt(salaryNumbers[0]);
        const jobMaxSalary = salaryNumbers.length > 1 ? parseInt(salaryNumbers[1]) : jobMinSalary;
        
        if (filters.minSalary && jobMaxSalary < filters.minSalary) return false;
        if (filters.maxSalary && jobMinSalary > filters.maxSalary) return false;
        
        return true;
      });
    }
    
    // ترتيب النتائج
    if (filters.sortBy) {
      jobs.sort((a, b) => {
        switch (filters.sortBy) {
          case 'date':
            return new Date(b.posted) - new Date(a.posted);
          case 'title':
            return a.title.localeCompare(b.title);
          case 'company':
            return a.company.localeCompare(b.company);
          default:
            return 0;
        }
      });
    }
    
    return jobs;
  }

  // البحث في المرشحين
  searchCandidates(filters = {}) {
    let candidates = this.read('job_seekers');
    
    // فلترة حسب المهارات
    if (filters.skills && filters.skills.length > 0) {
      candidates = candidates.filter(candidate => 
        candidate.skills && candidate.skills.some(skill => 
          filters.skills.some(filterSkill => 
            skill.toLowerCase().includes(filterSkill.toLowerCase())
          )
        )
      );
    }
    
    // فلترة حسب الخبرة
    if (filters.experience) {
      candidates = candidates.filter(candidate => 
        candidate.experience && candidate.experience.includes(filters.experience)
      );
    }
    
    // فلترة حسب التعليم
    if (filters.education) {
      candidates = candidates.filter(candidate => 
        candidate.education && candidate.education.toLowerCase().includes(filters.education.toLowerCase())
      );
    }
    
    // فلترة حسب الموقع
    if (filters.location) {
      candidates = candidates.filter(candidate => 
        candidate.location && candidate.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    return candidates;
  }

  // إحصائيات متقدمة
  getAdvancedStats() {
    const jobs = this.read('jobs');
    const applications = this.read('applications');
    const companies = this.read('companies');
    const jobSeekers = this.read('job_seekers');
    
    // إحصائيات الوظائف حسب النوع
    const jobsByType = {};
    jobs.forEach(job => {
      jobsByType[job.type] = (jobsByType[job.type] || 0) + 1;
    });
    
    // إحصائيات الطلبات حسب الحالة
    const applicationsByStatus = {};
    applications.forEach(app => {
      const status = app.status || 'pending';
      applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
    });
    
    // أكثر المهارات طلباً
    const skillDemand = {};
    jobs.forEach(job => {
      if (job.requirements) {
        job.requirements.forEach(skill => {
          skillDemand[skill] = (skillDemand[skill] || 0) + 1;
        });
      }
    });
    
    // ترتيب المهارات حسب الطلب
    const topSkills = Object.entries(skillDemand)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
    
    // إحصائيات الشركات النشطة
    const activeCompanies = companies.filter(company => 
      jobs.some(job => job.company === company.name)
    ).length;
    
    return {
      basic: this.getStats(),
      jobsByType,
      applicationsByStatus,
      topSkills,
      activeCompanies,
      averageApplicationsPerJob: jobs.length > 0 ? Math.round(applications.length / jobs.length) : 0,
      timestamp: new Date().toISOString()
    };
  }

  // إدارة المقابلات
  createInterview(interviewData) {
    const interviews = this.read('interviews') || [];
    const newInterview = {
      id: `interview_${Date.now()}`,
      ...interviewData,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    interviews.push(newInterview);
    this.write('interviews', interviews);
    return newInterview;
  }

  // الحصول على المقابلات
  getInterviews(filters = {}) {
    let interviews = this.read('interviews') || [];
    
    if (filters.candidateId) {
      interviews = interviews.filter(interview => interview.candidateId === filters.candidateId);
    }
    
    if (filters.companyId) {
      interviews = interviews.filter(interview => interview.companyId === filters.companyId);
    }
    
    if (filters.status) {
      interviews = interviews.filter(interview => interview.status === filters.status);
    }
    
    return interviews;
  }

  // تحديث حالة المقابلة
  updateInterviewStatus(interviewId, status, feedback = null) {
    const interviews = this.read('interviews') || [];
    const index = interviews.findIndex(interview => interview.id === interviewId);
    
    if (index !== -1) {
      interviews[index].status = status;
      interviews[index].updatedAt = new Date().toISOString();
      
      if (feedback) {
        interviews[index].feedback = feedback;
      }
      
      this.write('interviews', interviews);
      return interviews[index];
    }
    
    return null;
  }

  // إدارة الإشعارات
  createNotification(notificationData) {
    const notifications = this.read('notifications') || [];
    const newNotification = {
      id: `notification_${Date.now()}`,
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.push(newNotification);
    this.write('notifications', notifications);
    return newNotification;
  }

  // الحصول على الإشعارات
  getNotifications(userId, userType = 'user') {
    const notifications = this.read('notifications') || [];
    return notifications.filter(notification => 
      notification.userId === userId && notification.userType === userType
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // تحديث حالة الإشعار
  markNotificationAsRead(notificationId) {
    const notifications = this.read('notifications') || [];
    const index = notifications.findIndex(notification => notification.id === notificationId);
    
    if (index !== -1) {
      notifications[index].read = true;
      notifications[index].readAt = new Date().toISOString();
      this.write('notifications', notifications);
      return true;
    }
    
    return false;
  }

  // إدارة المحادثات
  createChatMessage(messageData) {
    const messages = this.read('chat_messages') || [];
    const newMessage = {
      id: `message_${Date.now()}`,
      ...messageData,
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    this.write('chat_messages', messages);
    return newMessage;
  }

  // الحصول على المحادثات
  getChatMessages(chatId, limit = 50) {
    const messages = this.read('chat_messages') || [];
    return messages
      .filter(message => message.chatId === chatId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
      .reverse();
  }

  // تنظيف البيانات القديمة
  cleanupOldData(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // تنظيف الإشعارات القديمة
    const notifications = this.read('notifications') || [];
    const recentNotifications = notifications.filter(notification => 
      new Date(notification.createdAt) > cutoffDate
    );
    this.write('notifications', recentNotifications);
    
    // تنظيف الرسائل القديمة
    const messages = this.read('chat_messages') || [];
    const recentMessages = messages.filter(message => 
      new Date(message.timestamp) > cutoffDate
    );
    this.write('chat_messages', recentMessages);
    
    return {
      notificationsRemoved: notifications.length - recentNotifications.length,
      messagesRemoved: messages.length - recentMessages.length
    };
  }

  // نسخ احتياطي للبيانات
  createBackup() {
    const backupData = {
      users: this.read('users'),
      jobs: this.read('jobs'),
      applications: this.read('applications'),
      companies: this.read('companies'),
      job_seekers: this.read('job_seekers'),
      admins: this.read('admins'),
      interviews: this.read('interviews') || [],
      notifications: this.read('notifications') || [],
      chat_messages: this.read('chat_messages') || [],
      timestamp: new Date().toISOString()
    };
    
    const backupFileName = `backup_${Date.now()}.json`;
    this.write(`backups/${backupFileName}`, backupData);
    
    return {
      success: true,
      fileName: backupFileName,
      timestamp: backupData.timestamp
    };
  }
}

module.exports = new SimpleDB();