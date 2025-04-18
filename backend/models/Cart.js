const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  price: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  },
  items: [CartItemSchema],
  total: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cart', CartSchema);
