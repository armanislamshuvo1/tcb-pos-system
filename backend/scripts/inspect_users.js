const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');
const Company = require('../models/Company');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    const users = await User.find().select('fullName email employeeCode role companyId pinCode isActive').lean();
    console.log('--- ALL USERS (' + users.length + ') ---');
    users.forEach(u => {
      console.log(`- [${u.role}] ${u.fullName} | Email: ${u.email} | Code: ${u.employeeCode} | Active: ${u.isActive} | CoId: ${u.companyId} | PinHash: ${u.pinCode?.substring(0, 10)}...`);
    });
    const companies = await Company.find().lean();
    console.log('\n--- ALL COMPANIES (' + companies.length + ') ---');
    companies.forEach(c => {
      console.log(`- [${c.code}] ${c.name} (ID: ${c._id}) | Active: ${c.isActive}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
