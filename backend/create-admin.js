const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-recruitment');
    console.log('Connected to MongoDB.');

    const adminEmail = 'mohom77393@gmail.com';
    let user = await User.findOne({ email: adminEmail });

    if (user) {
      console.log('User already exists. Updating role to admin and resetting password...');
      user.role = 'admin';
      user.password = 'admin123456';
      user.name = 'المهندس محمد علي';
      user.isVerified = true;
      await user.save();
      console.log('Admin user updated successfully.');
    } else {
      console.log('Creating new Admin User...');
      user = await User.create({
        name: 'المهندس محمد علي',
        email: adminEmail,
        password: 'admin123456',
        role: 'admin',
        isVerified: true,
        profile: {
          phone: '+967783332292',
          location: { city: 'صنعاء', country: 'اليمن' }
        }
      });
      console.log('Admin user created successfully.');
    }

    console.log('Email:', adminEmail);
    console.log('Password: admin123456');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
