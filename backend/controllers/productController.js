const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get products with optional category filter or keyword search
// @route   GET /api/products
// @access  Authenticated
exports.getProducts = async (req, res, next) => {
  try {
    const { categoryId, search, activeOnly = 'true' } = req.query;
    const query = {};

    // Multi-tenant scoping: Non-system admins only see their company's products
    if (req.user && req.user.role !== 'system_admin') {
      if (!req.user.companyId) {
        return res.status(200).json({ success: true, data: [] });
      }
      query.companyId = req.user.companyId;
    }

    if (activeOnly === 'true') {
      query.isActive = true;
    }

    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { name: searchRegex },
            { sku: searchRegex },
            { categoryNameSnapshot: searchRegex }
          ]
        }
      ];
    }

    const products = await Product.find(query)
      .populate('categoryId', 'name slug colorCode')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product assigned to a category
// @route   POST /api/admin/products
// @access  Admin Only
exports.createProduct = async (req, res, next) => {
  try {
    const {
      sku,
      name,
      categoryId,
      priceInCents,
      costInCents,
      taxRatePercent,
      stockQuantity,
      discountType,
      discountValue,
      companyId
    } = req.body;

    if (!sku || !name || !categoryId || priceInCents === undefined) {
      return res.status(400).json({
        success: false,
        message: 'SKU, product name, categoryId, and priceInCents are required'
      });
    }

    if (req.user.role !== 'system_admin' && !req.user.companyId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: No company associated' });
    }

    const assignedCompanyId = req.user.role === 'system_admin' ? (companyId || null) : req.user.companyId;

    // Verify category exists and belongs to this company
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'The specified Category does not exist'
      });
    }

    if (assignedCompanyId && category.companyId && category.companyId.toString() !== assignedCompanyId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The specified Category does not belong to your company'
      });
    }

    const existingSku = await Product.findOne({ 
      companyId: assignedCompanyId, 
      sku: sku.trim().toUpperCase() 
    });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: 'A product with this SKU already exists in this company'
      });
    }

    const validDiscountType = ['percentage', 'fixed_cents'].includes(discountType) ? discountType : 'none';
    const validDiscountValue = validDiscountType === 'none' ? 0 : Math.max(0, Number(discountValue) || 0);

    const product = await Product.create({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      categoryId: category._id,
      categoryNameSnapshot: category.name,
      priceInCents: Math.round(Number(priceInCents)),
      costInCents: Math.round(Number(costInCents) || 0),
      taxRatePercent: Number(taxRatePercent) || 0,
      stockQuantity: Number(stockQuantity) || 0,
      discountType: validDiscountType,
      discountValue: validDiscountValue,
      companyId: assignedCompanyId,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details or change category
// @route   PUT /api/admin/products/:id
// @access  Admin Only
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      sku,
      name,
      categoryId,
      priceInCents,
      costInCents,
      taxRatePercent,
      stockQuantity,
      discountType,
      discountValue,
      isActive
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Tenant check: Non-system admins cannot modify products outside their company
    if (req.user.role !== 'system_admin') {
      if (!product.companyId || !req.user.companyId || product.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to edit this company product' });
      }
    }

    if (sku) product.sku = sku.trim().toUpperCase();
    if (name) product.name = name.trim();
    if (priceInCents !== undefined) product.priceInCents = Math.round(Number(priceInCents));
    if (costInCents !== undefined) product.costInCents = Math.round(Number(costInCents));
    if (taxRatePercent !== undefined) product.taxRatePercent = Number(taxRatePercent);
    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
    if (discountType !== undefined) {
      product.discountType = ['percentage', 'fixed_cents'].includes(discountType) ? discountType : 'none';
      if (product.discountType === 'none') {
        product.discountValue = 0;
      }
    }
    if (discountValue !== undefined && product.discountType !== 'none') {
      product.discountValue = Math.max(0, Number(discountValue) || 0);
    }
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    // If category is changing, update ref and snapshot
    if (categoryId && categoryId !== String(product.categoryId)) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ success: false, message: 'New Category not found' });
      }
      if (product.companyId && category.companyId && category.companyId.toString() !== product.companyId.toString()) {
        return res.status(400).json({ success: false, message: 'The specified Category does not belong to this company' });
      }
      product.categoryId = category._id;
      product.categoryNameSnapshot = category.name;
    }

    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate product
// @route   DELETE /api/admin/products/:id
// @access  Admin Only
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.user.role !== 'system_admin') {
      if (!product.companyId || !req.user.companyId || product.companyId.toString() !== req.user.companyId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete this company product' });
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: { message: 'Product removed from catalog successfully' }
    });
  } catch (error) {
    next(error);
  }
};
