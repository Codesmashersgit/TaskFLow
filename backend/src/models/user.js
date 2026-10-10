const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  avatar: { type: String, default: '', maxlength: 500 },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    inAppNotifications: { type: Boolean, default: true },
  },
}, { timestamps: true })

module.exports = mongoose.models.User || mongoose.model('User', userSchema)
