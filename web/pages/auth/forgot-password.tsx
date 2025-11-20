import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../lib/auth';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Reset code must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ForgotPassword() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const forgotForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onForgotSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authService.forgotPassword({ email: data.email });
      setEmail(data.email);
      resetForm.setValue('email', data.email);
      showSuccessToast('Password reset code sent to your email!');
      setStep('reset');
    } catch (err) {
      // For security, we show success even if email doesn't exist
      setEmail(data.email);
      resetForm.setValue('email', data.email);
      showSuccessToast('If an account exists with this email, you will receive a reset code.');
      setStep('reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authService.resetPassword({
        email: data.email,
        code: data.code,
        password: data.password,
      });

      showSuccessToast('Password reset successfully!');

      // Redirect to login
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(message);
      showErrorToast(message);
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

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              {step === 'email' ? (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
                      Forgot Password?
                    </h1>
                    <p className="text-gray-600">
                      No worries! Enter your email and we'll send you a reset code.
                    </p>
                  </div>

                  <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          {...forgotForm.register('email')}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${forgotForm.formState.errors.email ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="your.email@example.com"
                        />
                      </div>
                      {forgotForm.formState.errors.email && (
                        <p className="mt-1 text-sm text-red-600">{forgotForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-900">
                      Reset Password
                    </h1>
                    <p className="text-gray-600">
                      Enter the 6-digit code sent to
                    </p>
                    <p className="text-gray-900 font-semibold mt-1">{email}</p>
                  </div>

                  <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
                    <input type="hidden" {...resetForm.register('email')} />

                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                        Reset Code
                      </label>
                      <input
                        type="text"
                        id="code"
                        maxLength={6}
                        {...resetForm.register('code')}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-center text-lg font-mono tracking-widest ${resetForm.formState.errors.code ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="000000"
                        autoComplete="one-time-code"
                      />
                      {resetForm.formState.errors.code && (
                        <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.code.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          {...resetForm.register('password')}
                          className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${resetForm.formState.errors.password ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {resetForm.formState.errors.password && (
                        <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          {...resetForm.register('confirmPassword')}
                          className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${resetForm.formState.errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                            }`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {resetForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError(null);
                      }}
                      className="w-full px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition font-semibold"
                    >
                      Resend Code
                    </button>
                  </form>
                </>
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
