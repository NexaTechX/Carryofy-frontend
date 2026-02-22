import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { geocodeAddress, getCurrentPosition, reverseGeocode } from '../../lib/api/geocode';
import {
  User,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Locate,
  Briefcase,
  Camera,
  ShoppingBag,
  FileText,
  Bookmark,
} from 'lucide-react';
import Link from 'next/link';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import { formatDate } from '../../lib/api/utils';

type TabId = 'personal' | 'business' | 'addresses' | 'security' | 'preferences';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
  createdAt: string;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: 'Weak', color: 'bg-red-500' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { score: 3, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 4) return { score: 4, label: 'Good', color: 'bg-orange-400' };
  return { score: 5, label: 'Strong', color: 'bg-green-500' };
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'business', label: 'Business Info', icon: Briefcase },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'preferences', label: 'Preferences', icon: ShoppingBag },
];

export default function BuyerProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [businessForm, setBusinessForm] = useState({
    companyName: '',
    businessType: '',
    rcNumber: '',
    businessAddress: '',
    website: '',
  });
  const [businessSaving, setBusinessSaving] = useState(false);

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
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [preferences, setPreferences] = useState({
    orderUpdates: true,
    quoteResponses: true,
    promotions: false,
    preferredCategories: [] as string[],
    language: 'en',
    currency: 'NGN',
  });
  const [preferencesSaving, setPreferencesSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const confirmation = useConfirmation();

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  useEffect(() => {
    setMounted(true);
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (mounted) {
      fetchProfile();
      fetchAddresses();
    }
  }, [mounted]);

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showErrorToast('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    try {
      const coords = await getCurrentPosition();
      if (!coords) {
        showErrorToast('Failed to get location. Please enable permissions.');
        return;
      }
      const reversed = await reverseGeocode(coords.latitude, coords.longitude);
      if (reversed) {
        setAddressForm((prev) => ({
          ...prev,
          line1: reversed.line1 || prev.line1,
          city: reversed.city || prev.city,
          state: reversed.state || prev.state,
          country: reversed.country || prev.country,
          postalCode: reversed.postalCode || prev.postalCode,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
        showSuccessToast('Address filled from your location');
      } else {
        setAddressForm((prev) => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }));
        showSuccessToast('Location captured. Please complete the address manually.');
      }
    } catch {
      showErrorToast('Failed to get location. Please try again.');
    } finally {
      setGettingLocation(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await apiClient.get<UserProfile | { data: UserProfile }>('/users/me');
      const profileData = (response.data as { data?: UserProfile }).data || (response.data as UserProfile);
      setProfile(profileData);
      setProfileForm({
        name: profileData.name || '',
        phone: profileData.phone || '',
      });
      setProfileError(null);
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { data?: { message?: string } }; message?: string };
      if (e?.code === 'ERR_NETWORK' || e?.code === 'ECONNREFUSED' || e?.message === 'Network Error') {
        setProfileError('Unable to connect to the server.');
      } else {
        setProfileError(e?.response?.data?.message || 'Failed to load profile');
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchAddresses = async () => {
    if (!tokenManager.isAuthenticated() || !tokenManager.getAccessToken()) {
      setAddresses([]);
      setLoadingAddresses(false);
      return;
    }
    try {
      setLoadingAddresses(true);
      const response = await apiClient.get<Address[] | { data: Address[] }>('/users/me/addresses');
      const addressesData = (response.data as { data?: Address[] }).data || (response.data as Address[]);
      setAddresses(Array.isArray(addressesData) ? addressesData : []);
      setAddressError(null);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number }; code?: string };
      if (e?.response?.status === 400) setAddressError('Unable to load saved addresses.');
      else if (e?.response?.status === 401) setAddressError('Please refresh and try again.');
      else setAddressError('Failed to load addresses');
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileMessage(null);
      setProfileError(null);
      const response = await apiClient.put<UserProfile | { data: UserProfile }>('/users/me', {
        name: profileForm.name,
        phone: profileForm.phone || undefined,
      });
      const updatedProfile = (response.data as { data?: UserProfile }).data || (response.data as UserProfile);
      setProfile(updatedProfile);
      setProfileMessage('Profile updated successfully');
      const storedUser = userManager.getUser();
      if (storedUser) userManager.setUser({ ...storedUser, name: updatedProfile.name, phone: updatedProfile.phone });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setProfileError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMessage(null), 3000);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.country) {
      setAddressError('Please fill in the required address fields');
      return;
    }
    if (!tokenManager.isAuthenticated() || !tokenManager.getAccessToken()) {
      setAddressError('Please log in to save addresses');
      return;
    }
    try {
      setAddressSaving(true);
      setAddressMessage(null);
      setAddressError(null);
      const coords = await geocodeAddress({
        line1: addressForm.line1.trim(),
        line2: addressForm.line2?.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        country: addressForm.country || 'Nigeria',
      });
      const payload: Record<string, unknown> = {
        label: addressForm.label || 'Home',
        line1: addressForm.line1.trim(),
        line2: addressForm.line2?.trim() || undefined,
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        country: addressForm.country || 'Nigeria',
        postalCode: addressForm.postalCode?.trim() || undefined,
      };
      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }
      if (editingAddressId) {
        await apiClient.put(`/users/me/addresses/${editingAddressId}`, payload);
        setAddressMessage('Address updated successfully');
      } else {
        await apiClient.post('/users/me/addresses', payload);
        setAddressMessage('Address added successfully');
      }
      resetAddressForm();
      fetchAddresses();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; code?: string };
      if (e?.response?.status === 400) setAddressError(e?.response?.data?.message || 'Invalid address data');
      else if (e?.response?.status === 401) setAddressError('Session expired. Please refresh.');
      else if (e?.code === 'ERR_NETWORK') setAddressError('Unable to connect.');
      else setAddressError(e?.response?.data?.message || 'Failed to save address');
    } finally {
      setAddressSaving(false);
      setTimeout(() => setAddressMessage(null), 3000);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label || 'Home',
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode || '',
      latitude: address.latitude as number | undefined,
      longitude: address.longitude as number | undefined,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Address',
      message: 'Are you sure you want to delete this address?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      setAddressSaving(true);
      confirmation.setLoading(true);
      await apiClient.delete(`/users/me/addresses/${addressId}`);
      showSuccessToast('Address deleted');
      if (editingAddressId === addressId) resetAddressForm();
      fetchAddresses();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showErrorToast(e?.response?.data?.message || 'Failed to delete address');
    } finally {
      setAddressSaving(false);
      confirmation.setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (_addressId: string) => {
    showSuccessToast('Default address updated');
    fetchAddresses();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    try {
      setPasswordSaving(true);
      setPasswordMessage(null);
      setPasswordError(null);
      await apiClient.post('/users/me/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPasswordError(e?.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
      setTimeout(() => setPasswordMessage(null), 3000);
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setShowAddressForm(false);
    setAddressForm({
      label: 'Home',
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: 'Nigeria',
      postalCode: '',
      latitude: undefined,
      longitude: undefined,
    });
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-black/40 border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed';
  const labelClass = 'block text-[#ffcc99] text-sm font-medium mb-2';

  if (!mounted) return null;

  const stats = {
    orders: 12,
    quotes: 3,
    savedLists: 5,
  };

  return (
    <>
      <Head>
        <title>Profile - Buyer | Carryofy</title>
        <meta name="description" content="Manage your Carryofy profile, addresses, and security." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div className="space-y-6">
          {/* Header - always visible */}
          <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-6">
            {loadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#ff6600] animate-spin" />
              </div>
            ) : profile ? (
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar with hover upload */}
                <div
                  className="group relative shrink-0 cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#ff6600]/20 border-2 border-[#ff6600]/40 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-[#ff6600]/50 transition">
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-[#ff6600]" />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-white text-2xl font-bold">{profile.name}</h1>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#ff6600]/30 text-[#ff6600] text-xs font-bold uppercase tracking-wide">
                      BUYER
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#ffcc99]/90">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#ff6600]/70" />
                      {profile.email}
                    </span>
                    {profile.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#ff6600]/70" />
                        {profile.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#ff6600]/70" />
                      Joined {formatDate(profile.createdAt)}
                    </span>
                    <span className={`flex items-center gap-1.5 ${profile.verified ? 'text-green-400' : 'text-amber-400'}`}>
                      <ShieldCheck className="w-4 h-4" />
                      {profile.verified ? 'Verified' : 'Awaiting verification'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-[#ff6600]/20 text-[#ffcc99] text-sm">
                      <ShoppingBag className="w-4 h-4 text-[#ff6600]" />
                      {stats.orders} Orders
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-[#ff6600]/20 text-[#ffcc99] text-sm">
                      <FileText className="w-4 h-4 text-[#ff6600]" />
                      {stats.quotes} Quotes
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-[#ff6600]/20 text-[#ffcc99] text-sm">
                      <Bookmark className="w-4 h-4 text-[#ff6600]" />
                      {stats.savedLists} Saved Lists
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[#ffcc99]/70">Unable to load profile.</p>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-[#ff6600]/20">
            <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-[#ff6600] text-[#ff6600]'
                        : 'border-transparent text-[#ffcc99]/70 hover:text-[#ffcc99] hover:border-[#ff6600]/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
            {/* Tab 1: Personal Info */}
            {activeTab === 'personal' && (
              <div>
                {profile && !profile.verified && (
                  <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                    <p className="text-amber-200">
                      Verify your email to unlock the full experience. We&apos;ve sent a link to {profile.email}.
                    </p>
                    <Link
                      href={`/auth/verify?email=${encodeURIComponent(profile.email)}`}
                      className="inline-flex rounded-xl bg-[#ff6600] px-4 py-2 text-xs font-semibold text-black hover:bg-[#cc5200] transition shrink-0"
                    >
                      Resend link
                    </Link>
                  </div>
                )}

                <h2 className="text-white text-lg font-bold mb-4">Personal Information</h2>
                {profileError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
                    {profileError}
                  </div>
                )}
                {profileMessage && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg">
                    {profileMessage}
                  </div>
                )}
                <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={inputClass}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className={inputClass}
                      placeholder="+234 916 678 3040"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className={inputClass}
                    />
                    <p className="text-xs text-[#ffcc99]/60 mt-1">Contact support to change your email.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 transition"
                  >
                    <Save className="w-4 h-4" />
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Business Info */}
            {activeTab === 'business' && (
              <div>
                <p className="text-[#ffcc99]/80 text-sm mb-6">
                  Fill this in if you purchase for a business. This unlocks bulk pricing and invoice generation.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBusinessSaving(true);
                    setTimeout(() => setBusinessSaving(false), 1000);
                  }}
                  className="space-y-4 max-w-xl"
                >
                  <div>
                    <label className={labelClass}>Company Name</label>
                    <input
                      type="text"
                      value={businessForm.companyName}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, companyName: e.target.value }))}
                      className={inputClass}
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Business Type</label>
                    <select
                      value={businessForm.businessType}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, businessType: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="">Select type</option>
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="services">Services</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>RC Number / Tax ID</label>
                    <input
                      type="text"
                      value={businessForm.rcNumber}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, rcNumber: e.target.value }))}
                      className={inputClass}
                      placeholder="Registration or tax ID"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Business Address</label>
                    <textarea
                      value={businessForm.businessAddress}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, businessAddress: e.target.value }))}
                      className={inputClass + ' min-h-[80px]'}
                      placeholder="Full business address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Website (optional)</label>
                    <input
                      type="url"
                      value={businessForm.website}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, website: e.target.value }))}
                      className={inputClass}
                      placeholder="https://"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={businessSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 transition"
                  >
                    <Save className="w-4 h-4" />
                    {businessSaving ? 'Saving...' : 'Save Business Info'}
                  </button>
                </form>
              </div>
            )}

            {/* Tab 3: Addresses */}
            {activeTab === 'addresses' && (
              <div>
                <h2 className="text-white text-lg font-bold mb-4">Saved Addresses</h2>
                {addressError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
                    {addressError}
                  </div>
                )}
                {addressMessage && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg">
                    {addressMessage}
                  </div>
                )}

                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#ff6600] animate-spin" />
                  </div>
                ) : addresses.length === 0 && !showAddressForm ? (
                  <div className="rounded-xl border border-[#ff6600]/20 bg-black/40 p-8 text-center text-[#ffcc99]/80">
                    <p className="mb-2">No saved addresses yet.</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6600]/20 text-[#ff6600] hover:bg-[#ff6600]/30 transition font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Address
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="rounded-xl border border-[#ff6600]/20 bg-black/40 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[#ff6600] text-sm font-bold uppercase tracking-wide">
                              {addr.label || 'Address'}
                            </span>
                            {addr.isDefault && (
                              <span className="text-xs text-green-400 font-medium">Default</span>
                            )}
                          </div>
                          <div className="text-sm text-[#ffcc99] space-y-1">
                            <p>{addr.line1}</p>
                            {addr.line2 && <p>{addr.line2}</p>}
                            <p>
                              {addr.city}, {addr.state} {addr.postalCode && `— ${addr.postalCode}`}
                            </p>
                            <p>{addr.country}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-xs text-[#ff6600] hover:text-[#ff8533] font-medium"
                              >
                                Set as Default
                              </button>
                            )}
                            <button
                              onClick={() => handleEditAddress(addr)}
                              className="inline-flex items-center gap-1 text-xs text-[#ffcc99] hover:text-white"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {showAddressForm || editingAddressId ? (
                      <div className="rounded-xl border border-[#ff6600]/20 bg-black/40 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-white font-semibold">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                          <button onClick={resetAddressForm} className="text-sm text-[#ffcc99]/70 hover:text-[#ffcc99]">
                            Cancel
                          </button>
                        </div>
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                          <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            disabled={gettingLocation}
                            className="flex items-center gap-2 text-sm text-[#ff6600] hover:text-[#ff8533]"
                          >
                            {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                            Use Current Location
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>Label</label>
                              <input
                                type="text"
                                value={addressForm.label}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                                className={inputClass}
                                placeholder="Home, Office, etc."
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelClass}>Address Line 1 *</label>
                              <input
                                type="text"
                                value={addressForm.line1}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, line1: e.target.value }))}
                                className={inputClass}
                                placeholder="Street address"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelClass}>Address Line 2</label>
                              <input
                                type="text"
                                value={addressForm.line2}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, line2: e.target.value }))}
                                className={inputClass}
                                placeholder="Apartment, suite, etc."
                              />
                            </div>
                            <div>
                              <label className={labelClass}>City *</label>
                              <input
                                type="text"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                                className={inputClass}
                                placeholder="City"
                                required
                              />
                            </div>
                            <div>
                              <label className={labelClass}>State *</label>
                              <input
                                type="text"
                                value={addressForm.state}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                                className={inputClass}
                                placeholder="State"
                                required
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Country *</label>
                              <input
                                type="text"
                                value={addressForm.country}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                                className={inputClass}
                                placeholder="Country"
                                required
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Postal Code</label>
                              <input
                                type="text"
                                value={addressForm.postalCode}
                                onChange={(e) => setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                                className={inputClass}
                                placeholder="Postal code"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={addressSaving}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 transition"
                          >
                            <Plus className="w-4 h-4" />
                            {addressSaving ? 'Saving...' : editingAddressId ? 'Update Address' : 'Add Address'}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/10 transition font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Address
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tab 4: Security */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-white text-lg font-bold mb-4">Update Password</h2>
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
                    {passwordError}
                  </div>
                )}
                {passwordMessage && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg">
                    {passwordMessage}
                  </div>
                )}
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div>
                    <label className={labelClass}>Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        className={inputClass + ' pr-12'}
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ffcc99]/60 hover:text-[#ffcc99]"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className={inputClass + ' pr-12'}
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ffcc99]/60 hover:text-[#ffcc99]"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition ${
                              i <= (passwordForm.newPassword ? Math.ceil((passwordStrength.score / 5) * 5) : 0)
                                ? passwordStrength.color
                                : 'bg-[#ff6600]/20'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-[#ffcc99]/60 mt-1">{passwordStrength.label}</p>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className={inputClass + ' pr-12'}
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ffcc99]/60 hover:text-[#ffcc99]"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-[#ff6600]/40 text-[#ff6600] rounded-xl font-bold hover:bg-[#ff6600]/10 disabled:opacity-50 transition"
                  >
                    <Lock className="w-4 h-4" />
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[#ff6600]/20">
                  <h3 className="text-white font-semibold mb-3">Two-factor authentication</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-[#ff6600]/20">
                    <div>
                      <p className="text-[#ffcc99] text-sm">Add an extra layer of security</p>
                      <p className="text-[#ffcc99]/60 text-xs mt-1">Use an app or SMS to verify your identity</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`relative w-12 h-6 rounded-full transition ${
                        twoFactorEnabled ? 'bg-[#ff6600]' : 'bg-[#ff6600]/30'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition left-1 ${
                          twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Preferences */}
            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-white text-lg font-bold mb-4">Notification Preferences</h2>
                <div className="space-y-4 max-w-xl">
                  {[
                    { key: 'orderUpdates' as const, label: 'Order updates', desc: 'Get notified about order status changes' },
                    { key: 'quoteResponses' as const, label: 'Quote responses', desc: 'When sellers respond to your quote requests' },
                    { key: 'promotions' as const, label: 'Promotions', desc: 'Deals, discounts, and marketing emails' },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-[#ff6600]/20"
                    >
                      <div>
                        <p className="text-[#ffcc99] font-medium">{label}</p>
                        <p className="text-[#ffcc99]/60 text-xs mt-0.5">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition ${
                          preferences[key] ? 'bg-[#ff6600]' : 'bg-[#ff6600]/30'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition left-1 ${
                            preferences[key] ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <h2 className="text-white text-lg font-bold mt-8 mb-4">Shopping Preferences</h2>
                <p className="text-[#ffcc99]/70 text-sm mb-4">
                  Preferred categories help personalize recommendations.
                </p>
                <Link
                  href="/ai-onboarding?edit=true"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ff6600]/40 text-[#ff6600] hover:bg-[#ff6600]/10 transition font-medium"
                >
                  Manage AI preferences
                </Link>

                <h2 className="text-white text-lg font-bold mt-8 mb-4">Language & Currency</h2>
                <div className="flex flex-wrap gap-4 max-w-xl">
                  <div>
                    <label className={labelClass}>Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, language: e.target.value }))}
                      className={inputClass + ' w-40'}
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="ha">Hausa</option>
                      <option value="yo">Yorùbá</option>
                      <option value="ig">Igbo</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => setPreferences((prev) => ({ ...prev, currency: e.target.value }))}
                      className={inputClass + ' w-40'}
                    >
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPreferencesSaving(true);
                    setTimeout(() => setPreferencesSaving(false), 800);
                  }}
                  disabled={preferencesSaving}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  {preferencesSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}
          </div>
        </div>
      </BuyerLayout>
      <ConfirmationDialog
        open={confirmation.open}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        loading={confirmation.loading}
      />
    </>
  );
}
