const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const User = require('../models/User');

async function verifyPin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const testCases = [
      { identifier: 'ADM-001', pin: '1234', desc: 'System Admin ADM-001' },
      { identifier: 'TCB', pin: '1234', desc: 'TCB Admin (code: TCB)' },
      { identifier: 'admin@tcb.com', pin: '1234', desc: 'TCB Admin (email)' },
    ];

    for (const tc of testCases) {
      const user = await User.findOne({
        $or: [
          { employeeCode: tc.identifier.toUpperCase() },
          { email: tc.identifier.toLowerCase() }
        ],
        isActive: true
      });

      if (!user) {
        console.log(`[${tc.desc}] ❌ User NOT FOUND`);
        continue;
      }

      const isMatch = await user.comparePin(tc.pin);
      console.log(`[${tc.desc}] Role: ${user.role} | PIN match (${tc.pin}): ${isMatch ? '✅' : '❌'} | Hash: ${user.pinCode?.substring(0, 15)}...`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

verifyPin();
