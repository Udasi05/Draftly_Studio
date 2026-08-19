const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Draftly API',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

module.exports = router;
