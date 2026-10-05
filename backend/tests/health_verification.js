// Open Status & Health Check Verification Test Suite
process.env.PORT = '5099';
require('dotenv').config({ path: __dirname + '/../.env' });
process.env.PORT = '5099'; // ensure test port is 5099
const { app, server, migrationPromise } = require('../server');
const mongoose = require('mongoose');

async function testHealthEndpoints() {
  console.log('=== Starting Open Status & Health Verification Suite ===\n');

  // Wait for MongoDB and any startup migration to complete
  let retries = 0;
  while (mongoose.connection.readyState !== 1) {
    await new Promise(res => setTimeout(res, 300));
    retries++;
    if (retries > 30) throw new Error('Timed out waiting for MongoDB connection');
  }
  if (migrationPromise) {
    await migrationPromise;
  }
  console.log('[Setup] Database connection ready and migrations completed (readyState: 1).\n');

  const activePort = server.address() ? server.address().port : 5099;
  const baseUrl = `http://127.0.0.1:${activePort}`;

  let hasFailed = false;

  try {
    // 1. Test GET / (Root health check ping)
    console.log('[Test 1] Testing open root endpoint GET / ...');
    const rootRes = await fetch(`${baseUrl}/`);
    const rootData = await rootRes.json();
    if (rootRes.status === 200 && rootData.success && rootData.data?.status === 'healthy') {
      console.log('  [PASS] GET / returned 200 with healthy status:');
      console.log('  -> service:', rootData.data.service);
      console.log('  -> version:', rootData.data.version);
      console.log('  -> uptimeFormatted:', rootData.data.uptimeFormatted);
      console.log('  -> database status:', rootData.data.database.status, '\n');
    } else {
      throw new Error(`GET / failed: ${JSON.stringify(rootData)}`);
    }

    // 2. Test GET /health
    console.log('[Test 2] Testing open endpoint GET /health ...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status === 200 && healthData.success && healthData.data?.status === 'healthy') {
      console.log('  [PASS] GET /health returned 200.\n');
    } else {
      throw new Error(`GET /health failed: ${JSON.stringify(healthData)}`);
    }

    // 3. Test GET /status
    console.log('[Test 3] Testing open endpoint GET /status ...');
    const statusRes = await fetch(`${baseUrl}/status`);
    const statusData = await statusRes.json();
    if (statusRes.status === 200 && statusData.success && statusData.data?.status === 'healthy') {
      console.log('  [PASS] GET /status returned 200.\n');
    } else {
      throw new Error(`GET /status failed: ${JSON.stringify(statusData)}`);
    }

    // 4. Test GET /api/health (Backwards compatibility)
    console.log('[Test 4] Testing API namespaced endpoint GET /api/health ...');
    const apiHealthRes = await fetch(`${baseUrl}/api/health`);
    const apiHealthData = await apiHealthRes.json();
    if (apiHealthRes.status === 200 && apiHealthData.success && apiHealthData.data?.status === 'healthy') {
      console.log('  [PASS] GET /api/health returned 200.\n');
    } else {
      throw new Error(`GET /api/health failed: ${JSON.stringify(apiHealthData)}`);
    }

    // 5. Test GET /api/status
    console.log('[Test 5] Testing API namespaced endpoint GET /api/status ...');
    const apiStatusRes = await fetch(`${baseUrl}/api/status`);
    const apiStatusData = await apiStatusRes.json();
    if (apiStatusRes.status === 200 && apiStatusData.success && apiStatusData.data?.status === 'healthy') {
      console.log('  [PASS] GET /api/status returned 200.\n');
    } else {
      throw new Error(`GET /api/status failed: ${JSON.stringify(apiStatusData)}`);
    }

    // 6. Test HEAD /health and Cache-Control headers
    console.log('[Test 6] Testing HEAD /health and cache-control headers ...');
    const headRes = await fetch(`${baseUrl}/health`, { method: 'HEAD' });
    const cacheControl = headRes.headers.get('cache-control');
    console.log('  -> Cache-Control header:', cacheControl);
    if (headRes.status === 200 && cacheControl?.includes('no-cache')) {
      console.log('  [PASS] HEAD /health returned 200 with no-cache headers.\n');
    } else {
      throw new Error(`HEAD /health failed: status ${headRes.status}, header: ${cacheControl}`);
    }

    // 7. Verify Open / Unauthenticated Access
    console.log('[Test 7] Verifying endpoints are completely open (no Authorization header required) ...');
    const unauthRes = await fetch(`${baseUrl}/health`, {
      headers: {
        'Accept': 'application/json'
        // Intentionally no Authorization
      }
    });
    if (unauthRes.status === 200) {
      console.log('  [PASS] Successfully accessed /health with zero authentication.\n');
    } else {
      throw new Error(`Expected 200 without auth, got: ${unauthRes.status}`);
    }

    // 8. Validate comprehensive payload structure
    console.log('[Test 8] Validating comprehensive payload structure ...');
    const d = rootData.data;
    const requiredKeys = ['status', 'message', 'service', 'version', 'environment', 'timestamp', 'uptime', 'uptimeFormatted', 'database', 'system'];
    for (const key of requiredKeys) {
      if (d[key] === undefined) {
        throw new Error(`Missing expected property: ${key}`);
      }
    }
    console.log('  [PASS] All expected health check schema keys present and validated.\n');

    console.log('=== All Health & Open Status Tests Passed Successfully! ===');
  } catch (err) {
    console.error('Test Suite Failed:', err.message);
    hasFailed = true;
  } finally {
    if (server && server.close) {
      server.close();
    }
    setTimeout(() => {
      process.exit(hasFailed ? 1 : 0);
    }, 500);
  }
}

testHealthEndpoints();
