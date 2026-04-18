const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const User = require('./models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-recruitment');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@smart.com';
    
    // مسح أي مستخدم قديم بهذا البريد لضمان نظافة البيانات
    await User.deleteOne({ email: adminEmail });
    console.log('Deleted old admin if exists');

    // إنشاء المستخدم باستخدام الموديل لضمان عمل التشفير التلقائي (pre-save hook)
    const admin = new User({
      name: 'مدير النظام',
      email: adminEmail,
      password: 'admin123456', // سيتم تشفيرها تلقائياً بواسطة الموديل
      role: 'admin',
      isActive: true,
      isVerified: true
    });

    await admin.save();
    console.log('Admin user created successfully with original model: admin@smart.com / admin123456');

    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createAdmin();
