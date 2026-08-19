const { ZodError } = require('zod');

/**
 * Factory that creates a Zod validation middleware for Express.
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Which part of the request to validate
 * @returns {import('express').RequestHandler}
 *
 * Usage:
 *   router.post('/generate', validateRequest(generateSchema, 'body'), handler)
 */
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.parse(req[source]);
      // Replace with parsed + sanitised data
      req[source] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: formatted,
        });
      }

      next(error);
    }
  };
}

module.exports = { validateRequest };
