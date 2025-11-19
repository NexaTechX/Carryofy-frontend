import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { firebaseAuth, userManager } from '../../lib/auth';
import { authApi } from '../../lib/api/auth';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';
import { isFirebaseInitialized } from '../../lib/firebase/config';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['buyer', 'seller']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Check Firebase initialization status (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsFirebaseReady(isFirebaseInitialized());
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: (router.query.role as 'buyer' | 'seller') || 'buyer',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (router.query.role) {
      setValue('role', router.query.role as 'buyer' | 'seller');
    }
  }, [router.query.role, setValue]);

  const handleGoogleSignup = async () => {
    // Only allow Google signup for buyers
    if (selectedRole !== 'buyer') {
      setError('Google sign-in is only available for buyers');
      showErrorToast('Google sign-in is only available for buyers');
      return;
    }

    setIsGoogleSigningIn(true);
    setError(null);

    try {
      // Check if Firebase is initialized before attempting sign-in
      if (!isFirebaseInitialized()) {
        throw new Error(
          'Firebase is not configured. Please add your Firebase configuration to .env or .env.local. ' +
          'See FIREBASE_MIGRATION_GUIDE.md for setup instructions.'
        );
      }

      // Step 1: Sign in with Google
      const firebaseUser = await firebaseAuth.signInWithGoogle();

      if (!firebaseUser.email) {
        throw new Error('Google account does not have an email address');
      }

      // Step 2: Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();

      // Step 3: Verify token with backend (creates user if doesn't exist, defaults to BUYER)
      const response = await authApi.verifyToken(idToken);

      // Validate response structure
      if (!response || !response.user || !response.user.role) {
        throw new Error('Invalid response from server. Please try again.');
      }

      // If user already exists with a different role, show error
      if (response.user.role !== 'BUYER') {
        throw new Error(`This account is already registered as a ${response.user.role.toLowerCase()}. Please use email/password to sign in.`);
      }

      // Store user data and token
      userManager.setUser(response.user);
      if (response.accessToken) {
        const { tokenManager } = await import('../../lib/auth');
        tokenManager.setToken(response.accessToken);
      }

      showSuccessToast('Signed in successfully!');

      // Redirect to buyer dashboard
      router.push('/buyer');
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error('Google signup error:', err);

      // Handle Firebase specific errors
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Please use email/password sign-in.');
      } else {
        const message = err.message || 'An error occurred. Please try again.';
        setError(message);
      }
      showErrorToast(err.message || 'Failed to sign in with Google');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create Firebase user
      const firebaseUser = await firebaseAuth.signup(
        data.email,
        data.password,
        data.name
      );

      // Step 2: Sync with backend (create user profile with role)
      const response = await authApi.signup(firebaseUser.uid, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role.toUpperCase() as 'BUYER' | 'SELLER',
      });

      // Validate response structure
      if (!response || !response.user || !response.user.role) {
        throw new Error('Invalid response from server. Please try again.');
      }

      // Store user data
      userManager.setUser(response.user);

      showSuccessToast('Account created! Please check your email to verify your account.');

      // Redirect to email verification page
      router.push('/auth/verify?email=' + encodeURIComponent(data.email));
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error('Signup error:', err);

      // Handle Firebase specific errors
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        const message = err.message || 'An error occurred. Please try again.';
        setError(message);
      }
      showErrorToast(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <>
      <Head>
        <title>Sign Up - Carryofy</title>
        <meta
          name="description"
          content="Create your Carryofy account and start your e-commerce journey."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <nav className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded"></div>
              <span className="text-2xl font-bold text-black">Carryofy</span>
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="grow flex items-center justify-center py-12 sm:py-16 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 border border-gray-100">
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
                  Create Account
                </h1>
                <p className="text-gray-600">
                  Join Carryofy and start your journey
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {/* Google Sign-in Button (Buyers Only) */}
              {selectedRole === 'buyer' && (
                <div className="mb-6">
                  {!isFirebaseReady && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs">
                      <p className="font-semibold mb-1">Google sign-in requires Firebase configuration</p>
                      <p>Add your Firebase config to <code className="bg-yellow-100 px-1 rounded">.env</code> or <code className="bg-yellow-100 px-1 rounded">.env.local</code>. See FIREBASE_MIGRATION_GUIDE.md for setup.</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isGoogleSigningIn || isSubmitting || !isFirebaseReady}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!isFirebaseReady ? "Firebase configuration required. See FIREBASE_MIGRATION_GUIDE.md for setup." : "Sign in with your Google account"}
                  >
                    {isGoogleSigningIn ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>
                  <div className="mt-4 flex items-center">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-sm text-gray-500">or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      {...register('name')}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      {...register('email')}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      {...register('password')}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      {...register('confirmPassword')}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Role Selection Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    I want to join as:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        errors.role
                          ? 'border-red-300'
                          : selectedRole === 'buyer'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      <input
                        type="radio"
                        value="buyer"
                        {...register('role')}
                        className="sr-only"
                      />
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${
                          selectedRole === 'buyer' ? 'text-primary' : 'text-gray-600'
                        }`}
                      >
                        <svg
                          className="w-8 h-8 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                        <span className="font-semibold text-sm">Buyer</span>
                        <span className="text-xs text-gray-500 mt-1">Shop & Order</span>
                      </div>
                    </label>
                    <label
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                        errors.role
                          ? 'border-red-300'
                          : selectedRole === 'seller'
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      <input
                        type="radio"
                        value="seller"
                        {...register('role')}
                        className="sr-only"
                      />
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${
                          selectedRole === 'seller' ? 'text-primary' : 'text-gray-600'
                        }`}
                      >
                        <svg
                          className="w-8 h-8 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        <span className="font-semibold text-sm">Seller</span>
                        <span className="text-xs text-gray-500 mt-1">Sell Products</span>
                      </div>
                    </label>
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-primary hover:text-primary-dark font-semibold">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
