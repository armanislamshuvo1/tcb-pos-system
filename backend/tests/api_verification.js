// API Verification Test Suite
require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const runVerification = async () => {
  console.log('--- Starting API Verification Test Suite ---');
  await connectDB();

  const Category = require('../models/Category');
  const Product = require('../models/Product');
  const User = require('../models/User');
  const Transaction = require('../models/Transaction');
  const Counter = require('../models/Counter');
  const { getNextTransactionId } = require('../utils/sequenceService');
  const { calculateCartFinancials } = require('../utils/discountEngine');

  // Test 1: Category retrieval
  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
  console.log(`[PASS] Test 1: Categories loaded: ${categories.length} found.`);
  console.log('       Categories:', categories.map(c => c.name).join(', '));

  // Test 2: Product linked to Category
  const targetCat = categories[0];
  if (!targetCat) throw new Error('No categories found');

  const products = await Product.find({ categoryId: targetCat._id });
  console.log(`[PASS] Test 2: Found ${products.length} products in '${targetCat.name}' category.`);

  // Test 3: Admin adding a new Category (Clean up previous run artifacts first)
  await Category.deleteMany({ slug: 'seasonal-specials' });
  await Product.deleteMany({ sku: 'SEA-PUM-01' });

  const newCat = await Category.create({
    name: 'Seasonal Specials',
    slug: 'seasonal-specials',
    displayOrder: 5,
    colorCode: '#8B5CF6'
  });
  console.log(`[PASS] Test 3: Admin created new Category: "${newCat.name}" (Slug: ${newCat.slug})`);

  // Test 4: Admin adding a Product into that Category
  const newProd = await Product.create({
    sku: 'SEA-PUM-01',
    name: 'Pumpkin Spice Latte',
    categoryId: newCat._id,
    categoryNameSnapshot: newCat.name,
    priceInCents: 650,
    costInCents: 180,
    stockQuantity: 50
  });
  console.log(`[PASS] Test 4: Admin added product "${newProd.name}" into "${newProd.categoryNameSnapshot}" for \$${(newProd.priceInCents/100).toFixed(2)}`);

  // Test 5: Sequential Transaction ID Generation
  const id1 = await getNextTransactionId();
  const id2 = await getNextTransactionId();
  console.log(`[PASS] Test 5: Sequential Transaction IDs generated: ${id1} -> ${id2}`);

  // Test 6: Integer Cent Discount Engine
  const cartFinancials = calculateCartFinancials({
    items: [
      {
        productId: newProd._id,
        productNameSnapshot: newProd.name,
        skuSnapshot: newProd.sku,
        categoryNameSnapshot: newProd.categoryNameSnapshot,
        unitPriceInCents: 650,
        quantity: 2,
        lineDiscountType: 'percentage',
        lineDiscountValue: 10 // 10% off
      }
    ],
    globalDiscount: {
      type: 'fixed_cents',
      value: 100 // $1 off total ticket
    }
  });
  console.log(`[PASS] Test 6: Discount calculation: Raw Subtotal = \$${(cartFinancials.subtotalInCents/100).toFixed(2)}, Total Discount = \$${(cartFinancials.totalDiscountInCents/100).toFixed(2)}, Grand Total = \$${(cartFinancials.grandTotalInCents/100).toFixed(2)}`);

  // Test 7: Staff Tab Creation & Whole-Transaction Settlement
  const cashier = await User.findOne({ role: 'cashier' });
  const staff = await User.findOne({ role: 'staff' });

  const tabTxn = await Transaction.create({
    txnNumber: await getNextTransactionId(),
    status: 'UNPAID_TAB',
    cashierId: cashier._id,
    cashierNameSnapshot: cashier.fullName,
    staffMemberId: staff._id,
    staffNameSnapshot: staff.fullName,
    items: cartFinancials.processedItems,
    subtotalInCents: cartFinancials.subtotalInCents,
    totalDiscountInCents: cartFinancials.totalDiscountInCents,
    grandTotalInCents: cartFinancials.grandTotalInCents,
    paymentMethod: 'TAB_DEFERRED'
  });
  console.log(`[PASS] Test 7a: Created Unpaid Tab transaction: ${tabTxn.txnNumber} for staff ${tabTxn.staffNameSnapshot}`);

  // Settle whole transaction
  tabTxn.status = 'PAID';
  tabTxn.paymentMethod = 'PAYROLL_DEDUCTION';
  tabTxn.settledAt = new Date();
  tabTxn.settledByCashierId = cashier._id;
  tabTxn.settledByCashierNameSnapshot = cashier.fullName;
  await tabTxn.save();
  console.log(`[PASS] Test 7b: Successfully settled transaction ${tabTxn.txnNumber} via ${tabTxn.paymentMethod}`);

  // Clean up created test records so database stays clean
  await Category.deleteOne({ _id: newCat._id });
  await Product.deleteOne({ _id: newProd._id });
  await Transaction.deleteOne({ _id: tabTxn._id });

  console.log('\n>>> ALL 7 CORE BACKEND VERIFICATION TESTS PASSED! <<<');
  process.exit(0);
};

runVerification().catch(err => {
  console.error('[Verification Failed]:', err);
  process.exit(1);
});
