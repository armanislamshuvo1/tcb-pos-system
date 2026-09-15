const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  try {
    if (mongoUri && mongoUri !== 'memory') {
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      console.log(`[MongoDB] Connected to external MongoDB: ${conn.connection.host}/${conn.connection.name}`);
      return;
    }
  } catch (error) {
    console.warn(`[MongoDB] Could not reach external MongoDB (${error.message}).`);
  }

  // Fallback to embedded mongodb-memory-server for local development
  try {
    console.log('[MongoDB] Spinning up embedded MongoDB Memory Server for local development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const uri = mongodInstance.getUri();
    
    await mongoose.connect(uri);
    console.log(`[MongoDB] Embedded Memory Server connected successfully at: ${uri}`);

    // Automatically seed initial data for immediate development productivity
    await autoSeedIfEmpty();
  } catch (memErr) {
    console.error('[MongoDB Error] Failed to initialize embedded MongoDB:', memErr.message);
  }
};

const autoSeedIfEmpty = async () => {
  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const Discount = require('../models/Discount');
  const User = require('../models/User');

  const Company = require('../models/Company');

  const count = await Category.countDocuments();
  if (count === 0) {
    console.log('[MongoDB Auto-Seed] Populating initial categories, products, discounts, users, and company...');

    // 0. Default Company
    const defaultCompany = await Company.create({
      name: 'PoS System HQ',
      code: 'POS-HQ',
      branding: {
        displayName: 'PoS System',
        logoText: 'P',
        themeColor: '#F59E0B'
      },
      currency: {
        code: 'MYR',
        symbol: 'RM'
      },
      address: 'Main Terminal',
      contactEmail: 'admin@possystem.com',
      isActive: true
    });

    // 1. Categories
    const categories = await Category.create([
      { name: 'Hot Coffee', slug: 'hot-coffee', displayOrder: 1, colorCode: '#D97706', companyId: defaultCompany._id },
      { name: 'Cold Drinks', slug: 'cold-drinks', displayOrder: 2, colorCode: '#0284C7', companyId: defaultCompany._id },
      { name: 'Bakery & Pastries', slug: 'bakery', displayOrder: 3, colorCode: '#EA580C', companyId: defaultCompany._id },
      { name: 'Kitchen & Meals', slug: 'kitchen', displayOrder: 4, colorCode: '#16A34A', companyId: defaultCompany._id }
    ]);

    const catMap = categories.reduce((acc, c) => ({ ...acc, [c.slug]: c }), {});

    // 2. Products
    await Product.create([
      { sku: 'COF-FW-01', name: 'Flat White', categoryId: catMap['hot-coffee']._id, categoryNameSnapshot: 'Hot Coffee', priceInCents: 450, costInCents: 120, stockQuantity: 200, companyId: defaultCompany._id },
      { sku: 'COF-LB-02', name: 'Long Black', categoryId: catMap['hot-coffee']._id, categoryNameSnapshot: 'Hot Coffee', priceInCents: 400, costInCents: 90, stockQuantity: 200, companyId: defaultCompany._id },
      { sku: 'COF-CAP-03', name: 'Cappuccino', categoryId: catMap['hot-coffee']._id, categoryNameSnapshot: 'Hot Coffee', priceInCents: 450, costInCents: 120, stockQuantity: 150, companyId: defaultCompany._id },
      { sku: 'DRK-IL-01', name: 'Iced Latte', categoryId: catMap['cold-drinks']._id, categoryNameSnapshot: 'Cold Drinks', priceInCents: 550, costInCents: 150, stockQuantity: 100, companyId: defaultCompany._id },
      { sku: 'DRK-CB-02', name: 'Cold Brew', categoryId: catMap['cold-drinks']._id, categoryNameSnapshot: 'Cold Drinks', priceInCents: 500, costInCents: 130, stockQuantity: 80, companyId: defaultCompany._id },
      { sku: 'BAK-AC-01', name: 'Almond Croissant', categoryId: catMap['bakery']._id, categoryNameSnapshot: 'Bakery & Pastries', priceInCents: 500, costInCents: 180, stockQuantity: 40, companyId: defaultCompany._id },
      { sku: 'BAK-CB-02', name: 'Chocolate Brownie', categoryId: catMap['bakery']._id, categoryNameSnapshot: 'Bakery & Pastries', priceInCents: 420, costInCents: 140, stockQuantity: 50, companyId: defaultCompany._id },
      { sku: 'KIT-ST-01', name: 'Sourdough Toast & Butter', categoryId: catMap['kitchen']._id, categoryNameSnapshot: 'Kitchen & Meals', priceInCents: 700, costInCents: 210, stockQuantity: 60, companyId: defaultCompany._id },
      { sku: 'KIT-BLT-02', name: 'BLT Sandwich', categoryId: catMap['kitchen']._id, categoryNameSnapshot: 'Kitchen & Meals', priceInCents: 1150, costInCents: 400, stockQuantity: 30, companyId: defaultCompany._id }
    ]);

    // 3. Preset Discounts
    await Discount.create([
      { name: '10% Staff Shift', type: 'percentage', target: 'line_item', value: 10, isPresetButton: true, displayOrder: 1, companyId: defaultCompany._id },
      { name: '20% Manager Special', type: 'percentage', target: 'line_item', value: 20, isPresetButton: true, displayOrder: 2, companyId: defaultCompany._id },
      { name: 'RM 2.00 Quick Promo', type: 'fixed_cents', target: 'global_ticket', value: 200, isPresetButton: true, displayOrder: 3, companyId: defaultCompany._id },
      { name: '100% Spoilage/Comp', type: 'percentage', target: 'line_item', value: 100, isPresetButton: true, displayOrder: 4, companyId: defaultCompany._id }
    ]);

    // 4. Users (System Admin, Cashier, Staff)
    await User.create([
      { firebaseUid: 'dev_admin_uid', email: 'arman@tcbpos.com', fullName: 'Arman', employeeCode: 'ADM-001', role: 'system_admin', pinCode: '276266', companyId: defaultCompany._id, isActive: true },
      { firebaseUid: 'dev_cashier_uid', email: 'cashier@pos.local', fullName: 'Sarah Jenkins', employeeCode: 'CSH-001', role: 'cashier', pinCode: '1234', companyId: defaultCompany._id, isActive: true },
      { firebaseUid: 'dev_staff_john', email: 'john.kitchen@pos.local', fullName: 'John Doe (Kitchen)', employeeCode: 'STF-101', role: 'staff', pinCode: '1234', companyId: defaultCompany._id, isActive: true },
      { firebaseUid: 'dev_staff_alex', email: 'alex.barista@pos.local', fullName: 'Alex Rivers (Barista)', employeeCode: 'STF-102', role: 'staff', pinCode: '1234', companyId: defaultCompany._id, isActive: true }
    ]);

    console.log('[MongoDB Auto-Seed] Initial data populated successfully with System Admin and MYR currency!');
  }
};

module.exports = connectDB;
