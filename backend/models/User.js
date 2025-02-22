const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  age: { type: Number },
  sexe: { type: String, enum: ['homme', 'femme'] },
  phoneNumber: { type: String },
  birthDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  // Champs spécifiques au Profile (extension de User)
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
});

module.exports = mongoose.model('User', UserSchema);
