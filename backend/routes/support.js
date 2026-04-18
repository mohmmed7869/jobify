const express = require('express');
const { protect } = require('../middleware/auth');
const SupportTicket = require('../models/SupportTicket');

const router = express.Router();

router.use(protect);

// @desc    Create a support ticket
// @route   POST /api/support/tickets
router.post('/tickets', async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    
    const ticket = await SupportTicket.create({
      user: req.user.id,
      subject,
      message,
      priority: priority || 'medium'
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    Get user's tickets
// @route   GET /api/support/my-tickets
router.get('/my-tickets', async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

module.exports = router;
