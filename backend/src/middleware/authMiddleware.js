const { OAuth2Client } = require('google-auth-library');
const { env } = require('../config/env');

const oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Authentication middleware — verifies Google OAuth ID token.
 *
 * Expects header: Authorization: Bearer <google_id_token>
 * On success, attaches `req.user` with { email, name, picture, googleId }
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Missing or malformed Authorization header',
      });
    }

    const idToken = authHeader.split(' ')[1];

    if (!idToken || idToken.length < 20) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid token format',
      });
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email_verified) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Email not verified',
      });
    }

    // Attach verified user info to the request
    req.user = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || 'Unknown',
      picture: payload.picture || null,
    };

    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);

    // Don't leak internal error details
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token',
    });
  }
}

module.exports = { authMiddleware };
