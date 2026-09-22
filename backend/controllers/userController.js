const User = require('../models/User');
const Company = require('../models/Company');
const Terminal = require('../models/Terminal');
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
    const user = await User.findById(req.user.mongoId).select('-__v -pinCode').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let company = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId).lean();
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

    // Cashiers and staff MUST be assigned to a specific company
    if (assignedRole !== 'system_admin' && !assignedCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'A company must be assigned when creating a cashier or staff member'
      });
    }

    // Clean numeric 4-6 digit PIN validation
    let cleanPin = (pinCode && pinCode.trim()) ? pinCode.trim() : (password && password.trim() ? password.trim() : '1234');
    if (!/^\d{4,6}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        message: 'Terminal PIN code must be between 4 and 6 numeric digits (e.g. 1234)'
      });
    }

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
      pinCode: cleanPin,
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
      const cleanPin = pinCode.trim();
      if (!/^\d{4,6}$/.test(cleanPin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN code must be 4 to 6 numeric digits (e.g. 1234)'
        });
      }
      user.pinCode = cleanPin; // Pre-save hook will hash
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

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Admin, System Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting own account
    if (userToDelete._id.toString() === req.user.mongoId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const isSystemAdmin = req.user.role === 'system_admin';

    // Tenant boundary: Company Admin can only delete users within their company
    if (!isSystemAdmin) {
      if (!userToDelete.companyId || !req.user.companyId || userToDelete.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage and delete users within your own company'
        });
      }
    }

    // Company Admin cannot delete a system_admin
    if (userToDelete.role === 'system_admin' && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only system admins can delete system admin accounts'
      });
    }

    // Remove user from Company admins array if present
    if (userToDelete.companyId) {
      await Company.findByIdAndUpdate(userToDelete.companyId, {
        $pull: { admins: userToDelete._id }
      });
    }

    // Clean up Firebase user if non-local
    if (isInitialized && userToDelete.firebaseUid && !userToDelete.firebaseUid.startsWith('local_')) {
      try {
        await admin.auth().deleteUser(userToDelete.firebaseUid);
      } catch (fbErr) {
        // Continue even if Firebase deletion fails
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `User ${userToDelete.fullName} (${userToDelete.employeeCode}) was successfully deleted`
    });
  } catch (error) {
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
      .select('-__v -pinCode')
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

// @desc    Fast POS Employee ID + PIN Code Login (With Terminal Device ID & Company Binding)
// @route   POST /api/users/pin-login
// @access  Public
exports.pinLogin = async (req, res, next) => {
  try {
    const { employeeCode, email, identifier, pinCode, deviceId, companyId } = req.body;
    const loginId = (identifier || employeeCode || email || '').trim();

    if (!loginId || !pinCode) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID or Email and PIN code are required'
      });
    }

    // Check if terminal device is bound to a specific company
    let boundTerminal = null;
    let targetCompanyId = companyId || null;

    if (deviceId && deviceId.trim()) {
      boundTerminal = await Terminal.findOne({ deviceId: deviceId.trim(), isActive: true }).populate('companyId');
      if (boundTerminal && boundTerminal.companyId && boundTerminal.companyId.isActive) {
        targetCompanyId = boundTerminal.companyId._id;
      }
    }

    // Find all active candidate users matching employeeCode or email
    const candidateQuery = {
      $or: [
        { employeeCode: loginId.toUpperCase() },
        { email: loginId.toLowerCase() }
      ],
      isActive: true
    };

    const candidates = await User.find(candidateQuery);

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active employee found with this ID or Email'
      });
    }

    // Match candidate with PIN code
    let matchedUser = null;
    for (const candidate of candidates) {
      const isMatch = await candidate.comparePin(pinCode.trim());
      if (isMatch) {
        matchedUser = candidate;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect PIN code'
      });
    }

    // STRICT B2B MULTI-TENANT GUARD: Zero crossover between companies
    // If the terminal is bound to a specific company, only cashiers/staff of THAT company can log in!
    // (System admins allowed to bypass for maintenance)
    if (targetCompanyId && matchedUser.role !== 'system_admin') {
      const userCompId = matchedUser.companyId ? matchedUser.companyId.toString() : null;
      if (!userCompId || userCompId !== targetCompanyId.toString()) {
        const companyName = boundTerminal?.companyId?.name || 'this company';
        return res.status(403).json({
          success: false,
          message: `Access Denied: You belong to another company and cannot operate this register for ${companyName}.`
        });
      }
    }

    // Resolve company branding and currency
    let company = null;
    if (matchedUser.companyId) {
      company = await Company.findById(matchedUser.companyId).lean();
    }
    if (!company && targetCompanyId) {
      company = await Company.findById(targetCompanyId).lean();
    }

    // Cryptographically signed JWT token with 12-hour shift expiry
    const jwtSecret = process.env.JWT_SECRET || 'tcb_pos_secure_jwt_secret_key_shift_token_2026_983742';
    const token = jwt.sign(
      {
        id: matchedUser._id,
        role: matchedUser.role,
        fullName: matchedUser.fullName,
        employeeCode: matchedUser.employeeCode,
        email: matchedUser.email,
        companyId: matchedUser.companyId
      },
      jwtSecret,
      { expiresIn: '12h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: matchedUser._id,
          fullName: matchedUser.fullName,
          employeeCode: matchedUser.employeeCode,
          role: matchedUser.role,
          email: matchedUser.email,
          companyId: matchedUser.companyId,
          company: company || {
            name: 'PoS System',
            branding: { displayName: 'PoS System', logoText: 'P', themeColor: '#F59E0B' },
            currency: { code: 'MYR', symbol: 'RM' }
          }
        },
        terminal: boundTerminal ? {
          deviceId: boundTerminal.deviceId,
          name: boundTerminal.name
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};
