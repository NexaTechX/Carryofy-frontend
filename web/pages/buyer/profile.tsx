import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { geocodeAddress } from '../../lib/api/geocode';
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
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';

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
  createdAt: string;
}

export default function BuyerProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
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
  });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

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
  const confirmation = useConfirmation();

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
      setProfileError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      // Handle network errors with a more user-friendly message
      if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNREFUSED' || err?.message === 'Network Error') {
        setProfileError('Unable to connect to the server. Please check your internet connection and ensure the API server is running.');
      } else {
        setProfileError(err.response?.data?.message || 'Failed to load profile');
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchAddresses = async () => {
    // Only fetch addresses if user is authenticated
    if (!tokenManager.isAuthenticated()) {
      setAddresses([]);
      setAddressError(null);
      setLoadingAddresses(false);
      return;
    }

    // Check if token exists
    const token = tokenManager.getAccessToken();
    if (!token) {
      setAddresses([]);
      setAddressError(null);
      setLoadingAddresses(false);
      return;
    }

    try {
      setLoadingAddresses(true);
      const response = await apiClient.get<Address[] | { data: Address[] }>('/users/me/addresses');
      const addressesData = (response.data as { data?: Address[] }).data || (response.data as Address[]);
      setAddresses(Array.isArray(addressesData) ? addressesData : []);
      setAddressError(null); // Clear any previous errors
    } catch (err: any) {
      // Handle specific error cases
      if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNREFUSED' || err?.message === 'Network Error') {
        setAddressError('Unable to connect to the server. Please check your internet connection and ensure the API server is running.');
      } else if (err.response?.status === 400) {
        // Bad request - user info might be missing, but this is not critical
        console.warn('Could not fetch saved addresses:', err.response?.data?.message || 'User information missing');
        setAddressError('Unable to load saved addresses. You can still add a new address below.');
      } else if (err.response?.status === 401) {
        // Unauthorized - token might be expired
        console.warn('Authentication issue when fetching addresses');
        setAddressError('Please refresh the page and try again.');
      } else {
        console.error('Error fetching addresses:', err);
        setAddressError(err.response?.data?.message || 'Failed to load addresses');
      }
      // Set empty array on error so user can still add addresses
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
      if (storedUser) {
        userManager.setUser({ ...storedUser, name: updatedProfile.name, phone: updatedProfile.phone });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile');
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

    // Check authentication before submitting
    if (!tokenManager.isAuthenticated()) {
      setAddressError('Please log in to save addresses');
      return;
    }

    const token = tokenManager.getAccessToken();
    if (!token) {
      setAddressError('Authentication token is missing. Please refresh the page and try again.');
      return;
    }

    try {
      setAddressSaving(true);
      setAddressMessage(null);
      setAddressError(null);

      // Geocode address to real coordinates for delivery distance/shipping fee calculation
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

      setAddressForm({
        label: 'Home',
        line1: '',
        line2: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postalCode: '',
      });
      setEditingAddressId(null);
      fetchAddresses();
    } catch (err: any) {
      console.error('Error saving address:', err);
      
      // Handle specific error cases
      if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || 'Invalid address data';
        if (errorMessage.includes('User information is missing') || errorMessage.includes('User ID is required')) {
          setAddressError('Authentication error. Please refresh the page and try again.');
        } else if (errorMessage.includes('required')) {
          setAddressError(errorMessage);
        } else {
          setAddressError(`Failed to save address: ${errorMessage}`);
        }
      } else if (err.response?.status === 401) {
        setAddressError('Your session has expired. Please refresh the page and try again.');
      } else if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNREFUSED') {
        setAddressError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setAddressError(err.response?.data?.message || 'Failed to save address. Please try again.');
      }
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
    });
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
      setAddressMessage(null);
      setAddressError(null);

      await apiClient.delete(`/users/me/addresses/${addressId}`);
      showSuccessToast('Address deleted successfully');
      setAddressMessage('Address deleted successfully');
      if (editingAddressId === addressId) {
        setEditingAddressId(null);
        setAddressForm({
          label: 'Home',
          line1: '',
          line2: '',
          city: '',
          state: '',
          country: 'Nigeria',
          postalCode: '',
        });
      }
      fetchAddresses();
    } catch (err: any) {
      console.error('Error deleting address:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete address';
      setAddressError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setAddressSaving(false);
      confirmation.setLoading(false);
      setTimeout(() => setAddressMessage(null), 3000);
    }
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
    } catch (err: any) {
      console.error('Error changing password:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
      setTimeout(() => setPasswordMessage(null), 3000);
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      line1: '',
      line2: '',
      city: '',
      state: '',
      country: 'Nigeria',
      postalCode: '',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Profile - Buyer | Carryofy</title>
        <meta name="description" content="Manage your Carryofy profile, addresses, and security." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <User className="w-8 h-8 text-[#ff6600]" />
              My Profile
            </h1>
            <p className="text-[#ffcc99] text-lg">
              Update your personal information, manage delivery addresses, and keep your account secure.
            </p>
          </div>

          {/* Profile Overview */}
          {profile && !profile.verified && (
            <div className="mb-6 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-yellow-400 mt-1" />
                <div>
                  <p className="text-yellow-200 font-semibold">Verify your email to unlock the full experience</p>
                  <p className="text-yellow-100/80">
                    We&apos;ve sent a verification link to {profile.email}. Didn&apos;t get it?
                    Request another email from the verification page or contact support.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/auth/verify?email=${encodeURIComponent(profile.email)}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ff6600] px-4 py-2 text-xs font-semibold text-black hover:bg-[#cc5200] transition"
                >
                  Resend link
                </Link>
                <Link
                  href="/buyer/help"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#ff6600]/30 px-4 py-2 text-xs font-semibold text-[#ffcc99] hover:bg-[#ff6600]/10 transition"
                >
                  Contact support
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
              {loadingProfile ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#ff6600] animate-spin" />
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#ff6600]/20 flex items-center justify-center border border-[#ff6600]/40">
                      <User className="w-8 h-8 text-[#ff6600]" />
                    </div>
                    <div>
                      <h2 className="text-white text-xl font-bold">{profile.name}</h2>
                      <p className="text-[#ffcc99] text-sm uppercase">{profile.role}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-[#ffcc99]">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </p>
                    {profile.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {profile.phone}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Joined {formatDate(profile.createdAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${profile.verified ? 'text-green-400' : 'text-[#ffcc99]'}`} />
                      {profile.verified ? 'Verified account' : 'Awaiting verification'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[#ffcc99]">Unable to load profile information.</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Link
                href="/buyer/preferences"
                className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-5 hover:border-[#ff6600]/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#ff6600]" />
                  <p className="text-[#ffcc99]/70 text-sm">AI Preferences</p>
                </div>
                <p className="text-white text-xl font-bold mt-2">Personalize</p>
                <p className="text-[#ffcc99]/60 text-xs mt-1">Manage shopping preferences</p>
              </Link>
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-5">
                <p className="text-[#ffcc99]/70 text-sm">Total Addresses</p>
                <p className="text-white text-3xl font-bold mt-2">{addresses.length}</p>
                <p className="text-[#ffcc99]/60 text-xs mt-1">Saved delivery locations</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-5">
                <p className="text-[#ffcc99]/70 text-sm">Account Status</p>
                <p className={`text-2xl font-bold mt-2 ${profile?.verified ? 'text-green-400' : 'text-[#ffcc99]'}`}>
                  {profile?.verified ? 'Verified' : 'Pending'}
                </p>
                <p className="text-[#ffcc99]/60 text-xs mt-1">Protect your account with strong password</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-5">
                <p className="text-[#ffcc99]/70 text-sm">Last Updated</p>
                <p className="text-white text-xl font-bold mt-2">
                  {profile ? formatDate(profile.updatedAt) : '--'}
                </p>
                <p className="text-[#ffcc99]/60 text-xs mt-1">Keep your info up to date</p>
              </div>
            </div>
          </div>

          {/* Profile & Security Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Profile Form */}
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-xl font-bold">Personal Information</h2>
                {profileSaving && <Loader2 className="w-5 h-5 text-[#ff6600] animate-spin" />}
              </div>

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

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="+234 916 678 3040"
                    required
                  />
                  <p className="text-xs text-[#ffcc99]/70 mt-1">Required for delivery coordination</p>
                </div>

                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] cursor-not-allowed"
                  />
                  <p className="text-xs text-[#ffcc99]/70 mt-1">Email changes are not supported at the moment.</p>
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Save className="w-4 h-4" />
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Password Section */}
            <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-xl font-bold">Security</h2>
                {passwordSaving && <Loader2 className="w-5 h-5 text-[#ff6600] animate-spin" />}
              </div>

              <p className="text-[#ffcc99]/80 text-sm mb-4">
                Update your password regularly to keep your account secure.
              </p>

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

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ffcc99]/60"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#ffcc99] text-sm font-medium mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ffcc99]/60"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#ffcc99] text-sm font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ffcc99]/60"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] border border-[#ff6600]/40 text-[#ff6600] rounded-xl font-bold hover:bg-[#ff6600]/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Lock className="w-4 h-4" />
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold">Saved Addresses</h2>
              <div className="flex items-center gap-3 text-sm text-[#ffcc99]">
                <MapPin className="w-4 h-4" />
                Manage your delivery locations
              </div>
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {loadingAddresses ? (
                <div className="col-span-2 flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#ff6600] animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="col-span-2 bg-black/40 border border-[#ff6600]/20 rounded-xl p-6 text-center text-[#ffcc99]/80">
                  <p>No saved addresses yet.</p>
                  <p className="text-xs mt-1">Add a new address using the form below.</p>
                </div>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="rounded-xl border border-[#ff6600]/20 bg-black/40 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#ff6600] text-sm font-bold uppercase tracking-wide">
                        {address.label || 'Address'}
                      </span>
                      <span className="text-xs text-[#ffcc99]/60">
                        Added {formatDate(address.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-[#ffcc99] space-y-1">
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>
                        {address.city}, {address.state}
                      </p>
                      <p>
                        {address.country}
                        {address.postalCode ? `, ${address.postalCode}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/30 hover:bg-[#ff6600]/20 transition text-xs font-semibold"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-xs font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Address Form */}
            <div className="bg-black/40 border border-[#ff6600]/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
                {editingAddressId && (
                  <button
                    onClick={resetAddressForm}
                    className="text-xs text-[#ffcc99]/70 hover:text-[#ffcc99]"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Label</label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="Home, Office, etc."
                  />
                </div>
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Address Line 1 *</label>
                  <input
                    type="text"
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, line1: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg黒 border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="Street address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Address Line 2</label>
                  <input
                    type="text"
                    value={addressForm.line2}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, line2: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">State *</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="State"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Country *</label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="Country"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black border border-[#ff6600]/30 text-white placeholder:text-[#ffcc99] focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                    placeholder="Postal code"
                  />
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-3 items-center pt-2">
                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Plus className="w-4 h-4" />
                    {addressSaving ? 'Saving...' : editingAddressId ? 'Update Address' : 'Add Address'}
                  </button>
                  {editingAddressId && (
                    <button
                      type="button"
                      onClick={resetAddressForm}
                      className="px-6 py-3 border border-[#ff6600]/30 text-[#ffcc99] rounded-xl hover:bg-[#ff6600]/10 transition"
                    >
                      Cancel
                    </button>
                  )}
                  <p className="text-xs text-[#ffcc99]/60">
                    Fields marked with * are required.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Account Tips */}
          <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-3">Keep your profile up to date</h3>
              <p className="text-[#ffcc99]/80 text-sm leading-relaxed">
                Accurate contact and delivery information helps ensure seamless order processing and delivery. Update your addresses whenever you move or want deliveries sent elsewhere.
              </p>
            </div>
            <div className="flex-1 bg-black/40 border border-[#ff6600]/20 rounded-xl p-5 text-sm text-[#ffcc99]/80 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#ff6600]" />
                <span>Use a strong password with at least 6 characters.</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ff6600]" />
                <span>Add multiple addresses to switch delivery destinations quickly.</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff6600]" />
                <span>Contact support if you notice any suspicious activity.</span>
              </div>
            </div>
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

