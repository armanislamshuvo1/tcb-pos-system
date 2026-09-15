const Customer = require('../models/Customer');

// @desc    Get all active customers for current company with optional search
// @route   GET /api/customers
// @access  Authenticated (Cashier, Admin, System Admin)
exports.getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { isActive: true };

    if (req.user.companyId && req.user.role !== 'system_admin') {
      query.companyId = req.user.companyId;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Authenticated (Cashier, Admin)
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    const companyId = req.user.companyId || null;

    // Check if an active customer with identical name already exists in this company
    const existing = await Customer.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      ...(companyId ? { companyId } : {}),
      isActive: true
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Customer already exists',
        data: existing
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      companyId,
      notes: notes ? notes.trim() : '',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer details
// @route   PUT /api/customers/:id
// @access  Authenticated (Cashier, Admin)
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, notes, isActive } = req.body;

    const query = { _id: id };
    if (req.user.companyId && req.user.role !== 'system_admin') {
      query.companyId = req.user.companyId;
    }

    const customer = await Customer.findOne(query);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (name !== undefined) customer.name = name.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email.trim().toLowerCase();
    if (notes !== undefined) customer.notes = notes.trim();
    if (isActive !== undefined) customer.isActive = Boolean(isActive);

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};
