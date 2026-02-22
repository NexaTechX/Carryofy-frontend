'use client';

import { Package, Search } from 'lucide-react';
import Link from 'next/link';

interface EmptyShopStateProps {
  onBrowseCategories?: () => void;
}

export default function EmptyShopState({ onBrowseCategories }: EmptyShopStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Illustration */}
      <div className="relative w-48 h-48 mb-6">
        <div className="absolute inset-0 rounded-full bg-[#1A1A1A] border-2 border-[#2a2a2a] flex items-center justify-center">
          <Package className="w-20 h-20 text-[#ffcc99]/30" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-[#1A1A1A] border-2 border-[#2a2a2a] flex items-center justify-center">
          <Search className="w-8 h-8 text-[#ffcc99]/20" />
        </div>
      </div>

      <h3 className="text-white text-xl font-bold mb-2">No products found</h3>
      <p className="text-[#ffcc99]/70 text-sm mb-6 max-w-sm">
        Try adjusting your filters or search query. Browse other categories to discover more products.
      </p>

      <Link
        href="/buyer/products"
        onClick={onBrowseCategories}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-black font-bold rounded-xl hover:bg-[#ff9955] transition-colors"
      >
        Browse other categories
      </Link>
    </div>
  );
}
