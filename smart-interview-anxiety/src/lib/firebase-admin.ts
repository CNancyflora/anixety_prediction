import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const serviceAccountValid = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL;
  
  if (serviceAccountValid) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Attempt default initialization if ENV vars are missing
    try {
      initializeApp();
    } catch (e) {
      console.warn("Firebase Admin fallback initialization failed.");
    }
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
