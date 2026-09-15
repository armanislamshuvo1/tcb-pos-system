const User = require('../models/User');
const Company = require('../models/Company');
const { admin, isInitialized } = require('../config/firebaseAdmin');
const jwt = require('jsonwebtoken');

// @desc    Get all active staff members for cart assignment dropdown
// @route   GET /api/staff
// @access  Authenticated (Cashier, Admin, System Admin)
exports.getActiveStaff = async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.user.companyId && req.user.role !== 'system_admin') {
      query.companyId = req.user.companyId;
    }

    const staff = await User.find(query)
      .select('fullName employeeCode role email companyId')
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

// @desc    Get current user profile & company settings
// @route   GET /api/users/me
// @access  Authenticated
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.mongoId).select('-__v').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let company = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId).lean();
    }
    if (!company) {
      company = await Company.findOne({ isActive: true }).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        ...user,
        company: company || {
          name: 'PoS System',
          branding: { displayName: 'PoS System', logoText: 'P', themeColor: '#F59E0B' },
          currency: { code: 'MYR', symbol: 'RM' }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user (Cashier or Staff or Admin)
// @route   POST /api/admin/users/create
// @access  Admin, System Admin
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, fullName, employeeCode, role, pinCode, companyId } = req.body;

    if (!email || !fullName || !employeeCode) {
      return res.status(400).json({
        success: false,
        message: 'Email, full name, and employee code are required'
      });
    }

    const isSystemAdmin = req.user.role === 'system_admin';

    // Role check: non-system admins cannot provision system_admin
    const assignedRole = role || 'cashier';
    if (assignedRole === 'system_admin' && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only system admins can provision other system admins'
      });
    }

    // Company scoping:
    // System admin can assign any companyId (or null for platform users)
    // Company admin (role === 'admin') is strictly locked to req.user.companyId
    let assignedCompanyId = null;
    if (isSystemAdmin) {
      assignedCompanyId = companyId || null;
    } else {
      if (!req.user.companyId) {
        return res.status(403).json({
          success: false,
          message: 'Your admin account is not linked to any company. Cannot provision staff.'
        });
      }
      assignedCompanyId = req.user.companyId;
    }

    const assignedPin = (pinCode && pinCode.trim()) ? pinCode.trim() : (password || '1234');
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
        // Fall back to local user if Firebase fails
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
      companyId: assignedCompanyId,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        employeeCode: user.employeeCode,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or employee code already exists in this company'
      });
    }
    next(error);
  }
};

// @desc    Update user profile & credentials
// @route   PUT /api/admin/users/:id
// @access  Admin, System Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { email, fullName, employeeCode, role, pinCode, isActive, companyId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isSystemAdmin = req.user.role === 'system_admin';

    // Tenant boundary check: Company Admins cannot edit users outside their company
    if (!isSystemAdmin) {
      if (!user.companyId || !req.user.companyId || user.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage users within your own company'
        });
      }
    }

    // Security check: Only system_admin can assign or modify system_admin
    if (role === 'system_admin' && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only system admins can assign the system_admin role'
      });
    }
    if (user.role === 'system_admin' && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only system admins can modify system admin accounts'
      });
    }

    if (email) user.email = email.trim().toLowerCase();
    if (fullName) user.fullName = fullName.trim();
    if (employeeCode) user.employeeCode = employeeCode.trim().toUpperCase();
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = Boolean(isActive);

    // Only system admin can reassign company
    if (isSystemAdmin && companyId !== undefined) {
      user.companyId = companyId || null;
    }

    if (pinCode && pinCode.trim()) {
      user.pinCode = pinCode.trim(); // Pre-save hook will hash
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        employeeCode: user.employeeCode,
        role: user.role,
        isActive: user.isActive,
        companyId: user.companyId
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or employee code already exists in this company'
      });
    }
    next(error);
  }
};

// @desc    Get all users (Cashiers, Admins, Staff, System Admins) for Admin Management
// @route   GET /api/admin/users
// @access  Admin, System Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'system_admin') {
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
    } else {
      if (!req.user.companyId) {
        return res.status(200).json({ success: true, data: [] });
      }
      query.companyId = req.user.companyId;
    }

    const users = await User.find(query)
      .select('-__v')
      .populate('companyId', 'name code')
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

    // Resolve company branding and currency
    let company = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId).lean();
    }
    if (!company) {
      company = await Company.findOne({ isActive: true }).lean();
    }

    // Cryptographically signed JWT token with 12-hour shift expiry
    const jwtSecret = process.env.JWT_SECRET || 'tcb_pos_secure_jwt_secret_key_shift_token_2026_983742';
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        employeeCode: user.employeeCode,
        email: user.email,
        companyId: user.companyId
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
          email: user.email,
          companyId: user.companyId,
          company: company || {
            name: 'PoS System',
            branding: { displayName: 'PoS System', logoText: 'P', themeColor: '#F59E0B' },
            currency: { code: 'MYR', symbol: 'RM' }
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
