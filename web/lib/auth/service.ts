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

export const authService = {
    signup: async (data: SignupRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/signup', data);
        return response.data;
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
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
        return response.data;
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
