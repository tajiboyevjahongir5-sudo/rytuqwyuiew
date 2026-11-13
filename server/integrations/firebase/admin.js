import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function parseServiceAccount(raw) {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT noto'g'ri formatda (JSON yoki base64 JSON bo'lishi kerak)");
  }
}

/** Firebase Admin SDK ni bir marta ishga tushiradi va Firestore ni qaytaradi. */
export function initFirestore(firebaseConfig) {
  if (!getApps().length) {
    const options = {};
    if (firebaseConfig.serviceAccount) {
      const account = parseServiceAccount(firebaseConfig.serviceAccount);
      options.credential = cert(account);
      options.projectId = firebaseConfig.projectId || account.project_id;
    } else {
      if (!process.env.FIRESTORE_EMULATOR_HOST) options.credential = applicationDefault();
      if (firebaseConfig.projectId) options.projectId = firebaseConfig.projectId;
    }
    if (firebaseConfig.storageBucket) options.storageBucket = firebaseConfig.storageBucket;
    initializeApp(options);
  }
  const db = getFirestore();
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // sozlamalar allaqachon o'rnatilgan
  }
  return db;
}
