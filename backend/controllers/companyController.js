const Company = require('../models/Company');
const User = require('../models/User');

// @desc    Get all B2B Companies (System Admin Only)
// @route   GET /api/companies
// @access  System Admin
exports.getAllCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 }).lean();
    
    // Enrich with counts
    const enriched = await Promise.all(companies.map(async (c) => {
      const userCount = await User.countDocuments({ companyId: c._id });
      return {
        ...c,
        userCount
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
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new B2B Company
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
      contactPhone
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Company name and unique company code are required'
      });
    }

    const existing = await Company.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A company with code "${code.trim().toUpperCase()}" already exists`
      });
    }

    const company = await Company.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
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

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
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
