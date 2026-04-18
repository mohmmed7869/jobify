const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');
const SystemSettings = require('./models/SystemSettings');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-recruitment');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing sample data for a clean start
    console.log('Clearing existing sample users, jobs, applications and settings...');
    const adminEmail = 'hshamaljmr53@gmail.com';
    const sampleEmails = [
      adminEmail,
      'employer@example.com',
      'hsa@example.com',
      'tadamon@example.com',
      'candidate@example.com',
      'sara@example.com',
      'mohammed@example.com'
    ];
    await User.deleteMany({ email: { $in: sampleEmails } });
    await Job.deleteMany({});
    await Application.deleteMany({});
    await SystemSettings.deleteMany({});

    // 1. Create Admin User
    console.log('Creating Admin User...');
    await User.create({
        name: 'المهندس هشام المجمر',
        email: adminEmail,
        password: 'admin123456',
        role: 'admin',
        isVerified: true,
        profile: {
          phone: '773988932',
          location: { city: 'صنعاء', country: 'اليمن' }
        }
      });
      console.log('Admin user created successfully.');

    // 2. Create Sample Employers
    const employers = [
      {
        name: 'شركة التقنية الذكية اليمنية',
        email: 'employer@example.com',
        password: 'employer123',
        role: 'employer',
        isVerified: true,
        employerProfile: {
          companyName: 'التقنية الذكية',
          industry: 'Technology',
          companyDescription: 'شركة رائدة في مجال الذكاء الاصطناعي في اليمن',
          headquarters: 'صنعاء'
        }
      },
      {
        name: 'مجموعة هائل سعيد أنعم',
        email: 'hsa@example.com',
        password: 'password123',
        role: 'employer',
        isVerified: true,
        employerProfile: {
          companyName: 'HSA Group',
          industry: 'Manufacturing',
          companyDescription: 'أكبر مجموعة تجارية وصناعية في اليمن',
          headquarters: 'تعز'
        }
      },
      {
        name: 'بنك التضامن الإسلامي',
        email: 'tadamon@example.com',
        password: 'password123',
        role: 'employer',
        isVerified: true,
        employerProfile: {
          companyName: 'Tadamon Bank',
          industry: 'Banking',
          companyDescription: 'من المؤسسات المالية الرائدة في اليمن',
          headquarters: 'صنعاء'
        }
      }
    ];

    let createdEmployers = [];
    for (const empData of employers) {
      let emp = await User.findOne({ email: empData.email });
      if (!emp) {
        emp = await User.create(empData);
        console.log(`Employer ${empData.name} created.`);
      }
      createdEmployers.push(emp);
    }

    // 2.5 Create Sample Jobseekers
    const jobseekers = [
      {
        name: 'أحمد محمد الباحث',
        email: 'candidate@example.com',
        password: 'candidate123',
        role: 'jobseeker',
        isVerified: true,
        profile: {
          phone: '777111222',
          location: { city: 'صنعاء', country: 'اليمن' },
          bio: 'مطور برمجيات طموح مع خبرة في تقنيات الويب الحديثة'
        },
        jobseekerProfile: {
          skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
          education: [{
            degree: 'بكالوريوس هندسة برمجيات',
            school: 'جامعة صنعاء',
            fieldOfStudy: 'Software Engineering',
            startDate: new Date('2018-09-01'),
            endDate: new Date('2022-06-01')
          }]
        }
      },
      {
        name: 'سارة خالد المنصور',
        email: 'sara@example.com',
        password: 'password123',
        role: 'jobseeker',
        isVerified: true,
        profile: {
          phone: '777333444',
          location: { city: 'عدن', country: 'اليمن' },
          bio: 'مصممة واجهات خبيرة تهتم بتجربة المستخدم'
        },
        jobseekerProfile: {
          skills: ['UI/UX', 'Figma', 'Adobe XD', 'Sketch'],
          education: [{
            degree: 'بكالوريوس تقنية معلومات',
            school: 'جامعة عدن',
            fieldOfStudy: 'Information Technology',
            startDate: new Date('2019-09-01'),
            endDate: new Date('2023-06-01')
          }]
        }
      },
      {
        name: 'محمد علي اليافعي',
        email: 'mohammed@example.com',
        password: 'password123',
        role: 'jobseeker',
        isVerified: true,
        profile: {
          phone: '777555666',
          location: { city: 'تعز', country: 'اليمن' },
          bio: 'مهندس شبكات متخصص في الحماية والأمن السيبراني'
        },
        jobseekerProfile: {
          skills: ['Networking', 'Cybersecurity', 'Cisco', 'Linux'],
          education: [{
            degree: 'بكالوريوس هندسة حاسوب',
            school: 'جامعة تعز',
            fieldOfStudy: 'Computer Engineering',
            startDate: new Date('2017-09-01'),
            endDate: new Date('2021-06-01')
          }]
        }
      }
    ];

    for (const jsData of jobseekers) {
      let js = await User.findOne({ email: jsData.email });
      if (!js) {
        await User.create(jsData);
        console.log(`Jobseeker ${jsData.name} created.`);
      }
    }

    // 3. Create Sample Jobs
    let createdJobs = [];
    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      const employer = createdEmployers[0];
      const hsaEmployer = createdEmployers[1];
      const bankEmployer = createdEmployers[2];

      createdJobs = await Job.create([
        {
          title: 'مطور برمجيات ذكاء اصطناعي',
          description: 'نبحث عن مطور محترف في بايثون وتعلم الآلة في صنعاء',
          company: employer._id,
          companyName: 'التقنية الذكية',
          location: { city: 'صنعاء', remote: true },
          jobType: 'دوام كامل',
          category: 'Software Engineering',
          industry: 'Technology',
          experienceLevel: 'متوسط',
          salary: { min: 500, max: 1500 },
          requirements: { skills: ['Python', 'TensorFlow', 'FastAPI'] },
          status: 'نشط'
        },
        {
          title: 'محاسب مالي أول',
          description: 'مطلوب محاسب خبير للعمل في مجموعة هائل سعيد أنعم',
          company: hsaEmployer._id,
          companyName: 'HSA Group',
          location: { city: 'تعز', remote: false },
          jobType: 'دوام كامل',
          category: 'Accounting',
          industry: 'Manufacturing',
          experienceLevel: 'خبير',
          salary: { min: 600, max: 1200 },
          requirements: { skills: ['Accounting', 'ERP', 'Excel'] },
          status: 'نشط'
        },
        {
          title: 'مدير فرع بنكي',
          description: 'إدارة عمليات الفرع في بنك التضامن',
          company: bankEmployer._id,
          companyName: 'Tadamon Bank',
          location: { city: 'صنعاء', remote: false },
          jobType: 'دوام كامل',
          category: 'Banking',
          industry: 'Banking',
          experienceLevel: 'خبير',
          salary: { min: 1000, max: 2000 },
          requirements: { skills: ['Leadership', 'Banking Operations', 'Customer Service'] },
          status: 'نشط'
        }
      ]);
      console.log('Sample jobs created.');
    }

    // 4. Create Sample Applications
    if (createdJobs.length > 0) {
      const candidates = await User.find({ role: 'jobseeker' });
      if (candidates.length > 0) {
        await Application.create([
          {
            job: createdJobs[0]._id,
            applicant: candidates[0]._id,
            employer: createdJobs[0].company,
            status: 'قيد المراجعة',
            aiAnalysis: { matchingScore: 85 }
          },
          {
            job: createdJobs[0]._id,
            applicant: candidates[1]._id,
            employer: createdJobs[0].company,
            status: 'مقبول',
            aiAnalysis: { matchingScore: 92 }
          },
          {
            job: createdJobs[1]._id,
            applicant: candidates[2]._id,
            employer: createdJobs[1].company,
            status: 'مرفوض',
            aiAnalysis: { matchingScore: 45 }
          }
        ]);
        console.log('Sample applications created.');
      }
    }

    // 5. Create System Settings
    await SystemSettings.create({
      aiProvider: 'python-service',
      openaiModel: 'gpt-3.5-turbo',
      serverMaintenance: false,
      enableRegistration: true,
      supportEmail: 'support@hisham-platform.com'
    });
    console.log('System settings created.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
