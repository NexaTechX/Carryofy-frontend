import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged,
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from './firebase/config';

export interface User {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  verified: boolean;
}

// Token management (JWT / access token stored in localStorage)
export const tokenManager = {
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  },

  clearToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  },
};

// User management
export const userManager = {
  setUser: (user: User): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  clearUser: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },

  logout: async (): Promise<void> => {
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
      }
      await firebaseSignOut(auth);
      userManager.clearUser();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data even if Firebase logout fails
      userManager.clearUser();
    }
  },
};

// Helper to check if Firebase Auth is initialized
const ensureAuthInitialized = (): Auth => {
  if (!auth) {
    throw new Error(
      'Firebase Auth is not initialized. Please check your Firebase configuration in .env or .env.local. ' +
      'Required variables: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, ' +
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, ' +
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID'
    );
  }
  return auth;
};

// Firebase Auth helpers
export const firebaseAuth = {
  /**
   * Sign up with email and password
   */
  signup: async (email: string, password: string, displayName: string): Promise<FirebaseUser> => {
    const authInstance = ensureAuthInitialized();
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    
    // Update display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
    }
    
    return userCredential.user;
  },

  /**
   * Sign in with email and password
   */
  login: async (email: string, password: string): Promise<FirebaseUser> => {
    const authInstance = ensureAuthInitialized();
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return userCredential.user;
  },

  /**
   * Sign out
   */
  logout: async (): Promise<void> => {
    const authInstance = ensureAuthInitialized();
    await firebaseSignOut(authInstance);
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email: string): Promise<void> => {
    const authInstance = ensureAuthInitialized();
    await sendPasswordResetEmail(authInstance, email);
  },

  /**
   * Get current Firebase user
   */
  getCurrentUser: (): FirebaseUser | null => {
    if (!auth) {
      // Throw error to indicate Firebase is not initialized
      throw new Error('Firebase Auth is not initialized');
    }
    return auth.currentUser;
  },

  /**
   * Get Firebase ID token
   */
  getIdToken: async (forceRefresh = false): Promise<string | null> => {
    // SSR-safe: return null on server-side
    if (typeof window === 'undefined' || !auth) return null;
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    if (!auth) {
      // If auth is not initialized, call callback with null immediately
      callback(null);
      return () => {}; // Return a no-op unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Resend email verification
   */
  resendVerification: async (): Promise<void> => {
    const authInstance = ensureAuthInitialized();
    const user = authInstance.currentUser;
    if (user) {
      await sendEmailVerification(user);
    } else {
      throw new Error('No user is currently signed in');
    }
  },

  /**
   * Sign in with Google
   */
  signInWithGoogle: async (): Promise<FirebaseUser> => {
    const authInstance = ensureAuthInitialized();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(authInstance, provider);
    return result.user;
  },
};

// Role-based redirect
export const getRoleRedirect = (role: string | undefined | null): string => {
  if (!role) {
    return '/';
  }
  
  switch (role.toUpperCase()) {
    case 'SELLER':
      return '/seller';
    case 'BUYER':
      return '/buyer';
    case 'ADMIN':
      return '/admin';
    default:
      return '/';
  }
};
