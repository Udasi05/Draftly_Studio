const express = require('express');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateDocumentJSON } = require('../services/ollamaService');
const { normalizeDocumentJSON } = require('../services/documentNormalizer');
const { generateDocx } = require('../services/docxService');
const { generatePdf } = require('../services/pdfService');

const router = express.Router();

// ─── Allowed document types ───
const VALID_DOC_TYPES = [
  'assignment', 'lab_experiment', 'srs', 'project_report',
  'resume', 'cover_letter', 'meeting_minutes', 'general',
];

// ─── Request validation schemas ───
const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(2000, 'Prompt must be at most 2000 characters')
    .trim(),
  docType: z.enum(VALID_DOC_TYPES, {
    errorMap: () => ({ message: `docType must be one of: ${VALID_DOC_TYPES.join(', ')}` }),
  }),
  format: z.enum(['docx', 'pdf', 'json'], {
    errorMap: () => ({ message: 'format must be "docx", "pdf", or "json"' }),
  }),
});

const compileSchema = z.object({
  document: z.object({
    title: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    sections: z.array(z.any()),
  }),
  format: z.enum(['docx', 'pdf'], {
    errorMap: () => ({ message: 'format must be "docx" or "pdf"' }),
  }),
});

// ─── Per-user rate limiter for generation ───
const generateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.GENERATE_RATE_LIMIT_MAX,
  keyGenerator: (req) => req.user?.email || req.ip,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many generation requests. Please wait a minute before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Helper to build safe filename from title and format extension
 */
function buildFilename(title, format) {
  const clean = String(title || 'Draftly_Document')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 60);

  return `${clean || 'Draftly_Document'}.${format}`;
}

// ─── POST /api/generate ───
router.post(
  '/',
  authMiddleware,
  generateLimiter,
  validateRequest(generateSchema, 'body'),
  asyncHandler(async (req, res) => {
    const { prompt, docType, format } = req.body;

    console.log(`[Generate] User: ${req.user.email} | Type: ${docType} | Format: ${format}`);

    // Step 1: Generate document JSON via Ollama
    const docJSON = await generateDocumentJSON(prompt, docType);

    console.log(`[Generate] Document structured: "${docJSON.title}" (${docJSON.sections.length} sections)`);

    // If client requested JSON format for preview/studio
    if (format === 'json') {
      return res.json({
        document: docJSON,
        docType,
      });
    }

    // Step 2: Convert to requested binary format
    let buffer;
    let contentType;

    if (format === 'docx') {
      buffer = await generateDocx(docJSON);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      buffer = await generatePdf(docJSON);
      contentType = 'application/pdf';
    }

    const filename = buildFilename(docJSON.title, format);

    // Step 3: Send file with metadata headers
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store',
      'X-Document-Title': encodeURIComponent(docJSON.title || 'Draftly Document'),
      'X-Document-Stats': JSON.stringify(docJSON.stats || {}),
    });

    res.send(buffer);

    console.log(`[Generate] Sent ${format.toUpperCase()} (${(buffer.length / 1024).toFixed(1)}KB) to ${req.user.email}`);
  })
);

// ─── POST /api/generate/compile (Instant multi-format export without re-running Ollama) ───
router.post(
  '/compile',
  authMiddleware,
  validateRequest(compileSchema, 'body'),
  asyncHandler(async (req, res) => {
    const { document, format } = req.body;
    const normalized = normalizeDocumentJSON(document);

    console.log(`[Compile] User: ${req.user.email} | Format: ${format} | Title: "${normalized.title}"`);

    let buffer;
    let contentType;

    if (format === 'docx') {
      buffer = await generateDocx(normalized);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      buffer = await generatePdf(normalized);
      contentType = 'application/pdf';
    }

    const filename = buildFilename(normalized.title, format);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store',
      'X-Document-Title': encodeURIComponent(normalized.title),
    });

    res.send(buffer);
  })
);

module.exports = router;
