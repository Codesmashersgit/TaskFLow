const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  message: { type: String, required: true, maxlength: 240 },
  readAt: { type: Date, default: null },
}, { timestamps: true })

notificationSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
