import { useEffect, useState } from 'react';
import { tokenManager } from '../../lib/auth';

interface StatCardProps {
  title: string;
  value: string;
  loading?: boolean;
}

function StatCard({ title, value, loading }: StatCardProps) {
  return (
    <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-[#ff6600]/30">
      <p className="text-white text-base font-medium leading-normal">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-[#1a1a1a] animate-pulse rounded"></div>
      ) : (
        <p className="text-white tracking-light text-2xl font-bold leading-tight">{value}</p>
      )}
    </div>
  );
}

interface DashboardKPIs {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/reports/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setStats({
          totalProducts: data.totalProducts || 0,
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toFixed(2)}`;
  };

  return (
    <div className="flex flex-wrap gap-4 p-4">
      <StatCard
        title="Total Products"
        value={stats ? stats.totalProducts.toString() : '0'}
        loading={loading}
      />
      <StatCard
        title="Total Orders"
        value={stats ? stats.totalOrders.toString() : '0'}
        loading={loading}
      />
      <StatCard
        title="Total Revenue"
        value={stats ? formatPrice(stats.totalRevenue) : '₦0.00'}
        loading={loading}
      />
    </div>
  );
}

