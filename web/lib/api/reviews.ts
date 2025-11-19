import apiClient from './client';

export interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
}

export const reviewsApi = {
  async getProductReviews(productId: string): Promise<Review[]> {
    const response = await apiClient.get<Review[]>(`/products/${productId}/reviews`);
    const data = response.data as any;
    return data?.data ?? data ?? [];
  },

  async createProductReview(productId: string, payload: CreateReviewPayload): Promise<Review> {
    const response = await apiClient.post<Review>(`/products/${productId}/reviews`, payload);
    const data = response.data as any;
    return data?.data ?? data;
  },
};
