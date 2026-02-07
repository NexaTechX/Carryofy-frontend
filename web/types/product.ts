/**
 * Product-related TypeScript types matching backend API DTOs
 */

export enum ProductStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    category: string;
    images: string[];
    tags?: string[];
    status: ProductStatus;
    sellerId: string;
    seller?: {
        id: string;
        businessName: string;
        email: string;
    };
    sellingMode?: 'B2C_ONLY' | 'B2B_ONLY' | 'BOTH';
    moq?: number;
    averageRating?: number;
    reviewCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProductQuery {
    page?: number;
    limit?: number;
    category?: string;
    status?: ProductStatus;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerId?: string;
    tags?: string[];
}

export interface ProductListResponse {
    data: Product[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ProductResponse {
    data: Product;
}

export interface Review {
    id: string;
    rating: number;
    comment: string;
    buyerId: string;
    productId: string;
    buyer?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateReviewDto {
    rating: number;
    comment: string;
}
