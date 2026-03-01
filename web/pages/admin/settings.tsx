import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AlertCircle, Check, X, Truck, Users, Bell, ChevronDown, ChevronRight, Mail, Send, RefreshCw, Moon } from 'lucide-react';

import {
  usePlatformSettings,
  useUpdatePlatformSettings,
  useTeamMembers,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
} from '../../lib/admin/hooks/useSettings';
import { TeamMember } from '../../lib/admin/types';
import { LoadingState } from '../../components/admin/ui';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

type TeamMemberForm = {
  id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Support' | 'Finance';
};

type SortKey = 'name' | 'email' | 'role' | 'lastActiveAt';
type SortDir = 'asc' | 'desc';

const inputClass =
  'w-full rounded-xl border border-[#1f1f1f] bg-[#131313] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-primary focus:outline-none disabled:opacity-50';

// --- Helpers: shipping fee calculation (mirrors backend v4 logic for preview)
function computeShippingFeeBreakdown(
  mode: 'FLAT' | 'WEIGHT',
  platformBaseFeeNaira: number,
  perKmCustomerFeeNaira: number,
  weightPerKgFeeNaira: number,
  riderBaseFeeNaira: number,
  riderPerKmFeeNaira: number,
  methodMultiplier: number,
  minMarginMultiplier: number,
  testWeightKg: number,
  testDistanceKm: number,
): { shippingFee: number; riderCost: number; margin: number } {
  if (mode === 'FLAT') {
    const fee = platformBaseFeeNaira * methodMultiplier;
    return { shippingFee: fee, riderCost: 0, margin: fee };
  }

  const riderCost = riderBaseFeeNaira + (riderPerKmFeeNaira * testDistanceKm);
  const marginFloor = riderCost * minMarginMultiplier;

  const rawFee = (platformBaseFeeNaira + (perKmCustomerFeeNaira * testDistanceKm) + (weightPerKgFeeNaira * testWeightKg)) * methodMultiplier;
  const shippingFee = Math.max(rawFee, marginFloor);

  return {
    shippingFee,
    riderCost,
    margin: shippingFee - riderCost,
  };
}

function formatLastActive(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return '—';
  }
}

export default function AdminSettings() {
  const { data: platformSettings, isLoading: platformLoading } = usePlatformSettings();
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers();
  const updatePlatform = useUpdatePlatformSettings();
  const createTeam = useCreateTeamMember();
  const updateTeam = useUpdateTeamMember();
  const deleteTeam = useDeleteTeamMember();

  // Form state (platform v4)
  const [shippingCalculationMode, setShippingCalculationMode] = useState<'FLAT' | 'WEIGHT'>('WEIGHT');
  const [platformBaseFeeNaira, setPlatformBaseFeeNaira] = useState(1100);
  const [perKmCustomerFeeNaira, setPerKmCustomerFeeNaira] = useState(220);
  const [weightPerKgFeeNaira, setWeightPerKgFeeNaira] = useState(250);
  const [riderBaseFeeNaira, setRiderBaseFeeNaira] = useState(1100);
  const [riderPerKmFeeNaira, setRiderPerKmFeeNaira] = useState(150);
  const [minimumMarginMultiplier, setMinimumMarginMultiplier] = useState(1.30);
  const [fudgeFactor, setFudgeFactor] = useState(1.3);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(25);
  const [maxBikeWeightKg, setMaxBikeWeightKg] = useState(20);
  const [fallbackDistanceKm, setFallbackDistanceKm] = useState(7);
  const [defaultWeightKg, setDefaultWeightKg] = useState(1);
  const [standardMultiplier, setStandardMultiplier] = useState(1);
  const [expressMultiplier, setExpressMultiplier] = useState(1.5);
  const [scheduledMultiplier, setScheduledMultiplier] = useState(0.9);

  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [refundAutoApproveEnabled, setRefundAutoApproveEnabled] = useState(false);
  const [refundThresholdNaira, setRefundThresholdNaira] = useState(500);
  const [commissionPercentage, setCommissionPercentage] = useState(15);

  // Live calculator: test params
  const [testWeightKg, setTestWeightKg] = useState(1);
  const [testDistanceKm, setTestDistanceKm] = useState(5);

  // Collapsible sections (default open)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    shipping: true,
    team: true,
    notifications: true,
    refunds: true,
    appearance: true,
  });

  // Team: table sort & filter
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Team member modal
  const [memberModal, setMemberModal] = useState<TeamMemberForm | null>(null);

  // Test send loading (per channel)
  const [testSending, setTestSending] = useState<{ sms?: boolean; email?: boolean; push?: boolean }>({});

  const confirmation = useConfirmation();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load settings into form
  useEffect(() => {
    if (platformSettings) {
      setShippingCalculationMode(platformSettings.shippingCalculationMode ?? 'WEIGHT');
      setPlatformBaseFeeNaira((platformSettings.platformBaseFeeKobo ?? 110000) / 100);
      setPerKmCustomerFeeNaira((platformSettings.perKmCustomerFeeKobo ?? 22000) / 100);
      setWeightPerKgFeeNaira((platformSettings.weightPerKgFeeKobo ?? 25000) / 100);
      setRiderBaseFeeNaira((platformSettings.riderBaseFeeKoboV4 ?? 110000) / 100);
      setRiderPerKmFeeNaira((platformSettings.riderPerKmFeeKoboV4 ?? 15000) / 100);
      setMinimumMarginMultiplier(platformSettings.minimumMarginMultiplier ?? 1.30);
      setFudgeFactor(platformSettings.fudgeFactor ?? 1.30);
      setMaxDeliveryRadiusKm(platformSettings.maxDeliveryRadiusKm ?? 25);
      setMaxBikeWeightKg(platformSettings.maxBikeWeightKg ?? 20);
      setFallbackDistanceKm(platformSettings.fallbackDistanceKm ?? 7);
      setDefaultWeightKg(platformSettings.defaultWeightKg ?? 1);
      setStandardMultiplier(platformSettings.standardMultiplier ?? 1);
      setExpressMultiplier(platformSettings.expressMultiplier ?? 1.5);
      setScheduledMultiplier(platformSettings.scheduledMultiplier ?? 0.9);

      setCommissionPercentage(platformSettings.commissionPercentage ?? 15);
      setSmsEnabled(platformSettings.smsEnabled);
      setEmailEnabled(platformSettings.emailEnabled);
      setPushEnabled(platformSettings.pushEnabled);
      setRefundAutoApproveEnabled(platformSettings.refundAutoApproveEnabled ?? false);
      setRefundThresholdNaira((platformSettings.refundAutoApproveThresholdKobo ?? 50000) / 100);
    }
  }, [platformSettings]);

  // Dirty state for platform settings (for Unsaved Changes banner)
  const hasUnsavedChanges = useMemo(() => {
    if (!platformSettings) return false;
    return (
      commissionPercentage !== platformSettings.commissionPercentage ||
      shippingCalculationMode !== (platformSettings.shippingCalculationMode ?? 'WEIGHT') ||
      platformBaseFeeNaira !== (platformSettings.platformBaseFeeKobo ?? 110000) / 100 ||
      perKmCustomerFeeNaira !== (platformSettings.perKmCustomerFeeKobo ?? 22000) / 100 ||
      weightPerKgFeeNaira !== (platformSettings.weightPerKgFeeKobo ?? 25000) / 100 ||
      riderBaseFeeNaira !== (platformSettings.riderBaseFeeKoboV4 ?? 110000) / 100 ||
      riderPerKmFeeNaira !== (platformSettings.riderPerKmFeeKoboV4 ?? 15000) / 100 ||
      minimumMarginMultiplier !== (platformSettings.minimumMarginMultiplier ?? 1.30) ||
      fudgeFactor !== (platformSettings.fudgeFactor ?? 1.30) ||
      maxDeliveryRadiusKm !== (platformSettings.maxDeliveryRadiusKm ?? 25) ||
      maxBikeWeightKg !== (platformSettings.maxBikeWeightKg ?? 20) ||
      fallbackDistanceKm !== (platformSettings.fallbackDistanceKm ?? 7) ||
      defaultWeightKg !== (platformSettings.defaultWeightKg ?? 1) ||
      standardMultiplier !== (platformSettings.standardMultiplier ?? 1) ||
      expressMultiplier !== (platformSettings.expressMultiplier ?? 1.5) ||
      scheduledMultiplier !== (platformSettings.scheduledMultiplier ?? 0.9) ||
      smsEnabled !== platformSettings.smsEnabled ||
      emailEnabled !== platformSettings.emailEnabled ||
      pushEnabled !== platformSettings.pushEnabled ||
      refundAutoApproveEnabled !== (platformSettings.refundAutoApproveEnabled ?? false) ||
      refundThresholdNaira !== (platformSettings.refundAutoApproveThresholdKobo ?? 50000) / 100
    );
  }, [platformSettings, commissionPercentage, shippingCalculationMode, platformBaseFeeNaira, perKmCustomerFeeNaira, weightPerKgFeeNaira, riderBaseFeeNaira, riderPerKmFeeNaira, minimumMarginMultiplier, fudgeFactor, maxDeliveryRadiusKm, maxBikeWeightKg, fallbackDistanceKm, defaultWeightKg, standardMultiplier, expressMultiplier, scheduledMultiplier, smsEnabled, emailEnabled, pushEnabled, refundAutoApproveEnabled, refundThresholdNaira]);

  const liveFeeBreakdown = useMemo(
    () =>
      computeShippingFeeBreakdown(
        shippingCalculationMode,
        platformBaseFeeNaira,
        perKmCustomerFeeNaira,
        weightPerKgFeeNaira,
        riderBaseFeeNaira,
        riderPerKmFeeNaira,
        standardMultiplier,
        minimumMarginMultiplier,
        Math.max(0, testWeightKg),
        Math.max(0, testDistanceKm),
      ),
    [shippingCalculationMode, platformBaseFeeNaira, perKmCustomerFeeNaira, weightPerKgFeeNaira, riderBaseFeeNaira, riderPerKmFeeNaira, standardMultiplier, minimumMarginMultiplier, testWeightKg, testDistanceKm]
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (platformBaseFeeNaira < 0) newErrors.platformBaseFeeNaira = 'Base fee cannot be negative';
    if (perKmCustomerFeeNaira < 0) newErrors.perKmCustomerFeeNaira = 'Per KM fee cannot be negative';
    if (weightPerKgFeeNaira < 0) newErrors.weightPerKgFeeNaira = 'Per KG fee cannot be negative';
    if (riderBaseFeeNaira < 0) newErrors.riderBaseFeeNaira = 'Rider base fee cannot be negative';
    if (riderPerKmFeeNaira < 0) newErrors.riderPerKmFeeNaira = 'Rider per KM fee cannot be negative';
    if (minimumMarginMultiplier < 1.0) newErrors.minimumMarginMultiplier = 'Floor multiplier must be >= 1.0';
    if (defaultWeightKg < 0) newErrors.defaultWeightKg = 'Default weight cannot be negative';
    if (standardMultiplier < 0) newErrors.standardMultiplier = 'Standard multiplier cannot be negative';
    if (expressMultiplier < 0) newErrors.expressMultiplier = 'Express multiplier cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast('error', 'Please fix validation errors');
      return;
    }
    try {
      await updatePlatform.mutateAsync({
        commissionPercentage,
        shippingCalculationMode,
        platformBaseFeeKobo: Math.round(platformBaseFeeNaira * 100),
        perKmCustomerFeeKobo: Math.round(perKmCustomerFeeNaira * 100),
        weightPerKgFeeKobo: Math.round(weightPerKgFeeNaira * 100),
        riderBaseFeeKoboV4: Math.round(riderBaseFeeNaira * 100),
        riderPerKmFeeKoboV4: Math.round(riderPerKmFeeNaira * 100),
        minimumMarginMultiplier,
        fudgeFactor,
        maxDeliveryRadiusKm,
        maxBikeWeightKg,
        fallbackDistanceKm,
        defaultWeightKg,
        standardMultiplier,
        expressMultiplier,
        scheduledMultiplier,
        smsEnabled,
        emailEnabled,
        pushEnabled,
        refundAutoApproveEnabled,
        refundAutoApproveThresholdKobo: Math.round(refundThresholdNaira * 100),
      });
      showToast('success', 'Settings saved successfully');
    } catch (error) {
      showToast('error', 'Failed to save settings');
      console.error('Save error:', error);
    }
  };

  const toggleSection = (key: string) => {
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  };

  const handleAddTeamMember = () => {
    setMemberModal({ name: '', email: '', role: 'Support' });
  };

  const handleInviteViaEmail = () => {
    setMemberModal({ name: '', email: '', role: 'Support' });
  };

  const handleEditTeamMember = (member: TeamMember) => {
    setMemberModal({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
    });
  };

  const handleSaveTeamMember = async () => {
    if (!memberModal) return;
    if (!memberModal.name || !memberModal.email) {
      showToast('error', 'Name and email are required');
      return;
    }
    try {
      if (memberModal.id) {
        await updateTeam.mutateAsync({
          memberId: memberModal.id,
          payload: { name: memberModal.name, email: memberModal.email, role: memberModal.role },
        });
        showToast('success', 'Team member updated');
      } else {
        await createTeam.mutateAsync({
          name: memberModal.name,
          email: memberModal.email,
          role: memberModal.role,
        });
        showToast('success', 'Team member added');
      }
      setMemberModal(null);
    } catch (error) {
      showToast('error', 'Failed to save team member');
      console.error('Team member save error:', error);
    }
  };

  const handleDeleteTeamMember = async (memberId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Remove Team Member',
      message: 'Are you sure you want to remove this team member?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    confirmation.setLoading(true);
    try {
      await deleteTeam.mutateAsync(memberId);
      showToast('success', 'Team member removed');
    } catch (error) {
      showToast('error', 'Failed to remove team member');
      console.error('Team member delete error:', error);
    } finally {
      confirmation.setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (!platformSettings) return;
    setShippingCalculationMode(platformSettings.shippingCalculationMode ?? 'WEIGHT');
    setPlatformBaseFeeNaira((platformSettings.platformBaseFeeKobo ?? 110000) / 100);
    setPerKmCustomerFeeNaira((platformSettings.perKmCustomerFeeKobo ?? 22000) / 100);
    setWeightPerKgFeeNaira((platformSettings.weightPerKgFeeKobo ?? 25000) / 100);
    setRiderBaseFeeNaira((platformSettings.riderBaseFeeKoboV4 ?? 110000) / 100);
    setRiderPerKmFeeNaira((platformSettings.riderPerKmFeeKoboV4 ?? 15000) / 100);
    setMinimumMarginMultiplier(platformSettings.minimumMarginMultiplier ?? 1.30);
    setFudgeFactor(platformSettings.fudgeFactor ?? 1.30);
    setMaxDeliveryRadiusKm(platformSettings.maxDeliveryRadiusKm ?? 25);
    setMaxBikeWeightKg(platformSettings.maxBikeWeightKg ?? 20);
    setFallbackDistanceKm(platformSettings.fallbackDistanceKm ?? 7);
    setDefaultWeightKg(platformSettings.defaultWeightKg ?? 1);
    setStandardMultiplier(platformSettings.standardMultiplier ?? 1);
    setExpressMultiplier(platformSettings.expressMultiplier ?? 1.5);
    setScheduledMultiplier(platformSettings.scheduledMultiplier ?? 0.9);
    setCommissionPercentage(platformSettings.commissionPercentage ?? 15);
    setSmsEnabled(platformSettings.smsEnabled);
    setEmailEnabled(platformSettings.emailEnabled);
    setPushEnabled(platformSettings.pushEnabled);
    setRefundAutoApproveEnabled(platformSettings.refundAutoApproveEnabled ?? false);
    setRefundThresholdNaira((platformSettings.refundAutoApproveThresholdKobo ?? 50000) / 100);
    setErrors({});
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredAndSortedMembers = useMemo(() => {
    let list = teamMembers ?? [];
    if (roleFilter !== 'all') list = list.filter((m) => m.role === roleFilter);
    return [...list].sort((a, b) => {
      let aVal: string | number | undefined = a[sortKey];
      let bVal: string | number | undefined = b[sortKey];
      if (sortKey === 'lastActiveAt') {
        aVal = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        bVal = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      }
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [teamMembers, roleFilter, sortKey, sortDir]);

  const handleTestSend = async (channel: 'sms' | 'email' | 'push') => {
    setTestSending((s) => ({ ...s, [channel]: true }));
    try {
      // Placeholder: in a real app you would call an API to send a test notification
      await new Promise((r) => setTimeout(r, 800));
      showToast('success', `Test ${channel} sent (demo)`);
    } catch {
      showToast('error', `Failed to send test ${channel}`);
    } finally {
      setTestSending((s) => ({ ...s, [channel]: false }));
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="ml-1 inline-block w-4 opacity-40">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (platformLoading || teamLoading) {
    return (
      <AdminLayout>
        <LoadingState />
      </AdminLayout>
    );
  }

  return (
    <>
      <AdminLayout>
        <div className={`space-y-4 px-6 py-8 lg:px-10 ${hasUnsavedChanges ? 'pb-24' : ''}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">Settings</h1>
              <p className="text-sm text-gray-400">Manage platform-wide configurations</p>
            </div>
            <button
              onClick={handleSave}
              disabled={updatePlatform.isPending || !hasUnsavedChanges}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9140] disabled:opacity-50"
            >
              {updatePlatform.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {toast && (
            <div
              className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${toast.type === 'success'
                ? 'border-green-500/20 bg-green-500/10 text-green-500'
                : 'border-red-500/20 bg-red-500/10 text-red-500'
                }`}
            >
              {toast.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-2">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ——— Shipping & Logistics ——— */}
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-xl overflow-hidden backdrop-blur-md bg-opacity-80">
            <button
              type="button"
              onClick={() => toggleSection('shipping')}
              className="flex w-full items-center gap-4 px-8 py-6 text-left transition hover:bg-[#181818]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_20px_rgba(255,102,0,0.15)]">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">Shipping & Logistics</span>
                <p className="text-sm text-gray-500">v4.1 Adaptive Pricing Engine</p>
              </div>
              {openSections.shipping ? (
                <ChevronDown className="ml-auto h-6 w-6 text-gray-600" />
              ) : (
                <ChevronRight className="ml-auto h-6 w-6 text-gray-600" />
              )}
            </button>
            {openSections.shipping && (
              <div className="border-t border-[#1f1f1f] p-8">
                <div className="grid gap-10 lg:grid-cols-12">
                  <div className="lg:col-span-8 space-y-8">
                    {/* Mode Selector */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="text-base font-semibold text-white">Pricing Model</h3>
                        <p className="text-sm text-gray-500">Choose how routes are priced.</p>
                      </div>
                      <div className="flex ml-auto rounded-2xl border border-[#2a2a2a] bg-black/40 p-1.5 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setShippingCalculationMode('FLAT')}
                          className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300 ${shippingCalculationMode === 'FLAT'
                            ? 'bg-primary text-black shadow-[0_4px_15px_rgba(255,102,0,0.3)]'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                          Legacy Flat
                        </button>
                        <button
                          type="button"
                          onClick={() => setShippingCalculationMode('WEIGHT')}
                          className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-300 ${shippingCalculationMode === 'WEIGHT'
                            ? 'bg-primary text-black shadow-[0_4px_15px_rgba(255,102,0,0.3)]'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                          V4 Adaptive
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      {/* Section: Customer Pricing */}
                      <div className="space-y-5 rounded-2xl border border-[#1f1f1f] bg-black/20 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                          <h4 className="text-xs font-bold uppercase tracking-widest text-blue-500/80">Customer Billing</h4>
                        </div>

                        <div className="space-y-4">
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-400">Platform Base Fee (₦)</span>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                              <input
                                type="number"
                                value={platformBaseFeeNaira}
                                onChange={(e) => setPlatformBaseFeeNaira(Number(e.target.value))}
                                className={`${inputClass} pl-8 border-blue-500/10 focus:border-blue-500/30`}
                              />
                            </div>
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-400">Per KM Surcharge (₦)</span>
                            <input
                              type="number"
                              value={perKmCustomerFeeNaira}
                              onChange={(e) => setPerKmCustomerFeeNaira(Number(e.target.value))}
                              className={`${inputClass} border-blue-500/10 focus:border-blue-500/30`}
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-400">Per KG Weight Fee (₦)</span>
                            <input
                              type="number"
                              value={weightPerKgFeeNaira}
                              onChange={(e) => setWeightPerKgFeeNaira(Number(e.target.value))}
                              className={`${inputClass} border-blue-500/10 focus:border-blue-500/30`}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Section: Rider Earnings */}
                      <div className="space-y-5 rounded-2xl border border-[#1f1f1f] bg-black/20 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                          <h4 className="text-xs font-bold uppercase tracking-widest text-green-500/80">Rider Compensation</h4>
                        </div>

                        <div className="space-y-4">
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-400">Rider Drop-off Base (₦)</span>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                              <input
                                type="number"
                                value={riderBaseFeeNaira}
                                onChange={(e) => setRiderBaseFeeNaira(Number(e.target.value))}
                                className={`${inputClass} pl-8 border-green-500/10 focus:border-green-500/30`}
                              />
                            </div>
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-400">Rider Per KM Pay (₦)</span>
                            <input
                              type="number"
                              value={riderPerKmFeeNaira}
                              onChange={(e) => setRiderPerKmFeeNaira(Number(e.target.value))}
                              className={`${inputClass} border-green-500/10 focus:border-green-500/30`}
                            />
                          </label>
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-gray-400">Min. Margin Multiplier</span>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.05"
                                value={minimumMarginMultiplier}
                                onChange={(e) => setMinimumMarginMultiplier(Number(e.target.value))}
                                className={`${inputClass} border-green-500/10 focus:border-green-500/30 pr-12`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">X</span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Operational Limits */}
                    <div className="space-y-6 rounded-2xl border border-[#1f1f1f] bg-[#141414] p-6">
                      <h4 className="text-sm font-bold text-white">Advanced Flow Controls</h4>
                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        <label className="space-y-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Fudge Factor</span>
                          <input type="number" step="0.1" value={fudgeFactor} onChange={(e) => setFudgeFactor(Number(e.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Max Radius (km)</span>
                          <input type="number" value={maxDeliveryRadiusKm} onChange={(e) => setMaxDeliveryRadiusKm(Number(e.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Max Weight (kg)</span>
                          <input type="number" value={maxBikeWeightKg} onChange={(e) => setMaxBikeWeightKg(Number(e.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Fallback (km)</span>
                          <input type="number" value={fallbackDistanceKm} onChange={(e) => setFallbackDistanceKm(Number(e.target.value))} className={inputClass} />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 border-t border-[#1f1f1f] pt-6">
                        <label className="space-y-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Standard Mult.</span>
                          <input type="number" step="0.1" value={standardMultiplier} onChange={(e) => setStandardMultiplier(Number(e.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Express Mult.</span>
                          <input type="number" step="0.1" value={expressMultiplier} onChange={(e) => setExpressMultiplier(Number(e.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Scheduled Mult.</span>
                          <input type="number" step="0.1" value={scheduledMultiplier} onChange={(e) => setScheduledMultiplier(Number(e.target.value))} className={inputClass} />
                        </label>
                        <label className="space-y-2">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Market Comm %</span>
                          <div className="relative">
                            <input type="number" value={commissionPercentage} onChange={(e) => setCommissionPercentage(Number(e.target.value))} className={inputClass} />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">%</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Profitability Sandbox */}
                  <div className="lg:col-span-4">
                    <div className="sticky top-6 space-y-4 rounded-3xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 text-primary animate-spin-slow" />
                        </div>
                        <h4 className="font-bold text-white">Profitability Sandbox</h4>
                      </div>

                      <div className="space-y-4">
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-gray-500">Test Distance (KM)</span>
                          <input
                            type="number"
                            value={testDistanceKm}
                            onChange={(e) => setTestDistanceKm(Number(e.target.value))}
                            className="w-full bg-black/40 border border-[#2a2a2a] rounded-xl px-4 py-2 text-sm text-white"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-xs font-medium text-gray-500">Test Weight (KG)</span>
                          <input
                            type="number"
                            value={testWeightKg}
                            onChange={(e) => setTestWeightKg(Number(e.target.value))}
                            className="w-full bg-black/40 border border-[#2a2a2a] rounded-xl px-4 py-2 text-sm text-white"
                          />
                        </label>
                      </div>

                      <div className="my-6 space-y-3 border-t border-white/5 pt-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 font-medium">Customer Pays</span>
                          <span className="font-bold text-white">₦{liveFeeBreakdown.shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 font-medium">Rider Earns</span>
                          <span className="font-bold text-orange-400">- ₦{liveFeeBreakdown.riderCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-4 border border-white/10">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Net Margin</span>
                          <span className={`text-xl font-black ${liveFeeBreakdown.margin >= 0 ? 'text-green-400' : 'text-red-400'} drop-shadow-lg`}>
                            ₦{liveFeeBreakdown.margin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {liveFeeBreakdown.margin < 0 && (
                          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-tighter">
                            <AlertCircle className="h-3 w-3" /> Warning: Unprofitable Route Configuration
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={updatePlatform.isPending || !hasUnsavedChanges}
                        className="w-full py-4 rounded-2xl bg-primary text-black font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(255,102,0,0.4)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                      >
                        {updatePlatform.isPending ? 'Syncing...' : 'Apply Config'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>


          {/* ——— Team & Permissions ——— */}
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('team')}
              className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-[#181818]"
            >
              <Users className="h-6 w-6 shrink-0 text-primary" />
              <span className="text-lg font-semibold text-white">Team & Permissions</span>
              {openSections.team ? (
                <ChevronDown className="ml-auto h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="ml-auto h-5 w-5 text-gray-400" />
              )}
            </button>
            {openSections.team && (
              <div className="border-t border-[#1f1f1f] p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-gray-400">Control access across your admin team.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleInviteViaEmail}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-black"
                    >
                      <Mail className="h-4 w-4" />
                      Invite via Email
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTeamMember}
                      className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#ff9140]"
                    >
                      Add Team Member
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    Filter by role
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    >
                      <option value="all">All roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Support">Support</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </label>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#151515]">
                  <table className="min-w-full divide-y divide-[#2a2a2a] text-sm">
                    <thead className="bg-[#1a1a1a] text-left text-xs uppercase tracking-wide text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-4 font-semibold">
                          <button type="button" onClick={() => handleSort('name')} className="flex items-center hover:text-white">
                            Name <SortIcon column="name" />
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-4 font-semibold">
                          <button type="button" onClick={() => handleSort('email')} className="flex items-center hover:text-white">
                            Email <SortIcon column="email" />
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-4 font-semibold">
                          <button type="button" onClick={() => handleSort('role')} className="flex items-center hover:text-white">
                            Role <SortIcon column="role" />
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-4 font-semibold">
                          <button type="button" onClick={() => handleSort('lastActiveAt')} className="flex items-center hover:text-white">
                            Last active <SortIcon column="lastActiveAt" />
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2a2a2a] text-gray-300">
                      {filteredAndSortedMembers.length > 0 ? (
                        filteredAndSortedMembers.map((member) => (
                          <tr key={member.id}>
                            <td className="px-6 py-4 font-medium text-white">{member.name}</td>
                            <td className="px-6 py-4">{member.email}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                {member.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400">{formatLastActive(member.lastActiveAt)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  className="text-sm font-medium text-primary transition hover:text-[#ffae73]"
                                  onClick={() => handleEditTeamMember(member)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="text-sm font-medium text-red-500 transition hover:text-red-400"
                                  onClick={() => handleDeleteTeamMember(member.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            {roleFilter === 'all' ? 'No team members yet. Add one or invite via email.' : 'No members match this role.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ——— Notifications ——— */}
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-xl overflow-hidden backdrop-blur-md bg-opacity-80">
            <button
              type="button"
              onClick={() => toggleSection('notifications')}
              className="flex w-full items-center gap-4 px-8 py-6 text-left transition hover:bg-[#181818]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">System Alerts</span>
                <p className="text-sm text-gray-500">Enable/Disable global comms channels.</p>
              </div>
              {openSections.notifications ? (
                <ChevronDown className="ml-auto h-6 w-6 text-gray-600" />
              ) : (
                <ChevronRight className="ml-auto h-6 w-6 text-gray-600" />
              )}
            </button>
            {openSections.notifications && (
              <div className="border-t border-[#1f1f1f] p-8 space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { id: 'sms', label: 'SMS Notifications', enabled: smsEnabled, setter: setSmsEnabled, desc: 'Direct text alerts for urgent updates.' },
                    { id: 'email', label: 'Email Reports', enabled: emailEnabled, setter: setEmailEnabled, desc: 'Transaction receipts and daily digests.' },
                    { id: 'push', label: 'Push Notifications', enabled: pushEnabled, setter: setPushEnabled, desc: 'Real-time rider and buyer app alerts.' },
                  ].map((channel) => (
                    <div key={channel.id} className="flex flex-col gap-4 p-6 rounded-2xl border border-[#1f1f1f] bg-black/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{channel.label}</span>
                        <button
                          type="button"
                          onClick={() => channel.setter(!channel.enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${channel.enabled ? 'bg-blue-500' : 'bg-[#222]'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${channel.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">{channel.desc}</p>
                      <button
                        type="button"
                        onClick={() => handleTestSend(channel.id as 'sms' | 'email' | 'push')}
                        disabled={testSending[channel.id as keyof typeof testSending] || !channel.enabled}
                        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] py-2 text-xs font-bold text-gray-400 transition hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        {testSending[channel.id as keyof typeof testSending] ? 'Sending...' : 'Send Test'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ——— Refunds ——— */}
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-xl overflow-hidden backdrop-blur-md bg-opacity-80">
            <button
              type="button"
              onClick={() => toggleSection('refunds')}
              className="flex w-full items-center gap-4 px-8 py-6 text-left transition hover:bg-[#181818]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">Refund Policy</span>
                <p className="text-sm text-gray-500">Auto-approval rules for buyer disputes.</p>
              </div>
              {openSections.refunds ? (
                <ChevronDown className="ml-auto h-6 w-6 text-gray-600" />
              ) : (
                <ChevronRight className="ml-auto h-6 w-6 text-gray-600" />
              )}
            </button>
            {openSections.refunds && (
              <div className="border-t border-[#1f1f1f] p-8 space-y-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center p-6 rounded-2xl border border-[#1f1f1f] bg-black/20">
                  <div className="flex-1">
                    <span className="block text-sm font-bold text-white">Auto-approve Micro-Refunds</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Instantly credit buyers for disputes below the threshold. Reduces support tickets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRefundAutoApproveEnabled(!refundAutoApproveEnabled)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${refundAutoApproveEnabled ? 'bg-orange-500' : 'bg-[#222]'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${refundAutoApproveEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="max-w-md">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-400">Refund Threshold (₦)</span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                      <input
                        type="number"
                        value={refundThresholdNaira}
                        onChange={(e) => setRefundThresholdNaira(Number(e.target.value))}
                        className={`${inputClass} pl-8 max-w-[180px] border-orange-500/10 focus:border-orange-500/30`}
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 italic">Disputes at or below this amount skip manual review.</p>
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* ——— Appearance ——— */}
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-xl overflow-hidden backdrop-blur-md bg-opacity-80">
            <button
              type="button"
              onClick={() => toggleSection('appearance')}
              className="flex w-full items-center gap-4 px-8 py-6 text-left transition hover:bg-[#181818]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">Appearance</span>
                <p className="text-sm text-gray-500">Customise your admin dashboard display.</p>
              </div>
              {openSections.appearance ? (
                <ChevronDown className="ml-auto h-6 w-6 text-gray-600" />
              ) : (
                <ChevronRight className="ml-auto h-6 w-6 text-gray-600" />
              )}
            </button>
            {openSections.appearance && (
              <div className="border-t border-[#1f1f1f] p-8 space-y-6">
                <div className="flex items-center justify-between p-6 rounded-2xl border border-[#1f1f1f] bg-black/20">
                  <div className="flex-1">
                    <span className="block text-sm font-bold text-white">Interface Theme</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Switch between Light and Dark mode for the admin panel.
                    </p>
                  </div>

                </div>
              </div>
            )}
          </section>

          {/* Team Member Modal */}
          {memberModal && (
            <>
              <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setMemberModal(null)} />
              <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-2xl">
                <h3 className="mb-4 text-xl font-semibold text-white">
                  {memberModal.id ? 'Edit Team Member' : 'Add Team Member'}
                </h3>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Name
                    <input
                      type="text"
                      value={memberModal.name}
                      onChange={(e) => setMemberModal({ ...memberModal, name: e.target.value })}
                      className={`${inputClass} mt-2`}
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-300">
                    Email
                    <input
                      type="email"
                      value={memberModal.email}
                      onChange={(e) => setMemberModal({ ...memberModal, email: e.target.value })}
                      className={`${inputClass} mt-2`}
                      placeholder="colleague@company.com"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-300">
                    Role
                    <select
                      value={memberModal.role}
                      onChange={(e) =>
                        setMemberModal({ ...memberModal, role: e.target.value as 'Admin' | 'Support' | 'Finance' })
                      }
                      className={`${inputClass} mt-2`}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Support">Support</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </label>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSaveTeamMember}
                    disabled={createTeam.isPending || updateTeam.isPending}
                    className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#ff9140] disabled:opacity-50"
                  >
                    {createTeam.isPending || updateTeam.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setMemberModal(null)}
                    className="flex-1 rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-[#1a1a1a]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminLayout>

      {/* Floating Unsaved Changes banner */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-amber-500/30 bg-[#1a1a1a] px-6 py-4 shadow-lg">
          <span className="text-sm font-medium text-amber-400">You have unsaved changes</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="rounded-full border border-[#3a3a3a] px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-[#252525]"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={updatePlatform.isPending}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#ff9140] disabled:opacity-50"
            >
              {updatePlatform.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

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
