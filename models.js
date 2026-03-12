const mongoose = require('mongoose');

const AmbulanceSchema = new mongoose.Schema({
  ambulanceId: { type: String, required: true, unique: true },
  driverName: String,
  status: { type: String, enum: ['available', 'on_call', 'en_route', 'at_hospital'], default: 'available' },
  location: {
    latitude: { type: Number, default: 28.6139 },
    longitude: { type: Number, default: 77.2090 },
    address: String
  },
  destination: {
    latitude: Number,
    longitude: Number,
    hospitalId: mongoose.Schema.Types.ObjectId
  },
  currentRoute: {
    distance: Number,
    estimatedTime: Number
  },
  patientInfo: {
    name: String,
    age: Number,
    condition: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ambulance', AmbulanceSchema);