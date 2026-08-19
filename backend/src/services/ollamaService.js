const { buildSystemPrompt } = require('../prompts/systemPrompt');
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
 * Generate structured document JSON from a user's natural language prompt using local Ollama.
 *
 * @param {string} userPrompt - The user's document description
 * @param {string} docType - Document type key (e.g. 'srs', 'resume')
 * @returns {Promise<object>} Parsed document JSON matching the schema
 */
async function generateDocumentJSON(userPrompt, docType) {
  const sanitisedPrompt = sanitisePrompt(userPrompt);
  const systemPrompt = buildSystemPrompt(docType);

  // We use the validated environment config
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Document Type: ${docType}\n\nUser Request: ${sanitisedPrompt}`
          }
        ],
        options: {
          temperature: 0.3, // Lower temperature for more structured, predictable JSON output
        }
      })
    });
  } catch (error) {
    console.error('[Ollama] Connection error:', error.message, error.cause);
    throw Object.assign(new Error('Could not connect to local AI. Is Ollama running?'), { statusCode: 503 });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Ollama] API error (${response.status}):`, errorText);
    throw Object.assign(new Error('Local AI generation failed.'), { statusCode: 502 });
  }

  const data = await response.json();
  const rawContent = data.message?.content || '';

  if (!rawContent) {
    throw Object.assign(new Error('AI returned no text content'), { statusCode: 502 });
  }

  let raw = rawContent.trim();

  // Clean potential markdown code fences just in case
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Parse and validate JSON
  let document;
  try {
    document = JSON.parse(raw);
  } catch (parseError) {
    console.error('[Ollama] Failed to parse response as JSON:', raw.substring(0, 200));
    throw Object.assign(new Error('AI returned invalid document structure. Please try again.'), {
      statusCode: 502,
    });
  }

  // Basic structural validation
  if (!document.title || !Array.isArray(document.sections) || document.sections.length === 0) {
    throw Object.assign(new Error('AI returned incomplete document. Please try again.'), {
      statusCode: 502,
    });
  }

  return document;
}

module.exports = { generateDocumentJSON };
