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

    const Customer = require('../models/Customer');

    // 2. Assign unassigned items to default company with collision safety
    // 2a. Categories: merge duplicates on { companyId, slug } or assign companyId
    const orphanCategories = await Category.find({
      $or: [{ companyId: { $exists: false } }, { companyId: null }]
    });

    for (const orphan of orphanCategories) {
      const existing = await Category.findOne({
        companyId: defaultCompany._id,
        slug: orphan.slug,
        _id: { $ne: orphan._id }
      });

      if (existing) {
        // Colliding slug: re-point any products referencing this orphan category to canonical one
        await Product.updateMany(
          { categoryId: orphan._id },
          { $set: { categoryId: existing._id, categoryNameSnapshot: existing.name } }
        );
        // Delete the redundant orphan duplicate
        await Category.deleteOne({ _id: orphan._id });
        console.log(`[Migration] Merged duplicate category '${orphan.slug}' into existing category '${existing.name}'.`);
      } else {
        orphan.companyId = defaultCompany._id;
        await orphan.save();
      }
    }

    // 2b. Products: safely deduplicate SKU collisions if any
    const orphanProducts = await Product.find({
      $or: [{ companyId: { $exists: false } }, { companyId: null }]
    });

    for (const orphan of orphanProducts) {
      const existing = await Product.findOne({
        companyId: defaultCompany._id,
        sku: orphan.sku,
        _id: { $ne: orphan._id }
      });

      if (existing) {
        orphan.sku = `${orphan.sku}-OLD-${orphan._id.toString().slice(-4)}`.toUpperCase();
      }
      orphan.companyId = defaultCompany._id;
      await orphan.save();
    }

    // 2c. Users: safely deduplicate employeeCode collisions if any
    const orphanUsers = await User.find({
      $or: [{ companyId: { $exists: false } }, { companyId: null }]
    });

    for (const orphan of orphanUsers) {
      const existing = await User.findOne({
        companyId: defaultCompany._id,
        employeeCode: orphan.employeeCode,
        _id: { $ne: orphan._id }
      });

      if (existing) {
        orphan.employeeCode = `${orphan.employeeCode}-OLD-${orphan._id.toString().slice(-4)}`.toUpperCase();
      }
      orphan.companyId = defaultCompany._id;
      await orphan.save();
    }

    // 2d. Discounts, Transactions, Customers
    await Promise.all([
      Discount.updateMany({ $or: [{ companyId: { $exists: false } }, { companyId: null }] }, { $set: { companyId: defaultCompany._id } }),
      Transaction.updateMany({ $or: [{ companyId: { $exists: false } }, { companyId: null }] }, { $set: { companyId: defaultCompany._id } }),
      Customer.updateMany({ $or: [{ companyId: { $exists: false } }, { companyId: null }] }, { $set: { companyId: defaultCompany._id } })
    ]);
    console.log('[Migration] Associated existing products, categories, discounts, transactions, customers and users with default company.');

    // 3. Promote ONLY the bootstrap system admin accounts to system_admin.
    //    We MUST NOT use role: 'admin' as a filter here — that would accidentally
    //    escalate B2B company admins to system_admin on every server restart.
    //    Only promote by explicit bootstrap identity (email or employee code).
    const promotedAdmins = await User.updateMany(
      {
        $or: [
          { employeeCode: 'ADM-001' },
          { email: 'arman@tcbpos.com' }
        ]
      },
      { $set: { role: 'system_admin' } }
    );
    console.log(`[Migration] Promoted ${promotedAdmins.modifiedCount} bootstrap admin(s) to 'system_admin'.`);

    // Verify system_admin user
    const systemAdmins = await User.find({ role: 'system_admin' }).select('fullName employeeCode email role');
    console.log('[Migration] Active System Admins:', systemAdmins);

    // 4. Drop legacy global unique indexes if present and sync multi-tenant compound indexes
    try {
      await Product.collection.dropIndex('sku_1').catch(() => {});
      await User.collection.dropIndex('employeeCode_1').catch(() => {});
      await Category.collection.dropIndex('slug_1').catch(() => {});
      await Category.collection.dropIndex('name_1').catch(() => {});

      await Promise.all([
        Product.syncIndexes(),
        User.syncIndexes(),
        Category.syncIndexes()
      ]);
      console.log('[Migration] Synced multi-tenant compound indexes.');
    } catch (idxErr) {
      console.warn('[Migration] Index sync note:', idxErr.message);
    }

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
