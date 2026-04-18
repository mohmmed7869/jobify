const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-recruitment');
    console.log('Connected to MongoDB');

    // تعريف مخطط بسيط للمستخدم (أو استيراد الموديل الأصلي)
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: { type: String, select: false },
      role: String,
      isActive: { type: Boolean, default: true },
      isVerified: { type: Boolean, default: true }
    }));

    const adminEmail = 'admin@smart.com';
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      console.log('Admin user already exists');
      // تحديث كلمة المرور للتأكد
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash('admin123456', salt);
      await existingUser.save();
      console.log('Admin password updated to: admin123456');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123456', salt);
      
      await User.create({
        name: 'مدير النظام',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isVerified: true
      });
      console.log('Admin user created: admin@smart.com / admin123456');
    }

    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createAdmin();
