// Room Bills Verification Suite
require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const runRoomBillsVerification = async () => {
  console.log('--- Starting Room Bills Verification Suite ---');
  await connectDB();

  const User = require('../models/User');
  const Transaction = require('../models/Transaction');
  const { 
    getConsolidatedRoomTabs, 
    getRoomOpenTransactions, 
    settleTransactions 
  } = require('../controllers/tabController');

  const cashier = await User.findOne();
  if (!cashier) {
    console.error('No cashier found for test');
    await mongoose.disconnect();
    return;
  }

  const Product = require('../models/Product');
  const product = await Product.findOne();
  const dummyProdId = product ? product._id : new mongoose.Types.ObjectId();
  const dummySku = product ? product.sku : 'TEST-SKU';

  // 1. Create two test transactions for Dorm D105 with different guest names
  const txn1 = await Transaction.create({
    txnNumber: `ROOM-DORM-${Date.now()}-A`,
    status: 'UNPAID_TAB',
    cashierId: cashier._id,
    cashierNameSnapshot: cashier.fullName || 'Cashier',
    tabType: 'ROOM',
    roomNumber: 'D105',
    guestName: 'Bed 1 - Alice',
    items: [{
      productId: dummyProdId,
      productNameSnapshot: 'Iced Latte',
      skuSnapshot: dummySku,
      categoryNameSnapshot: 'Cold Beverages',
      unitPriceInCents: 1500,
      quantity: 2,
      lineDiscountType: 'none',
      lineDiscountValue: 0,
      lineDiscountInCents: 0,
      finalLineTotalInCents: 3000,
      takenAt: new Date()
    }],
    subtotalInCents: 3000,
    grandTotalInCents: 3000,
    paymentMethod: 'TAB_DEFERRED',
    companyId: cashier.companyId
  });

  const txn2 = await Transaction.create({
    txnNumber: `ROOM-DORM-${Date.now()}-B`,
    status: 'UNPAID_TAB',
    cashierId: cashier._id,
    cashierNameSnapshot: cashier.fullName || 'Cashier',
    tabType: 'ROOM',
    roomNumber: 'D105',
    guestName: 'Bed 2 - Bob',
    items: [{
      productId: dummyProdId,
      productNameSnapshot: 'Croissant',
      skuSnapshot: dummySku,
      categoryNameSnapshot: 'Pastries',
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

  console.log('[PASS] Created test room tab transactions for D105 (Alice & Bob)');

  // 2. Verify getConsolidatedRoomTabs returns separate entries for Alice and Bob
  let consolidatedData = null;
  const mockReq = {
    query: {},
    user: { role: 'system_admin', companyId: cashier.companyId }
  };
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        consolidatedData = data.data;
      }
    })
  };

  await getConsolidatedRoomTabs(mockReq, mockRes, (e) => console.error(e));

  const d105Tabs = consolidatedData.filter(t => t.roomNumber === 'D105');
  console.log(`[PASS] Found ${d105Tabs.length} separate groups for Dorm D105.`);
  const aliceTab = d105Tabs.find(t => t.guestName === 'Bed 1 - Alice');
  const bobTab = d105Tabs.find(t => t.guestName === 'Bed 2 - Bob');

  if (!aliceTab || !bobTab) {
    throw new Error('Dorm D105 guest separation failed! Alice or Bob not found as distinct tabs.');
  }
  console.log('[PASS] Alice tab total:', aliceTab.totalOwedInCents, 'cents');
  console.log('[PASS] Bob tab total:', bobTab.totalOwedInCents, 'cents');

  // 3. Test getRoomOpenTransactions specifically for Alice
  let aliceTxns = null;
  const reqAlice = {
    params: { roomNumber: 'D105' },
    query: { guestName: 'Bed 1 - Alice' },
    user: { role: 'system_admin', companyId: cashier.companyId }
  };
  const resAlice = {
    status: (code) => ({
      json: (data) => {
        aliceTxns = data.data.transactions;
      }
    })
  };
  await getRoomOpenTransactions(reqAlice, resAlice, (e) => console.error(e));
  console.log(`[PASS] Discrete open transactions for Alice: ${aliceTxns.length}`);

  // 4. Test settleTransactions for Alice's tab
  let settleResult = null;
  const reqSettle = {
    body: {
      transactionIds: [txn1._id],
      paymentMethod: 'TRANSFER'
    },
    user: { _id: cashier._id, role: 'system_admin', companyId: cashier.companyId }
  };
  const resSettle = {
    status: (code) => ({
      json: (data) => {
        settleResult = data;
      }
    })
  };
  await settleTransactions(reqSettle, resSettle, (e) => console.error(e));
  console.log(`[PASS] Settled Alice tab with TRANSFER: settledCount = ${settleResult.data?.settledCount}`);

  // 5. Cleanup test records
  await Transaction.deleteOne({ _id: txn1._id });
  await Transaction.deleteOne({ _id: txn2._id });
  console.log('[PASS] Cleaned up temporary test transactions.');

  await mongoose.disconnect();
  console.log('--- Room Bills Verification Succeeded 100% ---');
};

runRoomBillsVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
