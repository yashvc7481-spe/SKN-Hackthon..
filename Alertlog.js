const mongoose = require('mongoose');

const TrafficSignalSchema = new mongoose.Schema({
  signalId: { type: String, required: true, unique: true },
  location: {
    latitude: Number,
    longitude: Number,
    intersection: String
  },
  status: { type: String, enum: ['red', 'yellow', 'green'], default: 'red' },
  ambulanceMode: { type: Boolean, default: false },
  ambulanceInRange: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrafficSignal', TrafficSignalSchema);