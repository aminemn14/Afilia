// models/message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation_id: {
    type: String,
    required: false,
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Indexation pour améliorer les performances des requêtes
MessageSchema.index({ conversation_id: 1, created_at: 1 });
MessageSchema.index({ sender_id: 1, receiver_id: 1 });

module.exports = mongoose.model('Message', MessageSchema);
