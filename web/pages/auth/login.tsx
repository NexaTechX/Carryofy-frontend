import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService, tokenManager, useAuth, getRoleRedirect } from '../../lib/auth';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';

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
      // Login with NestJS backend
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      // Validate response structure
      if (!response || !response.user) {
        console.error('Invalid login response:', response);
        throw new Error('Invalid response from server. Please try again.');
      }

      // Check if email is verified
      if (!response.user.verified) {
        setError('Please verify your email address before logging in. Check your inbox for the verification code.');
        setIsSubmitting(false);
        router.push('/auth/verify?email=' + encodeURIComponent(data.email));
        return;
      }

      // Store tokens and user data
      tokenManager.setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      // Sync with localStorage for backward compatibility
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      showSuccessToast('Login successful!');

      // Redirect based on user role
      const redirectPath = getRoleRedirect(response.user.role);
      router.push(redirectPath);
    } catch (error: any) {
      console.error('=== LOGIN ERROR DETAILS ===');
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error response headers:', error.response?.headers);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('==========================');

      // Extract message from backend response if available
      // Backend uses TransformInterceptor which wraps errors in { statusCode, message }
      let message = 'Invalid email or password';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('Parsing error data:', JSON.stringify(errorData, null, 2));
        
        // Handle wrapped error response from TransformInterceptor
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

      // Provide more specific error messages for common issues
      if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || error.message || 'Server error occurred';
        message = `Server Error (500): ${errorMessage}. Please check backend logs for details.`;
        console.error('=== 500 SERVER ERROR DETAILS ===');
        console.error('Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('Request URL:', error.config?.url);
        console.error('Request Method:', error.config?.method);
        console.error('Request Data:', error.config?.data);
        console.error('================================');
      }

      setError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Carryofy</title>
        <meta
          name="description"
          content="Login to your Carryofy account to start selling or shopping."
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
                  Welcome Back
                </h1>
                <p className="text-gray-600">Sign in to your account</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
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
                    Sign up
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

