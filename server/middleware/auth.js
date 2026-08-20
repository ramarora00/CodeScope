const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin dynamically using the FIREBASE_PROJECT_ID environment variable
// In environments where a full service account is needed, those should be provided securely.
// For simple token verification, projectId is typically sufficient if the app has access to Google's public keys.
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error('[AUTH] ❌ FIREBASE_PROJECT_ID is not set in backend .env');
  console.warn('[AUTH] Auth middleware will fail all requests until configured.');
} else {
  try {
    if (getApps().length === 0) {
      initializeApp({
        projectId: projectId
      });
      console.log(`[AUTH] Firebase Admin initialized for project: ${projectId}`);
    }
  } catch (error) {
    console.error('[AUTH] ❌ Firebase Admin initialization failed:', error);
  }
}

/**
 * Express middleware to verify Firebase Bearer Tokens
 */
const verifyToken = async (req, res, next) => {
  let token = null;

  // Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split('Bearer ')[1];
  } 
  // Fallback for SSE or other requests that pass token in query
  else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error.message);
    return res.status(401).json({ error: 'Forbidden: Invalid or expired token' });
  }
};

module.exports = { verifyToken };
