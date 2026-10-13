const express = require('express');
const { env } = require('../config/env');

const router = express.Router();

router.get('/', async (_req, res) => {
  let aiStatus = 'disconnected';
  let availableModels = [];
  let aiError = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${env.OLLAMA_HOST}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      availableModels = (data.models || []).map((m) => m.name);
      aiStatus = 'connected';
    } else {
      aiStatus = 'error';
      aiError = `HTTP ${response.status}`;
    }
  } catch (err) {
    aiStatus = 'disconnected';
    aiError = err.name === 'AbortError' ? 'timeout' : err.message;
  }

  res.json({
    status: 'ok',
    service: 'Draftly API',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    aiEngine: {
      provider: 'ollama',
      status: aiStatus,
      configuredModel: env.OLLAMA_MODEL,
      host: env.OLLAMA_HOST,
      availableModels,
      error: aiError,
    },
  });
});

module.exports = router;
