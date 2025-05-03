const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phoneNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  cashbackBalance: { type: Number, default: 0 },
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

module.exports = mongoose.model('User', UserSchema);
