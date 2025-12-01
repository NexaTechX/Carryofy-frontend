import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import { authService, tokenManager, useAuth } from '../../lib/auth';
import { showErrorToast, showSuccessToast } from '../../lib/ui/toast';
import SEO from '../../components/seo/SEO';
import { BreadcrumbSchema } from '../../components/seo/JsonLd';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['BUYER', 'SELLER']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: (router.query.role as 'BUYER' | 'SELLER') || 'BUYER',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (router.query.role) {
      setValue('role', router.query.role as 'BUYER' | 'SELLER');
    }
  }, [router.query.role, setValue]);

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.signup({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role,
      });

      tokenManager.setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      showSuccessToast('Account created! Please check your email to verify your account.');
      router.push('/auth/verify?email=' + encodeURIComponent(data.email));
    } catch (error) {
      const err = error as { message?: string };
      console.error('Signup error:', err);
      const message = err.message || 'An error occurred. Please try again.';
      setError(message);
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const signupKeywords = [
    // Primary intent
    'sign up Carryofy',
    'register Carryofy',
    'create account Carryofy',
    'join Carryofy',
    
    // Buyer intent
    'create buyer account Nigeria',
    'sign up online shopping Nigeria',
    'register ecommerce Nigeria',
    
    // Seller intent
    'seller registration Nigeria',
    'become seller Nigeria',
    'start selling online Nigeria',
    'merchant signup Lagos',
    'vendor registration Africa',
    
    // General
    'free account Nigeria ecommerce',
    'sign up free Nigeria marketplace',
  ].join(', ');

  return (
    <>
      <SEO
        title="Sign Up - Create Your Free Carryofy Account | Buy or Sell Online Nigeria"
        description="Create your free Carryofy account today. Sign up as a buyer to shop products with same-day delivery in Lagos, or register as a seller to start your online business in Nigeria. Free registration, no hidden fees."
        keywords={signupKeywords}
        canonical="https://carryofy.com/auth/signup"
        ogType="website"
        ogImage="https://carryofy.com/og/signup.png"
        ogImageAlt="Sign Up for Carryofy - Nigeria's E-Commerce Platform"
      />
      
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: '/' },
          { name: 'Sign Up', url: '/auth/signup' },
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
                  Create Account
                </h1>
                <p className="text-gray-600">
                  Join Carryofy and start your e-commerce journey in Nigeria
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm" role="alert">
                  {error}
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${errors.name ? 'border-red-300' : 'border-gray-300'
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${errors.email ? 'border-red-300' : 'border-gray-300'
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
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${errors.phone ? 'border-red-300' : 'border-gray-300'
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
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Create a password"
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
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 mb-3">
                    I want to join as:
                  </legend>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${errors.role
                          ? 'border-red-300'
                          : selectedRole === 'BUYER'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-300 hover:border-primary'
                        }`}
                    >
                      <input
                        type="radio"
                        value="BUYER"
                        {...register('role')}
                        className="sr-only"
                      />
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${selectedRole === 'BUYER' ? 'text-primary' : 'text-gray-600'
                          }`}
                      >
                        <svg
                          className="w-8 h-8 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
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
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${errors.role
                          ? 'border-red-300'
                          : selectedRole === 'SELLER'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-300 hover:border-primary'
                        }`}
                    >
                      <input
                        type="radio"
                        value="SELLER"
                        {...register('role')}
                        className="sr-only"
                      />
                      <div
                        className={`w-full h-full flex flex-col items-center justify-center ${selectedRole === 'SELLER' ? 'text-primary' : 'text-gray-600'
                          }`}
                      >
                        <svg
                          className="w-8 h-8 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
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
                </fieldset>

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
