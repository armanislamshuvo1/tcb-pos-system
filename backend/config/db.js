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
  const User = require('../models/User');
  const Company = require('../models/Company');

  const companyCount = await Company.countDocuments();
  let defaultCompany;

  if (companyCount === 0) {
    console.log('[MongoDB Auto-Seed] Populating initial company and admin credentials...');

    // 0. Default Company
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
      address: 'Main Terminal',
      contactEmail: 'admin@possystem.com',
      isActive: true
    });
  } else {
    defaultCompany = await Company.findOne();
  }

  const userCount = await User.countDocuments();
  if (userCount === 0 && defaultCompany) {
    await User.create([
      { firebaseUid: 'dev_admin_uid', email: 'arman@tcbpos.com', fullName: 'Arman', employeeCode: 'ADM-001', role: 'system_admin', pinCode: '276266', companyId: defaultCompany._id, isActive: true },
      { firebaseUid: 'dev_cashier_uid', email: 'cashier@pos.local', fullName: 'Sarah Jenkins', employeeCode: 'CSH-001', role: 'cashier', pinCode: '1234', companyId: defaultCompany._id, isActive: true }
    ]);
    console.log('[MongoDB Auto-Seed] Seeded bootstrap system admin and cashier accounts.');
  }
};

module.exports = connectDB;
