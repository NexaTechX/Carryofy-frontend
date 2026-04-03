'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../lib/api/utils';

// SECTION 3.3 — resolved: live category commission table from public API
interface CategoryRow {
  id: string;
  name: string;
  isActive: boolean;
  commissionB2C: number;
  commissionB2B: number | null;
}

export default function MerchantCategoryCommissions() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${getApiBaseUrl()}/categories`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        const raw = body?.data ?? body;
        const list = raw?.categories ?? raw;
        if (!Array.isArray(list)) {
          setRows([]);
          return;
        }
        setRows(
          list
            .filter((c: CategoryRow) => c.isActive)
            .sort(
              (a: CategoryRow, b: CategoryRow) =>
                (a.name || '').localeCompare(b.name || ''),
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
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">Loading category rates…</p>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-semibold">
          <tr>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Retail (D2C) %</th>
            <th className="px-4 py-3">Wholesale (B2B) %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50/80">
              <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
              <td className="px-4 py-3">{Number(c.commissionB2C).toFixed(1)}%</td>
              <td className="px-4 py-3">
                {c.commissionB2B != null
                  ? `${Number(c.commissionB2B).toFixed(1)}%`
                  : `Same as retail (${Number(c.commissionB2C).toFixed(1)}%)`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
