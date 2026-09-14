const Category = require('../models/Category');

// @desc    Get all active categories for POS navigation
// @route   GET /api/categories
// @access  Authenticated (Cashier, Admin)
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product category
// @route   POST /api/admin/categories
// @access  Admin Only
exports.createCategory = async (req, res, next) => {
  try {
    const { name, displayOrder, colorCode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = name.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await Category.findOne({ $or: [{ name: name.trim() }, { slug }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      displayOrder: Number(displayOrder) || 0,
      colorCode: colorCode || '#3B82F6',
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Admin Only
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, displayOrder, colorCode, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name.trim()) {
      category.name = name.trim();
      category.slug = name.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (colorCode) category.colorCode = colorCode;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate (soft delete) category
// @route   DELETE /api/admin/categories/:id
// @access  Admin Only
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' });
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Category deactivated successfully' }
    });
  } catch (error) {
    next(error);
  }
};
