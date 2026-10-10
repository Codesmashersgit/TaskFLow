const mongoose = require('mongoose')

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false })

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: { type: [memberSchema], default: [] },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  dueDate: { type: Date, default: null },
  color: { type: String, enum: ['violet', 'blue', 'green', 'orange'], default: 'violet' },
}, { timestamps: true })

projectSchema.index({ 'members.user': 1, status: 1, updatedAt: -1 })

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema)
