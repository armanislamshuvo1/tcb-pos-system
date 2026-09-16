require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const User = require('../models/User');
const Company = require('../models/Company');

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
      User.deleteMany({}),
      Company.deleteMany({})
    ]);
    console.log('[Seed] Cleared existing categories, products, discounts, users, and companies.');

    // 0. Create Default Company
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
    console.log(`[Seed] Created Default Company: ${defaultCompany.name} (${defaultCompany.currency.symbol})`);

    // Categories and products are NOT automatically seeded to keep inventory clean.

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

    // 4. Create Default System Admin, Cashier, and Staff Users
    const adminUser = await User.create({
      email: 'arman@tcbpos.com',
      fullName: 'Arman',
      employeeCode: 'ADM-001',
      role: 'system_admin',
      companyId: defaultCompany._id,
      pinCode: '276266',
      isActive: true
    });
    console.log(`[Seed] Created Default System Admin User: ${adminUser.email} (${adminUser.employeeCode})`);

    const cashierUser = await User.create({
      email: 'cashier@tcbpos.com',
      fullName: 'Sarah Cashier',
      employeeCode: 'CSH-001',
      role: 'cashier',
      companyId: defaultCompany._id,
      pinCode: '1234',
      isActive: true
    });
    console.log(`[Seed] Created Default Cashier User: ${cashierUser.email} (${cashierUser.employeeCode})`);

    const staffUser = await User.create({
      email: 'staff@tcbpos.com',
      fullName: 'John Staff',
      employeeCode: 'STF-001',
      role: 'staff',
      companyId: defaultCompany._id,
      pinCode: '1234',
      isActive: true
    });
    console.log(`[Seed] Created Default Staff Member: ${staffUser.email} (${staffUser.employeeCode})`);

    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
