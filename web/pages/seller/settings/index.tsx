import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { tokenManager, userManager } from '../../../lib/auth';
import { User, Building2, Shield, Bell, LogOut, Save, Eye, EyeOff, CheckCircle2, XCircle, Clock, CreditCard, Plus, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'payout' | 'security' | 'notifications'>('profile');
  
  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
  });
  
  // Business state
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
  });
  
  // Payout Account state
  const [bankAccount, setBankAccount] = useState<{
    id?: string;
    accountName: string;
    accountNumber: string;
    bankCode: string;
    bankName: string;
  } | null>(null);
  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNumber: '',
    bankCode: '',
    bankName: '',
  });
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Security state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Nigerian Banks list (common banks for Paystack)
  const nigerianBanks = [
    { code: '044', name: 'Access Bank' },
    { code: '063', name: 'Access Bank (Diamond)' },
    { code: '050', name: 'Ecobank Nigeria' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '526', name: 'Parallex Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '101', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'Suntrust Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '033', name: 'United Bank For Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' },
  ];

  useEffect(() => {
    setMounted(true);
    
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

    // Fetch profiles (non-blocking - page structure renders immediately)
    fetchProfiles();
  }, [router]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://carryofyapi.vercel.app';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      // Fetch user profile
      try {
        const userResponse = await fetch(`${apiUrl}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userResponse.ok) {
          const userResult = await userResponse.json();
          const userData = userResult.data || userResult;
          setUserProfile(userData);
          setProfileForm({
            name: userData.name || '',
            phone: userData.phone || '',
          });
        } else {
          console.warn('Failed to fetch user profile:', userResponse.statusText);
        }
      } catch (fetchError) {
        console.warn('Network error fetching user profile:', fetchError);
      }

      // Fetch seller profile
      try {
        const sellerResponse = await fetch(`${apiUrl}/sellers/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (sellerResponse.ok) {
          const sellerResult = await sellerResponse.json();
          const sellerData = sellerResult.data || sellerResult;
          setSellerProfile(sellerData);
          setBusinessForm({
            businessName: sellerData.businessName || '',
          });
        } else {
          console.warn('Failed to fetch seller profile:', sellerResponse.statusText);
        }
      } catch (fetchError) {
        console.warn('Network error fetching seller profile:', fetchError);
      }

      // Fetch bank account
      try {
        const bankResponse = await fetch(`${apiUrl}/sellers/me/bank-account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (bankResponse.ok) {
          const bankResult = await bankResponse.json();
          const bankData = bankResult.data || bankResult;
          setBankAccount(bankData);
        } else if (bankResponse.status === 404) {
          // No bank account yet - this is fine
          setBankAccount(null);
        } else {
          console.warn('Error fetching bank account:', bankResponse.statusText);
        }
      } catch (fetchError) {
        console.warn('Network error fetching bank account:', fetchError);
      }
    } catch (error) {
      console.error('Error in fetchProfiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://carryofyapi.vercel.app';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedData = result.data || result;
        setUserProfile(updatedData);
        const currentUser = userManager.getUser();
        if (currentUser) {
          userManager.setUser({ ...currentUser, name: updatedData.name });
        }
        toast.success('Profile updated successfully!');
      } else {
        const error = await response.json();
        toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://carryofyapi.vercel.app';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/sellers/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(businessForm),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedData = result.data || result;
        setSellerProfile(updatedData);
        toast.success('Business information updated successfully!');
      } else {
        const error = await response.json();
        toast.error(`Failed to update business information: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating business information:', error);
      toast.error('Failed to update business information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);

    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://carryofyapi.vercel.app';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/users/me/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        toast.error(`Failed to change password: ${error.message || 'Current password is incorrect'}`);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    tokenManager.clearTokens();
    userManager.clearUser();
    router.push('/auth/login');
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'payout', label: 'Payout Account', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleBankAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        toast.error('Please log in to save bank account information.');
        setSaving(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://carryofyapi.vercel.app';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      try {
        const response = await fetch(`${apiUrl}/sellers/me/bank-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bankForm),
        });

        if (response.ok) {
          const result = await response.json();
          const bankData = result.data || result;
          setBankAccount(bankData);
          setIsAddingBank(false);
          toast.success('Bank account saved successfully!');
          
          // Reset form
          setBankForm({
            accountName: '',
            accountNumber: '',
            bankCode: '',
            bankName: '',
          });
        } else {
          // Try to parse error message
          try {
            const error = await response.json();
            const errorMessage = error.message || error.error || 'Unknown error';
            toast.error(`Failed to save bank account: ${errorMessage}`);
          } catch (parseError) {
            toast.error(`Failed to save bank account: ${response.status} ${response.statusText}`);
          }
        }
      } catch (fetchError: any) {
        // Network error (API server not running, CORS, etc.)
        console.error('Network error saving bank account:', fetchError);
        if (fetchError.message && fetchError.message.includes('fetch')) {
          toast.error('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          toast.error('Failed to save bank account. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleBankAccountSave:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBankAccountDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleBankAccountDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleBankAccountDelete = async () => {
    setShowDeleteConfirm(false);
    setSaving(true);
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        toast.error('Please log in to remove bank account information.');
        setSaving(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://carryofyapi.vercel.app';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      try {
        const response = await fetch(`${apiUrl}/sellers/me/bank-account`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setBankAccount(null);
          setIsAddingBank(false);
          toast.success('Bank account removed successfully!');
        } else {
          // Try to parse error message
          try {
            const error = await response.json();
            const errorMessage = error.message || error.error || 'Unknown error';
            toast.error(`Failed to remove bank account: ${errorMessage}`);
          } catch (parseError) {
            toast.error(`Failed to remove bank account: ${response.status} ${response.statusText}`);
          }
        }
      } catch (fetchError: any) {
        // Network error (API server not running, CORS, etc.)
        console.error('Network error deleting bank account:', fetchError);
        if (fetchError.message && fetchError.message.includes('fetch')) {
          toast.error('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          toast.error('Failed to remove bank account. Please check your connection and try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleBankAccountDelete:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBank = nigerianBanks.find(bank => bank.code === e.target.value);
    if (selectedBank) {
      setBankForm({
        ...bankForm,
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
      });
    }
  };

  return (
    <>
      <Head>
        <title>Settings - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="Manage your account settings on Carryofy."
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
                Settings
              </p>
              <p className="text-[#ffcc99] text-sm font-normal leading-normal mt-1">
                Manage your account and preferences
              </p>
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Navigation */}
              <div className="w-full lg:w-64">
                <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-4 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#ff6600] text-black'
                            : 'text-[#ffcc99] hover:bg-[#ff6600]/10 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-red-500/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1">
                {loading && (
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-[#ff6600]/30 border-t-[#ff6600] rounded-full animate-spin mb-4"></div>
                      <p className="text-[#ffcc99] text-sm">Loading settings...</p>
                    </div>
                  </div>
                )}
                {!loading && (
                <>
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h2 className="text-white text-xl font-bold mb-6">Profile Settings</h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={userProfile?.email || ''}
                          disabled
                          className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] cursor-not-allowed"
                          placeholder="Email address"
                        />
                        <p className="text-[#ffcc99] text-xs mt-1">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                          placeholder="+234 801 234 5678"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6600] text-black text-sm font-bold rounded-xl hover:bg-[#cc5200] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Business Settings */}
                {activeTab === 'business' && (
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h2 className="text-white text-xl font-bold mb-6">Business Information</h2>
                    
                    {sellerProfile && (
                      <div className="mb-6 p-4 bg-black rounded-xl border border-[#ff6600]/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#ffcc99] text-sm font-medium mb-1">KYC Status</p>
                            {getKycStatusBadge(sellerProfile.kycStatus)}
                          </div>
                        </div>
                        {sellerProfile.kycStatus === 'PENDING' && (
                          <p className="text-[#ffcc99] text-xs mt-3">
                            Your KYC application is under review. You'll be notified once it's approved.
                          </p>
                        )}
                        {sellerProfile.kycStatus === 'REJECTED' && (
                          <p className="text-red-400 text-xs mt-3">
                            Your KYC application was rejected. Please contact support for more information.
                          </p>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleBusinessUpdate} className="space-y-6">
                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={businessForm.businessName}
                          onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                          placeholder="Enter your business name"
                          required
                        />
                        <p className="text-[#ffcc99] text-xs mt-1">
                          This name will be displayed to customers
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6600] text-black text-sm font-bold rounded-xl hover:bg-[#cc5200] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Payout Account Settings */}
                {activeTab === 'payout' && (
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h2 className="text-white text-xl font-bold mb-6">Payout Account</h2>
                    <p className="text-[#ffcc99] text-sm mb-6">
                      Link your bank account to receive payouts from your earnings. This information is encrypted and secure.
                    </p>

                    {showDeleteConfirm && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                        <p className="text-white font-medium mb-4">Are you sure you want to remove this bank account?</p>
                        <p className="text-[#ffcc99] text-sm mb-4">This action cannot be undone.</p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleBankAccountDelete}
                            disabled={saving}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Removing...' : 'Yes, Remove'}
                          </button>
                          <button
                            onClick={handleBankAccountDeleteCancel}
                            disabled={saving}
                            className="px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-lg text-sm font-medium hover:bg-[#ff6600]/10 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {bankAccount && !isAddingBank && !showDeleteConfirm ? (
                      <div className="mb-6">
                        <div className="bg-black border border-[#ff6600]/30 rounded-xl p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-[#ff6600]/20 rounded-xl">
                                <CreditCard className="w-6 h-6 text-[#ff6600]" />
                              </div>
                              <div>
                                <h3 className="text-white font-semibold">{bankAccount.accountName || 'N/A'}</h3>
                                <p className="text-[#ffcc99] text-sm">{bankAccount.bankName || 'N/A'}</p>
                              </div>
                            </div>
                            <button
                              onClick={handleBankAccountDeleteClick}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Remove bank account"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[#ffcc99] text-sm">Account Number</span>
                              <span className="text-white font-mono">
                                {bankAccount.accountNumber ? bankAccount.accountNumber.replace(/\d(?=\d{4})/g, '*') : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsAddingBank(true);
                            setBankForm({
                              accountName: bankAccount.accountName || '',
                              accountNumber: bankAccount.accountNumber || '',
                              bankCode: bankAccount.bankCode || '',
                              bankName: bankAccount.bankName || '',
                            });
                          }}
                          className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl text-sm font-medium hover:bg-[#ff6600]/10 hover:text-white transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Update Bank Account
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleBankAccountSave} className="space-y-6">
                        <div>
                          <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                            Account Name
                          </label>
                          <input
                            type="text"
                            value={bankForm.accountName}
                            onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                            placeholder="Enter account holder name"
                            required
                          />
                          <p className="text-[#ffcc99] text-xs mt-1">
                            Name as it appears on your bank account
                          </p>
                        </div>

                        <div>
                          <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={bankForm.accountNumber}
                            onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                            placeholder="Enter 10-digit account number"
                            required
                            maxLength={10}
                            minLength={10}
                          />
                        </div>

                        <div>
                          <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                            Bank
                          </label>
                          <select
                            value={bankForm.bankCode}
                            onChange={handleBankSelect}
                            className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                            required
                          >
                            <option value="">Select a bank</option>
                            {nigerianBanks.map((bank) => (
                              <option key={bank.code} value={bank.code}>
                                {bank.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6600] text-black text-sm font-bold rounded-xl hover:bg-[#cc5200] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : bankAccount ? 'Update Account' : 'Link Bank Account'}
                          </button>
                          {isAddingBank && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingBank(false);
                                setBankForm({
                                  accountName: '',
                                  accountNumber: '',
                                  bankCode: '',
                                  bankName: '',
                                });
                              }}
                              className="px-6 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] text-sm font-medium rounded-xl hover:bg-[#ff6600]/10 hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    )}

                    {!bankAccount && !isAddingBank && (
                      <button
                        onClick={() => setIsAddingBank(true)}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl text-sm font-medium hover:bg-[#ff6600]/10 hover:text-white transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Add Bank Account
                      </button>
                    )}

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <p className="text-blue-400 text-xs">
                        <strong>Note:</strong> Your bank account information is securely encrypted. 
                        We use Paystack for secure payouts to Nigerian bank accounts.
                      </p>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h2 className="text-white text-xl font-bold mb-6">Security Settings</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ffcc99] hover:text-white"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                            placeholder="Enter new password"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ffcc99] hover:text-white"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <p className="text-[#ffcc99] text-xs mt-1">Minimum 6 characters</p>
                      </div>

                      <div>
                        <label className="block text-[#ffcc99] text-sm font-medium mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 pr-12 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ffcc99] hover:text-white"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6600] text-black text-sm font-bold rounded-xl hover:bg-[#cc5200] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === 'notifications' && (
                  <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                    <h2 className="text-white text-xl font-bold mb-6">Notification Preferences</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-black rounded-xl border border-[#ff6600]/30">
                        <p className="text-[#ffcc99] text-sm mb-2">Notification settings coming soon</p>
                        <p className="text-[#ffcc99] text-xs">
                          You'll be able to manage email notifications, push notifications, and more.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}

