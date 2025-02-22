const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  zipcode: { type: String, required: true },
  event_type: {
    type: String,
    enum: ['theatre', 'concert', 'chorale', 'exposition', 'museum'],
    required: true,
  },
});

module.exports = mongoose.model('Location', LocationSchema);
