const { buildSystemPrompt } = require('../prompts/systemPrompt');
const { normalizeDocumentJSON } = require('./documentNormalizer');
const { env } = require('../config/env');

// Maximum length for user prompts (characters)
const MAX_PROMPT_LENGTH = 2000;

/**
 * Sanitise user input before sending to Ollama.
 */
function sanitisePrompt(userPrompt) {
  let sanitised = userPrompt.trim();

  // Enforce length limit
  if (sanitised.length > MAX_PROMPT_LENGTH) {
    sanitised = sanitised.substring(0, MAX_PROMPT_LENGTH);
  }

  // Remove null bytes and control characters (except newlines and tabs)
  sanitised = sanitised.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitised;
}

/**
 * Extract clean JSON substring from an LLM response string.
 */
function extractJSONString(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return '';

  let text = rawContent.trim();

  // Remove thinking/reasoning blocks (e.g. <think>...</think>)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // If wrapped in markdown code fence, extract interior
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  // If there are still non-JSON prefixes or suffixes, find outermost { and }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  return text;
}

/**
 * Generate structured document JSON from a user's natural language prompt using local Ollama.
 *
 * @param {string} userPrompt - The user's document description
 * @param {string} docType - Document type key (e.g. 'srs', 'resume')
 * @returns {Promise<object>} Parsed document JSON matching the schema
 */
async function generateDocumentJSON(userPrompt, docType) {
  const sanitisedPrompt = sanitisePrompt(userPrompt);
  const systemPrompt = buildSystemPrompt(docType);

  const model = env.OLLAMA_MODEL;
  const ollamaHost = env.OLLAMA_HOST;

  console.log(`[Ollama] Generating document using model: "${model}" at host: "${ollamaHost}"`);

  let response;
  try {
    response = await fetch(`${ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        format: 'json', // Ollama's strict JSON mode
        stream: false,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Document Type: ${docType}\n\nUser Request: ${sanitisedPrompt}`,
          },
        ],
        options: {
          temperature: 0.3,
          num_ctx: 8192,
          num_predict: 4096,
        },
      }),
    });
  } catch (error) {
    console.error('[Ollama] Connection error:', error.message);
    throw Object.assign(new Error('Could not connect to local AI. Is Ollama running on http://127.0.0.1:11434?'), {
      statusCode: 503,
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Ollama] API error (${response.status}):`, errorText);
    throw Object.assign(new Error(`Local AI generation failed (${response.status}).`), { statusCode: 502 });
  }

  const data = await response.json();
  const rawContent = data.message?.content || '';

  if (!rawContent) {
    throw Object.assign(new Error('AI returned no text content'), { statusCode: 502 });
  }

  const jsonCandidate = extractJSONString(rawContent);

  let rawDocument;
  try {
    rawDocument = JSON.parse(jsonCandidate);
  } catch (parseError) {
    console.error('[Ollama] Failed to parse response as JSON. Excerpt:', rawContent.substring(0, 300));
    throw Object.assign(new Error('AI returned invalid document structure. Please try again.'), {
      statusCode: 502,
    });
  }

  // Normalize document to ensure robust schema compliance
  try {
    const normalized = normalizeDocumentJSON(rawDocument);
    return normalized;
  } catch (normError) {
    console.error('[Ollama] Document normalization error:', normError.message);
    throw Object.assign(new Error('AI document schema could not be processed.'), { statusCode: 502 });
  }
}

module.exports = { generateDocumentJSON, extractJSONString };
