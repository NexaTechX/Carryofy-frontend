import { useState, useMemo } from 'react';
import { Search, X, Package, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';
import type { BroadcastProductOption } from '../../../lib/admin/types';
import { fetchBroadcastProducts } from '../../../lib/admin/api';
import { useQuery } from '@tanstack/react-query';
import { useAdminCategories } from '../../../lib/admin/hooks/useCategories';
import { LoadingState } from '../ui';

interface ProductSelectorProps {
  selected: string[];
  onSelect: (productIds: string[]) => void;
  autoAttachDays?: number;
  onAutoAttachDaysChange?: (days: number | undefined) => void;
}

export default function ProductSelector({
  selected,
  onSelect,
  autoAttachDays,
  onAutoAttachDaysChange,
}: ProductSelectorProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const { data: categoriesData } = useAdminCategories();
  const categories = categoriesData?.categories || [];

  const { data: products = [], isLoading } = useQuery<BroadcastProductOption[]>({
    queryKey: ['admin', 'broadcast', 'products', categoryFilter, autoAttachDays],
    queryFn: () => fetchBroadcastProducts(100, categoryFilter || undefined, autoAttachDays),
  });

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, search]);

  const toggleProduct = (id: string) => {
    if (selected.includes(id)) {
      onSelect(selected.filter((p) => p !== id));
    } else {
      onSelect([...selected, id]);
    }
  };

  const selectAllVisible = () => {
    const visibleIds = filteredProducts.map((p) => p.id);
    onSelect([...new Set([...selected, ...visibleIds])]);
  };

  const deselectAll = () => {
    onSelect([]);
  };

  return (
    <div className="space-y-4">
      {/* Auto-attach option */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
        <div>
          <label className="text-sm font-medium text-gray-300">Auto-attach newly approved products</label>
          <p className="text-xs text-gray-500 mt-0.5">Automatically include products approved in the last X days</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Days"
            value={autoAttachDays || ''}
            onChange={(e) => {
              const days = e.target.value ? parseInt(e.target.value, 10) : undefined;
              onAutoAttachDaysChange?.(days);
            }}
            className="w-20 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-primary/50 focus:outline-none"
          />
          <span className="text-xs text-gray-500">days</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:border-primary/50 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-gray-200 focus:border-primary/50 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={selectAllVisible}
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            Select all visible
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            Deselect all
          </button>
        </div>
        {selected.length > 0 && (
          <span className="flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Product list */}
      {isLoading ? (
        <LoadingState label="Loading products…" />
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-10 text-center">
          <Package className="mb-2 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-500">
            {search ? 'No products match your search.' : 'No products found.'}
          </p>
        </div>
      ) : (
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
          {filteredProducts.map((product) => {
            const isSelected = selected.includes(product.id);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => toggleProduct(product.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                  isSelected
                    ? 'border-primary/30 bg-primary/[0.06]'
                    : 'border-transparent hover:bg-white/[0.04]'
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 flex-shrink-0 text-primary" />
                ) : (
                  <Square className="h-4 w-4 flex-shrink-0 text-gray-600" />
                )}
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.05]">
                    <ImageIcon className="h-5 w-5 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isSelected ? 'font-medium text-white' : 'text-gray-300'}`}>
                    {product.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                    {product.price && (
                      <span>₦{(product.price / 100).toLocaleString()}</span>
                    )}
                    {product.categoryName && (
                      <>
                        <span>•</span>
                        <span>{product.categoryName}</span>
                      </>
                    )}
                    {product.quantity !== undefined && (
                      <>
                        <span>•</span>
                        <span>Stock: {product.quantity}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
