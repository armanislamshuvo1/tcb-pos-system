const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the user created for TCB company that was incorrectly promoted to system_admin
    // We need to demote them back to 'admin' 
    const tcbAdmins = await User.find({
      role: 'system_admin',
      email: { $ne: 'arman@tcbpos.com' }  // exclude the real system admin
    }).lean();

    console.log('Users incorrectly escalated to system_admin:', tcbAdmins.length);
    tcbAdmins.forEach(u => console.log(`  - ${u.fullName} | ${u.email} | ${u.employeeCode} | companyId: ${u.companyId}`));

    if (tcbAdmins.length > 0) {
      const ids = tcbAdmins.map(u => u._id);
      const result = await User.updateMany(
        { _id: { $in: ids } },
        { $set: { role: 'admin' } }
      );
      console.log(`\nDemoted ${result.modifiedCount} incorrectly escalated user(s) back to 'admin'`);
    }

    // Verify
    const allUsers = await User.find().select('fullName email employeeCode role companyId isActive').lean();
    console.log('\nAll users after fix:');
    allUsers.forEach(u => console.log(`  - [${u.role}] ${u.fullName} | ${u.email} | ${u.employeeCode} | companyId: ${u.companyId} | active: ${u.isActive}`));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

fix();
