require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Discount = require('../models/Discount');
const Transaction = require('../models/Transaction');
const connectDB = require('../config/db');

const runMigration = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('[Migration] Connected to MongoDB...');

    // 1. Create or Find Default B2B Company
    let defaultCompany = await Company.findOne({ code: 'POS-HQ' });
    if (!defaultCompany) {
      defaultCompany = await Company.findOne(); // check if any company exists
    }

    if (!defaultCompany) {
      defaultCompany = await Company.create({
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
        address: 'HQ Terminal',
        contactEmail: 'admin@possystem.com',
        isActive: true
      });
      console.log(`[Migration] Created Default B2B Company: ${defaultCompany.name} (Code: ${defaultCompany.code})`);
    } else {
      console.log(`[Migration] Using existing company: ${defaultCompany.name} (Code: ${defaultCompany.code})`);
    }

    // 2. Assign unassigned items to default company
    await Promise.all([
      Product.updateMany({ companyId: { $exists: false } }, { $set: { companyId: defaultCompany._id } }),
      Product.updateMany({ companyId: null }, { $set: { companyId: defaultCompany._id } }),
      Category.updateMany({ companyId: { $exists: false } }, { $set: { companyId: defaultCompany._id } }),
      Category.updateMany({ companyId: null }, { $set: { companyId: defaultCompany._id } }),
      Discount.updateMany({ companyId: { $exists: false } }, { $set: { companyId: defaultCompany._id } }),
      Discount.updateMany({ companyId: null }, { $set: { companyId: defaultCompany._id } }),
      Transaction.updateMany({ companyId: { $exists: false } }, { $set: { companyId: defaultCompany._id } }),
      Transaction.updateMany({ companyId: null }, { $set: { companyId: defaultCompany._id } }),
      User.updateMany({ companyId: { $exists: false } }, { $set: { companyId: defaultCompany._id } }),
      User.updateMany({ companyId: null }, { $set: { companyId: defaultCompany._id } })
    ]);
    console.log('[Migration] Associated existing products, categories, discounts, transactions and users with default company.');

    // 3. Promote current admin(s) to system_admin
    const promotedAdmins = await User.updateMany(
      { $or: [{ role: 'admin' }, { employeeCode: 'ADM-001' }, { email: 'arman@tcbpos.com' }] },
      { $set: { role: 'system_admin' } }
    );
    console.log(`[Migration] Promoted ${promotedAdmins.modifiedCount} admin user(s) to 'system_admin'.`);

    // Verify system_admin user
    const systemAdmins = await User.find({ role: 'system_admin' }).select('fullName employeeCode email role');
    console.log('[Migration] Active System Admins:', systemAdmins);

    console.log('[Migration] Multi-tenant B2B migration completed successfully!');
    return { success: true, defaultCompany, systemAdmins };
  } catch (error) {
    console.error('[Migration Error]:', error);
    throw error;
  }
};

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigration;
