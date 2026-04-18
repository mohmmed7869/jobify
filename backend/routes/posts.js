const express = require('express');
const { protect } = require('../middleware/auth');
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// إعداد Multer لرفع صور المنشورات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/posts';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// @desc    الحصول على جميع المنشورات
// @route   GET /api/posts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name profile.avatar role')
      .populate('comments.user', 'name profile.avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    إنشاء منشور جديد
// @route   POST /api/posts
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { content, type } = req.body;
    const postData = {
      user: req.user.id,
      content,
      type: type || 'post'
    };

    if (req.file) {
      postData.image = req.file.path;
    }

    const post = await Post.create(postData);
    const populatedPost = await post.populate('user', 'name profile.avatar role');

    res.status(201).json({
      success: true,
      data: populatedPost
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    الإعجاب بمنشور
// @route   PUT /api/posts/:id/like
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'المنشور غير موجود' });

    if (post.likes.includes(req.user.id)) {
      post.likes = post.likes.filter(id => id.toString() !== req.user.id);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.status(200).json({ success: true, data: post.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    إضافة تعليق
// @route   POST /api/posts/:id/comment
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'المنشور غير موجود' });

    const newComment = {
      user: req.user.id,
      text: req.body.text
    };

    post.comments.push(newComment);
    await post.save();
    
    const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'name profile.avatar');

    res.status(200).json({ success: true, data: updatedPost.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

// @desc    الحصول على منشورات مستخدم معين
// @route   GET /api/posts/user/:userId
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'name profile.avatar role')
      .populate('comments.user', 'name profile.avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: `خطأ في الخادم (${error.message})` });
  }
});

module.exports = router;
