const Terminal = require('../models/Terminal');
const Company = require('../models/Company');
const User = require('../models/User');

// @desc    Get device binding status & company info
// @route   GET /api/terminal/status
// @access  Public
exports.getTerminalStatus = async (req, res, next) => {
  try {
    const { deviceId } = req.query;

    if (!deviceId || !deviceId.trim()) {
      return res.status(400).json({ success: false, message: 'Device ID is required' });
    }

    const terminal = await Terminal.findOne({ deviceId: deviceId.trim(), isActive: true })
      .populate('companyId', 'name code branding currency isActive')
      .lean();

    if (!terminal || !terminal.companyId || !terminal.companyId.isActive) {
      return res.status(200).json({
        success: true,
        data: {
          isBound: false,
          deviceId: deviceId.trim()
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isBound: true,
        deviceId: terminal.deviceId,
        terminalName: terminal.name,
        boundAt: terminal.boundAt,
        company: terminal.companyId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active companies for terminal registration dropdown
// @route   GET /api/terminal/public-companies
// @access  Public
exports.getPublicCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('name code branding currency')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bind a terminal device to a specific company
// @route   POST /api/terminal/bind
// @access  Public with Admin Verification OR Authenticated Admin
exports.bindTerminal = async (req, res, next) => {
  try {
    const { deviceId, companyId, terminalName, adminIdentifier, adminPin } = req.body;

    if (!deviceId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and Company are required to pair this terminal'
      });
    }

    const company = await Company.findById(companyId);
    if (!company || !company.isActive) {
      return res.status(404).json({ success: false, message: 'Selected company is invalid or inactive' });
    }

    let authorizingAdmin = null;

    // Check if called with Authorization header
    if (req.user) {
      authorizingAdmin = req.user;
    } else {
      // Authenticate via adminIdentifier + adminPin
      if (!adminIdentifier || !adminPin) {
        return res.status(401).json({
          success: false,
          message: 'Admin ID or Email and PIN code are required to bind this device'
        });
      }

      const loginId = adminIdentifier.trim();
      const adminUsers = await User.find({
        $or: [
          { employeeCode: loginId.toUpperCase() },
          { email: loginId.toLowerCase() }
        ],
        isActive: true,
        role: { $in: ['admin', 'system_admin'] }
      });

      for (const u of adminUsers) {
        if (await u.comparePin(adminPin.trim())) {
          authorizingAdmin = {
            mongoId: u._id,
            role: u.role,
            companyId: u.companyId,
            fullName: u.fullName
          };
          break;
        }
      }

      if (!authorizingAdmin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Admin credentials or unauthorized role to bind terminal'
        });
      }
    }

    // Role check: Company admin can only bind to their own company
    if (authorizingAdmin.role !== 'system_admin') {
      if (!authorizingAdmin.companyId || authorizingAdmin.companyId.toString() !== company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: `You are only authorized to pair terminals for ${authorizingAdmin.companyId ? 'your own company' : 'no company'}`
        });
      }
    }

    // Upsert Terminal binding
    const terminal = await Terminal.findOneAndUpdate(
      { deviceId: deviceId.trim() },
      {
        deviceId: deviceId.trim(),
        name: terminalName?.trim() || `${company.name} Register 1`,
        companyId: company._id,
        boundBy: authorizingAdmin.mongoId,
        boundAt: new Date(),
        isActive: true
      },
      { upsert: true, new: true }
    ).populate('companyId', 'name code branding currency');

    res.status(200).json({
      success: true,
      message: `Terminal successfully bound to ${company.name}`,
      data: {
        deviceId: terminal.deviceId,
        terminalName: terminal.name,
        company: terminal.companyId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unbind / Reassign a terminal device (Requires System Admin Authorization)
// @route   POST /api/terminal/unbind
// @access  Public with System Admin Auth OR Authenticated System Admin
exports.unbindTerminal = async (req, res, next) => {
  try {
    const { deviceId, systemAdminIdentifier, systemAdminPin } = req.body;

    if (!deviceId || !deviceId.trim()) {
      return res.status(400).json({ success: false, message: 'Device ID is required' });
    }

    let isAuthorized = false;

    // Check if called with authenticated system_admin
    if (req.user && req.user.role === 'system_admin') {
      isAuthorized = true;
    } else {
      if (!systemAdminIdentifier || !systemAdminPin) {
        return res.status(401).json({
          success: false,
          message: 'System Admin Employee Code or Email and PIN code are required to unbind this terminal'
        });
      }

      const loginId = systemAdminIdentifier.trim();
      const sysAdminUsers = await User.find({
        $or: [
          { employeeCode: loginId.toUpperCase() },
          { email: loginId.toLowerCase() }
        ],
        isActive: true,
        role: 'system_admin'
      });

      for (const u of sysAdminUsers) {
        if (await u.comparePin(systemAdminPin.trim())) {
          isAuthorized = true;
          break;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Security lock: Only System Admin credentials can unbind or switch terminal company'
      });
    }

    const terminal = await Terminal.findOne({ deviceId: deviceId.trim() });
    if (!terminal) {
      return res.status(404).json({ success: false, message: 'Terminal device not found' });
    }

    await Terminal.deleteOne({ _id: terminal._id });

    res.status(200).json({
      success: true,
      message: 'Terminal device successfully unbound. Terminal can now be re-paired.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all terminals for current company (or all for system_admin)
// @route   GET /api/terminal/list
// @access  Admin, System Admin
exports.listTerminals = async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.user.role !== 'system_admin') {
      if (!req.user.companyId) {
        return res.status(200).json({ success: true, data: [] });
      }
      query.companyId = req.user.companyId;
    }

    const terminals = await Terminal.find(query)
      .populate('companyId', 'name code')
      .populate('boundBy', 'fullName employeeCode')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: terminals
    });
  } catch (error) {
    next(error);
  }
};
