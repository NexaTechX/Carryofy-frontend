import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SellerLayout from '../../../components/seller/SellerLayout';
import { tokenManager, userManager } from '../../../lib/auth';

interface OrderItem {
  id: string;
  productId: string;
  price: number;
  quantity: number;
  product?: {
    id: string;
    title: string;
    seller?: {
      id: string;
      businessName: string;
    };
  };
}

interface Delivery {
  id: string;
  status: string;
  rider?: string;
  eta?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  amount: number;
  status: string;
  paymentRef?: string;
  delivery?: Delivery;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      return;
    }

    // Fetch orders
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const token = tokenManager.getToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Handle both wrapped response (from TransformInterceptor) and direct array
        const ordersData = result.data || result;
        // Ensure it's always an array
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusDisplay = (order: Order) => {
    // If order has delivery info, use delivery status
    if (order.delivery) {
      const deliveryStatus = order.delivery.status;
      switch (deliveryStatus) {
        case 'PREPARING':
          return 'In Warehouse';
        case 'PICKED_UP':
        case 'IN_TRANSIT':
          return 'Out for Delivery';
        case 'DELIVERED':
          return 'Delivered';
        case 'ISSUE':
          return 'Issue';
        default:
          break;
      }
    }

    // Otherwise use order status
    switch (order.status) {
      case 'PENDING_PAYMENT':
        return 'Pending';
      case 'PAID':
        return 'Paid';
      case 'PROCESSING':
        return 'Processing';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELED':
        return 'Canceled';
      default:
        return order.status;
    }
  };

  const getCustomerName = (order: Order) => {
    // Sellers don't see customer PII, so we'll show a generic identifier
    if (order.user?.name) {
      return order.user.name;
    }
    // For sellers, show order ID or a generic customer reference
    return `Customer #${order.id.slice(0, 8)}`;
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter((order) => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        order.id.toLowerCase().includes(query) ||
        getCustomerName(order).toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        getStatusDisplay(order).toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        return order.status === 'PENDING_PAYMENT' || order.status === 'PAID' || order.status === 'PROCESSING';
      } else if (statusFilter === 'delivered') {
        return order.status === 'DELIVERED';
      } else if (statusFilter === 'cancelled') {
        return order.status === 'CANCELED';
      } else if (statusFilter === 'out_for_delivery') {
        return order.status === 'OUT_FOR_DELIVERY';
      }
    }

    return true;
  }) : [];

  return (
    <>
      <Head>
        <title>Orders - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="View and manage your orders on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Title Section */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Orders
            </p>
          </div>

          {/* Status Filter */}
          <div className="px-4 py-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All Orders' },
                { value: 'pending', label: 'Pending' },
                { value: 'out_for_delivery', label: 'Out for Delivery' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-[#ff6600] text-black'
                      : 'bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                <div className="text-[#ffcc99] flex border-none bg-[#1a1a1a] items-center justify-center pl-4 rounded-l-xl border-r-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search orders"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#1a1a1a] focus:border-none h-full placeholder:text-[#ffcc99] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                />
              </div>
            </label>
          </div>

          {/* Orders Table */}
          <div className="px-4 py-3">
            <div className="flex overflow-hidden rounded-xl border border-[#ff6600]/30 bg-black">
              <table className="flex-1">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-white w-60 text-sm font-medium leading-normal">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-white">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-white">
                        {searchQuery ? 'No orders found matching your search' : 'No orders found'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-t-[#ff6600]/30"
                      >
                        <td className="h-[72px] px-4 py-2 w-[400px] text-sm font-normal leading-normal">
                          <Link
                            href={`/seller/orders/${order.id}`}
                            className="text-[#ff6600] hover:text-[#cc5200] font-medium transition"
                          >
                            #{order.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="h-[72px] px-4 py-2 w-[400px] text-[#ffcc99] text-sm font-normal leading-normal">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="h-[72px] px-4 py-2 w-[400px] text-[#ffcc99] text-sm font-normal leading-normal">
                          {getCustomerName(order)}
                        </td>
                        <td className="h-[72px] px-4 py-2 w-[400px] text-[#ffcc99] text-sm font-normal leading-normal">
                          {formatPrice(order.amount)}
                        </td>
                        <td className="h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#1a1a1a] border border-[#ff6600]/30 text-white text-sm font-medium leading-normal w-full">
                            <span className="truncate">{getStatusDisplay(order)}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}

