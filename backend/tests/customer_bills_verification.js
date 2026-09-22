// Customer Bills Verification Suite
require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const runVerification = async () => {
  console.log('--- Starting Customer Bills Verification Suite ---');
  await connectDB();

  const User = require('../models/User');
  const Customer = require('../models/Customer');
  const Product = require('../models/Product');
  const Transaction = require('../models/Transaction');
  const { 
    getConsolidatedCustomerTabs, 
    getCustomerOpenTransactions, 
    settleTransactions 
  } = require('../controllers/tabController');
  const { createCustomer, getCustomers } = require('../controllers/customerController');
  const { createTransaction } = require('../controllers/transactionController');

  const cashier = await User.findOne({ isActive: true });
  if (!cashier) {
    console.error('FAIL: No active cashier/user found in DB');
    await mongoose.disconnect();
    process.exit(1);
  }

  const product = await Product.findOne();
  const dummyProdId = product ? product._id : new mongoose.Types.ObjectId();
  const dummySku = product ? product.sku : 'CUST-SKU-1';
  const dummyPrice = product ? product.priceInCents : 1200;
  const expectedTotal = dummyPrice * 3;

  // 1. Create a new Customer via customerController
  console.log('1. Testing createCustomer...');
  let createdCustomer = null;
  const mockReqCreateCust = {
    user: { mongoId: cashier._id, companyId: cashier.companyId, role: cashier.role },
    body: {
      name: `Test Customer ${Date.now()}`,
      phone: '+60129998888',
      email: 'testcustomer@example.com',
      notes: 'VIP customer'
    }
  };
  const mockResCreateCust = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) {
      if (payload.success) {
        createdCustomer = payload.data;
        console.log(`✓ Customer created: "${createdCustomer.name}" (ID: ${createdCustomer._id})`);
      } else {
        console.error('FAIL createCustomer:', payload);
      }
    }
  };
  await createCustomer(mockReqCreateCust, mockResCreateCust, (err) => { throw err; });

  if (!createdCustomer) {
    console.error('FAIL: Customer was not created');
    await mongoose.disconnect();
    process.exit(1);
  }

  // 2. Test getCustomers
  console.log('2. Testing getCustomers...');
  const mockReqGetCust = {
    user: { mongoId: cashier._id, companyId: cashier.companyId, role: cashier.role },
    query: { search: createdCustomer.name }
  };
  let fetchedCustomers = [];
  const mockResGetCust = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) {
      if (payload.success) {
        fetchedCustomers = payload.data;
        console.log(`✓ Found ${fetchedCustomers.length} customer(s) matching search query`);
      }
    }
  };
  await getCustomers(mockReqGetCust, mockResGetCust, (err) => { throw err; });
  if (fetchedCustomers.length === 0) {
    console.error('FAIL: getCustomers did not find created customer');
    await mongoose.disconnect();
    process.exit(1);
  }

  // 3. Create a Customer Bill (UNPAID_TAB)
  console.log('3. Testing createTransaction with tabType: CUSTOMER and UNPAID_TAB...');
  let createdTxn = null;
  const mockReqCreateTxn = {
    headers: {},
    user: { mongoId: cashier._id, fullName: cashier.fullName, companyId: cashier.companyId, role: cashier.role },
    body: {
      status: 'UNPAID_TAB',
      paymentMethod: 'TAB_DEFERRED',
      tabType: 'CUSTOMER',
      customerId: createdCustomer._id,
      customerName: createdCustomer.name,
      items: [{
        productId: dummyProdId,
        productNameSnapshot: 'Fresh Orange Juice',
        skuSnapshot: dummySku,
        categoryNameSnapshot: 'Drinks',
        unitPriceInCents: dummyPrice,
        quantity: 3
      }],
      notes: 'Customer hold bill'
    }
  };
  const mockResCreateTxn = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (payload) {
      if (payload.success) {
        createdTxn = payload.data;
        console.log(`✓ Customer bill transaction created: ${createdTxn.txnNumber}, customerName: ${createdTxn.customerName}, tabType: ${createdTxn.tabType}`);
      } else {
        console.error('FAIL createTransaction:', payload);
      }
    }
  };
  await createTransaction(mockReqCreateTxn, mockResCreateTxn, (err) => { throw err; });

  if (!createdTxn || createdTxn.customerName !== createdCustomer.name || createdTxn.tabType !== 'CUSTOMER') {
    console.error('FAIL: Transaction was not properly recorded with customer and tabType');
    await mongoose.disconnect();
    process.exit(1);
  }

  // 4. Test getConsolidatedCustomerTabs
  console.log('4. Testing getConsolidatedCustomerTabs...');
  let customerTabs = [];
  const mockReqGetTabs = {
    user: { mongoId: cashier._id, companyId: cashier.companyId, role: cashier.role },
    query: { search: createdCustomer.name }
  };
  const mockResGetTabs = {
    status: function (code) { return this; },
    json: function (payload) {
      if (payload.success) {
        customerTabs = payload.data;
        console.log(`✓ Consolidated customer tabs count: ${customerTabs.length}`);
        if (customerTabs.length > 0) {
          console.log(`  Customer: "${customerTabs[0].customerName}", Total Owed: RM ${(customerTabs[0].totalOwedInCents / 100).toFixed(2)}, Items: ${customerTabs[0].itemCount}`);
        }
      }
    }
  };
  await getConsolidatedCustomerTabs(mockReqGetTabs, mockResGetTabs, (err) => { throw err; });

  if (customerTabs.length === 0 || customerTabs[0].totalOwedInCents !== expectedTotal) {
    console.error('FAIL: getConsolidatedCustomerTabs did not properly aggregate customer bill');
    await mongoose.disconnect();
    process.exit(1);
  }

  // 5. Test getCustomerOpenTransactions
  console.log('5. Testing getCustomerOpenTransactions...');
  let openTxns = [];
  const mockReqOpenTxns = {
    user: { mongoId: cashier._id, companyId: cashier.companyId, role: cashier.role },
    params: { customerName: encodeURIComponent(createdCustomer.name) },
    query: { customerId: createdCustomer._id.toString() }
  };
  const mockResOpenTxns = {
    status: function (code) { return this; },
    json: function (payload) {
      if (payload.success) {
        openTxns = payload.data.transactions;
        console.log(`✓ Customer open transactions count: ${openTxns.length}, balance: RM ${(payload.data.totalBalanceInCents / 100).toFixed(2)}`);
      }
    }
  };
  await getCustomerOpenTransactions(mockReqOpenTxns, mockResOpenTxns, (err) => { throw err; });

  if (openTxns.length === 0) {
    console.error('FAIL: getCustomerOpenTransactions returned 0 open transactions');
    await mongoose.disconnect();
    process.exit(1);
  }

  // 6. Test settleTransactions with CARD
  console.log('6. Testing settleTransactions for customer bill via CARD...');
  const mockReqSettle = {
    user: { mongoId: cashier._id, fullName: cashier.fullName, companyId: cashier.companyId, role: cashier.role },
    body: {
      transactionIds: [createdTxn._id],
      paymentMethod: 'CARD',
      notes: 'Customer paid by card at front desk'
    }
  };
  const mockResSettle = {
    status: function (code) { return this; },
    json: function (payload) {
      if (payload.success) {
        console.log(`✓ Successfully settled ${payload.data.settledCount} transaction(s) for RM ${(payload.data.totalSettledInCents / 100).toFixed(2)} via ${payload.data.paymentMethod}`);
      } else {
        console.error('FAIL settleTransactions:', payload);
      }
    }
  };
  await settleTransactions(mockReqSettle, mockResSettle, (err) => { throw err; });

  // 7. Verify transaction in DB is now PAID
  const updatedTxn = await Transaction.findById(createdTxn._id);
  if (updatedTxn.status === 'PAID' && updatedTxn.paymentMethod === 'CARD') {
    console.log('✓ Transaction status verified in DB as PAID with paymentMethod: CARD');
  } else {
    console.error('FAIL: Transaction status was not updated to PAID');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Cleanup test records
  await Transaction.deleteOne({ _id: createdTxn._id });
  await Customer.deleteOne({ _id: createdCustomer._id });
  console.log('✓ Cleaned up test transaction and customer records');

  console.log('=== ALL CUSTOMER BILLS VERIFICATIONS PASSED ===');
  await mongoose.disconnect();
};

runVerification().catch(async (err) => {
  console.error('Verification Error:', err);
  await mongoose.disconnect();
  process.exit(1);
});
