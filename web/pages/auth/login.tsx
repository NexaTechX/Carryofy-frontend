import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService, tokenManager, useAuth, getRoleRedirect } from '../../lib/auth';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';
import SEO from '../../components/seo/SEO';
import { BreadcrumbSchema } from '../../components/seo/JsonLd';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (router.query.error === 'unauthorized') {
      setError('You do not have permission to access that page. Please login with an admin account.');
    }
  }, [router.query.error]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (!response || !response.user) {
        console.error('Invalid login response:', response);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.user.verified) {
        setError('Please verify your email address before logging in. Check your inbox for the verification code.');
        setIsSubmitting(false);
        router.push('/auth/verify?email=' + encodeURIComponent(data.email));
        return;
      }

      tokenManager.setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      showSuccessToast('Login successful!');

      // Check for redirect parameter
      const redirectUrl = router.query.redirect as string;
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        const redirectPath = getRoleRedirect(response.user.role);
        router.push(redirectPath);
      }
    } catch (error: any) {
      console.error('Login error:', error);

      let message = 'Invalid email or password';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData.message) {
          message = Array.isArray(errorData.message) 
            ? errorData.message.join(', ') 
            : errorData.message;
        } else if (typeof errorData === 'string') {
          message = errorData;
        }
      } else if (error.message) {
        message = error.message;
      }

      if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || error.message || 'Server error occurred';
        message = `Server Error: ${errorMessage}. Please try again later.`;
      }

      setError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginKeywords = [
    // Primary intent
    'login Carryofy',
    'sign in Carryofy',
    'Carryofy account login',
    
    // User type specific
    'seller login Nigeria',
    'buyer login Nigeria',
    'merchant login Carryofy',
    
    // General
    'ecommerce login Nigeria',
    'online shopping login',
    'marketplace login Nigeria',
  ].join(', ');

  return (
    <>
      <SEO
        title="Login - Sign In to Your Carryofy Account | Nigeria E-Commerce"
        description="Sign in to your Carryofy account to shop products, manage orders, or access your seller dashboard. Secure login for buyers and sellers in Nigeria. Forgot password? Reset it easily."
        keywords={loginKeywords}
        canonical="https://carryofy.com/auth/login"
        ogType="website"
        ogImage="https://carryofy.com/og/login.png"
        ogImageAlt="Login to Carryofy - Nigeria's E-Commerce Platform"
      />
      
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Login', url: '/auth/login' },
        ]}
      />
      
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
                  Welcome Back
                </h1>
                <p className="text-gray-600">Sign in to your Carryofy account</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm" role="alert">
                  {error}
                </div>
              )}

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
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
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
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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

                {/* Forgot Password Link */}
                <div className="flex items-center justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/signup" className="text-primary hover:text-primary-dark font-semibold">
                    Sign up free
                  </Link>
                </p>
              </div>
              
              {/* Additional Links for SEO */}
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-500 text-xs">
                  Want to sell on Carryofy?{' '}
                  <Link href="/merchant-onboarding" className="text-primary hover:underline">
                    Become a Merchant
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
