const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'محتوى المنشور مطلوب'],
    trim: true
  },
  image: String,
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  type: {
    type: String,
    enum: ['post', 'job_announcement', 'achievement'],
    default: 'post'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
