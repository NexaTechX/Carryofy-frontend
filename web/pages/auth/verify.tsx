import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { authService, useAuth, getRoleRedirect } from '../../lib/auth';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';

const verifySchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
  email: z.string().email(),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function EmailVerification() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  useEffect(() => {
    if (router.query.email) {
      const emailParam = decodeURIComponent(router.query.email as string);
      setEmail(emailParam);
      setValue('email', emailParam);
    }
  }, [router.query.email, setValue]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onSubmit = async (data: VerifyFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authService.verifyEmail({ email: data.email, code: data.code });

      showSuccessToast('Email verified successfully!');
      setSuccess(true);

      // After verification, fetch updated user info and redirect to dashboard
      setTimeout(async () => {
        try {
          // Check if user has tokens (from signup)
          const { tokenManager } = await import('../../lib/auth');
          const hasToken = tokenManager.hasAccessToken();
          
          if (hasToken) {
            // User is already logged in from signup, fetch updated user info
            const updatedUser = await authService.getCurrentUser();
            // Update user in context with verified status
            setUser(updatedUser);
            // Sync with localStorage for backward compatibility
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            const redirectPath = getRoleRedirect(updatedUser.role);
            router.push(redirectPath);
          } else {
            // No token, redirect to login
            router.push('/auth/login');
          }
        } catch (err) {
          // If fetching user fails, still redirect to login
          console.error('Failed to fetch user after verification:', err);
          router.push('/auth/login');
        }
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    setIsResending(true);
    setError(null);

    try {
      await authService.resendVerificationCode({ email });
      showSuccessToast('Verification code resent successfully!');
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
      showErrorToast(message);
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Email Verified - Carryofy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
          <header className="bg-white shadow-sm">
            <nav className="container mx-auto px-4 py-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded"></div>
                <span className="text-2xl font-bold text-black">Carryofy</span>
              </Link>
            </nav>
          </header>
          <main className="flex-grow flex items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 border border-gray-100 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-gray-900">Email Verified!</h1>
                <p className="text-gray-600 mb-6">
                  Your email has been verified successfully. Redirecting...
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Verify Email - Carryofy</title>
        <meta
          name="description"
          content="Verify your email address to complete your Carryofy account setup."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
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
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
                  Verify Your Email
                </h1>
                <p className="text-gray-600">
                  We've sent a 6-digit verification code to
                </p>
                {email && (
                  <p className="text-gray-900 font-semibold mt-1">{email}</p>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Hidden Email Field */}
                <input type="hidden" {...register('email')} />

                {/* Verification Code Field */}
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    maxLength={6}
                    {...register('code')}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-center text-lg font-mono tracking-widest ${errors.code ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              {/* Spam Notice */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm font-medium mb-2">
                  📧 Can't find the email?
                </p>
                <ul className="text-amber-700 text-sm space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>Check your <strong>Spam</strong> or <strong>Junk</strong> folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>If found in spam, click <strong>"Not Spam"</strong> or <strong>"Move to Inbox"</strong> to receive future emails properly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>Add <strong>noreply@carryofy.com</strong> to your contacts</span>
                  </li>
                </ul>
              </div>

              {/* Resend Code */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm mb-3">
                  Still didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="text-primary hover:text-primary-dark font-semibold disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                >
                  {resendCooldown > 0 ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    'Resend Code'
                  )}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

