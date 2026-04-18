const mongoose = require('mongoose');
require('dotenv').config({path: './backend/.env'});

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-recruitment');
    console.log('Connected to MongoDB');
    
    const userSchema = new mongoose.Schema({
      email: String,
      name: String,
      role: String,
      isActive: Boolean
    });
    
    const User = mongoose.model('UserCheck', userSchema, 'users');
    const users = await User.find({});
    
    console.log('Total Users:', users.length);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [${u.role}] - Active: ${u.isActive}`);
    });
    
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
