import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { useAuth, tokenManager } from '../../../lib/auth';
import { 
  Bell, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Settings,
  Trash2,
  Check,
  Filter,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: string; // Backend sends uppercase: ORDER, PRODUCT, PAYOUT, SYSTEM, KYC
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  action?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'order' | 'product' | 'payout' | 'system' | 'kyc'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Notification preferences
  const [preferences, setPreferences] = useState({
    email: {
      orders: true,
      products: true,
      payouts: true,
      system: true,
      kyc: true,
    },
    push: {
      orders: true,
      products: true,
      payouts: true,
      system: false,
      kyc: true,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check authentication
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch notifications and preferences
    fetchNotifications();
    fetchPreferences();
  }, [router, authLoading, isAuthenticated, user]);

  const fetchNotifications = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;
      
      try {
        const response = await fetch(`${apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          const notificationsData = result.data || result;
          setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
          setUnreadCount(Array.isArray(notificationsData) ? notificationsData.filter((n: Notification) => !n.read).length : 0);
        } else {
          // API returned an error status
          console.warn('Error fetching notifications:', response.statusText);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (fetchError) {
        // Network error or fetch failed (API server not running, CORS, etc.)
        console.warn('Failed to fetch notifications from API:', fetchError);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      // Any other error
      console.error('Error in fetchNotifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/notifications/${id}/mark-as-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/notifications/mark-as-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAllClick = () => {
    setShowClearConfirm(true);
  };

  const handleClearAllCancel = () => {
    setShowClearConfirm(false);
  };

  const clearAllNotifications = async () => {
    setShowClearConfirm(false);
    
    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('All notifications cleared');
      } else {
        toast.error('Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case 'order':
        return <ShoppingCart className="w-5 h-5" />;
      case 'product':
        return <Package className="w-5 h-5" />;
      case 'payout':
        return <DollarSign className="w-5 h-5" />;
      case 'kyc':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'system':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case 'order':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'product':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'payout':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'kyc':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'system':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fetchPreferences = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const preferencesData = result.data || result;
        if (preferencesData) {
          setPreferences({
            email: preferencesData.email || {
              orders: true,
              products: true,
              payouts: true,
              system: true,
              kyc: true,
            },
            push: preferencesData.push || {
              orders: true,
              products: true,
              payouts: true,
              system: false,
              kyc: true,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        toast.error('Please log in to save preferences');
        setSavingPreferences(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success('Notification preferences saved!');
        setShowPreferences(false);
      } else {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast.error(`Failed to save preferences: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSavingPreferences(false);
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#ffcc99]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render until auth check is complete
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Notifications - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="View and manage your notifications on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Title Section */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div>
              <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
                Notifications
              </p>
              <p className="text-[#ffcc99] text-sm font-normal leading-normal mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl text-sm font-medium hover:bg-[#ff6600]/10 hover:text-white transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl text-sm font-medium hover:bg-[#ff6600]/10 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                Preferences
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAllClick}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Clear All Confirmation */}
          {showClearConfirm && (
            <div className="px-4 py-3 mb-4">
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                <p className="text-white font-medium mb-4">Are you sure you want to clear all notifications?</p>
                <p className="text-[#ffcc99] text-sm mb-4">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={clearAllNotifications}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={handleClearAllCancel}
                    className="px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-lg text-sm font-medium hover:bg-[#ff6600]/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notification Preferences Panel */}
          {showPreferences && (
            <div className="px-4 py-3">
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg font-bold">Notification Preferences</h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="p-2 text-[#ffcc99] hover:text-white hover:bg-[#ff6600]/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h4 className="text-white font-semibold mb-4">Email Notifications</h4>
                    <div className="space-y-3">
                      {(['orders', 'products', 'payouts', 'system', 'kyc'] as const).map((type) => (
                        <div key={type} className="flex items-center justify-between">
                          <label className="text-[#ffcc99] text-sm capitalize">{type}</label>
                          <button
                            onClick={() => setPreferences({
                              ...preferences,
                              email: { ...preferences.email, [type]: !preferences.email[type] }
                            })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              preferences.email[type] ? 'bg-[#ff6600]' : 'bg-[#1a1a1a] border border-[#ff6600]/30'
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                preferences.email[type] ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div>
                    <h4 className="text-white font-semibold mb-4">Push Notifications</h4>
                    <div className="space-y-3">
                      {(['orders', 'products', 'payouts', 'system', 'kyc'] as const).map((type) => (
                        <div key={type} className="flex items-center justify-between">
                          <label className="text-[#ffcc99] text-sm capitalize">{type}</label>
                          <button
                            onClick={() => setPreferences({
                              ...preferences,
                              push: { ...preferences.push, [type]: !preferences.push[type] }
                            })}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              preferences.push[type] ? 'bg-[#ff6600]' : 'bg-[#1a1a1a] border border-[#ff6600]/30'
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                preferences.push[type] ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={savePreferences}
                    disabled={savingPreferences}
                    className="w-full px-6 py-3 bg-[#ff6600] text-black text-sm font-bold rounded-xl hover:bg-[#cc5200] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingPreferences ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {(['all', 'order', 'product', 'payout', 'kyc', 'system'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-[#ff6600] text-black'
                      : 'bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] hover:bg-[#ff6600]/10 hover:text-white'
                  }`}
                >
                  {filterType === 'all' && <Filter className="w-4 h-4" />}
                  {filterType !== 'all' && getNotificationIcon(filterType)}
                  <span className="capitalize">{filterType}</span>
                  {filterType !== 'all' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      filter === filterType ? 'bg-black/20' : 'bg-[#ff6600]/20'
                    }`}>
                      {notifications.filter(n => n.type === filterType).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="px-4 py-3">
            {loading ? (
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-8 text-center">
                <p className="text-white">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-12 text-center">
                <Bell className="w-16 h-16 text-[#ff6600]/30 mx-auto mb-4" />
                <p className="text-white text-lg font-semibold mb-2">No notifications</p>
                <p className="text-[#ffcc99] text-sm">
                  {filter === 'all' 
                    ? "You're all caught up! No notifications to display."
                    : `No ${filter} notifications to display.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-[#1a1a1a] border rounded-xl p-4 transition-all ${
                      notification.read
                        ? 'border-[#ff6600]/30'
                        : 'border-[#ff6600] bg-[#ff6600]/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg border ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold">{notification.title}</h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-[#ff6600] rounded-full"></span>
                              )}
                            </div>
                            <p className="text-[#ffcc99] text-sm mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-[#ffcc99] text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(notification.createdAt)}
                              </span>
                              {notification.link && notification.action && (
                                <Link
                                  href={notification.link}
                                  className="text-[#ff6600] text-xs font-medium hover:text-[#cc5200] transition-colors"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  {notification.action} →
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-[#ffcc99] hover:text-white hover:bg-[#ff6600]/10 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-[#ffcc99] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SellerLayout>
    </>
  );
}

