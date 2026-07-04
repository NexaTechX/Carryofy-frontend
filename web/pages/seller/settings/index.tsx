import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import RemoteImage from '../../../components/common/RemoteImage';
import { useAuth, tokenManager, userManager } from '../../../lib/auth';
import { apiClient } from '../../../lib/api/client';
import { resolveSellerKycStatus } from '../../../lib/seller/kyc-status';
import { kycRejectionReasonLabel } from '../../../lib/kyc/rejection-reasons';
import {
  unwrapSellerMePayload,
  sellerNeedsProfileOnboardingFromProfile,
} from '../../../lib/seller/onboarding';
import { User, Building2, Shield, Bell, Save, Eye, EyeOff, CheckCircle2, XCircle, Clock, CreditCard, Plus, Trash2, ShieldCheck, Upload, AlertCircle, Lock, Loader2, Moon, MapPin } from 'lucide-react';

import { geocodeString, getCurrentPosition, reverseGeocode } from '../../../lib/api/geocode';

/** Max KYC submission attempts a seller is allowed (must match the backend cap). */

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
  logo?: string;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
  kyc?: {
    rejectionReason?: string;
    rejectedBy?: string;
    rejectedAt?: string;
  } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'payout' | 'security' | 'notifications'>('profile');

  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [sellerNotOnboarded, setSellerNotOnboarded] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    countryCode: '+234',
  });
  const [initialProfileForm, setInitialProfileForm] = useState({
    name: '',
    phone: '',
    countryCode: '+234',
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Business state
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    businessType: 'Individual',
    cacNumber: '',
    businessAddress: '',
    businessDescription: '',
    logo: '',
    pickupInstructions: '',
    latitude: '' as any,
    longitude: '' as any,
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [gettingBusinessLocation, setGettingBusinessLocation] = useState(false);

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

  // KYC state
  const [kycStatus, setKycStatus] = useState<string>('NOT_SUBMITTED');
  const [kycFetching, setKycFetching] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  // Synchronous guard against rapid double-submits (state updates are async, so a
  // double click can fire the handler twice before the button disables).
  const kycSubmitLockRef = useRef(false);
  const [kycForm, setKycForm] = useState({
    businessType: 'Individual',
    idType: 'NIN',
    idNumber: '',
    idImage: '',
    idImageBack: '',
    addressProofImage: '',
    cacDocumentUrl: '',
    registrationNumber: '',
    taxId: '',
    bvn: '',
    kyc: null as any,
  });
  const [kycUploading, setKycUploading] = useState({
    idImage: false,
    idImageBack: false,
    addressProofImage: false,
    cacDocument: false,
  });

  // Notification preferences state (new structure per spec)
  type NotifPref = { email: boolean; push?: boolean };
  const [notificationPreferences, setNotificationPreferences] = useState<Record<string, NotifPref>>({
    newOrderReceived: { email: true, push: true },
    quoteRequest: { email: true, push: true },
    paymentReceived: { email: true, push: true },
    lowStockAlert: { email: true, push: true },
    marketingUpdates: { email: true }, // email only - push toggle hidden
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

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
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check authentication
    if (!isAuthenticated || !authUser) {
      router.push('/auth/login');
      return;
    }

    if (authUser.role && authUser.role !== 'SELLER' && authUser.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Check for tab query parameter
    const tabParam = router.query.tab as string;
    if (tabParam && ['profile', 'business', 'payout', 'security', 'notifications'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }

    // Load all settings
    loadSettings();
    fetchNotificationPreferences();
  }, [router, authLoading, isAuthenticated, authUser]);

  const loadSettings = async () => {
    if (authLoading || !isAuthenticated) return;
    setLoading(true);

    try {
      // Use Promise.allSettled to fetch all data even if some fail (e.g. non-onboarded seller gets 404)
      const [userRes, sellerRes, kycRes, accountsRes] = await Promise.allSettled([
        apiClient.get('/users/me'),
        apiClient.get('/sellers/me'),
        apiClient.get('/sellers/kyc'),
        apiClient.get('/sellers/me/bank-account')
      ]);

      // Handle User Profile
      if (userRes.status === 'fulfilled') {
        const userData = userRes.value.data.data || userRes.value.data;
        setUserProfile(userData);
        const phoneStr = userData.phone || '';
        const match = phoneStr.match(/^(\+\d{1,4})(.*)$/);
        const cc = match ? match[1] : '+234';
        const num = match ? match[2].replace(/\D/g, '') : phoneStr.replace(/\D/g, '');
        const formData = {
          name: userData.name || '',
          phone: num,
          countryCode: cc,
        };
        setProfileForm(formData);
        setInitialProfileForm(formData);
      }

      // Handle Seller Profile
      // CAC / RC number from the seller profile. The KYC "Registration Number"
      // field is the same real-world value, so this seeds it (below) to keep the
      // Business tab and KYC tab from holding divergent numbers.
      let sellerRegistrationNumber = '';
      if (sellerRes.status === 'fulfilled') {
        const sellerData =
          unwrapSellerMePayload(sellerRes.value.data) ??
          (sellerRes.value.data.data || sellerRes.value.data);
        setSellerProfile(sellerData);
        setSellerNotOnboarded(
          sellerNeedsProfileOnboardingFromProfile(sellerData),
        );
        sellerRegistrationNumber =
          sellerData.registrationNumber ||
          sellerData.cacNumber ||
          sellerData.kyc?.registrationNumber ||
          '';
        setBusinessForm({
          businessName: sellerData.businessName || '',
          businessType: sellerData.businessType || 'Individual',
          cacNumber: sellerRegistrationNumber,
          businessAddress: sellerData.businessAddress || '',
          businessDescription: sellerData.businessDescription || '',
          logo: sellerData.logo || '',
          pickupInstructions: sellerData.pickupInstructions || '',
          latitude: sellerData.latitude ?? '',
          longitude: sellerData.longitude ?? '',
        });
      } else if (sellerRes.reason?.response?.status === 404) {
        // Seller record doesn't exist yet — user needs to complete onboarding
        setSellerNotOnboarded(true);
        console.warn('Seller not onboarded (404)');
      } else {
        console.warn('Error fetching seller profile:', sellerRes.reason);
      }

      // Handle KYC Status
      if (kycRes.status === 'fulfilled') {
        const responseData = kycRes.value.data.data || kycRes.value.data;
        const status = resolveSellerKycStatus(
          responseData.status,
          responseData.kyc,
        );
        setKycStatus(status);
        if (responseData.kyc) {
          setKycForm({
            businessType: responseData.kyc.businessType || 'Individual',
            registrationNumber:
              responseData.kyc.registrationNumber || sellerRegistrationNumber || '',
            taxId: responseData.kyc.taxId || '',
            idType: responseData.kyc.idType || 'National ID',
            idNumber: responseData.kyc.idNumber || '',
            idImage: responseData.kyc.idImage || '',
            idImageBack: responseData.kyc.idImageBack || '',
            addressProofImage: responseData.kyc.addressProofImage || '',
            cacDocumentUrl: responseData.kyc.cacDocumentUrl || '',
            bvn: responseData.kyc.bvn || '',
            kyc: responseData.kyc
          });
        } else if (sellerRegistrationNumber) {
          // No KYC submitted yet — prefill the registration number from the
          // Business profile so the seller doesn't re-key (and can't diverge) it.
          setKycForm((prev) => ({
            ...prev,
            registrationNumber: prev.registrationNumber || sellerRegistrationNumber,
          }));
        }
      } else {
        setKycStatus('NOT_SUBMITTED');
        if (kycRes.reason?.response?.status !== 404) {
          console.warn('Error fetching KYC:', kycRes.reason);
        }
      }

      // Handle Bank Accounts
      if (accountsRes.status === 'fulfilled') {
        const data = accountsRes.value.data.data || accountsRes.value.data;
        if (data) setBankAccount(data);
      } else if (accountsRes.reason?.response?.status === 404) {
        setBankAccount(null);
      }

    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated, activeTab]);

  /**
   * Build full phone from country code and number.
   */
  const buildPhone = (countryCode: string, num: string): string => {
    const digits = num.replace(/\D/g, '');
    if (!digits) return '';
    const cc = countryCode.replace(/\D/g, '');
    return `+${cc}${digits}`;
  };

  const profileFormDirty =
    profileForm.name !== initialProfileForm.name ||
    profileForm.phone !== initialProfileForm.phone ||
    profileForm.countryCode !== initialProfileForm.countryCode;

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 11)}`;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveStatus('loading');

    try {
      const token = tokenManager.getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const payload = {
        name: profileForm.name,
        phone: buildPhone(profileForm.countryCode, profileForm.phone) || undefined,
      };

      const response = await fetch(`${apiUrl}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedData = result.data || result;
        setUserProfile(updatedData);
        const currentUser = userManager.getUser();
        if (currentUser) {
          userManager.setUser({ ...currentUser, name: updatedData.name });
        }
        const phoneStr = updatedData.phone || '';
        const match = phoneStr.match(/^(\+\d{1,4})(.*)$/);
        const cc = match ? match[1] : '+234';
        const num = match ? match[2].replace(/\D/g, '') : phoneStr.replace(/\D/g, '');
        const newInitial = {
          name: updatedData.name || '',
          phone: num,
          countryCode: cc,
        };
        setInitialProfileForm(newInitial);
        setProfileForm(newInitial);
        setProfileSaveStatus('success');
        setTimeout(() => setProfileSaveStatus('idle'), 2000);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
        setProfileSaveStatus('error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
      setProfileSaveStatus('error');
    }
  };

  const getPasswordStrength = (pwd: string): { level: 'weak' | 'fair' | 'strong' | 'very strong'; percent: number } => {
    if (!pwd) return { level: 'weak', percent: 0 };
    let score = 0;
    if (pwd.length >= 6) score += 20;
    if (pwd.length >= 8) score += 10;
    if (pwd.length >= 12) score += 10;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 20;
    if (/\d/.test(pwd)) score += 20;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 20;
    if (score <= 20) return { level: 'weak', percent: 25 };
    if (score <= 50) return { level: 'fair', percent: 50 };
    if (score <= 80) return { level: 'strong', percent: 75 };
    return { level: 'very strong', percent: 100 };
  };

  const persistBusinessInformation = async (form: typeof businessForm) => {
    setSaving(true);

    const token = tokenManager.getAccessToken();
    let lat = form.latitude;
    let lng = form.longitude;

    // Automatically geocode if coordinates are missing
    if (!lat || !lng) {
      const geoResult = await geocodeString(form.businessAddress, {
        preferServer: true,
        accessToken: token ?? undefined,
      });
      if (geoResult) {
        lat = geoResult.latitude;
        lng = geoResult.longitude;
        setBusinessForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      } else {
        toast.error('Address saved without coordinates. You can update location again later.');
      }
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const payload = {
        businessName: form.businessName,
        businessType: form.businessType,
        registrationNumber: form.cacNumber?.trim() || undefined,
        businessAddress: form.businessAddress || undefined,
        businessDescription: form.businessDescription?.trim() || undefined,
        logo: form.logo || undefined,
        pickupInstructions: form.pickupInstructions || undefined,
        latitude: lat ? Number(lat) : undefined,
        longitude: lng ? Number(lng) : undefined,
      };

      const response = await fetch(`${apiUrl}/sellers/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

  const handleBusinessUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessForm.businessAddress?.trim()) {
      toast.error('Business address is required');
      return;
    }
    await persistBusinessInformation(businessForm);
  };

  const handleUseBusinessLocation = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGettingBusinessLocation(true);
    try {
      const coords = await getCurrentPosition();
      if (!coords) {
        toast.error('Failed to get location. Please enable location permissions.');
        return;
      }
      const reversed = await reverseGeocode(coords.latitude, coords.longitude);
      if (!reversed) {
        toast.error('Could not resolve address from your location. Enter the address manually or try again.');
        return;
      }
      const fullAddress = [reversed.line1, reversed.city, reversed.state, reversed.country].filter(Boolean).join(', ');
      if (!fullAddress.trim()) {
        toast.error('Could not build address from your location.');
        return;
      }
      const merged = {
        ...businessForm,
        businessAddress: fullAddress,
        latitude: reversed.latitude,
        longitude: reversed.longitude,
      };
      setBusinessForm(merged);
      await persistBusinessInformation(merged);
    } catch {
      toast.error('Failed to get location. Please try again.');
    } finally {
      setGettingBusinessLocation(false);
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
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
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

  const getKycStatusBadge = (status: string) => {
    const normalizedStatus = (status || '').toUpperCase();
    switch (normalizedStatus) {
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
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        );
      case 'NOT_SUBMITTED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <Clock className="w-3 h-3" />
            Not Submitted
          </span>
        );
    }
  };


  const handleLogoUpload = async (file: File | null) => {
    if (!file) return;

    const maxSize = 2 * 1024 * 1024; // 2MB for logos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or WebP');
      return;
    }

    setLogoUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      // Use apiClient for consistency
      const response = await apiClient.post('/sellers/logo/upload', formDataToSend, {
        timeout: 300000,
      });

      const data = response.data;
      const url = data.data?.url || data.url;

      if (url) {
        setBusinessForm(prev => ({ ...prev, logo: url }));
        if (sellerProfile) {
          setSellerProfile({ ...sellerProfile, logo: url });
        }
        toast.success('Logo uploaded successfully!');
      } else {
        console.error('Upload response missing URL:', data);
        toast.error('Upload succeeded but no URL returned');
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload logo. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setBusinessForm(prev => ({ ...prev, logo: '' }));
    if (sellerProfile) {
      setSellerProfile({ ...sellerProfile, logo: '' });
    }
    toast.success('Logo removed. Save changes to update.');
  };



  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'payout', label: 'Payout', icon: CreditCard },
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

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
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

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
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

  const fetchNotificationPreferences = async () => {
    setLoadingPreferences(true);
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setLoadingPreferences(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const pref = result.data || result;
        if (pref) {
          // Map API format to new structure if needed
          setNotificationPreferences({
            newOrderReceived: pref.newOrderReceived || { email: pref.email?.orders ?? true, push: pref.push?.orders ?? true },
            quoteRequest: pref.quoteRequest || { email: pref.email?.products ?? true, push: pref.push?.products ?? true },
            paymentReceived: pref.paymentReceived || { email: pref.email?.payouts ?? true, push: pref.push?.payouts ?? true },
            lowStockAlert: pref.lowStockAlert || { email: pref.email?.system ?? true, push: pref.push?.system ?? true },
            marketingUpdates: pref.marketingUpdates || { email: pref.email?.kyc ?? false },
          });
        }
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleSaveNotificationPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Send only the shape the API expects (email + push); do not send newOrderReceived, quoteRequest, etc.
      const payload = {
        email: {
          orders: notificationPreferences.newOrderReceived.email,
          products: notificationPreferences.quoteRequest.email,
          payouts: notificationPreferences.paymentReceived.email,
          system: notificationPreferences.lowStockAlert.email,
          kyc: notificationPreferences.marketingUpdates.email,
        },
        push: {
          orders: notificationPreferences.newOrderReceived.push,
          products: notificationPreferences.quoteRequest.push,
          payouts: notificationPreferences.paymentReceived.push,
          system: notificationPreferences.lowStockAlert.push,
          kyc: false,
        },
      };

      const response = await fetch(`${apiUrl}/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Notification preferences saved successfully!');
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
  if (!isAuthenticated || !authUser) {
    return null;
  }

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
          <div className="flex flex-wrap justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-[32px]">
                Settings
              </h1>
              <p className="mt-1 text-sm font-normal leading-normal text-[#ffcc99]">
                Manage your account and preferences
              </p>
            </div>
          </div>

          <div className="px-3 pb-4 sm:px-4 sm:pb-6">
            {/* Content Card with Horizontal Tabs */}
            <div
              className="overflow-hidden rounded-2xl sm:rounded-xl"
              style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
            >
              {/* Horizontal Tab Bar - scroll on small screens */}
              <div className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto border-b border-[#2A2A2A]">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`btn-mobile flex min-h-[52px] shrink-0 snap-start items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors sm:min-h-0 sm:px-5 sm:py-4 ${isActive
                        ? '-mb-px border-b-[3px] border-[#FF6B00] text-white'
                        : 'border-b-[3px] border-transparent text-[#A0A0A0] hover:text-white'
                        }`}
                    >
                      <Icon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Main Content Area — mobile-friendly input heights via descendant selectors */}
              <div className="max-lg:[&_input:not([type=hidden])]:min-h-[48px] max-lg:[&_select]:min-h-[48px] max-lg:[&_input]:text-base max-lg:[&_select]:text-base max-lg:[&_textarea]:text-base p-3 sm:p-4 lg:p-6">
                {loading && (
                  <div
                    className="rounded-xl p-8 sm:p-12"
                    style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#2A2A2A] border-t-[#FF6B00]"></div>
                      <p className="text-[#A0A0A0] text-sm">Loading settings...</p>
                    </div>
                  </div>
                )}
                {!loading && (
                  <>
                    {/* Profile Settings */}
                    {activeTab === 'profile' && (
                      <div
                        className="rounded-xl p-4 sm:p-6"
                        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                      >
                        <h2
                          className="text-white font-bold mb-5 pb-4 border-b"
                          style={{ fontSize: '14px', borderColor: '#2A2A2A' }}
                        >
                          Profile Settings
                        </h2>
                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                          <div>
                            <label className="block text-[#A0A0A0] text-sm font-medium mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className="w-full px-4 py-3 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                              placeholder="Enter your full name"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[#A0A0A0] text-sm font-medium mb-2">
                              Email
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                value={userProfile?.email || ''}
                                readOnly
                                className="w-full px-4 py-3 pr-12 rounded-lg border text-[#A0A0A0] cursor-not-allowed"
                                style={{ backgroundColor: '#111111', border: '1px solid #1A1A1A' }}
                                placeholder="Email address"
                              />
                              <Lock
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4"
                                style={{ color: '#A0A0A0' }}
                              />
                            </div>
                            <p className="text-[#A0A0A0] text-xs mt-1">
                              Email cannot be changed — contact support to update
                            </p>
                          </div>

                          <div>
                            <label className="block text-[#A0A0A0] text-sm font-medium mb-2">
                              Phone Number
                            </label>
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                              <div
                                className="flex items-center justify-center gap-2 rounded-t-lg border border-b-0 px-4 py-3 sm:justify-start sm:rounded-l-lg sm:rounded-r-none sm:border-b sm:border-r-0"
                                style={{ backgroundColor: '#111111', borderColor: '#2A2A2A' }}
                              >
                                <span className="text-sm text-white">+234</span>
                                <span className="text-lg" role="img" aria-label="Nigeria">🇳🇬</span>
                              </div>
                              <input
                                type="tel"
                                value={formatPhoneInput(profileForm.phone)}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                                  setProfileForm({ ...profileForm, phone: digits });
                                }}
                                className="min-h-[48px] flex-1 rounded-b-lg border border-[#2A2A2A] bg-black px-4 py-3 text-white placeholder:text-[#A0A0A0] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FF6B00] sm:min-h-0 sm:rounded-l-none sm:rounded-r-lg sm:border-l-0"
                                placeholder="801 234 5678"
                                required
                              />
                            </div>
                            <p className="text-xs text-[#A0A0A0] mt-1">
                              Required for seller accounts. Auto-formats as you type.
                            </p>
                          </div>

                          <button
                            type="submit"
                            disabled={!profileFormDirty || profileSaveStatus === 'loading'}
                            className={`btn-mobile flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:min-h-0 sm:rounded-lg ${profileSaveStatus === 'success'
                              ? 'bg-[#22C55E] text-white'
                              : profileSaveStatus === 'error'
                                ? 'bg-red-600 text-white'
                                : profileSaveStatus === 'loading'
                                  ? 'bg-[#FF6B00] text-black'
                                  : 'bg-[#FF6B00] text-black hover:bg-[#E65100]'
                              }`}
                          >
                            {profileSaveStatus === 'loading' ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : profileSaveStatus === 'success' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Saved!
                              </>
                            ) : profileSaveStatus === 'error' ? (
                              'Failed to save — try again'
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </form>

                        {/* Theme Settings Section */}
                        <div className="mt-8 pt-6 border-t border-[#2A2A2A]">
                          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Moon className="w-4 h-4 text-[#FF6B00]" />
                            Display Mode
                          </h3>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-[#2A2A2A]">
                            <div>
                              <p className="text-white text-sm font-medium">Theme Preference</p>
                              <p className="text-[#A0A0A0] text-xs">Switch between light and dark mode</p>
                            </div>
                            <span className="shrink-0 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1 text-xs font-medium text-[#A0A0A0]">
                              Coming soon
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Business Settings */}
                    {activeTab === 'business' && (
                      <div
                        className="rounded-xl p-4 sm:p-6"
                        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                      >
                        <div className="mb-5 pb-4 border-b" style={{ borderColor: '#2A2A2A' }}>
                          <h2 className="text-white font-bold" style={{ fontSize: '16px' }}>
                            Business Information
                          </h2>
                          <p className="text-[#A0A0A0] text-xs mt-1">
                            This appears on your storefront and is used for order pickup.
                          </p>
                        </div>

                        {sellerProfile && (
                          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[#A0A0A0] text-sm font-medium mb-1">KYC Status</p>
                                {getKycStatusBadge(
                                  resolveSellerKycStatus(
                                    kycStatus,
                                    kycForm.kyc,
                                    sellerProfile?.kycStatus?.toString(),
                                  ),
                                )}
                              </div>
                            </div>
                            {kycStatus === 'PENDING' && (
                              <p className="text-[#A0A0A0] text-xs mt-3">
                                Your KYC application is under review. You'll be notified once it's approved.
                              </p>
                            )}
                            {kycStatus === 'NOT_SUBMITTED' && (
                              <p className="text-[#A0A0A0] text-xs mt-3">
                                Please complete your KYC verification to start selling. Go to the Identity tab to get started.
                              </p>
                            )}
                            {kycStatus === 'REJECTED' && (
                              <div className="mt-3">
                                <p className="text-red-400 text-xs mb-2">Your KYC application was rejected.</p>
                                {(kycForm.kyc?.rejectionReason || kycForm.kyc?.rejectionReasonCode) && (
                                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(127,29,29,0.2)', border: '1px solid rgba(185,28,28,0.3)' }}>
                                    <p className="text-xs font-semibold text-red-300 mb-1">Rejection Reason:</p>
                                    {kycRejectionReasonLabel(kycForm.kyc?.rejectionReasonCode) &&
                                      kycRejectionReasonLabel(kycForm.kyc?.rejectionReasonCode) !== 'Other' && (
                                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-red-300 mb-1" style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}>
                                        {kycRejectionReasonLabel(kycForm.kyc?.rejectionReasonCode)}
                                      </span>
                                    )}
                                    {kycForm.kyc?.rejectionReason && (
                                      <p className="text-xs text-red-400">{kycForm.kyc.rejectionReason}</p>
                                    )}
                                  </div>
                                )}
                                <Link
                                  href="/seller/onboarding"
                                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
                                >
                                  Fix &amp; resubmit
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        <form onSubmit={handleBusinessUpdate} className="space-y-8">
                          {/* — Business details — */}
                          <section className="space-y-5">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#FF6B00]" />
                              <h3 className="text-white text-sm font-semibold">Business details</h3>
                            </div>

                            <div>
                              <label className="block text-[#A0A0A0] text-sm font-medium mb-2">
                                Business Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={businessForm.businessName}
                                onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                                placeholder="Enter your business name"
                                required
                              />
                              <p className="text-xs text-[#A0A0A0] mt-1.5">The name buyers see on your store and orders.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                              <div>
                                <label className="block text-[#A0A0A0] text-sm font-medium mb-2">Business Type</label>
                                <select
                                  value={businessForm.businessType}
                                  onChange={(e) => setBusinessForm({ ...businessForm, businessType: e.target.value })}
                                  className="w-full px-4 py-3 rounded-lg bg-black border border-[#2A2A2A] text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                                >
                                  <option value="Individual">Individual</option>
                                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                                  <option value="Partnership">Partnership</option>
                                  <option value="LLC">LLC</option>
                                  <option value="Registered Business">Registered Business</option>
                                </select>
                                <p className="text-xs text-[#A0A0A0] mt-1.5">How your business is structured.</p>
                              </div>

                              <div>
                                <label className="flex items-center justify-between text-[#A0A0A0] text-sm font-medium mb-2">
                                  <span>CAC Number</span>
                                  <span className="text-[11px] font-normal text-[#A0A0A0]/70">Optional</span>
                                </label>
                                <input
                                  type="text"
                                  value={businessForm.cacNumber}
                                  onChange={(e) => setBusinessForm({ ...businessForm, cacNumber: e.target.value })}
                                  className="w-full px-4 py-3 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                                  placeholder="RC / BN number"
                                />
                                <p className="text-xs text-[#A0A0A0] mt-1.5">Your CAC registration number, if registered.</p>
                              </div>
                            </div>
                          </section>

                          <div className="border-t border-[#2A2A2A]" />

                          {/* — Pickup location — */}
                          <section className="space-y-5">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[#FF6B00]" />
                              <h3 className="text-white text-sm font-semibold">Pickup location</h3>
                            </div>

                            <div>
                              <label className="block text-[#A0A0A0] text-sm font-medium mb-2">
                                Business address <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={businessForm.businessAddress}
                                onChange={(e) => setBusinessForm({ ...businessForm, businessAddress: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                                placeholder="e.g. 14 Bode Thomas Street, Surulere, Lagos"
                                required
                              />
                              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs text-[#A0A0A0]">
                                  Riders pick up your orders here — this address is also used for pickup.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleUseBusinessLocation}
                                  disabled={gettingBusinessLocation || saving}
                                  className="inline-flex items-center gap-2 text-sm text-[#FF6B00] hover:text-[#ff8533] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] rounded-md"
                                  title="Use device location to fill and save this address"
                                >
                                  {gettingBusinessLocation || saving ? (
                                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                                  ) : (
                                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                                  )}
                                  <span>{gettingBusinessLocation ? 'Getting location…' : saving ? 'Saving…' : 'Use my location'}</span>
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="flex items-center justify-between text-[#A0A0A0] text-sm font-medium mb-2">
                                <span>Pickup Instructions</span>
                                <span className="text-[11px] font-normal text-[#A0A0A0]/70">Optional</span>
                              </label>
                              <input
                                type="text"
                                value={businessForm.pickupInstructions}
                                onChange={(e) => setBusinessForm({ ...businessForm, pickupInstructions: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                                placeholder="e.g. Call on arrival, gate code is 1234"
                              />
                              <p className="text-xs text-[#A0A0A0] mt-1.5">Help riders find you — a landmark, gate code, or who to call.</p>
                            </div>
                          </section>

                          <div className="border-t border-[#2A2A2A]" />

                          {/* — Branding & description — */}
                          <section className="space-y-5">
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4 text-[#FF6B00]" />
                              <h3 className="text-white text-sm font-semibold">Branding</h3>
                            </div>

                          <div>
                            <label className="flex items-center justify-between text-[#A0A0A0] text-sm font-medium mb-2">
                              <span>Business Description</span>
                              <span className="text-[11px] font-normal text-[#A0A0A0]/70">{businessForm.businessDescription.length}/500</span>
                            </label>
                            <textarea
                              value={businessForm.businessDescription}
                              onChange={(e) => setBusinessForm({ ...businessForm, businessDescription: e.target.value })}
                              rows={4}
                              maxLength={500}
                              className="w-full px-4 py-3 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent resize-none"
                              placeholder="Tell buyers what you sell and what makes your store stand out…"
                            />
                          </div>

                          <div>
                            <label className="block text-[#A0A0A0] text-sm font-medium mb-2">Business Logo</label>
                            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:gap-6">
                              <div className="relative mx-auto flex aspect-square w-full max-w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#2A2A2A] bg-black sm:mx-0 sm:w-[200px] sm:max-w-none">
                                {businessForm.logo ? (
                                  <RemoteImage
                                    src={businessForm.logo}
                                    alt="Business Logo"
                                    fill
                                    className="object-cover"
                                    sizes="200px"
                                  />
                                ) : (
                                  <div className="text-center p-2">
                                    <Building2 className="w-10 h-10 text-[#A0A0A0]/50 mx-auto mb-1" />
                                    <span className="text-[#A0A0A0]/50 text-xs">200×200</span>
                                  </div>
                                )}
                                {businessForm.logo && (
                                  <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                                    title="Remove logo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div className="min-w-0 flex-1 text-center sm:text-left">
                                <input
                                  type="file"
                                  id="logoUpload"
                                  accept="image/jpeg,image/jpg,image/png,image/webp"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLogoUpload(file);
                                  }}
                                  className="hidden"
                                  disabled={logoUploading}
                                />
                                <label
                                  htmlFor="logoUpload"
                                  className={`btn-mobile inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors sm:inline-flex sm:w-auto sm:min-h-0 sm:rounded-lg sm:py-2 ${logoUploading ? 'cursor-wait bg-[#FF6B00]/50 text-black' : 'bg-[#FF6B00] text-black hover:bg-[#E65100]'}`}
                                >
                                  <Upload className="w-4 h-4" />
                                  {logoUploading ? 'Uploading...' : businessForm.logo ? 'Change Logo' : 'Upload Logo'}
                                </label>
                                <p className="text-[#A0A0A0] text-xs mt-2">Square image works best · JPG, PNG, WebP · Max 2MB</p>
                              </div>
                            </div>
                          </div>
                          </section>

                          <div className="border-t border-[#2A2A2A]" />

                          <button
                            type="submit"
                            disabled={saving || logoUploading}
                            className="btn-mobile flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-sm font-bold text-black transition-colors hover:bg-[#E65100] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:min-h-0 sm:rounded-lg"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </form>
                      </div>
                    )}


                    {/* Payout Account Settings */}
                    {activeTab === 'payout' && (
                      <div
                        className="rounded-xl p-4 sm:p-6"
                        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                      >
                        <h2
                          className="text-white font-bold mb-5 pb-4 border-b"
                          style={{ fontSize: '14px', borderColor: '#2A2A2A' }}
                        >
                          Payout Account
                        </h2>
                        <p className="text-[#ffcc99] text-sm mb-6">
                          Link your bank account to receive payouts from your earnings. This information is encrypted and secure.
                        </p>

                        {showDeleteConfirm && (
                          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                            <p className="text-white font-medium mb-4">Are you sure you want to remove this bank account?</p>
                            <p className="text-[#ffcc99] text-sm mb-4">This action cannot be undone.</p>
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                              <button
                                type="button"
                                onClick={handleBankAccountDelete}
                                disabled={saving}
                                className="btn-mobile min-h-[48px] rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:py-2"
                              >
                                {saving ? 'Removing...' : 'Yes, Remove'}
                              </button>
                              <button
                                type="button"
                                onClick={handleBankAccountDeleteCancel}
                                disabled={saving}
                                className="btn-mobile min-h-[48px] rounded-xl border border-[#ff6600]/30 bg-[#1a1a1a] px-4 py-3 text-sm font-medium text-[#ffcc99] transition-colors hover:bg-[#ff6600]/10 disabled:opacity-50 sm:min-h-0 sm:py-2"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {bankAccount && !isAddingBank && !showDeleteConfirm ? (
                          <div className="mb-6">
                            <div className="rounded-xl border border-[#ff6600]/30 bg-black p-4 sm:p-6">
                              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="p-3 bg-[#ff6600]/20 rounded-xl">
                                    <CreditCard className="w-6 h-6 text-[#ff6600]" />
                                  </div>
                                  <div>
                                    <h3 className="text-white font-semibold">{bankAccount.accountName || 'N/A'}</h3>
                                    <p className="text-[#ffcc99] text-sm">{bankAccount.bankName || 'N/A'}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleBankAccountDeleteClick}
                                  className="btn-mobile self-end rounded-lg p-2.5 text-red-400 transition-colors hover:bg-red-500/10 sm:self-auto"
                                  title="Remove bank account"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="space-y-2">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="text-sm text-[#ffcc99]">Account Number</span>
                                  <span className="break-all font-mono text-sm text-white sm:text-right">
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
                              className="btn-mobile mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#ff6600]/30 bg-[#1a1a1a] px-4 py-3 text-sm font-medium text-[#ffcc99] transition-colors hover:bg-[#ff6600]/10 hover:text-white sm:w-auto sm:py-2"
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

                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                              <button
                                type="submit"
                                disabled={saving}
                                className="btn-mobile flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff6600] px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-[#cc5200] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Save className="h-4 w-4" />
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
                                  className="btn-mobile min-h-[48px] rounded-xl border border-[#ff6600]/30 bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#ffcc99] transition-colors hover:bg-[#ff6600]/10 hover:text-white"
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
                            className="btn-mobile mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#ff6600]/30 bg-[#1a1a1a] px-6 py-3 text-sm font-medium text-[#ffcc99] transition-colors hover:bg-[#ff6600]/10 hover:text-white"
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
                      <div
                        className="rounded-xl p-4 sm:p-6"
                        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                      >
                        <h2
                          className="text-white font-bold mb-5 pb-4 border-b"
                          style={{ fontSize: '14px', borderColor: '#2A2A2A' }}
                        >
                          Security Settings
                        </h2>

                        <form onSubmit={handlePasswordChange} className="space-y-6 mb-8">
                          <h3 className="text-white font-semibold text-sm mb-4">Change Password</h3>
                          <div>
                            <label className="block text-[#A0A0A0] text-sm font-medium mb-2">Current Password</label>
                            <div className="relative">
                              <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="w-full px-4 py-3 pr-12 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                                placeholder="Enter current password"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                className="btn-mobile absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-[#A0A0A0] hover:text-white"
                              >
                                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[#A0A0A0] text-sm font-medium mb-2">New Password</label>
                            <div className="relative">
                              <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full px-4 py-3 pr-12 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                                placeholder="Enter new password"
                                required
                                minLength={6}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                className="btn-mobile absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-[#A0A0A0] hover:text-white"
                              >
                                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                            {passwordForm.newPassword && (
                              <div className="mt-2">
                                <div
                                  className="h-1.5 rounded-full overflow-hidden"
                                  style={{ backgroundColor: '#2A2A2A' }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${getPasswordStrength(passwordForm.newPassword).percent}%`,
                                      backgroundColor:
                                        getPasswordStrength(passwordForm.newPassword).level === 'weak'
                                          ? '#EF4444'
                                          : getPasswordStrength(passwordForm.newPassword).level === 'fair'
                                            ? '#F59E0B'
                                            : getPasswordStrength(passwordForm.newPassword).level === 'strong'
                                              ? '#22C55E'
                                              : '#10B981',
                                    }}
                                  />
                                </div>
                                <p
                                  className="text-xs mt-1"
                                  style={{
                                    color:
                                      getPasswordStrength(passwordForm.newPassword).level === 'weak'
                                        ? '#EF4444'
                                        : getPasswordStrength(passwordForm.newPassword).level === 'fair'
                                          ? '#F59E0B'
                                          : getPasswordStrength(passwordForm.newPassword).level === 'strong'
                                            ? '#22C55E'
                                            : '#10B981',
                                  }}
                                >
                                  {getPasswordStrength(passwordForm.newPassword).level}
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[#A0A0A0] text-sm font-medium mb-2">Confirm New Password</label>
                            <div className="relative">
                              <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 pr-12 rounded-lg bg-black border border-[#2A2A2A] text-white placeholder:text-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                                placeholder="Confirm new password"
                                required
                                minLength={6}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                className="btn-mobile absolute right-1 top-1/2 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-[#A0A0A0] hover:text-white"
                              >
                                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={saving}
                            className="btn-mobile flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-sm font-bold text-black transition-colors hover:bg-[#E65100] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:min-h-0 sm:rounded-lg"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? 'Updating...' : 'Update Password'}
                          </button>
                        </form>

                        <div className="border-t pt-6" style={{ borderColor: '#2A2A2A' }}>
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <h3 className="mb-1 text-sm font-semibold text-white">Enable 2FA via SMS</h3>
                              <p className="text-sm text-[#A0A0A0]">
                                Get a code sent to your phone for each login
                              </p>
                            </div>
                            <span className="shrink-0 self-start rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-1 text-xs font-medium text-[#A0A0A0] sm:self-auto">
                              Coming soon
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notifications Settings */}
                    {activeTab === 'notifications' && (
                      <div
                        className="rounded-xl p-4 sm:p-6"
                        style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
                      >
                        <h2
                          className="text-white font-bold mb-5 pb-4 border-b"
                          style={{ fontSize: '14px', borderColor: '#2A2A2A' }}
                        >
                          Notification Preferences
                        </h2>
                        <p className="text-[#A0A0A0] text-sm mb-6">
                          Manage your email and push notification preferences.
                        </p>

                        {loadingPreferences ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-[#2A2A2A] border-t-[#FF6B00] rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <form onSubmit={handleSaveNotificationPreferences} className="space-y-6">
                            {[
                              {
                                key: 'newOrderReceived',
                                label: 'New order received',
                                desc: 'When a customer places an order',
                                hasPush: true,
                              },
                              {
                                key: 'quoteRequest',
                                label: 'Quote request from buyer',
                                desc: 'When a buyer requests a quote',
                                hasPush: true,
                              },
                              {
                                key: 'paymentReceived',
                                label: 'Payment received',
                                desc: 'When payment is confirmed',
                                hasPush: true,
                              },
                              {
                                key: 'lowStockAlert',
                                label: 'Low stock alert',
                                desc: 'When inventory runs low',
                                hasPush: true,
                              },
                              {
                                key: 'marketingUpdates',
                                label: 'Marketing updates',
                                desc: 'News, tips, and promotions',
                                hasPush: false,
                              },
                            ].map(({ key, label, desc, hasPush }) => (
                              <div
                                key={key}
                                className="flex flex-col gap-4 border-b py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                                style={{ borderColor: '#2A2A2A' }}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-white">{label}</p>
                                  <p className="mt-0.5 text-xs text-[#A0A0A0]">{desc}</p>
                                </div>
                                <div className="flex w-full items-center justify-between gap-6 sm:w-auto sm:justify-end">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#A0A0A0] text-xs">Email</span>
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={notificationPreferences[key as keyof typeof notificationPreferences].email}
                                      onClick={() =>
                                        setNotificationPreferences({
                                          ...notificationPreferences,
                                          [key]: {
                                            ...notificationPreferences[key as keyof typeof notificationPreferences],
                                            email: !notificationPreferences[key as keyof typeof notificationPreferences].email,
                                          },
                                        })
                                      }
                                      className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${notificationPreferences[key as keyof typeof notificationPreferences].email
                                        ? 'bg-[#FF6B00]'
                                        : 'bg-[#2A2A2A]'
                                        }`}
                                    >
                                      <span
                                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${notificationPreferences[key as keyof typeof notificationPreferences].email
                                          ? 'translate-x-5'
                                          : 'translate-x-0'
                                          }`}
                                      />
                                    </button>
                                  </div>
                                  {hasPush && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#A0A0A0] text-xs">Push</span>
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={
                                          'push' in notificationPreferences[key as keyof typeof notificationPreferences] &&
                                          notificationPreferences[key as keyof typeof notificationPreferences].push
                                        }
                                        onClick={() =>
                                          setNotificationPreferences({
                                            ...notificationPreferences,
                                            [key]: {
                                              ...notificationPreferences[key as keyof typeof notificationPreferences],
                                              push: !('push' in notificationPreferences[key as keyof typeof notificationPreferences]
                                                ? notificationPreferences[key as keyof typeof notificationPreferences].push
                                                : false),
                                            },
                                          })
                                        }
                                        className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${'push' in notificationPreferences[key as keyof typeof notificationPreferences] &&
                                          notificationPreferences[key as keyof typeof notificationPreferences].push
                                          ? 'bg-[#FF6B00]'
                                          : 'bg-[#2A2A2A]'
                                          }`}
                                      >
                                        <span
                                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${'push' in notificationPreferences[key as keyof typeof notificationPreferences] &&
                                            notificationPreferences[key as keyof typeof notificationPreferences].push
                                            ? 'translate-x-5'
                                            : 'translate-x-0'
                                            }`}
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            <button
                              type="submit"
                              disabled={savingPreferences}
                              className="btn-mobile flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-sm font-bold text-black transition-colors hover:bg-[#E65100] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:min-h-0 sm:rounded-lg"
                            >
                              <Save className="w-4 h-4" />
                              {savingPreferences ? 'Saving...' : 'Save Preferences'}
                            </button>
                          </form>
                        )}
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

