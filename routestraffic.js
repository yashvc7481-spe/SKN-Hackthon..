const express = require('express');
const router = express.Router();
const TrafficSignal = require('../models/TrafficSignal');

router.get('/', async (req, res) => {
  try {
    const signals = await TrafficSignal.find();
    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const signal = new TrafficSignal(req.body);
    await signal.save();
    res.status(201).json(signal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/check-proximity', async (req, res) => {
  try {
    const { ambulanceLatitude, ambulanceLongitude, signalId } = req.body;
    const signal = await TrafficSignal.findById(signalId);

    if (!signal) return res.status(404).json({ error: 'Signal not found' });

    const distance = calculateDistance(
      ambulanceLatitude, ambulanceLongitude,
      signal.location.latitude, signal.location.longitude
    );

    const inRange = distance <= 0.5;

    if (inRange) {
      await TrafficSignal.findByIdAndUpdate(signalId, {
        status: 'green',
        ambulanceMode: true,
        ambulanceInRange: true
      });
    } else {
      await TrafficSignal.findByIdAndUpdate(signalId, {
        status: 'red',
        ambulanceMode: false,
        ambulanceInRange: false
      });
    }

    res.json({ distance, inRange, signal: await TrafficSignal.findById(signalId) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 1 } = req.query;
    const signals = await TrafficSignal.find();
    
    const nearby = signals.map(s => ({
      ...s.toObject(),
      distance: calculateDistance(latitude, longitude, s.location.latitude, s.location.longitude)
    })).filter(s => s.distance <= radius).sort((a, b) => a.distance - b.distance);
    
    res.json(nearby);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;