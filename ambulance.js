const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: "Ambulance route working",
    data: []
  });
});

module.exports = router;