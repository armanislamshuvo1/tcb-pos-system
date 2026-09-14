require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const User = require('../models/User');

const seedData = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tcb_pos_tab';

  try {
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing collections
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Discount.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing categories, products, discounts, and users.');

    // 1. Create Categories
    const categories = await Category.create([
      { name: 'Hot Coffee', slug: 'hot-coffee', displayOrder: 1, colorCode: '#D97706' },
      { name: 'Cold Drinks', slug: 'cold-drinks', displayOrder: 2, colorCode: '#0284C7' },
      { name: 'Bakery & Pastries', slug: 'bakery', displayOrder: 3, colorCode: '#EA580C' },
      { name: 'Kitchen & Meals', slug: 'kitchen', displayOrder: 4, colorCode: '#16A34A' }
    ]);
    console.log(`[Seed] Created ${categories.length} categories.`);

    const catMap = categories.reduce((acc, cat) => {
      acc[cat.slug] = cat;
      return acc;
    }, {});

    // 2. Create Products linked to Categories
    const products = await Product.create([
      {
        sku: 'COF-FW-01',
        name: 'Flat White',
        categoryId: catMap['hot-coffee']._id,
        categoryNameSnapshot: catMap['hot-coffee'].name,
        priceInCents: 450,
        costInCents: 120,
        stockQuantity: 200
      },
      {
        sku: 'COF-LB-02',
        name: 'Long Black',
        categoryId: catMap['hot-coffee']._id,
        categoryNameSnapshot: catMap['hot-coffee'].name,
        priceInCents: 400,
        costInCents: 90,
        stockQuantity: 200
      },
      {
        sku: 'COF-CAP-03',
        name: 'Cappuccino',
        categoryId: catMap['hot-coffee']._id,
        categoryNameSnapshot: catMap['hot-coffee'].name,
        priceInCents: 450,
        costInCents: 120,
        stockQuantity: 150
      },
      {
        sku: 'DRK-IL-01',
        name: 'Iced Latte',
        categoryId: catMap['cold-drinks']._id,
        categoryNameSnapshot: catMap['cold-drinks'].name,
        priceInCents: 550,
        costInCents: 150,
        stockQuantity: 100
      },
      {
        sku: 'DRK-COLD-02',
        name: 'Cold Brew',
        categoryId: catMap['cold-drinks']._id,
        categoryNameSnapshot: catMap['cold-drinks'].name,
        priceInCents: 500,
        costInCents: 130,
        stockQuantity: 80
      },
      {
        sku: 'BAK-AC-01',
        name: 'Almond Croissant',
        categoryId: catMap['bakery']._id,
        categoryNameSnapshot: catMap['bakery'].name,
        priceInCents: 500,
        costInCents: 180,
        stockQuantity: 40
      },
      {
        sku: 'BAK-CB-02',
        name: 'Chocolate Brownie',
        categoryId: catMap['bakery']._id,
        categoryNameSnapshot: catMap['bakery'].name,
        priceInCents: 420,
        costInCents: 140,
        stockQuantity: 50
      },
      {
        sku: 'KIT-ST-01',
        name: 'Sourdough Toast & Butter',
        categoryId: catMap['kitchen']._id,
        categoryNameSnapshot: catMap['kitchen'].name,
        priceInCents: 700,
        costInCents: 210,
        stockQuantity: 60
      },
      {
        sku: 'KIT-BLT-02',
        name: 'BLT Sandwich',
        categoryId: catMap['kitchen']._id,
        categoryNameSnapshot: catMap['kitchen'].name,
        priceInCents: 1150,
        costInCents: 400,
        stockQuantity: 30
      }
    ]);
    console.log(`[Seed] Created ${products.length} products.`);

    // 3. Create Preset Discounts
    const discounts = await Discount.create([
      {
        name: '10% Staff Shift',
        type: 'percentage',
        target: 'line_item',
        value: 10,
        isPresetButton: true,
        displayOrder: 1
      },
      {
        name: '20% Manager Special',
        type: 'percentage',
        target: 'line_item',
        value: 20,
        isPresetButton: true,
        displayOrder: 2
      },
      {
        name: '$2.00 Promo',
        type: 'fixed_cents',
        target: 'global_ticket',
        value: 200,
        isPresetButton: true,
        displayOrder: 3
      },
      {
        name: '100% Spoilage/Comp',
        type: 'percentage',
        target: 'line_item',
        value: 100,
        isPresetButton: true,
        displayOrder: 4
      }
    ]);
    console.log(`[Seed] Created ${discounts.length} preset discounts.`);

    // 4. Create Users (Cashiers, Staff, Admin)
    const users = await User.create([
      {
        firebaseUid: 'dev_admin_uid',
        email: 'admin@pos.local',
        fullName: 'System Administrator',
        employeeCode: 'ADM-001',
        role: 'admin',
        isActive: true
      },
      {
        firebaseUid: 'dev_cashier_uid',
        email: 'cashier@pos.local',
        fullName: 'Sarah Jenkins',
        employeeCode: 'CSH-001',
        role: 'cashier',
        isActive: true
      },
      {
        firebaseUid: 'dev_staff_john',
        email: 'john.kitchen@pos.local',
        fullName: 'John Doe (Kitchen)',
        employeeCode: 'STF-101',
        role: 'staff',
        isActive: true
      },
      {
        firebaseUid: 'dev_staff_alex',
        email: 'alex.barista@pos.local',
        fullName: 'Alex Rivers (Barista)',
        employeeCode: 'STF-102',
        role: 'staff',
        isActive: true
      }
    ]);
    console.log(`[Seed] Created ${users.length} users/staff.`);

    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
