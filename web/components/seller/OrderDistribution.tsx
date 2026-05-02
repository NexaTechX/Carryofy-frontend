import { useEffect, useState } from 'react';
import { tokenManager } from '../../lib/auth';

interface DistributionItem {
  status: string;
  count: number;
  percentage: number;
}

interface OrderDistributionResponse {
  distribution: DistributionItem[];
  total: number;
}

export default function OrderDistribution() {
  const [distributionData, setDistributionData] = useState<OrderDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDistribution();
  }, []);

  const fetchOrderDistribution = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/reports/order-distribution`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setDistributionData(data);
      }
    } catch (error) {
      console.error('Error fetching order distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarHeight = (percentage: number) => {
    if (percentage === 0) return '0%';
    return `${Math.max(percentage, 5)}%`;
  };

  return (
    <div className="flex min-w-72 flex-1 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <p className="mb-2 text-base font-medium text-gray-900">Order distribution</p>
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-gray-100"></div>
        ) : (
          <>
            <p className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              {distributionData?.total || 0}
            </p>
            <p className="text-sm text-gray-500">Total orders</p>
          </>
        )}
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100"></div>
              <div className="h-8 animate-pulse rounded bg-gray-100"></div>
            </div>
          ))}
        </div>
      ) : distributionData ? (
        <div className="space-y-4">
          {distributionData.total === 0 ||
          !distributionData.distribution?.length ||
          distributionData.distribution.every((d) => d.count === 0) ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Awaiting first order</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gray-200" style={{ width: '100%' }} />
              </div>
            </div>
          ) : (
            distributionData.distribution.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{item.status}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{item.count}</span>
                    <span className="font-semibold text-orange-600">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500 ease-out"
                    style={{ width: getBarHeight(item.percentage) }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-gray-400">
          <p>No order data available</p>
        </div>
      )}
    </div>
  );
}
