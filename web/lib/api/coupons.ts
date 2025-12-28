import apiClient from './client';

export interface ValidateCouponDto {
  code: string;
  orderAmount: number;
}

export interface CouponValidationResponse {
  valid: boolean;
  discountAmount: number;
  message?: string;
  code?: string;
}

/**
 * Validate coupon code
 */
export async function validateCoupon(data: ValidateCouponDto): Promise<CouponValidationResponse> {
  try {
    const response = await apiClient.post<CouponValidationResponse | { data: CouponValidationResponse }>('/coupons/validate', data);
    const responseData = response.data;
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data;
    }
    return responseData as CouponValidationResponse;
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    throw error;
  }
}

