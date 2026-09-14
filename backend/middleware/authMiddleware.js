const { admin, isInitialized } = require('../config/firebaseAdmin');
const User = require('../models/User');

exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'tcb_pos_secure_jwt_secret_key_shift_token_2026_983742';

    // 1. Verify Signed Cryptographic JWT Token
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded && decoded.id) {
        const localUser = await User.findById(decoded.id);
        if (!localUser || !localUser.isActive) {
          return res.status(403).json({ success: false, message: 'User account is inactive or not found' });
        }
        req.user = {
          uid: localUser.firebaseUid || String(localUser._id),
          role: localUser.role,
          mongoId: localUser._id,
          fullName: localUser.fullName,
          employeeCode: localUser.employeeCode,
          email: localUser.email
        };
        return next();
      }
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please enter your PIN to log in again.' });
      }
    }

    // 2. Fallback: If Firebase is initialized, verify Firebase token
    if (isInitialized) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const decodedUid = decodedToken.uid;
        const localUser = await User.findOne({ firebaseUid: decodedUid, isActive: true });
        if (localUser) {
          req.user = {
            uid: decodedUid,
            role: localUser.role,
            mongoId: localUser._id,
            fullName: localUser.fullName,
            employeeCode: localUser.employeeCode,
            email: localUser.email
          };
          return next();
        }
      } catch (fbErr) {
        // Fall through to 401
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
};

exports.requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role` 
      });
    }
    next();
  };
};
