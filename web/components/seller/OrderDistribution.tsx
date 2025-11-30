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
    // Ensure minimum visibility for non-zero values
    if (percentage === 0) return '0%';
    return `${Math.max(percentage, 5)}%`;
  };

  return (
    <div className="flex min-w-72 flex-1 flex-col gap-4 rounded-xl border border-[#ff6600]/30 p-6">
      <div>
        <p className="text-white text-base font-medium leading-normal mb-2">Order Distribution</p>
        {loading ? (
          <div className="h-8 w-24 bg-[#1a1a1a] animate-pulse rounded"></div>
        ) : (
          <>
            <p className="text-white tracking-light text-[32px] font-bold leading-tight">
              {distributionData?.total || 0}
            </p>
            <p className="text-[#ffcc99] text-sm font-normal leading-normal">Total Orders</p>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-[#1a1a1a] animate-pulse rounded"></div>
              <div className="h-8 bg-[#1a1a1a] animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      ) : distributionData ? (
        <div className="space-y-4">
          {distributionData.distribution.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white font-medium">{item.status}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#ffcc99]">{item.count}</span>
                  <span className="text-[#ff6600] font-bold">{item.percentage}%</span>
                </div>
              </div>
              <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff6600] to-[#ff9933] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-[#ffcc99] py-8">
          <p>No order data available</p>
        </div>
      )}
    </div>
  );
}

