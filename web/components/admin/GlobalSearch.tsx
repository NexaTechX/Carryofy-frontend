import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Search, X, Package, ShoppingCart, Truck, Users } from 'lucide-react';
import { useGlobalSearch } from '../../lib/admin/hooks/useGlobalSearch';
import { useDebounce } from '../../lib/hooks/useDebounce';

const NGN = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading } = useGlobalSearch(debouncedQuery, isOpen);

  const allResults = [
    ...(results?.sellers || []).map((item) => ({
      type: 'seller' as const,
      id: item.id,
      title: item.businessName,
      subtitle: item.email || item.kycStatus,
      href: `/admin/sellers`,
      icon: Users,
    })),
    ...(results?.orders || []).map((item) => ({
      type: 'order' as const,
      id: item.id,
      title: `Order #${item.id.slice(0, 8)}`,
      subtitle: `${NGN.format(item.amount / 100)} • ${item.status}`,
      href: `/admin/orders`,
      icon: ShoppingCart,
    })),
    ...(results?.products || []).map((item) => ({
      type: 'product' as const,
      id: item.id,
      title: item.title,
      subtitle: `${NGN.format(item.price / 100)} • ${item.seller?.businessName || 'Unknown'}`,
      href: `/admin/products`,
      icon: Package,
    })),
    ...(results?.deliveries || []).map((item) => ({
      type: 'delivery' as const,
      id: item.id,
      title: `Delivery for #${item.orderId.slice(0, 8)}`,
      subtitle: `${item.status} ${item.rider ? `• ${item.rider}` : ''}`,
      href: `/admin/deliveries`,
      icon: Truck,
    })),
  ];

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (result: typeof allResults[0]) => {
    router.push(result.href);
    onClose();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/30 text-primary">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
        <div className="overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-[#1f1f1f] px-4 py-3">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search sellers, orders, products, deliveries..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded-full p-1 text-gray-500 hover:bg-[#1a1a1a] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="rounded border border-[#2a2a2a] bg-[#151515] px-2 py-1 text-xs text-gray-500">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading && query.length >= 2 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : query.length < 2 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Type at least 2 characters to search
              </div>
            ) : allResults.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No results found for "{query}"
              </div>
            ) : (
              <div className="py-2">
                {allResults.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                        index === selectedIndex
                          ? 'bg-[#1a1a1a]'
                          : 'hover:bg-[#151515]'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          index === selectedIndex
                            ? 'bg-primary/20 text-primary'
                            : 'bg-[#1f1f1f] text-gray-500'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-white">
                          {highlightMatch(result.title, query)}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {highlightMatch(result.subtitle, query)}
                        </p>
                      </div>
                      <div className="rounded-full bg-[#1f1f1f] px-2 py-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                        {result.type}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#1f1f1f] px-4 py-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[#2a2a2a] bg-[#151515] px-1.5 py-0.5">↑</kbd>
                <kbd className="rounded border border-[#2a2a2a] bg-[#151515] px-1.5 py-0.5">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[#2a2a2a] bg-[#151515] px-1.5 py-0.5">↵</kbd>
                Select
              </span>
            </div>
            <span>{allResults.length} results</span>
          </div>
        </div>
      </div>
    </>
  );
}

