const express = require('express');
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationHelper');

const router = express.Router();

// @desc    إرسال رسالة
// @route   POST /api/chat/send
// @access  Private
router.post('/send', protect, async (req, res) => {
  try {
    const { recipientId, message, jobId } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستلم والرسالة مطلوبان'
      });
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      message,
      job: jobId || null
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name profile.avatar')
      .populate('recipient', 'name profile.avatar');

    // إرسال الرسالة عبر Socket.IO إذا كان المستلم متصلاً
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId).emit('new_message', {
        ...populatedMessage.toObject(),
        senderId: req.user.id, // For frontend compatibility
        recipientId: recipientId
      });

      // إرسال إشعار داخل المنصة
      await sendNotification({
        recipient: recipientId,
        sender: req.user.id,
        type: 'message',
        title: `رسالة جديدة من ${req.user.name}`,
        message: message.length > 50 ? message.substring(0, 50) + '...' : message,
        link: `/chat?user=${req.user.id}`
      }, io);
    }

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    الحصول على المحادثات
// @route   GET /api/chat/conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    // الحصول على جميع الرسائل التي يشارك فيها المستخدم
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }]
    }).sort({ createdAt: -1 });

    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.sender.toString() === req.user.id.toString() 
        ? msg.recipient.toString() 
        : msg.sender.toString();
      
      if (!conversationsMap.has(otherUser)) {
        const unreadCount = await Message.countDocuments({
          sender: otherUser,
          recipient: req.user.id,
          read: false
        });

        conversationsMap.set(otherUser, {
          otherUserId: otherUser,
          lastMessage: msg,
          unreadCount,
          conversationId: [req.user.id.toString(), otherUser].sort().join('-')
        });
      }
    }

    const userConversations = Array.from(conversationsMap.values());

    res.status(200).json({
      success: true,
      count: userConversations.length,
      data: userConversations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    الحصول على رسائل محادثة معينة
// @route   GET /api/chat/conversation/:userId
// @access  Private
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    
    const conversationMessages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user.id }
      ]
    }).sort({ createdAt: 1 })
      .populate('sender', 'name profile.avatar')
      .populate('recipient', 'name profile.avatar');

    // تحديد الرسائل كمقروءة
    await Message.updateMany(
      { sender: otherUserId, recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    // Map to frontend expected format if necessary
    const formattedMessages = conversationMessages.map(msg => ({
      ...msg.toObject(),
      senderId: msg.sender._id,
      recipientId: msg.recipient._id
    }));

    res.status(200).json({
      success: true,
      count: formattedMessages.length,
      data: formattedMessages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    تحديد رسالة كمقروءة
// @route   PUT /api/chat/message/:messageId/read
// @access  Private
router.put('/message/:messageId/read', protect, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.messageId, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديد الرسالة كمقروءة'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

// @desc    الحصول على عدد الرسائل غير المقروءة
// @route   GET /api/chat/unread-count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: `خطأ في الخادم (${error.message || 'خطأ غير معروف'})`
    });
  }
});

module.exports = router;
