const Discount = require('../models/Discount');

// @desc    Get active preset discount buttons for POS ticket
// @route   GET /api/discounts/presets
// @access  Authenticated
exports.getPresetDiscounts = async (req, res, next) => {
  try {
    const query = { isActive: true, isPresetButton: true };
    if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
      query.companyId = req.user.companyId;
    }

    const discounts = await Discount.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: discounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all discounts (Admin view)
// @route   GET /api/admin/discounts
// @access  Admin Only
exports.getAllDiscounts = async (req, res, next) => {
  try {
    const query = {};
    if (req.user && req.user.role !== 'system_admin' && req.user.companyId) {
      query.companyId = req.user.companyId;
    }

    const discounts = await Discount.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: discounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new discount
// @route   POST /api/admin/discounts
// @access  Admin Only
exports.createDiscount = async (req, res, next) => {
  try {
    const { name, type, target, value, isPresetButton, displayOrder, productId, companyId } = req.body;

    if (!name || !type || !target || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, target, and value are required'
      });
    }

    let productNameSnapshot = undefined;
    let validProductId = undefined;

    if (target === 'specific_product' && productId) {
      const Product = require('../models/Product');
      const prod = await Product.findById(productId);
      if (prod) {
        validProductId = prod._id;
        productNameSnapshot = prod.name;
      }
    }

    const assignedCompanyId = req.user.role === 'system_admin' ? (companyId || null) : req.user.companyId;

    const discount = await Discount.create({
      name: name.trim(),
      type,
      target,
      productId: validProductId,
      productNameSnapshot,
      value: Number(value),
      isPresetButton: Boolean(isPresetButton),
      displayOrder: Number(displayOrder) || 0,
      companyId: assignedCompanyId,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update discount
// @route   PUT /api/admin/discounts/:id
// @access  Admin Only
exports.updateDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, target, value, isPresetButton, displayOrder, isActive } = req.body;

    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    if (req.user.role !== 'system_admin') {
      if (discount.companyId && req.user.companyId && discount.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to edit this company discount' });
      }
    }

    if (name) discount.name = name.trim();
    if (type) discount.type = type;
    if (target) discount.target = target;
    if (value !== undefined) discount.value = Number(value);
    if (isPresetButton !== undefined) discount.isPresetButton = Boolean(isPresetButton);
    if (displayOrder !== undefined) discount.displayOrder = Number(displayOrder);
    if (isActive !== undefined) discount.isActive = Boolean(isActive);

    await discount.save();

    res.status(200).json({
      success: true,
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete discount
// @route   DELETE /api/admin/discounts/:id
// @access  Admin Only
exports.deleteDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    if (req.user.role !== 'system_admin') {
      if (discount.companyId && req.user.companyId && discount.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete this company discount' });
      }
    }

    await Discount.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: { message: 'Discount deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

