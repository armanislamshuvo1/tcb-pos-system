const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');
const Company = require('../models/Company');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const comp = await Company.findOne({ code: 'TCB' }).lean();
    console.log('TCB COMPANY:', comp);

    const users = await User.find({ companyId: comp?._id }).lean();
    console.log('USERS FOR TCB:', users);

    // Let's also check all users in database regardless of companyId
    const allUsers = await User.find().lean();
    console.log('ALL USERS COUNT:', allUsers.length);
    allUsers.forEach(u => console.log('USER:', u.fullName, u.email, u.employeeCode, u.role, u.companyId));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
