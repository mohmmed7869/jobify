const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const SystemSettings = require('../models/SystemSettings');
const SupportTicket = require('../models/SupportTicket');

const router = express.Router();

// All routes here require admin authorization
router.use(protect);
router.use(authorize('admin'));

// --- System Settings ---

// @desc    Get system settings
// @route   GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Update system settings
// @route   PUT /api/admin/settings
router.put('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    settings.updatedBy = req.user.id;
    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// --- Customer Support ---

// @desc    Get all support tickets
// @route   GET /api/admin/tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('user', 'name email avatar')
      .sort('-updatedAt');
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Reply to a ticket
// @route   POST /api/admin/tickets/:id/reply
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.replies.push({
      sender: req.user.id,
      message: req.body.message
    });
    ticket.status = req.body.status || 'in_progress';
    ticket.lastRepliedAt = Date.now();
    await ticket.save();

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Search
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Update user status (block/unblock)
// @route   PUT /api/admin/users/:id/status
router.put('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = req.body.isActive;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Get all jobs for moderation
// @route   GET /api/admin/jobs
router.get('/jobs', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find()
      .skip(skip)
      .limit(limit)
      .sort('-createdAt')
      .populate('company', 'name email');

    const total = await Job.countDocuments();

    res.status(200).json({
      success: true,
      count: jobs.length,
      total,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Delete any job
// @route   DELETE /api/admin/jobs/:id
router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Get system-wide stats for manager
// @route   GET /api/admin/system-stats
router.get('/system-stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'نشط' });
    
    // إحصائيات الأدوار
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // الطلبات في آخر 7 أيام
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentApplications = await Application.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalJobs,
          totalApplications,
          activeJobs,
          recentApplications
        },
        roleStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Verify/Unverify user
// @route   PUT /api/admin/users/:id/verify
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isVerified = req.body.isVerified;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Change user role
// @route   POST /api/admin/users/:id/role
router.post('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['jobseeker', 'employer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = role;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

module.exports = router;