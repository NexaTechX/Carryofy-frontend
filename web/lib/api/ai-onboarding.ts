import { apiClient } from './client';

export interface AIOnboardingPreferences {
  id: string;
  userId: string;
  favoriteCategories: string[];
  budgetRange?: string;
  deliveryPreference?: string;
  shoppingFrequency?: string;
  priceSensitivity?: string;
  notificationPreference?: string;
  preferredBrands: string[];
  specialInterests: string[];
  consent: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateAIOnboardingDto {
  favoriteCategories?: string[];
  budgetRange?: string;
  deliveryPreference?: string;
  shoppingFrequency?: string;
  priceSensitivity?: string;
  notificationPreference?: string;
  preferredBrands?: string[];
  specialInterests?: string[];
  consent?: boolean;
}

export const aiOnboardingApi = {
  async getPreferences(): Promise<AIOnboardingPreferences | null> {
    try {
      const response = await apiClient.get('/ai/onboarding');
      const data = response.data?.data || response.data;
      // Return null if data is null or undefined
      return data || null;
    } catch (error: any) {
      // If 404 or empty response, return null (preferences don't exist)
      if (error?.response?.status === 404) {
        return null;
      }
      // Handle network errors gracefully - return null instead of throwing
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || error?.message === 'Network Error') {
        console.warn('Network error fetching AI onboarding preferences - API may be unavailable');
        return null;
      }
      // For other errors, rethrow to let caller handle
      throw error;
    }
  },

  async updatePreferences(data: UpdateAIOnboardingDto): Promise<AIOnboardingPreferences> {
    try {
      const response = await apiClient.put('/ai/onboarding', data);
      return response.data?.data || response.data;
    } catch (error: any) {
      // Log the full error for debugging
      console.error('Update preferences error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        requestData: data,
      });
      throw error;
    }
  },
};

