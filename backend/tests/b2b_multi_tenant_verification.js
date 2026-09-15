// B2B Multi-Tenant Verification Test Suite
require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const Company = require('../models/Company');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const companyController = require('../controllers/companyController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');

// Helper to mock express req/res
function mockReqRes(body = {}, params = {}, query = {}, user = null) {
  const req = { body, params, query, user, headers: {} };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, getResult: () => ({ statusCode, data: responseData }), next };
}

const runTest = async () => {
  console.log('\n======================================================');
  console.log('--- STARTING B2B MULTI-TENANT VERIFICATION SUITE ---');
  console.log('======================================================\n');

  await connectDB();

  // Clean up any previous test remnants
  await Company.deleteMany({ code: { $in: ['ACME-TEST', 'BETA-TEST'] } });
  await User.deleteMany({ email: { $in: ['acme_admin@test.com', 'acme_staff@test.com', 'beta_admin@test.com'] } });
  await Product.deleteMany({ sku: { $in: ['TST-COF-01'] } });

  const sysAdminUser = {
    role: 'system_admin',
    fullName: 'System Superadmin',
    email: 'sysadmin@pos.local',
    companyId: null
  };

  // -------------------------------------------------------------
  // TEST 1: System Admin provisions B2B Company + Initial Company Admin atomically
  // -------------------------------------------------------------
  console.log('Test 1: System Admin creating B2B Company with initial Company Admin...');
  const { req: req1, res: res1, getResult: getRes1, next: next1 } = mockReqRes({
    name: 'Acme Coffee Group',
    code: 'ACME-TEST',
    branding: { displayName: 'Acme Cafe', logoText: 'AC', themeColor: '#10B981' },
    currency: { code: 'MYR', symbol: 'RM' },
    contactEmail: 'contact@acme.test',
    adminUser: {
      fullName: 'Alice Acme',
      email: 'acme_admin@test.com',
      employeeCode: 'ADM-ACME',
      pinCode: '7777',
      password: 'password123'
    }
  }, {}, {}, sysAdminUser);

  await companyController.createCompany(req1, res1, next1);
  const res1Data = getRes1();

  if (res1Data.statusCode !== 201 || !res1Data.data.success) {
    throw new Error(`Test 1 Failed: ${JSON.stringify(res1Data)}`);
  }
  const acmeCompany = res1Data.data.data;
  const acmeAdmin = res1Data.data.data.initialAdmin;

  console.log(`[PASS] Test 1: Company "${acmeCompany.name}" provisioned with ID ${acmeCompany._id}`);
  console.log(`       Initial Admin "${acmeAdmin.fullName}" (${acmeAdmin.email}, Code: ${acmeAdmin.employeeCode}) bound to company.`);

  // -------------------------------------------------------------
  // TEST 2: Company Admin PIN login & Company linkage
  // -------------------------------------------------------------
  console.log('\nTest 2: Company Admin authenticates via PIN Login...');
  const { req: req2, res: res2, getResult: getRes2, next: next2 } = mockReqRes({
    identifier: 'ADM-ACME',
    pinCode: '7777'
  });

  await userController.pinLogin(req2, res2, next2);
  const res2Data = getRes2();

  if (res2Data.statusCode !== 200 || !res2Data.data.success) {
    throw new Error(`Test 2 Failed: ${JSON.stringify(res2Data)}`);
  }

  const loginUser = res2Data.data.data.user;
  if (String(loginUser.companyId) !== String(acmeCompany._id)) {
    throw new Error(`Test 2 Failed: Company ID mismatch: expected ${acmeCompany._id}, got ${loginUser.companyId}`);
  }
  console.log(`[PASS] Test 2: Login successful. Token issued for "${loginUser.fullName}".`);
  console.log(`       Company attached: "${loginUser.company?.name || loginUser.company?.branding?.displayName}" (${loginUser.company?.currency?.symbol})`);

  // Context for subsequent tests as Alice Acme
  const acmeAdminContext = {
    mongoId: acmeAdmin._id,
    role: 'admin',
    fullName: acmeAdmin.fullName,
    email: acmeAdmin.email,
    companyId: acmeCompany._id
  };

  // -------------------------------------------------------------
  // TEST 3: Company Admin provisions Staff member under their company
  // -------------------------------------------------------------
  console.log('\nTest 3: Company Admin onboarding Staff under Acme company...');
  const { req: req3, res: res3, getResult: getRes3, next: next3 } = mockReqRes({
    fullName: 'Bob Barista',
    email: 'acme_staff@test.com',
    employeeCode: 'STF-01',
    role: 'staff',
    pinCode: '1111'
  }, {}, {}, acmeAdminContext);

  await userController.createUser(req3, res3, next3);
  const res3Data = getRes3();

  if (res3Data.statusCode !== 201 || !res3Data.data.success) {
    throw new Error(`Test 3 Failed: ${JSON.stringify(res3Data)}`);
  }
  const acmeStaff = res3Data.data.data;
  if (String(acmeStaff.companyId) !== String(acmeCompany._id)) {
    throw new Error(`Test 3 Failed: Staff companyId was not automatically locked to Acme.`);
  }
  console.log(`[PASS] Test 3: Staff "${acmeStaff.fullName}" created under Acme (${acmeStaff.companyId}).`);

  // -------------------------------------------------------------
  // TEST 4: Security Check: Company Admin cannot escalate to system_admin
  // -------------------------------------------------------------
  console.log('\nTest 4: Security - Company Admin attempting to provision a system_admin...');
  const { req: req4, res: res4, getResult: getRes4, next: next4 } = mockReqRes({
    fullName: 'Hacker Admin',
    email: 'hacker@test.com',
    employeeCode: 'HACK-01',
    role: 'system_admin',
    pinCode: '0000'
  }, {}, {}, acmeAdminContext);

  try {
    await userController.createUser(req4, res4, next4);
  } catch (err) {
    // Controller may throw or pass to next
  }
  const res4Data = getRes4();
  if (res4Data.statusCode !== 403) {
    throw new Error(`Test 4 Failed: Expected 403 Forbidden when creating system_admin, got ${res4Data.statusCode}`);
  }
  console.log(`[PASS] Test 4: Blocked unauthorized role escalation (403 Forbidden).`);

  // -------------------------------------------------------------
  // TEST 5: System Admin provisions second tenant (Beta Retail)
  // -------------------------------------------------------------
  console.log('\nTest 5: System Admin provisioning second tenant ("Beta Retail")...');
  const { req: req5, res: res5, getResult: getRes5, next: next5 } = mockReqRes({
    name: 'Beta Retail Ltd',
    code: 'BETA-TEST',
    adminUser: {
      fullName: 'Brian Beta',
      email: 'beta_admin@test.com',
      employeeCode: 'ADM-BETA',
      pinCode: '9999'
    }
  }, {}, {}, sysAdminUser);

  await companyController.createCompany(req5, res5, next5);
  const res5Data = getRes5();
  const betaCompany = res5Data.data.data;
  console.log(`[PASS] Test 5: Second tenant provisioned: "${betaCompany.name}" (${betaCompany.code}).`);

  // -------------------------------------------------------------
  // TEST 6: Tenant User List Isolation (Acme Admin cannot see Beta Admin)
  // -------------------------------------------------------------
  console.log('\nTest 6: Verifying user roster data isolation for Acme Admin...');
  const { req: req6, res: res6, getResult: getRes6, next: next6 } = mockReqRes({}, {}, {}, acmeAdminContext);
  await userController.getAllUsers(req6, res6, next6);
  const res6Data = getRes6();

  const acmeUsers = res6Data.data.data;
  const containsBetaUser = acmeUsers.some(u => u.email === 'beta_admin@test.com');
  if (containsBetaUser) {
    throw new Error(`Test 6 Failed: Acme Admin leaked Beta Retail users!`);
  }
  console.log(`[PASS] Test 6: Roster strictly isolated. Acme Admin sees ${acmeUsers.length} users (all Acme members).`);

  // -------------------------------------------------------------
  // TEST 7: Compound Index on Product SKU (Acme and Beta can both use TST-COF-01)
  // -------------------------------------------------------------
  console.log('\nTest 7: Compound SKU index per company...');
  // Find or create test category
  let testCat = await Category.findOne({ companyId: acmeCompany._id });
  if (!testCat) {
    testCat = await Category.create({
      name: 'Coffee',
      slug: 'coffee-acme',
      companyId: acmeCompany._id
    });
  }

  // Create product under Acme
  const { req: req7a, res: res7a, getResult: getRes7a, next: next7a } = mockReqRes({
    sku: 'TST-COF-01',
    name: 'Acme Americano',
    categoryId: testCat._id,
    priceInCents: 500
  }, {}, {}, acmeAdminContext);
  await productController.createProduct(req7a, res7a, next7a);
  if (getRes7a().statusCode !== 201) {
    throw new Error(`Test 7a Failed: ${JSON.stringify(getRes7a())}`);
  }

  // Create same SKU under Beta
  const betaAdminContext = {
    role: 'admin',
    fullName: 'Brian Beta',
    companyId: betaCompany._id
  };
  let betaCat = await Category.findOne({ companyId: betaCompany._id });
  if (!betaCat) {
    betaCat = await Category.create({
      name: 'Drinks',
      slug: 'drinks-beta',
      companyId: betaCompany._id
    });
  }

  const { req: req7b, res: res7b, getResult: getRes7b, next: next7b } = mockReqRes({
    sku: 'TST-COF-01',
    name: 'Beta Brew',
    categoryId: betaCat._id,
    priceInCents: 650
  }, {}, {}, betaAdminContext);
  await productController.createProduct(req7b, res7b, next7b);
  if (getRes7b().statusCode !== 201) {
    throw new Error(`Test 7b Failed: Compound SKU blocked second company from using same SKU!`);
  }
  console.log(`[PASS] Test 7: Both companies created SKU "TST-COF-01" without collision.`);

  // Clean up test data
  console.log('\nCleaning up verification records...');
  await Company.deleteMany({ code: { $in: ['ACME-TEST', 'BETA-TEST'] } });
  await User.deleteMany({ email: { $in: ['acme_admin@test.com', 'acme_staff@test.com', 'beta_admin@test.com'] } });
  await Product.deleteMany({ sku: { $in: ['TST-COF-01'] } });
  await Category.deleteMany({ slug: { $in: ['coffee-acme', 'drinks-beta'] } });

  console.log('\n======================================================');
  console.log('>>> ALL B2B MULTI-TENANT VERIFICATION TESTS PASSED <<<');
  console.log('======================================================\n');
  process.exit(0);
};

runTest().catch((err) => {
  console.error('\n[FAIL] Test Error:', err);
  process.exit(1);
});
