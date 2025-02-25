const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  event_type: { type: String, required: true },
  current_participants: { type: Number, default: 0 },
  max_participants: { type: Number, required: true },
  remaining_participants: {
    type: Number,
    default: function () {
      return this.max_participants - this.current_participants;
    },
  },
  location_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  creator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['open', 'full', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
  },
  price: { type: Number, required: true },
  is_free: { type: Boolean, required: true },
  organizer: { type: String, required: true },
  tel: { type: String, required: true },
  email: { type: String, required: true },
  description: { type: String, required: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
});

module.exports = mongoose.model('Event', EventSchema);
