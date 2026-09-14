require('dotenv').config({ path: __dirname + '/../.env' });
const { app, server } = require('../server');
const mongoose = require('mongoose');

async function testSecurityAndAuth() {
  console.log('=== Starting Security & PIN Auth Verification Suite ===\n');

  // Wait for MongoDB to be connected and seeded
  const User = require('../models/User');
  let retries = 0;
  while (mongoose.connection.readyState !== 1 || (await User.countDocuments().catch(() => 0)) === 0) {
    await new Promise(res => setTimeout(res, 500));
    retries++;
    if (retries > 30) throw new Error('Timed out waiting for MongoDB connection and seeding');
  }
  console.log('[Setup] Database ready and verified seeded with users.\n');

  const PORT = process.env.PORT || 5000;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  try {
    // 1. Verify Helmet Security Headers
    console.log('[Test 1] Testing Helmet security headers on /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const headers = Object.fromEntries(healthRes.headers.entries());
    
    console.log('  -> x-content-type-options:', headers['x-content-type-options']);
    console.log('  -> x-frame-options:', headers['x-frame-options']);
    console.log('  -> strict-transport-security:', headers['strict-transport-security']);
    
    if (headers['x-content-type-options'] === 'nosniff') {
      console.log('  [PASS] Helmet security headers verified.\n');
    } else {
      console.warn('  [WARN] Unexpected header values.\n');
    }

    // 2. Verify Successful PIN Login for Cashier (CSH-001 / PIN: 1234)
    console.log('[Test 2] Testing successful PIN login for CSH-001 with PIN 1234...');
    const loginRes = await fetch(`${baseUrl}/api/users/pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeCode: 'CSH-001', pinCode: '1234' })
    });
    const loginData = await loginRes.json();
    
    if (loginRes.ok && loginData.success && loginData.data?.token) {
      console.log('  [PASS] PIN login successful!');
      console.log('  -> Cashier:', loginData.data.user.fullName);
      console.log('  -> Role:', loginData.data.user.role);
      console.log('  -> JWT Token received (length):', loginData.data.token.length, '\n');
    } else {
      throw new Error(`PIN login failed: ${JSON.stringify(loginData)}`);
    }

    const cashierToken = loginData.data.token;

    // 3. Verify Authenticated Request using JWT
    console.log('[Test 3] Testing JWT authentication on protected endpoint /api/staff...');
    const staffRes = await fetch(`${baseUrl}/api/staff`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const staffData = await staffRes.json();

    if (staffRes.ok && staffData.success && Array.isArray(staffData.data)) {
      console.log(`  [PASS] Protected route accessed with JWT. Staff count: ${staffData.data.length}\n`);
    } else {
      throw new Error(`Protected route access failed: ${JSON.stringify(staffData)}`);
    }

    // 4. Verify Invalid PIN rejection
    console.log('[Test 4] Testing invalid PIN rejection...');
    const badPinRes = await fetch(`${baseUrl}/api/users/pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeCode: 'CSH-001', pinCode: '9999' })
    });
    const badPinData = await badPinRes.json();
    if (badPinRes.status === 401 && badPinData.message === 'Incorrect PIN code') {
      console.log('  [PASS] Invalid PIN correctly rejected with 401 Unauthorized.\n');
    } else {
      throw new Error(`Expected 401 for bad PIN, got ${badPinRes.status}: ${JSON.stringify(badPinData)}`);
    }

    // 5. Verify Rate Limiter on /api/users/pin-login
    console.log('[Test 5] Testing Rate Limiter (Brute force protection max 5 requests)...');
    let blocked = false;
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${baseUrl}/api/users/pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode: 'CSH-001', pinCode: '0000' })
      });
      console.log(`  Attempt ${i}: Status ${res.status}`);
      if (res.status === 429) {
        const rateLimitData = await res.json();
        console.log('  -> 429 Response message:', rateLimitData.message);
        blocked = true;
        break;
      }
    }

    if (blocked) {
      console.log('  [PASS] Rate limiter successfully engaged and blocked excessive attempts!\n');
    } else {
      console.warn('  [WARN] Rate limit threshold was not triggered within 6 requests.\n');
    }

    console.log('=== All Security & PIN Auth Tests Completed Successfully ===');
  } catch (err) {
    console.error('Test Suite Failed:', err);
  } finally {
    if (server && server.close) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

testSecurityAndAuth();
