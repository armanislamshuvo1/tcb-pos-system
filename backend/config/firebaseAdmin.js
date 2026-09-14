const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let isInitialized = false;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH 
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, 'firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    });
    isInitialized = true;
    console.log('[Firebase Admin] Initialized with Service Account Key');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    isInitialized = true;
    console.log('[Firebase Admin] Initialized with Project ID');
  } else {
    console.warn('[Firebase Admin] No service account key found. Running in Development Mock Auth mode.');
  }
} catch (err) {
  console.warn(`[Firebase Admin] Initialization warning: ${err.message}. Running in Mock Auth mode.`);
}

module.exports = {
  admin,
  isInitialized
};
