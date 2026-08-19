const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { env } = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const healthRoutes = require('./routes/health');
const generateRoutes = require('./routes/generate');

const app = express();

// ─── 1. Security headers ───
app.use(
  helmet({
    contentSecurityPolicy: false,        // Not serving HTML from backend
    crossOriginEmbedderPolicy: false,
  })
);

// ─── 2. CORS — explicit allowlist ───
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman, etc.)
      if (!origin) return callback(null, true);

      if (env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // Pre-flight cache: 24 hours
  })
);

// ─── 3. Global rate limiter ───
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─── 4. Body parsing with size limit ───
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── 5. Request logging ───
app.use(
  morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req) => req.path === '/api/health',
  })
);

// ─── 6. Trust proxy (for rate limiter behind reverse proxy) ───
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── 7. Routes ───
app.use('/api/health', healthRoutes);
app.use('/api/generate', generateRoutes);

// ─── 8. 404 handler ───
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ─── 9. Global error handler (must be last) ───
app.use(errorHandler);

// ─── Start server ───
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`\n🚀 Draftly API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   CORS origins: ${env.CORS_ORIGINS.join(', ')}`);
  console.log(`   Rate limit: ${env.RATE_LIMIT_MAX_REQUESTS} req/min (global), ${env.GENERATE_RATE_LIMIT_MAX} req/min (generate)\n`);
});

module.exports = app;
