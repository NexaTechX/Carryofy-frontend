import apiClient from '../api/client';
import {
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ResetPasswordRequest,
    RiderSignupRequest,
    SignupRequest,
    User,
    VerifyEmailRequest,
    ResendVerificationRequest
} from './types';

// Helper to extract data from backend response (handles TransformInterceptor wrapper)
const extractResponseData = <T>(response: any): T => {
  // Backend uses TransformInterceptor which wraps response in { statusCode, message, data }
  // response.data is the axios response data, which is the wrapped object
  if (
    response?.data &&
    typeof response.data === 'object' &&
    response.data !== null
  ) {
    // Check if it's wrapped by TransformInterceptor (has statusCode and data properties)
    if ('statusCode' in response.data && 'data' in response.data) {
      return response.data.data as T;
    }
    // If it has a 'data' property but no statusCode, it might be double-wrapped
    if ('data' in response.data && typeof response.data.data === 'object') {
      return response.data.data as T;
    }
  }
  // If response is already unwrapped or doesn't match expected structure
  return (response?.data || response) as T;
};

export const authService = {
    signup: async (data: SignupRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/signup', data);
        return extractResponseData<AuthResponse>(response);
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/login', data);
            return extractResponseData<AuthResponse>(response);
        } catch (error: any) {
            // Enhanced error logging for login
            if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
                const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';
                console.error('🚨 Login Network Error:', {
                    code: error.code,
                    message: error.message,
                    apiBase,
                    fullURL: `${apiBase}/auth/login`,
                    hint: 'Make sure the backend is running on port 3000'
                });
            }
            throw error;
        }
    },

    verifyEmail: async (data: VerifyEmailRequest): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/auth/verify-email', data);
        return response.data;
    },

    resendVerificationCode: async (data: ResendVerificationRequest): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/auth/resend-verification-code', data);
        return response.data;
    },

    forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/auth/forgot-password', data);
        return response.data;
    },

    resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
        return response.data;
    },

    refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
        const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh-token', data);
        return response.data;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get<User>('/auth/me');
        return extractResponseData<User>(response);
    },

    riderSignup: async (data: RiderSignupRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/rider/signup', data);
        return response.data;
    },

    deleteAccount: async (): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('/auth/delete');
        return response.data;
    }
};
