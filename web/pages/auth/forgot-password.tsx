import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { firebaseAuth } from '../../lib/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await firebaseAuth.resetPassword(data.email);
      setSuccess(true);
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error('Password reset error:', err);
      
      // Handle Firebase specific errors
      if (err.code === 'auth/user-not-found') {
        // Don't reveal if user exists for security
        setSuccess(true);
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Carryofy</title>
        <meta
          name="description"
          content="Reset your Carryofy account password."
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
        <main className="flex-grow flex items-center justify-center py-12 sm:py-16 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 border border-gray-100">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Link>

              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
                  Forgot Password?
                </h1>
                <p className="text-gray-600">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {success ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Check Your Email</h2>
                  <p className="text-gray-600 mb-6">
                    We've sent password reset instructions to{' '}
                    <strong className="text-gray-900">{getValues('email')}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setError(null);
                      }}
                      className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition font-semibold"
                    >
                      Resend Email
                    </button>
                    <Link
                      href="/auth/login"
                      className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold text-center"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Remember your password?{' '}
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
