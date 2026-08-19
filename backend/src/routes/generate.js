const express = require('express');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateDocumentJSON } = require('../services/ollamaService');
const { generateDocx } = require('../services/docxService');
const { generatePdf } = require('../services/pdfService');

const router = express.Router();

// ─── Allowed document types ───
const VALID_DOC_TYPES = [
  'assignment', 'lab_experiment', 'srs', 'project_report',
  'resume', 'cover_letter', 'meeting_minutes', 'general',
];

// ─── Request validation schema ───
const generateSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(2000, 'Prompt must be at most 2000 characters')
    .trim(),
  docType: z.enum(VALID_DOC_TYPES, {
    errorMap: () => ({ message: `docType must be one of: ${VALID_DOC_TYPES.join(', ')}` }),
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
    message: `Too many generation requests. Please wait before trying again.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

    console.log(`[Generate] AI returned document: "${docJSON.title}" with ${docJSON.sections.length} sections`);

    // Step 2: Convert to requested format
    let buffer;
    let contentType;
    let fileExtension;

    if (format === 'docx') {
      buffer = await generateDocx(docJSON);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';
    } else {
      buffer = await generatePdf(docJSON);
      contentType = 'application/pdf';
      fileExtension = 'pdf';
    }

    // Step 3: Build safe filename
    const safeTitle = docJSON.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 60);
    const filename = `${safeTitle || 'Draftly_Document'}.${fileExtension}`;

    // Step 4: Send file
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store',
    });

    res.send(buffer);

    console.log(`[Generate] Sent ${fileExtension.toUpperCase()} (${(buffer.length / 1024).toFixed(1)}KB) to ${req.user.email}`);
  })
);

module.exports = router;
