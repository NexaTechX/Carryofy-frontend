import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Required Firebase config values
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

// Validate Firebase configuration
const isFirebaseConfigValid = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // Server-side, skip validation
  }
  
  const allValid = requiredEnvVars.every((varName) => {
    const value = process.env[varName];
    const isValid = value && value.trim() !== '';
    if (!isValid) {
      console.warn(`Missing or empty: ${varName}`);
    }
    return isValid;
  });
  
  if (!allValid) {
    console.warn('Firebase config validation failed. Check console for missing variables.');
  }
  
  return allValid;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

// Initialize Firebase on client-side only
if (typeof window !== 'undefined') {
  // Debug: Log environment variable status
  console.log('🔍 Checking Firebase environment variables...');
  const envStatus = requiredEnvVars.map((varName) => {
    const value = process.env[varName];
    return {
      name: varName,
      value: value ? '✅ Set' : '❌ Missing',
      actualValue: value ? `${value.substring(0, 20)}...` : undefined,
    };
  });
  console.table(envStatus);
  
  // Only initialize if config is valid
  if (isFirebaseConfigValid()) {
    try {
      // Check if firebaseConfig has all required values
      const hasAllValues = firebaseConfig.apiKey && 
                          firebaseConfig.authDomain && 
                          firebaseConfig.projectId && 
                          firebaseConfig.storageBucket && 
                          firebaseConfig.messagingSenderId && 
                          firebaseConfig.appId;
      
      if (!hasAllValues) {
        console.error('❌ Firebase config object has undefined values:', firebaseConfig);
        throw new Error('Firebase config is incomplete');
      }
      
      // Get existing app or initialize new one
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      console.log('✅ Firebase initialized successfully');
      
      // Initialize Analytics only in browser and production
      if (process.env.NODE_ENV === 'production') {
        try {
          analytics = getAnalytics(app);
        } catch (analyticsError) {
          console.warn('Failed to initialize Firebase Analytics:', analyticsError);
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error);
      console.error('Firebase config object:', firebaseConfig);
      console.error('Please check your Firebase configuration in .env or .env.local');
      // Set to null to indicate initialization failed
      app = null;
      auth = null;
    }
  } else {
    // Debug: Log which variables are missing
    const missingVars = requiredEnvVars.filter((varName) => {
      const value = process.env[varName];
      return !value || value.trim() === '';
    });
    
    if (missingVars.length > 0) {
      console.error('⚠️ Firebase configuration is missing or incomplete.');
      console.error('Missing variables:', missingVars);
      console.error('Please add the following environment variables to .env or .env.local:\n' +
        requiredEnvVars.map((v) => `  - ${v}`).join('\n'));
      console.error('Current .env location: apps/web/.env');
      console.error('💡 TIP: Restart your Next.js dev server after adding/changing .env variables!');
    }
  }
}

// Helper to check if Firebase is initialized
export const isFirebaseInitialized = (): boolean => {
  // Always return false on server-side
  if (typeof window === 'undefined') {
    return false;
  }
  return auth !== null && app !== null;
};

// Export with null checks
export { auth, analytics };
export default app;

