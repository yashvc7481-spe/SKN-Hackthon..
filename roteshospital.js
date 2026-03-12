const express = require('express');
const router = express.Router();
// const Ambulance = require('../models/Ambulance');

router.get('/', async (req, res) => {
  try {
    const ambulances = await Ambulance.find();
    res.json(ambulances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const ambulance = new Ambulance(req.body);
    await ambulance.save();
    res.status(201).json(ambulance);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ambulance = await Ambulance.findById(req.params.id);
    if (!ambulance) return res.status(404).json({ error: 'Not found' });
    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/location', async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { 'location': req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updatedAt: Date.now() },
      { new: true }
    );
    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;