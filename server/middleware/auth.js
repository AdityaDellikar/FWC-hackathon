const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * Firebase token verification middleware.
 * Extracts the Bearer token from the Authorization header,
 * verifies it with Firebase Admin, then attaches uid, email,
 * and MongoDB role to req.user.
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Token is empty' });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach base fields from Firebase token
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: 'employee', // default; overwritten below if found in DB
    };

    // Enrich with MongoDB role
    try {
      const dbUser = await User.findOne({ uid: decodedToken.uid }).lean();
      if (dbUser) {
        req.user.role = dbUser.role;
        req.user.name = dbUser.name;
        req.user._id = dbUser._id;
      }
    } catch (dbErr) {
      // Non-fatal: proceed without DB role if lookup fails
      console.warn('Auth middleware: DB user lookup failed:', dbErr.message);
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = auth;
