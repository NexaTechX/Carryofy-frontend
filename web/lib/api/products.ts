/**
 * Products API Service
 * Handles all product-related API calls
 */

import apiClient from './client';
import {
    Product,
    ProductQuery,
    ProductListResponse,
    ProductResponse,
    Review,
    CreateReviewDto,
} from '../../types/product';

/**
 * Get all products with optional filters
 */
export async function getProducts(query?: ProductQuery): Promise<ProductListResponse> {
    try {
        const params = new URLSearchParams();

        if (query) {
            if (query.page) params.append('page', query.page.toString());
            if (query.limit) params.append('limit', query.limit.toString());
            if (query.category) params.append('category', query.category);
            if (query.status) params.append('status', query.status);
            if (query.search) params.append('search', query.search);
            if (query.minPrice) params.append('minPrice', query.minPrice.toString());
            if (query.maxPrice) params.append('maxPrice', query.maxPrice.toString());
            if (query.sellerId) params.append('sellerId', query.sellerId);
        }

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await apiClient.get<ProductListResponse>(`/products${queryString}`);

        return response.data;
    } catch (error: any) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

/**
 * Get a single product by ID
 */
export async function getProductById(productId: string): Promise<Product> {
    try {
        const response = await apiClient.get<ProductResponse>(`/products/${productId}`);
        return response.data.data;
    } catch (error: any) {
        console.error(`Error fetching product ${productId}:`, error);
        throw error;
    }
}

/**
 * Get reviews for a product
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
    try {
        const response = await apiClient.get<Review[]>(`/products/${productId}/reviews`);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching reviews for product ${productId}:`, error);
        throw error;
    }
}

/**
 * Create a review for a product (authenticated buyers only)
 */
export async function createProductReview(
    productId: string,
    reviewData: CreateReviewDto
): Promise<Review> {
    try {
        const response = await apiClient.post<Review>(
            `/products/${productId}/reviews`,
            reviewData
        );
        return response.data;
    } catch (error: any) {
        console.error(`Error creating review for product ${productId}:`, error);
        throw error;
    }
}

/**
 * Get featured products for landing page
 * Fetches approved products with limit
 */
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
        const response = await getProducts({
            status: 'ACTIVE' as any, // ProductStatus.ACTIVE (backend uses ACTIVE, not APPROVED)
            limit,
            page: 1,
        });

        // API may return { data: [] } or { products: [] }
        const products = response.data ?? (response as any).products ?? [];
        return Array.isArray(products) ? products : [];
    } catch (error: any) {
        console.error('Error fetching featured products:', error);
        // Return empty array on error for graceful degradation
        return [];
    }
}
