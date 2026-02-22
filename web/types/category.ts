/**
 * Category-related TypeScript types (shared across admin/buyer)
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  displayOrder: number;
  commissionB2C?: number;
  commissionB2B?: number | null;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CategoriesResponse {
  categories: Category[];
}
