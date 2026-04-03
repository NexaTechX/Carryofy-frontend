'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';

interface Row {
  categoryName: string;
  b2c: number;
  b2b: number | null;
}

// SECTION 4.1 — resolved: seller-visible category commissions from listed products
export default function SellerCommissionRates({ sellerId }: { sellerId: string | null }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('/products', { params: { sellerId, limit: 200, page: 1 } })
      .then((res) => {
        if (cancelled) return;
        const raw = res.data as { data?: { products?: unknown[] }; products?: unknown[] };
        const body = raw.data ?? raw;
        const products = (body as { products?: unknown[] })?.products ?? [];
        const byCat = new Map<string, Row>();
        for (const p of products as {
          categoryRel?: {
            id?: string;
            name?: string;
            commissionB2C?: number;
            commissionB2B?: number | null;
          };
        }[]) {
          const rel = p.categoryRel;
          if (!rel?.id || !rel.name) continue;
          if (byCat.has(rel.id)) continue;
          byCat.set(rel.id, {
            categoryName: rel.name,
            b2c: Number(rel.commissionB2C ?? 0),
            b2b: rel.commissionB2B != null ? Number(rel.commissionB2B) : null,
          });
        }
        setRows(
          [...byCat.values()].sort((a, b) =>
            a.categoryName.localeCompare(b.categoryName),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  if (!sellerId) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-[#ffcc99]/80 text-sm">
        Loading commission info…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-[#ffcc99]/80 text-sm">
        List products in a category to see Carryofy&apos;s commission rate for that category.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#ff6600]/30 bg-[#1A1A1A] p-5">
      <h2 className="text-lg font-bold text-white mb-2">Commission by category</h2>
      <p className="text-sm text-[#ffcc99]/90 mb-4">
        Carryofy earns the percentage shown on sales in each category — you keep the rest after delivery fees and applicable taxes.
      </p>
      <ul className="space-y-2 text-sm text-[#ffcc99]">
        {rows.map((r) => (
          <li key={r.categoryName} className="flex flex-wrap justify-between gap-2 border-b border-[#2A2A2A]/80 pb-2 last:border-0">
            <span className="text-white font-medium">{r.categoryName}</span>
            <span>
              Retail {r.b2c.toFixed(1)}%
              {r.b2b != null ? ` · Wholesale ${r.b2b.toFixed(1)}%` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
