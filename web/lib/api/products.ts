/**
 * Products API Service
 * Handles all product-related API calls
 */

import apiClient from './client';
import { isApiConnectionError } from './utils';
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

/** Unwrap Nest transform interceptor + ProductListResponseDto shapes */
export function unwrapProductListPayload(payload: unknown): Record<string, unknown>[] {
    if (!payload || typeof payload !== 'object') return [];
    const root = payload as Record<string, unknown>;
    const nested = root.data;

    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const bag = nested as Record<string, unknown>;
        if (Array.isArray(bag.products)) {
            return bag.products as Record<string, unknown>[];
        }
    }
    if (Array.isArray(root.products)) {
        return root.products as Record<string, unknown>[];
    }
    if (Array.isArray(nested)) {
        return nested as Record<string, unknown>[];
    }
    if (Array.isArray(root.data)) {
        return root.data as Record<string, unknown>[];
    }
    return [];
}

function normalizeCatalogProduct(raw: Record<string, unknown>): Product {
    const title = (raw.title as string) || (raw.name as string) || 'Product';
    const qty = (raw.quantity as number) ?? (raw.stockQuantity as number) ?? 0;
    const base = raw as unknown as Product;
    return {
        ...base,
        id: String(raw.id),
        name: title,
        price: Number(raw.price) || 0,
        stockQuantity: qty,
        images: Array.isArray(raw.images) ? (raw.images as string[]) : base.images ?? [],
        category: (raw.category as string) || base.category || '',
        status: (raw.status as Product['status']) || base.status,
    };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET that retries only on connection/network errors (e.g. API cold start or watch-mode
 * recompile dropping the port). Real HTTP errors (4xx/5xx) are thrown immediately.
 */
async function getWithNetworkRetry(url: string, retries = 2, backoffMs = 600) {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await apiClient.get(url);
        } catch (error) {
            if (attempt >= retries || !isApiConnectionError(error)) throw error;
            await sleep(backoffMs * (attempt + 1));
            attempt += 1;
        }
    }
}

/**
 * Featured / landing catalogue — all selling modes (B2C, B2B, both), public GET.
 */
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
        const params = new URLSearchParams({
            page: '1',
            limit: String(limit),
            sortBy: 'newest',
            inStockOnly: 'false',
        });

        const response = await getWithNetworkRetry(`/products?${params.toString()}`);
        const rows = unwrapProductListPayload(response.data);

        if (rows.length > 0) {
            return rows.map((row) => normalizeCatalogProduct(row));
        }

        // Fallback: legacy getProducts path
        const legacy = await getProducts({ limit, page: 1 });
        const legacyRows = unwrapProductListPayload(legacy);
        return legacyRows.map((row) => normalizeCatalogProduct(row));
    } catch (error: unknown) {
        console.error('Error fetching featured products:', error);
        return [];
    }
}
