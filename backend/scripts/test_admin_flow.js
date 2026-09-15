const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function postAuth(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        Authorization: `Bearer ${token}`
      }
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  // Step 1: Login as system admin
  console.log('\n=== STEP 1: Login as system admin ===');
  const loginRes = await post('/api/users/pin-login', { identifier: 'ADM-001', pinCode: '276266' });
  console.log('Status:', loginRes.status, '| Success:', loginRes.body?.success);
  if (!loginRes.body?.success) {
    console.error('FAILED TO LOGIN. Body:', JSON.stringify(loginRes.body));
    return;
  }
  const token = loginRes.body.data.token;
  console.log('Got token, role:', loginRes.body.data.user.role);

  // Step 2: Fetch companies
  console.log('\n=== STEP 2: Fetch companies ===');
  const compRes = await get('/api/companies', token);
  console.log('Status:', compRes.status);
  const companies = compRes.body?.data || [];
  companies.forEach(c => console.log(`  - [${c.code}] ${c.name} (ID: ${c._id}) | Admins: ${c.admins?.length || 0}`));

  const tcb = companies.find(c => c.code === 'TCB');
  if (!tcb) {
    console.log('No TCB company found!');
    return;
  }

  // Step 3: Try to assign a NEW admin to TCB company
  const testEmail = `tcbadmin_test_${Date.now()}@tcb.com`;
  const testCode = `ADM-T${Date.now().toString().slice(-4)}`;
  console.log(`\n=== STEP 3: Provision admin for TCB (${tcb._id}) ===`);
  console.log(`  email: ${testEmail}, code: ${testCode}`);
  const assignRes = await postAuth(`/api/companies/${tcb._id}/admins`, {
    fullName: 'Test TCB Admin',
    email: testEmail,
    employeeCode: testCode,
    pinCode: '9999'
  }, token);
  console.log('Status:', assignRes.status, '| Body:', JSON.stringify(assignRes.body));

  if (!assignRes.body?.success) {
    console.error('\nFAILED to provision admin. That is the bug.');
    return;
  }

  // Step 4: Try login as new admin with employee code
  console.log(`\n=== STEP 4: Login as new admin (${testCode} / PIN 9999) ===`);
  const adminLoginRes = await post('/api/users/pin-login', { identifier: testCode, pinCode: '9999' });
  console.log('Status:', adminLoginRes.status, '| Success:', adminLoginRes.body?.success);
  if (adminLoginRes.body?.success) {
    const adminUser = adminLoginRes.body.data.user;
    console.log('  role:', adminUser.role, '| companyId:', adminUser.companyId);
  } else {
    console.error('  Error:', JSON.stringify(adminLoginRes.body));
  }

  // Step 5: Try login with email
  console.log(`\n=== STEP 5: Login as new admin (${testEmail} / PIN 9999) ===`);
  const emailLoginRes = await post('/api/users/pin-login', { identifier: testEmail, pinCode: '9999' });
  console.log('Status:', emailLoginRes.status, '| Success:', emailLoginRes.body?.success);
  if (emailLoginRes.body?.success) {
    console.log('  role:', emailLoginRes.body.data.user.role);
  } else {
    console.error('  Error:', JSON.stringify(emailLoginRes.body));
  }
}

run().catch(err => console.error('Fatal:', err.message));
