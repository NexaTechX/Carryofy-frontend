'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, X } from 'lucide-react';
import apiClient from '../../lib/api/client';
import { tokenManager } from '../../lib/auth';

export interface RestockSuggestion {
  id: string;
  productName: string;
  productId?: string | null;
  sellerId: string;
  sellerName: string;
  reason: string;
  predictedDate: string;
  dismissed: boolean;
}

async function fetchRestockSuggestions(): Promise<RestockSuggestion[]> {
  const res = await apiClient.get('/restock/suggestions');
  const data = (res.data as { data?: RestockSuggestion[] })?.data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export default function RestockSuggestionCard() {
  const queryClient = useQueryClient();
  const isAuthenticated = tokenManager.isAuthenticated();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['restock-suggestions'],
    queryFn: fetchRestockSuggestions,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/restock/suggestions/${id}/dismiss`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['restock-suggestions'] });
    },
  });

  if (!isAuthenticated || isLoading || suggestions.length === 0) {
    return null;
  }

  const suggestion = suggestions[0];

  return (
    <section className="mb-6 rounded-2xl border border-[#FF6B00]/30 bg-gradient-to-br from-[#FF6B00]/10 to-[#1a1a1a] p-5 shadow-lg">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-[#FF6B00]" aria-hidden />
          <h2 className="text-lg font-semibold text-white">Time to Restock?</h2>
        </div>
        <button
          type="button"
          onClick={() => dismissMutation.mutate(suggestion.id)}
          disabled={dismissMutation.isPending}
          className="rounded-lg p-1.5 text-[#ffcc99]/60 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Dismiss suggestion"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <p className="text-sm text-[#ffcc99]/90 leading-relaxed mb-3">{suggestion.reason}</p>
      <p className="text-sm text-white/80 mb-4">
        Vendor: <span className="font-medium text-[#FF6B00]">{suggestion.sellerName}</span> has stock
        available
      </p>

      <footer className="flex flex-wrap gap-3">
        <Link
          href={`/buyer/products?seller=${suggestion.sellerId}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#ff8800] transition-colors"
        >
          Order Now
        </Link>
        {suggestion.productId && (
          <Link
            href={`/buyer/quote-request?productId=${suggestion.productId}&sellerId=${suggestion.sellerId}&quantity=1`}
            className="inline-flex items-center justify-center rounded-xl border border-[#FF6B00]/40 px-4 py-2.5 text-sm font-medium text-[#ffcc99] hover:bg-[#FF6B00]/10 transition-colors"
          >
            Restock with quote
          </Link>
        )}
        <button
          type="button"
          onClick={() => dismissMutation.mutate(suggestion.id)}
          disabled={dismissMutation.isPending}
          className="inline-flex items-center justify-center rounded-xl border border-[#2a2a2a] px-4 py-2.5 text-sm font-medium text-[#ffcc99] hover:border-[#FF6B00]/40 transition-colors"
        >
          Dismiss
        </button>
      </footer>
    </section>
  );
}
