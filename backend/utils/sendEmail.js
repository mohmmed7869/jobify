const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // إنشاء transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // إعداد الرسالة
    const message = {
      from: `Jobify <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">Jobify</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">نربط المواهب بالفرص</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">${options.subject}</h2>
              <div style="color: #374151; line-height: 1.6; white-space: pre-line;">
                ${options.message}
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                هذا البريد الإلكتروني تم إرساله تلقائياً من Jobify
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
                إذا كان لديك أي استفسارات، يرجى التواصل معنا
              </p>
            </div>
          </div>
        </div>
      `
    };

    // إرسال البريد
    const info = await transporter.sendMail(message);
    
    console.log('تم إرسال البريد الإلكتروني بنجاح:', info.messageId);
    return info;
  } catch (error) {
    console.error('خطأ في إرسال البريد الإلكتروني:', error);
    throw error;
  }
};

// إرسال بريد ترحيب للمستخدمين الجدد
const sendWelcomeEmail = async (user) => {
  const welcomeMessage = `
مرحباً ${user.name}،

أهلاً وسهلاً بك في Jobify!

نحن سعداء لانضمامك إلى مجتمعنا المتنامي من المحترفين وأصحاب العمل.

${user.role === 'jobseeker' ? 
  `كباحث عن عمل، يمكنك الآن:
• إنشاء ملف شخصي مهني
• رفع سيرتك الذاتية
• البحث عن الوظائف المناسبة
• التقدم للوظائف بنقرة واحدة
• الحصول على توصيات ذكية للوظائف

ننصحك بإكمال ملفك الشخصي لزيادة فرص العثور على الوظيفة المثالية.` :
  `كصاحب عمل، يمكنك الآن:
• نشر إعلانات الوظائف
• البحث عن المرشحين المناسبين
• إدارة طلبات التوظيف
• استخدام أدوات الذكاء الاصطناعي للفرز
• جدولة المقابلات

ابدأ بنشر أول وظيفة لك واكتشف المواهب المميزة.`
}

نتطلع لمساعدتك في رحلتك المهنية!

فريق Jobify
  `;

  return await sendEmail({
    email: user.email,
    subject: 'مرحباً بك في Jobify! 🎉',
    message: welcomeMessage
  });
};

// إرسال تذكير بإكمال الملف الشخصي
const sendProfileCompletionReminder = async (user) => {
  const reminderMessage = `
مرحباً ${user.name},

نلاحظ أن ملفك الشخصي لم يكتمل بعد.

إكمال ملفك الشخصي يزيد من فرصك في:
• العثور على الوظائف المناسبة
• ظهور ملفك في نتائج البحث
• الحصول على توصيات أفضل

يرجى تسجيل الدخول وإكمال المعلومات التالية:
${user.role === 'jobseeker' ? 
  `• المهارات والخبرات
• التعليم والشهادات
• تفضيلات العمل
• رفع السيرة الذاتية` :
  `• معلومات الشركة
• شعار الشركة
• وصف الشركة
• معلومات الاتصال`
}

لا تفوت الفرص المتاحة!

فريق Jobify
  `;

  return await sendEmail({
    email: user.email,
    subject: 'أكمل ملفك الشخصي لفرص أفضل 📝',
    message: reminderMessage
  });
};

// إرسال تقرير أسبوعي للمستخدمين
const sendWeeklyReport = async (user, stats) => {
  const reportMessage = `
مرحباً ${user.name},

إليك تقريرك الأسبوعي من Jobify:

${user.role === 'jobseeker' ? 
  `📊 إحصائياتك هذا الأسبوع:
• ${stats.profileViews || 0} مشاهدة لملفك الشخصي
• ${stats.jobsApplied || 0} وظيفة تقدمت لها
• ${stats.newMatches || 0} وظيفة جديدة مناسبة لك

🎯 وظائف قد تهمك:
${stats.recommendedJobs ? stats.recommendedJobs.map(job => `• ${job.title} - ${job.company}`).join('\n') : 'لا توجد توصيات جديدة'}

💡 نصيحة الأسبوع:
حدث مهاراتك وخبراتك بانتظام لتحسين فرص العثور على الوظيفة المناسبة.` :
  `📊 إحصائيات شركتك هذا الأسبوع:
• ${stats.jobViews || 0} مشاهدة لوظائفك
• ${stats.newApplications || 0} طلب توظيف جديد
• ${stats.activeJobs || 0} وظيفة نشطة

👥 أفضل المرشحين:
${stats.topCandidates ? stats.topCandidates.map(candidate => `• ${candidate.name} - درجة المطابقة: ${candidate.score}%`).join('\n') : 'لا توجد طلبات جديدة'}

💡 نصيحة الأسبوع:
استخدم أدوات الذكاء الاصطناعي لتحسين إعلانات الوظائف وجذب المرشحين المناسبين.`
}

استمر في التميز!

فريق Jobify
  `;

  return await sendEmail({
    email: user.email,
    subject: 'تقريرك الأسبوعي 📈',
    message: reportMessage
  });
};

// إرسال إشعار بوظيفة جديدة مناسبة
const sendJobMatchNotification = async (user, job, matchScore) => {
  const notificationMessage = `
مرحباً ${user.name},

وجدنا وظيفة قد تناسبك!

🎯 ${job.title}
🏢 ${job.companyName}
📍 ${job.location.city || 'عن بُعد'}
💰 ${job.salary ? `${job.salary.min} - ${job.salary.max} ${job.salary.currency}` : 'راتب تنافسي'}

📊 درجة المطابقة: ${matchScore}%

${job.description.substring(0, 200)}...

لا تفوت هذه الفرصة! تقدم الآن قبل انتهاء الموعد.

[رابط التقديم سيكون هنا]

حظاً موفقاً!

فريق Jobify
  `;

  return await sendEmail({
    email: user.email,
    subject: `وظيفة مناسبة لك: ${job.title} 🎯`,
    message: notificationMessage
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendProfileCompletionReminder,
  sendWeeklyReport,
  sendJobMatchNotification
};