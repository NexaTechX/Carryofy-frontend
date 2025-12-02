import { useEffect, useState } from 'react';
import { tokenManager } from '../../lib/auth';

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
    <div className="flex min-w-72 flex-1 flex-col gap-4 rounded-xl border border-[#ff6600]/30 p-6">
      <div>
        <p className="text-white text-base font-medium leading-normal mb-2">Sales Trend</p>
        {loading ? (
          <div className="h-8 w-24 bg-[#1a1a1a] animate-pulse rounded"></div>
        ) : (
          <>
            <p className="text-white tracking-light text-[32px] font-bold leading-tight">
              {formatPrice(trendData?.totalSales || 0)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[#ffcc99] text-sm font-normal leading-normal">Last 30 Days</p>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                <span>{isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trendPercentage)}%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="h-32 bg-[#1a1a1a] animate-pulse rounded"></div>
      ) : trendData && trendData.trend.length > 0 ? (
        <div className="relative h-32">
          <svg
            viewBox="0 0 400 80"
            className="w-full h-full"
            preserveAspectRatio="none"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ff6600', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#ff6600', stopOpacity: 0 }} />
              </linearGradient>
            </defs>

            {/* Area under the line */}
            <polygon
              points={`0,80 ${getSparklinePoints()} 400,80`}
              fill="url(#salesGradient)"
            />

            {/* Line */}
            <polyline
              points={getSparklinePoints()}
              fill="none"
              stroke="#ff6600"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Dots on data points */}
            {trendData.trend.map((point, index) => {
              const data = trendData.trend;
              const maxAmount = Math.max(...data.map(d => d.amount), 1);
              const width = 400;
              const height = 80;
              const padding = 10;
              const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
              const y = height - padding - ((point.amount / maxAmount) * (height - 2 * padding));

              // Only show dots for every 5th point to avoid clutter
              if (index % 5 === 0 || index === data.length - 1) {
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#ff6600"
                    stroke="#000"
                    strokeWidth="1"
                  />
                );
              }
              return null;
            })}
          </svg>

          {/* Labels */}
          <div className="flex justify-between mt-2 px-2">
            <span className="text-[#ffcc99] text-xs">
              {trendData.trend[0]?.date ? new Date(trendData.trend[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </span>
            <span className="text-[#ffcc99] text-xs">
              {trendData.trend[Math.floor(trendData.trend.length / 2)]?.date ?
                new Date(trendData.trend[Math.floor(trendData.trend.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </span>
            <span className="text-[#ffcc99] text-xs">
              {trendData.trend[trendData.trend.length - 1]?.date ?
                new Date(trendData.trend[trendData.trend.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center text-[#ffcc99] py-8">
          <p>No sales data available</p>
        </div>
      )}

      {!loading && trendData && (
        <div className="flex items-center justify-between text-sm pt-2 border-t border-[#ff6600]/20">
          <span className="text-[#ffcc99]">Total Orders</span>
          <span className="text-white font-bold">{trendData.totalOrders}</span>
        </div>
      )}
    </div>
  );
}

