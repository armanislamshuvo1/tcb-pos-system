require('dotenv').config({ path: __dirname + '/../.env' });
const { app, server } = require('../server');
const mongoose = require('mongoose');

async function testVoidTransactions() {
  console.log('=== Starting Void Transaction & PIN Verification Suite ===\n');

  const User = require('../models/User');
  const Transaction = require('../models/Transaction');
  const Product = require('../models/Product');

  let retries = 0;
  while (mongoose.connection.readyState !== 1 || (await User.countDocuments().catch(() => 0)) === 0) {
    await new Promise(res => setTimeout(res, 500));
    retries++;
    if (retries > 30) throw new Error('Timed out waiting for MongoDB connection and seeding');
  }
  console.log('[Setup] Database ready and verified.\n');

  const PORT = process.env.PORT || 5000;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  try {
    // 1. PIN Login as Cashier (CSH-001, PIN 1234)
    console.log('[Step 1] Logging in as Cashier CSH-001 with PIN 1234...');
    const loginRes = await fetch(`${baseUrl}/api/users/pin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeCode: 'CSH-001', pinCode: '1234' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.data.token;
    const staffUser = loginData.data.user;
    console.log(`  [PASS] Logged in as: ${staffUser.fullName} (${staffUser.employeeCode})\n`);

    // 2. Create a test transaction to void
    console.log('[Step 2] Creating a test transaction to void...');
    const sampleProduct = await Product.findOne({ isActive: true });
    if (!sampleProduct) throw new Error('No active products found');

    const txnRes = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        items: [
          {
            productId: sampleProduct._id,
            productName: sampleProduct.name,
            unitPriceInCents: sampleProduct.priceInCents,
            quantity: 2
          }
        ],
        status: 'PAID',
        paymentMethod: 'CASH',
        customerName: 'Test Void Customer'
      })
    });
    const txnData = await txnRes.json();
    if (!txnRes.ok || !txnData.data?._id) {
      throw new Error(`Transaction creation failed: ${JSON.stringify(txnData)}`);
    }
    const txnId = txnData.data._id;
    const txnNumber = txnData.data.txnNumber;
    console.log(`  [PASS] Created transaction: ${txnNumber} (ID: ${txnId})\n`);

    // 3. Attempt void with missing PIN
    console.log('[Step 3] Attempting void without PIN...');
    const noPinRes = await fetch(`${baseUrl}/api/transactions/${txnId}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: 'Customer changed mind'
      })
    });
    const noPinData = await noPinRes.json();
    if (noPinRes.status === 400 && !noPinData.success) {
      console.log('  [PASS] Rejected void with missing PIN (HTTP 400):', noPinData.message, '\n');
    } else {
      throw new Error(`Expected HTTP 400 for missing PIN, got: ${noPinRes.status}`);
    }

    // 4. Attempt void with missing reason
    console.log('[Step 4] Attempting void without reason...');
    const noReasonRes = await fetch(`${baseUrl}/api/transactions/${txnId}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pinCode: '1234',
        reason: '   '
      })
    });
    const noReasonData = await noReasonRes.json();
    if (noReasonRes.status === 400 && !noReasonData.success) {
      console.log('  [PASS] Rejected void with empty reason (HTTP 400):', noReasonData.message, '\n');
    } else {
      throw new Error(`Expected HTTP 400 for missing reason, got: ${noReasonRes.status}`);
    }

    // 5. Attempt void with WRONG PIN
    console.log('[Step 5] Attempting void with incorrect PIN (9999)...');
    const wrongPinRes = await fetch(`${baseUrl}/api/transactions/${txnId}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pinCode: '9999',
        reason: 'Duplicate entry'
      })
    });
    const wrongPinData = await wrongPinRes.json();
    if (wrongPinRes.status === 401 && !wrongPinData.success) {
      console.log('  [PASS] Rejected void with incorrect PIN (HTTP 401):', wrongPinData.message, '\n');
    } else {
      throw new Error(`Expected HTTP 401 for wrong PIN, got: ${wrongPinRes.status}`);
    }

    // 6. Void transaction with valid PIN and valid reason
    console.log('[Step 6] Voiding transaction with valid PIN (1234) and reason...');
    const voidRes = await fetch(`${baseUrl}/api/transactions/${txnId}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pinCode: '1234',
        reason: 'Customer requested cancellation before order fulfillment'
      })
    });
    const voidData = await voidRes.json();
    if (!voidRes.ok || !voidData.success) {
      throw new Error(`Valid void failed: ${JSON.stringify(voidData)}`);
    }

    console.log('  [PASS] Transaction voided successfully!');
    console.log('  -> Status:', voidData.data.status);
    console.log('  -> Voided by:', voidData.data.voidedByStaffName);
    console.log('  -> Reason:', voidData.data.voidReason);
    console.log('  -> Voided At:', voidData.data.voidedAt, '\n');

    if (voidData.data.status !== 'VOIDED') {
      throw new Error(`Expected status 'VOIDED', got: ${voidData.data.status}`);
    }
    if (voidData.data.voidedByStaffName !== staffUser.fullName) {
      throw new Error(`Expected voidedByStaffName '${staffUser.fullName}', got: ${voidData.data.voidedByStaffName}`);
    }
    if (voidData.data.voidReason !== 'Customer requested cancellation before order fulfillment') {
      throw new Error(`Unexpected voidReason: ${voidData.data.voidReason}`);
    }

    // 7. Attempt void on an already voided transaction
    console.log('[Step 7] Attempting to void the already voided transaction again...');
    const repeatVoidRes = await fetch(`${baseUrl}/api/transactions/${txnId}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pinCode: '1234',
        reason: 'Trying again'
      })
    });
    const repeatVoidData = await repeatVoidRes.json();
    if (repeatVoidRes.status === 400 && !repeatVoidData.success) {
      console.log('  [PASS] Rejected duplicate void (HTTP 400):', repeatVoidData.message, '\n');
    } else {
      throw new Error(`Expected HTTP 400 for duplicate void, got: ${repeatVoidRes.status}`);
    }

    // 8. Query Ledger with status=VOIDED
    console.log('[Step 8] Querying Ledger with status=VOIDED filter...');
    const ledgerVoidRes = await fetch(`${baseUrl}/api/transactions/ledger?status=VOIDED`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const ledgerVoidData = await ledgerVoidRes.json();
    const foundVoided = ledgerVoidData.data?.transactions?.find(t => t._id === txnId);
    if (foundVoided && foundVoided.status === 'VOIDED' && foundVoided.voidReason) {
      console.log('  [PASS] Voided transaction correctly returned in ledger with void details.');
      console.log(`  -> Found ${foundVoided.txnNumber}: "${foundVoided.voidReason}" by ${foundVoided.voidedByStaffName}\n`);
    } else {
      throw new Error('Voided transaction not found in ledger query');
    }

    console.log('=== All Void Transaction & PIN Verification Tests PASSED! ===');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

testVoidTransactions();
