// Settlement Revert Verification Test Suite
require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const runSettlementRevertVerification = async () => {
  console.log('--- Starting Settlement Revert Verification Suite ---');
  await connectDB();

  const User = require('../models/User');
  const Transaction = require('../models/Transaction');
  const Product = require('../models/Product');
  const {
    settleTransactions,
    revertSettlement,
    getRecentlySettledBills
  } = require('../controllers/tabController');

  // Find a cashier or admin user
  const cashier = await User.findOne();
  if (!cashier) {
    console.error('FAIL: No cashier user found in DB');
    await mongoose.disconnect();
    return;
  }

  // Ensure cashier has a known PIN for testing
  cashier.pinCode = '1234';
  await cashier.save();

  const product = await Product.findOne();
  const dummyProdId = product ? product._id : new mongoose.Types.ObjectId();
  const dummySku = product ? product.sku : 'TEST-SKU';

  console.log(`Using cashier: ${cashier.fullName} (${cashier.employeeCode})`);

  // 1. Create a test unpaid transaction
  const txn = await Transaction.create({
    txnNumber: `TEST-REVERT-${Date.now()}`,
    status: 'UNPAID_TAB',
    cashierId: cashier._id,
    cashierNameSnapshot: cashier.fullName,
    tabType: 'ROOM',
    roomNumber: 'A101',
    guestName: 'Revert Test Guest',
    items: [{
      productId: dummyProdId,
      productNameSnapshot: 'Specialty Coffee',
      skuSnapshot: dummySku,
      categoryNameSnapshot: 'Beverages',
      unitPriceInCents: 1200,
      quantity: 1,
      lineDiscountType: 'none',
      lineDiscountValue: 0,
      lineDiscountInCents: 0,
      finalLineTotalInCents: 1200,
      takenAt: new Date()
    }],
    subtotalInCents: 1200,
    grandTotalInCents: 1200,
    paymentMethod: 'TAB_DEFERRED',
    companyId: cashier.companyId
  });

  console.log(`[PASS] 1. Created test unpaid bill: ${txn.txnNumber} (status: ${txn.status})`);

  // 2. Settle the bill via settleTransactions
  let settleResult = null;
  const mockReqSettle = {
    body: {
      transactionIds: [txn._id],
      paymentMethod: 'CARD'
    },
    user: {
      mongoId: cashier._id,
      _id: cashier._id,
      fullName: cashier.fullName,
      role: cashier.role,
      companyId: cashier.companyId
    }
  };
  const mockResSettle = {
    status: (code) => ({
      json: (data) => {
        settleResult = { code, data };
      }
    })
  };

  await settleTransactions(mockReqSettle, mockResSettle, (err) => { throw err; });
  console.log(`[PASS] 2. Settled bill via CARD: settledCount = ${settleResult?.data?.data?.settledCount}`);

  // Verify status in DB
  const settledTxn = await Transaction.findById(txn._id);
  if (settledTxn.status !== 'PAID' || settledTxn.paymentMethod !== 'CARD' || !settledTxn.settledAt) {
    throw new Error('Settlement failed to set status PAID, CARD paymentMethod, and settledAt');
  }
  console.log(`[PASS] Verified DB status: ${settledTxn.status}, settledAt: ${settledTxn.settledAt}`);

  // 3. Test getRecentlySettledBills
  let recentBillsResult = null;
  const mockReqRecent = {
    query: { search: txn.txnNumber },
    user: { role: 'system_admin' }
  };
  const mockResRecent = {
    status: (code) => ({
      json: (data) => {
        recentBillsResult = data;
      }
    })
  };

  await getRecentlySettledBills(mockReqRecent, mockResRecent, (err) => { throw err; });
  if (!recentBillsResult?.data?.some((b) => b._id.toString() === txn._id.toString())) {
    throw new Error('Settled bill did not appear in getRecentlySettledBills');
  }
  console.log(`[PASS] 3. Verified getRecentlySettledBills returns the settled bill`);

  // 4. Test revertSettlement with WRONG PIN -> expect 401
  let wrongPinResult = null;
  const mockReqWrongPin = {
    body: {
      transactionIds: [txn._id],
      pinCode: '9999', // Invalid PIN
      reason: 'Testing invalid PIN'
    },
    user: {
      mongoId: cashier._id,
      _id: cashier._id,
      fullName: cashier.fullName,
      role: cashier.role,
      companyId: cashier.companyId
    }
  };
  const mockResWrongPin = {
    status: (code) => ({
      json: (data) => {
        wrongPinResult = { code, data };
      }
    })
  };

  await revertSettlement(mockReqWrongPin, mockResWrongPin, (err) => { throw err; });
  if (wrongPinResult.code !== 401) {
    throw new Error(`Expected 401 for wrong PIN, got: ${wrongPinResult.code}`);
  }
  console.log(`[PASS] 4. Revert correctly rejected with 401 for invalid PIN`);

  // 5. Test revertSettlement with VALID PIN and reason
  let revertResult = null;
  const mockReqValidRevert = {
    body: {
      transactionIds: [txn._id],
      pinCode: '1234',
      reason: 'Settled by mistake'
    },
    user: {
      mongoId: cashier._id,
      _id: cashier._id,
      fullName: cashier.fullName,
      role: cashier.role,
      companyId: cashier.companyId
    }
  };
  const mockResValidRevert = {
    status: (code) => ({
      json: (data) => {
        revertResult = { code, data };
      }
    })
  };

  await revertSettlement(mockReqValidRevert, mockResValidRevert, (err) => { throw err; });
  if (revertResult.code !== 200 || !revertResult.data.success) {
    throw new Error(`Revert failed: ${JSON.stringify(revertResult)}`);
  }
  console.log(`[PASS] 5. Successfully reverted settlement: revertedCount = ${revertResult.data.data.revertedCount}`);

  // Verify status in DB after revert
  const revertedTxn = await Transaction.findById(txn._id);
  if (revertedTxn.status !== 'UNPAID_TAB') {
    throw new Error(`Expected status UNPAID_TAB, got: ${revertedTxn.status}`);
  }
  if (revertedTxn.paymentMethod !== 'TAB_DEFERRED') {
    throw new Error(`Expected paymentMethod TAB_DEFERRED, got: ${revertedTxn.paymentMethod}`);
  }
  if (revertedTxn.settledAt != null) {
    throw new Error(`Expected settledAt to be undefined/null, got: ${revertedTxn.settledAt}`);
  }
  if (!revertedTxn.revertedSettlementAt || revertedTxn.revertReason !== 'Settled by mistake') {
    throw new Error(`Audit fields not properly recorded: ${JSON.stringify(revertedTxn)}`);
  }
  console.log(`[PASS] DB check passed: status is UNPAID_TAB, paymentMethod is TAB_DEFERRED, audit reason: "${revertedTxn.revertReason}", staff: "${revertedTxn.revertedByStaffName}"`);

  // 6. Test reverting an already UNPAID_TAB -> expect 400
  let alreadyUnpaidResult = null;
  const mockResAlreadyUnpaid = {
    status: (code) => ({
      json: (data) => {
        alreadyUnpaidResult = { code, data };
      }
    })
  };

  await revertSettlement(mockReqValidRevert, mockResAlreadyUnpaid, (err) => { throw err; });
  if (alreadyUnpaidResult.code !== 400) {
    throw new Error(`Expected 400 when attempting to revert already-unpaid bill, got: ${alreadyUnpaidResult.code}`);
  }
  console.log(`[PASS] 6. Correctly rejected 400 when reverting already-unpaid bill`);

  // 7. Test reverting a VOIDED transaction -> expect 400
  revertedTxn.status = 'VOIDED';
  await revertedTxn.save();

  let voidedResult = null;
  const mockResVoided = {
    status: (code) => ({
      json: (data) => {
        voidedResult = { code, data };
      }
    })
  };

  await revertSettlement(mockReqValidRevert, mockResVoided, (err) => { throw err; });
  if (voidedResult.code !== 400) {
    throw new Error(`Expected 400 when attempting to revert voided bill, got: ${voidedResult.code}`);
  }
  console.log(`[PASS] 7. Correctly rejected 400 when attempting to revert voided bill`);

  // 8. Cleanup test transaction
  await Transaction.deleteOne({ _id: txn._id });
  console.log(`[PASS] 8. Cleaned up test transaction.`);

  await mongoose.disconnect();
  console.log('--- Settlement Revert Verification Succeeded 100% ---');
};

runSettlementRevertVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
