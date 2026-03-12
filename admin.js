const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const TrafficSignal = require('../models/TrafficSignal');
const AlertLog = require('../models/AlertLog');

router.get('/dashboard', async (req, res) => {
  try {
    const stats = {
      ambulances: await Ambulance.countDocuments(),
      activeAmbulances: await Ambulance.countDocuments({ status: 'en_route' }),
      hospitals: await Hospital.countDocuments(),
      signals: await TrafficSignal.countDocuments()
    };

    const recentAlerts = await AlertLog.find().sort({ createdAt: -1 }).limit(10);

    res.json({ stats, recentAlerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const logs = await AlertLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;