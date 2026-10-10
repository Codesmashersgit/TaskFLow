const mongoose = require('mongoose')

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 240 },
  done: { type: Boolean, default: false },
}, { timestamps: true })

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true, maxlength: 80 },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true })

const activitySchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String, required: true, maxlength: 80 },
  action: { type: String, required: true, maxlength: 120 },
  detail: { type: String, default: '', maxlength: 300 },
}, { timestamps: true })

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  status: { type: String, enum: ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done'], default: 'Todo' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  dueDate: { type: Date, default: null },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  labels: [{ type: String, trim: true, maxlength: 32 }],
  checklist: [checklistItemSchema],
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  comments: [commentSchema],
  activity: [activitySchema],
}, { timestamps: true })

taskSchema.index({ owner: 1, createdAt: -1 })
taskSchema.index({ project: 1, status: 1, dueDate: 1 })
taskSchema.index({ assignee: 1, status: 1, dueDate: 1 })

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema)
