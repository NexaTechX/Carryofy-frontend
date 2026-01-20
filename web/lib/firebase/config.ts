import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase configuration values
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingConfigKeys = requiredConfigKeys.filter(
  (key) => !firebaseConfig[key]
);

// Map config keys to environment variable names
const configKeyToEnvVar: Record<keyof typeof firebaseConfig, string> = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  measurementId: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
};

// Initialize Firebase app (only once, client-side only)
let app: FirebaseApp | undefined;
if (typeof window !== 'undefined') {
  if (missingConfigKeys.length > 0) {
    console.warn(
      `⚠️ Firebase configuration incomplete. Missing: ${missingConfigKeys.join(', ')}. ` +
      `Please set the following environment variables: ${missingConfigKeys
        .map((key) => configKeyToEnvVar[key])
        .join(', ')}`
    );
  } else if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  } else {
    app = getApps()[0];
  }
}

// Analytics instance - will be initialized in useEffect
let analytics: Analytics | null = null;

/**
 * Initialize Firebase Analytics
 * Call this function in a useEffect hook in your app
 */
export const initAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined' || !app) {
    return null;
  }

  if (analytics) {
    return analytics;
  }

  try {
    const supported = await isSupported();
    if (supported && app) {
      analytics = getAnalytics(app);
      return analytics;
    }
  } catch (error) {
    console.error('Firebase Analytics initialization error:', error);
  }

  return null;
};

/**
 * Get the current analytics instance
 * Returns null if analytics hasn't been initialized yet
 */
export const getAnalyticsInstance = (): Analytics | null => {
  return analytics;
};

export { app };
