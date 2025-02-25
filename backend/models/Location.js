const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  address: { type: String, required: true },
  city: { type: String, required: true },
  zipcode: { type: String, required: true },
  event_types: {
    type: [String],
    enum: ['theatre', 'concert', 'chorale', 'exposition', 'museum'],
    required: true,
  },
  image_url: { type: String, required: true },
  description: { type: String, required: true },
  tel: { type: String, required: true },
  email: { type: String, required: true },
});

module.exports = mongoose.model('Location', LocationSchema);
