export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN' | 'RIDER';

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    verified: boolean;
    vehicleType?: string;
    vehicleNumber?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface SignupRequest {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface VerifyEmailRequest {
    email: string;
    code: string;
}

export interface ResendVerificationRequest {
    email: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    code: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
}

export interface RiderSignupRequest {
    name: string;
    email: string;
    password: string;
    phone: string;
    vehicleType?: string;
    vehicleNumber?: string;
}
