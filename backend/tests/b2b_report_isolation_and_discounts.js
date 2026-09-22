require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const runTest = async () => {
  console.log('=== Starting B2B Report Isolation & Discount Verification ===');
  await connectDB();

  const Company = require('../models/Company');
  const User = require('../models/User');
  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const Transaction = require('../models/Transaction');
  const { getSalesSummary, getProductReport } = require('../controllers/reportController');
  const { createTransaction } = require('../controllers/transactionController');
  const { settleTransactions } = require('../controllers/tabController');

  // Clean previous test artifacts
  await Company.deleteMany({ code: { $in: ['TEST-CO-A', 'TEST-CO-B'] } });

  // 1. Create two separate companies
  const companyA = await Company.create({
    name: 'Company Alpha',
    code: 'TEST-CO-A',
    currency: { code: 'MYR', symbol: 'RM' },
    isActive: true
  });
  const companyB = await Company.create({
    name: 'Company Beta',
    code: 'TEST-CO-B',
    currency: { code: 'USD', symbol: '$' },
    isActive: true
  });

  // 2. Create users for both companies
  const userA = await User.create({
    email: 'cashier_a@test.com',
    fullName: 'Alice Alpha',
    employeeCode: 'ALPHA-01',
    role: 'admin',
    companyId: companyA._id,
    pinCode: '1234',
    isActive: true
  });
  const userB = await User.create({
    email: 'cashier_b@test.com',
    fullName: 'Bob Beta',
    employeeCode: 'BETA-01',
    role: 'admin',
    companyId: companyB._id,
    pinCode: '1234',
    isActive: true
  });

  // 3. Create categories & products
  const catA = await Category.create({
    name: 'Alpha Hot Drinks',
    slug: 'alpha-hot-drinks',
    companyId: companyA._id
  });
  const prodA = await Product.create({
    name: 'Alpha Espresso',
    sku: 'ALPHA-ESP-01',
    categoryId: catA._id,
    categoryNameSnapshot: catA.name,
    priceInCents: 1000,
    companyId: companyA._id
  });

  // 4. Create a transaction for Company A with a 20% discount ($2.00 off $10.00 = $8.00)
  let createdTxnA = null;
  const mockReqCreateA = {
    headers: {},
    user: { mongoId: userA._id, fullName: userA.fullName, companyId: companyA._id, role: userA.role },
    body: {
      status: 'PAID',
      paymentMethod: 'CASH',
      items: [{
        productId: prodA._id,
        quantity: 1
      }],
      globalDiscount: { type: 'percentage', value: 20 }
    }
  };
  const mockResCreateA = {
    status: function (code) { return this; },
    json: function (payload) {
      if (payload.success) createdTxnA = payload.data;
    }
  };
  await createTransaction(mockReqCreateA, mockResCreateA, (err) => { throw err; });

  if (!createdTxnA || createdTxnA.totalDiscountInCents !== 200 || createdTxnA.grandTotalInCents !== 800) {
    console.error('FAIL: createTransaction did not correctly store totalDiscountInCents:', createdTxnA);
    process.exit(1);
  }
  console.log('[PASS] Test 1: Created Company A transaction with totalDiscountInCents = 200 (RM 2.00 discount stored)');

  // 5. Query Sales Summary as Company A
  let salesSummaryA = null;
  const mockReqSalesA = {
    user: { mongoId: userA._id, companyId: companyA._id, role: userA.role },
    query: {}
  };
  const mockResSalesA = {
    status: function (code) { return this; },
    json: function (payload) { salesSummaryA = payload.data?.summary; }
  };
  await getSalesSummary(mockReqSalesA, mockResSalesA, (err) => { throw err; });

  if (salesSummaryA.totalDiscountInCents !== 200 || salesSummaryA.netPaidRevenueInCents !== 800) {
    console.error('FAIL: Company A sales summary incorrect:', salesSummaryA);
    process.exit(1);
  }
  console.log(`[PASS] Test 2: Company A sales summary shows totalDiscountInCents = ${salesSummaryA.totalDiscountInCents}, netRevenue = ${salesSummaryA.netPaidRevenueInCents}`);

  // 6. Query Sales Summary as Company B (Must be ISOLATED: 0 transactions, 0 revenue, 0 discount)
  let salesSummaryB = null;
  const mockReqSalesB = {
    user: { mongoId: userB._id, companyId: companyB._id, role: userB.role },
    query: {}
  };
  const mockResSalesB = {
    status: function (code) { return this; },
    json: function (payload) { salesSummaryB = payload.data?.summary; }
  };
  await getSalesSummary(mockReqSalesB, mockResSalesB, (err) => { throw err; });

  if (salesSummaryB.totalTransactions !== 0 || salesSummaryB.netPaidRevenueInCents !== 0) {
    console.error('FAIL: Multi-tenant data leak! Company B saw Company A sales data:', salesSummaryB);
    process.exit(1);
  }
  console.log('[PASS] Test 3: Multi-tenant isolation verified. Company B sees 0 transactions and 0 revenue.');

  // 7. Test category filter in getProductReport
  let productReportA = null;
  const mockReqProdReport = {
    user: { mongoId: userA._id, companyId: companyA._id, role: userA.role },
    query: { categoryId: catA._id.toString() }
  };
  const mockResProdReport = {
    status: function (code) { return this; },
    json: function (payload) { productReportA = payload.data; }
  };
  await getProductReport(mockReqProdReport, mockResProdReport, (err) => { throw err; });

  if (!productReportA || productReportA.length === 0 || productReportA[0].sku !== 'ALPHA-ESP-01') {
    console.error('FAIL: Product report category filter failed:', productReportA);
    process.exit(1);
  }
  console.log('[PASS] Test 4: Product report category filter successfully matched items by categoryId!');

  // 8. Test cross-tenant settlement prevention
  // Create an unpaid tab in Company A
  let unpaidTxnA = null;
  mockReqCreateA.body.status = 'UNPAID_TAB';
  mockReqCreateA.body.paymentMethod = 'TAB_DEFERRED';
  mockReqCreateA.body.tabType = 'STAFF';
  mockReqCreateA.body.staffMemberId = userA._id;
  mockResCreateA.json = (p) => { if (p.success) unpaidTxnA = p.data; };
  await createTransaction(mockReqCreateA, mockResCreateA, (err) => { throw err; });

  // Company B attempts to settle Company A's unpaid transaction
  let settleResultB = null;
  let settleErrorB = null;
  const mockReqSettleB = {
    user: { mongoId: userB._id, fullName: userB.fullName, companyId: companyB._id, role: userB.role },
    body: { transactionIds: [unpaidTxnA._id], paymentMethod: 'CASH' }
  };
  const mockResSettleB = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) { settleResultB = payload; }
  };
  await settleTransactions(mockReqSettleB, mockResSettleB, (err) => { settleErrorB = err; });

  if (mockResSettleB.statusCode !== 400 || settleResultB?.success === true) {
    console.error('FAIL: Cross-company settlement vulnerability! Company B was able to settle Company A tab');
    process.exit(1);
  }
  console.log('[PASS] Test 5: Cross-tenant settlement blocked! Company B cannot settle Company A transaction.');

  // Clean up
  await Transaction.deleteMany({ _id: { $in: [createdTxnA._id, unpaidTxnA._id] } });
  await Product.deleteOne({ _id: prodA._id });
  await Category.deleteOne({ _id: catA._id });
  await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
  await Company.deleteMany({ _id: { $in: [companyA._id, companyB._id] } });

  console.log('\n>>> ALL B2B REPORT ISOLATION & DISCOUNT TESTS PASSED 100%! <<<\n');
  await mongoose.disconnect();
};

runTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
