require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const runVerification = async () => {
  console.log('--- Starting Custom Product & Checkout Verification Test Suite ---');
  await connectDB();

  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const User = require('../models/User');
  const Company = require('../models/Company');
  const Transaction = require('../models/Transaction');
  const transactionController = require('../controllers/transactionController');
  const productController = require('../controllers/productController');

  // Setup test environment (Company & Cashier)
  let testCompany = await Company.findOne({ name: 'Verification Test Co' });
  if (!testCompany) {
    testCompany = await Company.create({
      name: 'Verification Test Co',
      code: 'VTC'
    });
  }

  let cashierUser = await User.findOne({ email: 'test_cashier_custom@example.com' });
  if (!cashierUser) {
    cashierUser = await User.create({
      fullName: 'Test Cashier Custom',
      email: 'test_cashier_custom@example.com',
      employeeCode: 'TCUST01',
      role: 'cashier',
      companyId: testCompany._id,
      pinCode: '1234'
    });
  }

  // 1. Test standalone helper: POST /api/products/custom-item
  console.log('\n--- Test 1: createOneTimeCustomProduct helper ---');
  const reqHelper = {
    user: {
      role: 'cashier',
      companyId: testCompany._id,
      mongoId: cashierUser._id
    },
    body: {
      name: 'Special Bicycle Rental',
      priceDollars: '35.50'
    }
  };
  let helperResult = null;
  const resHelper = {
    status: (code) => ({
      json: (data) => {
        helperResult = { code, data };
        return helperResult;
      }
    })
  };
  await productController.createOneTimeCustomProduct(reqHelper, resHelper, (err) => {
    if (err) throw err;
  });

  if (!helperResult || helperResult.code !== 201 || !helperResult.data?.data) {
    throw new Error(`Test 1 Failed: ${JSON.stringify(helperResult)}`);
  }
  const helperProduct = helperResult.data.data;
  console.log(`[PASS] Test 1: Created helper one-time product: "${helperProduct.name}" (SKU: ${helperProduct.sku})`);
  console.log(`       Price: \$${(helperProduct.priceInCents / 100).toFixed(2)}, isActive: ${helperProduct.isActive}, isCustom: ${helperProduct.isCustom}`);
  if (helperProduct.isActive !== false) {
    throw new Error('Test 1 Assertion Failed: helper product should have isActive: false');
  }
  if (helperProduct.isCustom !== true) {
    throw new Error('Test 1 Assertion Failed: helper product should have isCustom: true');
  }

  // 2. Test Checkout with One-Time Custom Item in active cart
  console.log('\n--- Test 2: Transaction Checkout with One-Time Custom Item ---');
  const reqCheckout = {
    user: {
      role: 'cashier',
      companyId: testCompany._id,
      mongoId: cashierUser._id,
      fullName: cashierUser.fullName
    },
    headers: {},
    body: {
      status: 'PAID',
      paymentMethod: 'CASH',
      items: [
        {
          productId: 'custom_client_temp_123',
          isCustom: true,
          productNameSnapshot: 'Fresh Mango Smoothie with Extra Chia',
          unitPriceInCents: 1400, // RM 14.00
          quantity: 2,
          lineDiscountType: 'percentage',
          lineDiscountValue: 10 // 10% off
        }
      ]
    }
  };

  let checkoutResult = null;
  const resCheckout = {
    status: (code) => ({
      json: (data) => {
        checkoutResult = { code, data };
        return checkoutResult;
      }
    })
  };

  await transactionController.createTransaction(reqCheckout, resCheckout, (err) => {
    if (err) throw err;
  });

  if (!checkoutResult || checkoutResult.code !== 201 || !checkoutResult.data?.data) {
    throw new Error(`Test 2 Failed: ${JSON.stringify(checkoutResult)}`);
  }

  const txn = checkoutResult.data.data;
  console.log(`[PASS] Test 2: Transaction created: ${txn.txnNumber}`);
  console.log(`       Grand Total: \$${(txn.grandTotalInCents / 100).toFixed(2)}, Total Discount: \$${(txn.totalDiscountInCents / 100).toFixed(2)}`);
  
  const createdLineItem = txn.items[0];
  console.log(`       Line item productNameSnapshot: "${createdLineItem.productNameSnapshot}"`);
  console.log(`       Line item productId: ${createdLineItem.productId}`);
  console.log(`       Line item finalLineTotalInCents: \$${(createdLineItem.finalLineTotalInCents / 100).toFixed(2)}`);

  // Verify created one-time product in DB
  const dbCustomProduct = await Product.findById(createdLineItem.productId);
  if (!dbCustomProduct) {
    throw new Error('Test 2 Assertion Failed: one-time product record was not found in MongoDB');
  }
  if (dbCustomProduct.isActive !== false) {
    throw new Error('Test 2 Assertion Failed: dbCustomProduct must have isActive: false');
  }
  if (dbCustomProduct.isCustom !== true) {
    throw new Error('Test 2 Assertion Failed: dbCustomProduct must have isCustom: true');
  }
  console.log(`[PASS] Test 2: DB product record verified: isActive=${dbCustomProduct.isActive}, isCustom=${dbCustomProduct.isCustom}`);

  // 3. Test Active Catalog Isolation (Must NOT appear in active catalog search)
  console.log('\n--- Test 3: Catalog Query Isolation ---');
  const activeProducts = await Product.find({
    companyId: testCompany._id,
    isActive: true
  });
  const foundOneTimeInActive = activeProducts.some(
    p => p._id.toString() === dbCustomProduct._id.toString() || p._id.toString() === helperProduct._id.toString()
  );
  if (foundOneTimeInActive) {
    throw new Error('Test 3 Failed: One-time custom products must NOT appear in active catalog query!');
  }
  console.log('[PASS] Test 3: Confirmed one-time custom products are excluded from active catalog inventory queries.');

  console.log('\n=== ALL CUSTOM PRODUCT TESTS PASSED SUCCESSFULLY! ===');
  await mongoose.connection.close();
  process.exit(0);
};

runVerification().catch((err) => {
  console.error('[ERROR] Verification failed:', err);
  process.exit(1);
});
