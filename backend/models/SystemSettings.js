const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  aiProvider: {
    type: String,
    enum: ['openai', 'local', 'python-service'],
    default: 'local'
  },
  openaiModel: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  openaiApiKey: {
    type: String,
    default: ''
  },
  aiTemperature: {
    type: Number,
    default: 0.7
  },
  maxTokens: {
    type: Number,
    default: 800
  },
  serverMaintenance: {
    type: Boolean,
    default: false
  },
  enableRegistration: {
    type: Boolean,
    default: true
  },
  supportEmail: {
    type: String,
    default: 'mohom77393@gmail.com'
  },
  supportPhone: {
    type: String,
    default: '783332292'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
