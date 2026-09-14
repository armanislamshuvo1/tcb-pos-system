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
          employeeCode: localUser.employeeCode
        };
        return next();
      }
    } catch (jwtErr) {
      // If not a signed JWT, proceed to check fallback tokens or Firebase
    }

    if (token.startsWith('pin_token_')) {
      const parts = token.split('_');
      const mongoId = parts[3];
      const localUser = await User.findById(mongoId);
      if (!localUser || !localUser.isActive) {
        return res.status(403).json({ success: false, message: 'User account is inactive or not found' });
      }
      req.user = {
        uid: localUser.firebaseUid || String(localUser._id),
        role: localUser.role,
        mongoId: localUser._id,
        fullName: localUser.fullName,
        employeeCode: localUser.employeeCode
      };
      return next();
    }

    let decodedUid = null;
    let decodedRole = null;

    if (isInitialized) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      decodedUid = decodedToken.uid;
      decodedRole = decodedToken.role;
    } else {
      // Development Mock Mode: allow test tokens formatted as "dev-cashier", "dev-admin", or arbitrary UID
      if (token === 'dev-admin-token') {
        decodedUid = 'dev_admin_uid';
        decodedRole = 'admin';
      } else if (token === 'dev-cashier-token') {
        decodedUid = 'dev_cashier_uid';
        decodedRole = 'cashier';
      } else {
        decodedUid = token;
      }
    }

    // Resolve user from MongoDB
    let localUser = await User.findOne({ 
      $or: [{ firebaseUid: decodedUid }, { email: `${decodedUid}@pos.local` }] 
    });

    // Auto-seed development mock user if operating in local dev mode
    if (!localUser && !isInitialized) {
      localUser = await User.create({
        firebaseUid: decodedUid,
        email: `${decodedUid}@pos.local`,
        fullName: decodedRole === 'admin' ? 'System Administrator' : 'Terminal Cashier',
        employeeCode: decodedRole === 'admin' ? 'ADM-001' : 'CSH-001',
        role: decodedRole || 'cashier',
        isActive: true
      });
    }

    if (!localUser || !localUser.isActive) {
      return res.status(403).json({ success: false, message: 'User account is inactive or not found' });
    }

    req.user = {
      uid: decodedUid,
      role: localUser.role,
      mongoId: localUser._id,
      fullName: localUser.fullName,
      employeeCode: localUser.employeeCode
    };

    next();
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
