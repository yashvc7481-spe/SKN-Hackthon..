const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    city: String
  },
  contactNumber: String,
  availability: {
    totalBeds: { type: Number, default: 100 },
    availableBeds: { type: Number, default: 50 },
    icuBeds: { type: Number, default: 20 },
    availableICUBeds: { type: Number, default: 10 }
  },
  rating: { type: Number, default: 4.5 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hospital', HospitalSchema);