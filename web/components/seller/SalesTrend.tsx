import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tokenManager } from '../../lib/auth';
import { TrendingUp } from 'lucide-react';

interface TrendData {
  date: string;
  amount: number;
}

interface SalesTrendResponse {
  trend: TrendData[];
  totalSales: number;
  totalOrders: number;
  period: string;
}

export default function SalesTrend() {
  const [trendData, setTrendData] = useState<SalesTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesTrend();
  }, []);

  const fetchSalesTrend = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/reports/sales-trend`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setTrendData(data);
      }
    } catch (error) {
      console.error('Error fetching sales trend:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toFixed(2)}`;
  };

  const calculateTrendPercentage = () => {
    if (!trendData || trendData.trend.length < 2) return 0;

    const recentDays = trendData.trend.slice(-7);
    const previousDays = trendData.trend.slice(-14, -7);

    const recentSum = recentDays.reduce((sum, day) => sum + day.amount, 0);
    const previousSum = previousDays.reduce((sum, day) => sum + day.amount, 0);

    if (previousSum === 0) return recentSum > 0 ? 100 : 0;

    return Math.round(((recentSum - previousSum) / previousSum) * 100);
  };

  const trendPercentage = calculateTrendPercentage();
  const isPositive = trendPercentage >= 0;

  const getSparklinePoints = () => {
    if (!trendData || trendData.trend.length === 0) return '';

    const data = trendData.trend;
    const maxAmount = Math.max(...data.map(d => d.amount), 1);
    const width = 400;
    const height = 80;
    const padding = 10;

    return data.map((point, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((point.amount / maxAmount) * (height - 2 * padding));
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="flex min-w-72 flex-1 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <p className="mb-2 text-base font-medium text-gray-900">Sales trend</p>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-gray-100"></div>
        ) : (
          <>
            <p className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              {formatPrice(trendData?.totalSales || 0)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-gray-500">Last 30 days</p>
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                <span>{isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trendPercentage)}%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded bg-gray-100"></div>
      ) : !trendData || trendData.totalOrders === 0 || trendData.trend.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 px-6 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
            <TrendingUp className="h-8 w-8 text-orange-500" strokeWidth={1.5} />
          </div>
          <p className="text-center text-sm font-medium text-gray-500">No sales yet</p>
          <p className="max-w-[280px] text-center text-xs text-gray-400">
            Your sales trend will appear here once you receive your first order
          </p>
          <Link
            href="/seller/products/new"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
          >
            Add your first product →
          </Link>
        </div>
      ) : trendData && trendData.trend.length > 0 ? (
        <div className="relative h-32">
          <svg
            viewBox="0 0 400 80"
            className="h-full w-full"
            preserveAspectRatio="none"
            style={{ pointerEvents: 'none' }}
          >
            <polyline
              points={getSparklinePoints()}
              fill="none"
              stroke="#F97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {trendData.trend.map((point, index) => {
              const data = trendData.trend;
              const maxAmount = Math.max(...data.map((d) => d.amount), 1);
              const width = 400;
              const height = 80;
              const padding = 10;
              const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
              const y = height - padding - (point.amount / maxAmount) * (height - 2 * padding);

              if (index % 5 === 0 || index === data.length - 1) {
                return (
                  <circle key={index} cx={x} cy={y} r="3" fill="#F97316" stroke="#fff" strokeWidth="1" />
                );
              }
              return null;
            })}
          </svg>

          <div className="mt-2 flex justify-between px-2">
            <span className="text-xs text-gray-400">
              {trendData.trend[0]?.date
                ? new Date(trendData.trend[0].date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : ''}
            </span>
            <span className="text-xs text-gray-400">
              {trendData.trend[Math.floor(trendData.trend.length / 2)]?.date
                ? new Date(trendData.trend[Math.floor(trendData.trend.length / 2)].date).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric' },
                  )
                : ''}
            </span>
            <span className="text-xs text-gray-400">
              {trendData.trend[trendData.trend.length - 1]?.date
                ? new Date(trendData.trend[trendData.trend.length - 1].date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : ''}
            </span>
          </div>
        </div>
      ) : null}

      {!loading && trendData && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
          <span className="text-gray-500">Total orders</span>
          <span className="font-semibold text-gray-900">{trendData.totalOrders}</span>
        </div>
      )}
    </div>
  );
}

