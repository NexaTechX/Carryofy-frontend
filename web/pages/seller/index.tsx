import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../components/seller/SellerLayout';
import DashboardStats from '../../components/seller/DashboardStats';
import SalesTrend from '../../components/seller/SalesTrend';
import OrderDistribution from '../../components/seller/OrderDistribution';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { tokenManager, userManager } from '../../lib/auth';

export default function SellerDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Dashboard - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="Seller dashboard for managing products, orders, and earnings on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Dashboard
            </p>
          </div>

          {/* Stats Cards */}
          <DashboardStats />

          {/* Charts */}
          <div className="flex flex-wrap gap-4 px-4 py-6">
            <SalesTrend />
            <OrderDistribution />
          </div>
        </div>

        {/* Floating Action Button */}
        <Link
          href="/seller/products/new"
          className="fixed bottom-6 right-6 bg-[#ff6600] hover:bg-[#cc5200] text-black px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 font-bold transition transform hover:scale-105 z-50"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </Link>
      </SellerLayout>
    </>
  );
}

