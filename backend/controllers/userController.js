const User = require('../models/User');
const { admin, isInitialized } = require('../config/firebaseAdmin');
const jwt = require('jsonwebtoken');

// @desc    Get all active staff members for cart assignment dropdown
// @route   GET /api/staff
// @access  Authenticated (Cashier, Admin)
exports.getActiveStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ isActive: true })
      .select('fullName employeeCode role email')
      .sort({ fullName: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Authenticated
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.mongoId).select('-__v');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user (Cashier or Staff or Admin)
// @route   POST /api/admin/users/create
// @access  Admin Only
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, fullName, employeeCode, role, pinCode } = req.body;

    if (!email || !fullName || !employeeCode) {
      return res.status(400).json({
        success: false,
        message: 'Email, full name, and employee code are required'
      });
    }

    const assignedRole = role || 'cashier';
    const assignedPin = (pinCode && pinCode.trim()) ? pinCode.trim() : '1234';
    let firebaseUid = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // If Firebase Admin is initialized and password is provided, create Firebase user
    if (isInitialized && password) {
      try {
        const userRecord = await admin.auth().createUser({
          email: email.trim().toLowerCase(),
          password,
          displayName: fullName.trim()
        });
        firebaseUid = userRecord.uid;

        // Set custom claims for role
        await admin.auth().setCustomUserClaims(firebaseUid, { role: assignedRole });
      } catch (fbErr) {
        return res.status(400).json({
          success: false,
          message: `Firebase Auth error: ${fbErr.message}`
        });
      }
    }

    // Create MongoDB User record
    const user = await User.create({
      firebaseUid,
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      employeeCode: employeeCode.trim().toUpperCase(),
      role: assignedRole,
      pinCode: assignedPin,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        employeeCode: user.employeeCode,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or employee code already exists'
      });
    }
    next(error);
  }
};

// @desc    Get all users (Cashiers, Admins, Staff) for Admin Management
// @route   GET /api/admin/users
// @access  Admin Only
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-__v')
      .sort({ role: 1, fullName: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fast POS Employee ID + PIN Code Login
// @route   POST /api/users/pin-login
// @access  Public
exports.pinLogin = async (req, res, next) => {
  try {
    const { employeeCode, email, identifier, pinCode } = req.body;
    const loginId = (identifier || employeeCode || email || '').trim();

    if (!loginId || !pinCode) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID or Email and PIN code are required'
      });
    }

    const user = await User.findOne({
      $or: [
        { employeeCode: loginId.toUpperCase() },
        { email: loginId.toLowerCase() }
      ],
      isActive: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No active employee found with this ID or Email'
      });
    }

    const isMatch = await user.comparePin(pinCode.trim());
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect PIN code'
      });
    }

    // Cryptographically signed JWT token with 12-hour shift expiry
    const jwtSecret = process.env.JWT_SECRET || 'tcb_pos_secure_jwt_secret_key_shift_token_2026_983742';
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        employeeCode: user.employeeCode,
        email: user.email
      },
      jwtSecret,
      { expiresIn: '12h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          fullName: user.fullName,
          employeeCode: user.employeeCode,
          role: user.role,
          email: user.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


