
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      // Try with config first in all environments
      if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        // Fallback to auto-init for Firebase App Hosting
        firebaseApp = initializeApp();
      }
    } catch (e) {
      console.error('Firebase initialization failed:', e);
      throw e;
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  try {
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const storage = getStorage(firebaseApp);
    
    return {
      firebaseApp,
      auth,
      firestore,
      storage
    };
  } catch (e) {
    console.error('Failed to get Firebase SDKs:', e);
    throw e;
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

    