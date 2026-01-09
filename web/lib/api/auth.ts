import apiClient from './client';
import { AxiosError, AxiosResponse } from 'axios';

export interface SignupRequest {
  name: string;
  email: string;
  phone?: string;
  role: 'BUYER' | 'SELLER';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    verified: boolean;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  password: string;
}

// Helper function to extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Network error (backend not reachable)
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      return 'Unable to connect to server. Please check your internet connection and try again.';
    }
    
    // Timeout error
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    // Response error with message
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    // Status code specific messages
    if (error.response?.status === 401) {
      return 'Authentication failed';
    }
    if (error.response?.status === 404) {
      return 'API endpoint not found. Please check your configuration.';
    }
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retryAfter;
      if (retryAfter) {
        return `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
      }
      return error.response.data?.message || 'Too many requests. Please try again later.';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    if (error.message) {
      return error.message;
    }
  }
  return 'An error occurred. Please try again.';
};

// Helper to extract data from backend response (handles TransformInterceptor wrapper)
const extractResponseData = <T>(response: AxiosResponse<unknown>): T => {
  // Backend uses TransformInterceptor which wraps response in { statusCode, message, data }
  if (
    response.data &&
    typeof response.data === 'object' &&
    response.data !== null &&
    'data' in response.data
  ) {
    return (response.data as { data: T }).data;
  }
  // If response is already unwrapped
  return response.data as T;
};

// Auth API functions
export const authApi = {

  /**
   * Get current user information
   */
  getMe: async (): Promise<AuthResponse['user']> => {
    try {
      const response = await apiClient.get<AuthResponse['user']>('/auth/me');
      return extractResponseData<AuthResponse['user']>(response);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Delete user account
   */
  deleteAccount: async (): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/delete');
      return extractResponseData<{ message: string }>(response);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Verify user email with a verification token
   */
  verifyEmail: async (payload: VerifyEmailRequest): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/verify-email', payload);
      return extractResponseData<{ message: string }>(response);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Confirm password reset with token and new password
   */
  resetPasswordConfirm: async (payload: ResetPasswordConfirmRequest): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/reset-password/confirm', payload);
      return extractResponseData<{ message: string }>(response);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
