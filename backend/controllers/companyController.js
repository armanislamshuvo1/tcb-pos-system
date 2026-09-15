const Company = require('../models/Company');
const User = require('../models/User');
const { admin, isInitialized } = require('../config/firebaseAdmin');

// @desc    Get all B2B Companies (System Admin Only)
// @route   GET /api/companies
// @access  System Admin
exports.getAllCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 }).lean();
    
    // Enrich with counts and admin lists
    const enriched = await Promise.all(companies.map(async (c) => {
      const users = await User.find({ companyId: c._id }).select('fullName email employeeCode role isActive').lean();
      const admins = users.filter(u => u.role === 'admin');
      return {
        ...c,
        userCount: users.length,
        adminCount: admins.length,
        admins: admins.map(a => ({
          _id: a._id,
          fullName: a.fullName,
          email: a.email,
          employeeCode: a.employeeCode,
          isActive: a.isActive
        }))
      };
    }));

    res.status(200).json({
      success: true,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single company by ID
// @route   GET /api/companies/:id
// @access  System Admin
exports.getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const admins = await User.find({ companyId: company._id, role: 'admin' }).select('fullName email employeeCode isActive').lean();
    res.status(200).json({ 
      success: true, 
      data: {
        ...company.toObject(),
        admins
      } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new B2B Company (Optionally provisions initial Company Admin)
// @route   POST /api/companies
// @access  System Admin
exports.createCompany = async (req, res, next) => {
  try {
    const {
      name,
      code,
      branding,
      currency,
      address,
      contactEmail,
      contactPhone,
      adminUser
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Company name and unique company code are required'
      });
    }

    const trimmedCode = code.trim().toUpperCase();
    const existing = await Company.findOne({ code: trimmedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A company with code "${trimmedCode}" already exists`
      });
    }

    // Pre-validate admin user if provided
    if (adminUser && adminUser.email) {
      const existingUser = await User.findOne({ email: adminUser.email.trim().toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `User with email "${adminUser.email.trim().toLowerCase()}" already exists. Please assign or use another email.`
        });
      }
    }

    const company = await Company.create({
      name: name.trim(),
      code: trimmedCode,
      branding: {
        displayName: branding?.displayName?.trim() || name.trim(),
        logoText: branding?.logoText?.trim() || name.trim().charAt(0).toUpperCase(),
        themeColor: branding?.themeColor || '#F59E0B'
      },
      currency: {
        code: currency?.code?.trim()?.toUpperCase() || 'MYR',
        symbol: currency?.symbol?.trim() || 'RM'
      },
      address: address || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      isActive: true
    });

    let initialAdmin = null;
    if (adminUser && adminUser.email && adminUser.fullName) {
      const empCode = (adminUser.employeeCode || `ADM-${trimmedCode}`).trim().toUpperCase();
      const assignedPin = (adminUser.pinCode || adminUser.password || '1234').trim();
      let firebaseUid = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (isInitialized && adminUser.password) {
        try {
          const userRecord = await admin.auth().createUser({
            email: adminUser.email.trim().toLowerCase(),
            password: adminUser.password,
            displayName: adminUser.fullName.trim()
          });
          firebaseUid = userRecord.uid;
          await admin.auth().setCustomUserClaims(firebaseUid, { role: 'admin' });
        } catch (fbErr) {
          // fallback to local user if Firebase auth creation fails
        }
      }

      initialAdmin = await User.create({
        firebaseUid,
        email: adminUser.email.trim().toLowerCase(),
        fullName: adminUser.fullName.trim(),
        employeeCode: empCode,
        role: 'admin',
        pinCode: assignedPin,
        companyId: company._id,
        isActive: true
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...company.toObject(),
        initialAdmin: initialAdmin ? {
          _id: initialAdmin._id,
          fullName: initialAdmin.fullName,
          email: initialAdmin.email,
          employeeCode: initialAdmin.employeeCode,
          role: initialAdmin.role
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign or provision a Company Admin under a specific company
// @route   POST /api/companies/:id/admins
// @access  System Admin
exports.assignCompanyAdmin = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const { userId, fullName, email, employeeCode, password, pinCode } = req.body;

    // Option A: Assign existing user as admin of this company
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      user.companyId = company._id;
      user.role = 'admin';
      await user.save();
      return res.status(200).json({
        success: true,
        message: `Assigned ${user.fullName} as Admin for ${company.name}`,
        data: user
      });
    }

    // Option B: Provision a new Admin user
    if (!fullName || !email || !employeeCode) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and employee code are required to create a new Company Admin'
      });
    }

    const assignedPin = (pinCode || password || '1234').trim();
    let firebaseUid = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (isInitialized && password) {
      try {
        const userRecord = await admin.auth().createUser({
          email: email.trim().toLowerCase(),
          password,
          displayName: fullName.trim()
        });
        firebaseUid = userRecord.uid;
        await admin.auth().setCustomUserClaims(firebaseUid, { role: 'admin' });
      } catch (fbErr) {
        // fallback to local
      }
    }

    const newAdmin = await User.create({
      firebaseUid,
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      employeeCode: employeeCode.trim().toUpperCase(),
      role: 'admin',
      pinCode: assignedPin,
      companyId: company._id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: `Admin ${newAdmin.fullName} provisioned for ${company.name}`,
      data: {
        _id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        employeeCode: newAdmin.employeeCode,
        role: newAdmin.role,
        companyId: newAdmin.companyId
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

// @desc    Update B2B Company
// @route   PUT /api/companies/:id
// @access  System Admin
exports.updateCompany = async (req, res, next) => {
  try {
    const {
      name,
      code,
      branding,
      currency,
      address,
      contactEmail,
      contactPhone,
      isActive
    } = req.body;

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (name) company.name = name.trim();
    if (code) company.code = code.trim().toUpperCase();
    if (address !== undefined) company.address = address;
    if (contactEmail !== undefined) company.contactEmail = contactEmail;
    if (contactPhone !== undefined) company.contactPhone = contactPhone;
    if (isActive !== undefined) company.isActive = Boolean(isActive);

    if (branding) {
      company.branding = {
        displayName: branding.displayName !== undefined ? branding.displayName.trim() : company.branding.displayName,
        logoText: branding.logoText !== undefined ? branding.logoText.trim() : company.branding.logoText,
        themeColor: branding.themeColor || company.branding.themeColor
      };
    }

    if (currency) {
      company.currency = {
        code: currency.code ? currency.code.trim().toUpperCase() : company.currency.code,
        symbol: currency.symbol ? currency.symbol.trim() : company.currency.symbol
      };
    }

    await company.save();

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User's Company / Active Branding & Currency
// @route   GET /api/companies/my/current
// @access  Authenticated
exports.getMyCompany = async (req, res, next) => {
  try {
    let company = null;
    if (req.user.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    
    // If no company linked, return the first active company or default fallback
    if (!company) {
      company = await Company.findOne({ isActive: true });
    }

    if (!company) {
      // Fallback default
      return res.status(200).json({
        success: true,
        data: {
          name: 'PoS System',
          code: 'DEFAULT',
          branding: { displayName: 'PoS System', logoText: 'P', themeColor: '#F59E0B' },
          currency: { code: 'MYR', symbol: 'RM' }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Current Company's Currency & Branding (Admin / System Admin)
// @route   PUT /api/companies/my/settings
// @access  Admin, System Admin
exports.updateMyCompanySettings = async (req, res, next) => {
  try {
    const { currency, branding } = req.body;
    
    let company = null;
    if (req.user.companyId) {
      company = await Company.findById(req.user.companyId);
    }
    if (!company) {
      company = await Company.findOne({ isActive: true });
    }

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (currency) {
      company.currency = {
        code: currency.code ? currency.code.trim().toUpperCase() : company.currency.code,
        symbol: currency.symbol ? currency.symbol.trim() : company.currency.symbol
      };
    }

    if (branding && req.user.role === 'system_admin') {
      if (branding.displayName) company.branding.displayName = branding.displayName.trim();
      if (branding.logoText) company.branding.logoText = branding.logoText.trim();
      if (branding.themeColor) company.branding.themeColor = branding.themeColor;
    }

    await company.save();

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    next(error);
  }
};
