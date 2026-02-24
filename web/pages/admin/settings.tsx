import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AlertCircle, Check, X, Truck, Users, Bell, ChevronDown, ChevronRight, Mail, Send, RefreshCw } from 'lucide-react';
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

// --- Helpers: shipping fee calculation (mirrors backend logic for preview)
function computeShippingFeeNaira(
  mode: 'FLAT' | 'WEIGHT',
  baseFeeNaira: number,
  perKgFeeNaira: number,
  testWeightKg: number,
  standardMultiplier: number
): number {
  const base = mode === 'FLAT' ? baseFeeNaira : baseFeeNaira + testWeightKg * perKgFeeNaira;
  return base * standardMultiplier;
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

  // Form state (platform)
  const [deliveryCalculation, setDeliveryCalculation] = useState<'flat' | 'distance'>('distance');
  const [baseFee, setBaseFee] = useState(1500);
  const [perMileFee, setPerMileFee] = useState(350);
  const [shippingCalculationMode, setShippingCalculationMode] = useState<'FLAT' | 'WEIGHT'>('WEIGHT');
  const [baseFeeNaira, setBaseFeeNaira] = useState(15);
  const [perKgFeeNaira, setPerKgFeeNaira] = useState(2);
  const [defaultWeightKg, setDefaultWeightKg] = useState(1);
  const [standardMultiplier, setStandardMultiplier] = useState(1);
  const [expressMultiplier, setExpressMultiplier] = useState(1.5);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [refundAutoApproveEnabled, setRefundAutoApproveEnabled] = useState(false);
  const [refundThresholdNaira, setRefundThresholdNaira] = useState(500);

  // Live calculator: test weight (kg)
  const [testWeightKg, setTestWeightKg] = useState(1);

  // Collapsible sections (default open)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    shipping: true,
    team: true,
    notifications: true,
    refunds: true,
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
      setDeliveryCalculation(platformSettings.deliveryCalculation);
      setBaseFee(platformSettings.baseFee);
      setPerMileFee(platformSettings.perMileFee);
      setShippingCalculationMode(platformSettings.shippingCalculationMode ?? 'WEIGHT');
      setBaseFeeNaira((platformSettings.baseFeeKobo ?? 1500) / 100);
      setPerKgFeeNaira((platformSettings.perKgFeeKobo ?? 200) / 100);
      setDefaultWeightKg(platformSettings.defaultWeightKg ?? 1);
      setStandardMultiplier(platformSettings.standardMultiplier ?? 1);
      setExpressMultiplier(platformSettings.expressMultiplier ?? 1.5);
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
      deliveryCalculation !== platformSettings.deliveryCalculation ||
      baseFee !== platformSettings.baseFee ||
      perMileFee !== platformSettings.perMileFee ||
      shippingCalculationMode !== (platformSettings.shippingCalculationMode ?? 'WEIGHT') ||
      baseFeeNaira !== (platformSettings.baseFeeKobo ?? 1500) / 100 ||
      perKgFeeNaira !== (platformSettings.perKgFeeKobo ?? 200) / 100 ||
      defaultWeightKg !== (platformSettings.defaultWeightKg ?? 1) ||
      standardMultiplier !== (platformSettings.standardMultiplier ?? 1) ||
      expressMultiplier !== (platformSettings.expressMultiplier ?? 1.5) ||
      smsEnabled !== platformSettings.smsEnabled ||
      emailEnabled !== platformSettings.emailEnabled ||
      pushEnabled !== platformSettings.pushEnabled ||
      refundAutoApproveEnabled !== (platformSettings.refundAutoApproveEnabled ?? false) ||
      refundThresholdNaira !== (platformSettings.refundAutoApproveThresholdKobo ?? 50000) / 100
    );
  }, [platformSettings, deliveryCalculation, baseFee, perMileFee, shippingCalculationMode, baseFeeNaira, perKgFeeNaira, defaultWeightKg, standardMultiplier, expressMultiplier, smsEnabled, emailEnabled, pushEnabled, refundAutoApproveEnabled, refundThresholdNaira]);

  const liveFeeNaira = useMemo(
    () =>
      computeShippingFeeNaira(
        shippingCalculationMode,
        baseFeeNaira,
        perKgFeeNaira,
        Math.max(0, testWeightKg),
        standardMultiplier
      ),
    [shippingCalculationMode, baseFeeNaira, perKgFeeNaira, testWeightKg, standardMultiplier]
  );

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (baseFee < 0) newErrors.baseFee = 'Base fee cannot be negative';
    if (perMileFee < 0) newErrors.perMileFee = 'Per mile fee cannot be negative';
    if (baseFeeNaira < 0) newErrors.baseFeeNaira = 'Base fee cannot be negative';
    if (perKgFeeNaira < 0) newErrors.perKgFeeNaira = 'Per kg fee cannot be negative';
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
        commissionPercentage: platformSettings?.commissionPercentage ?? 15,
        deliveryCalculation,
        baseFee,
        perMileFee,
        shippingCalculationMode,
        baseFeeKobo: Math.round(baseFeeNaira * 100),
        perKgFeeKobo: Math.round(perKgFeeNaira * 100),
        defaultWeightKg,
        standardMultiplier,
        expressMultiplier,
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
    setDeliveryCalculation(platformSettings.deliveryCalculation);
    setBaseFee(platformSettings.baseFee);
    setPerMileFee(platformSettings.perMileFee);
    setShippingCalculationMode(platformSettings.shippingCalculationMode ?? 'WEIGHT');
    setBaseFeeNaira((platformSettings.baseFeeKobo ?? 1500) / 100);
    setPerKgFeeNaira((platformSettings.perKgFeeKobo ?? 200) / 100);
    setDefaultWeightKg(platformSettings.defaultWeightKg ?? 1);
    setStandardMultiplier(platformSettings.standardMultiplier ?? 1);
    setExpressMultiplier(platformSettings.expressMultiplier ?? 1.5);
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
              className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
                toast.type === 'success'
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
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('shipping')}
              className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-[#181818]"
            >
              <Truck className="h-6 w-6 shrink-0 text-primary" />
              <span className="text-lg font-semibold text-white">Shipping & Logistics</span>
              {openSections.shipping ? (
                <ChevronDown className="ml-auto h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="ml-auto h-5 w-5 text-gray-400" />
              )}
            </button>
            {openSections.shipping && (
              <div className="border-t border-[#1f1f1f] p-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-4 text-base font-semibold text-white">Shipping Fee Rules (In-House Logistics)</h3>
                    <p className="mb-4 text-sm text-gray-400">Control how shipping fees are calculated. All fees are global — no seller overrides.</p>

                    {/* Segmented toggle: Flat vs Weight-based */}
                    <label className="mb-3 block text-sm font-medium text-gray-300">Calculation mode</label>
                    <div className="inline-flex rounded-xl border border-[#2a2a2a] bg-[#151515] p-1">
                      <button
                        type="button"
                        onClick={() => setShippingCalculationMode('FLAT')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          shippingCalculationMode === 'FLAT'
                            ? 'bg-primary text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Flat rate
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingCalculationMode('WEIGHT')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          shippingCalculationMode === 'WEIGHT'
                            ? 'bg-primary text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Weight-based
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {shippingCalculationMode === 'FLAT' ? 'Fixed fee per order.' : 'Base fee + per kg. Fee × multiplier for standard/express.'}
                    </p>

                    <div className="mt-4 space-y-4">
                      <label className="block text-sm font-medium text-gray-300">
                        Base Fee (₦)
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={baseFeeNaira}
                          onChange={(e) => setBaseFeeNaira(Number(e.target.value))}
                          className={`${inputClass} mt-2 ${errors.baseFeeNaira ? 'border-red-500' : ''}`}
                          placeholder="15"
                        />
                        {errors.baseFeeNaira && <span className="mt-1 text-xs text-red-500">{errors.baseFeeNaira}</span>}
                        <span className="mt-1 block text-xs text-gray-500">Fixed base amount (used in WEIGHT mode)</span>
                      </label>
                      <label className="block text-sm font-medium text-gray-300">
                        Per Kg Fee (₦)
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={perKgFeeNaira}
                          onChange={(e) => setPerKgFeeNaira(Number(e.target.value))}
                          className={`${inputClass} mt-2 ${errors.perKgFeeNaira ? 'border-red-500' : ''}`}
                          placeholder="2"
                        />
                        {errors.perKgFeeNaira && <span className="mt-1 text-xs text-red-500">{errors.perKgFeeNaira}</span>}
                        <span className="mt-1 block text-xs text-gray-500">Amount per kg (WEIGHT mode)</span>
                      </label>
                      <label className="block text-sm font-medium text-gray-300">
                        Default Product Weight (kg)
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={defaultWeightKg}
                          onChange={(e) => setDefaultWeightKg(Number(e.target.value))}
                          className={`${inputClass} mt-2 ${errors.defaultWeightKg ? 'border-red-500' : ''}`}
                          placeholder="1"
                        />
                        {errors.defaultWeightKg && <span className="mt-1 text-xs text-red-500">{errors.defaultWeightKg}</span>}
                        <span className="mt-1 block text-xs text-gray-500">Used when product has no weight set</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="block text-sm font-medium text-gray-300">
                          Standard multiplier
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={standardMultiplier}
                            onChange={(e) => setStandardMultiplier(Number(e.target.value))}
                            className={`${inputClass} mt-2 ${errors.standardMultiplier ? 'border-red-500' : ''}`}
                          />
                          {errors.standardMultiplier && <span className="mt-1 text-xs text-red-500">{errors.standardMultiplier}</span>}
                        </label>
                        <label className="block text-sm font-medium text-gray-300">
                          Express multiplier
                          <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={expressMultiplier}
                            onChange={(e) => setExpressMultiplier(Number(e.target.value))}
                            className={`${inputClass} mt-2 ${errors.expressMultiplier ? 'border-red-500' : ''}`}
                          />
                          {errors.expressMultiplier && <span className="mt-1 text-xs text-red-500">{errors.expressMultiplier}</span>}
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">Shipping fee = base fee × multiplier. Pickup = ₦0.</p>
                    </div>
                  </div>

                  {/* Live fee calculator */}
                  <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-5">
                    <h4 className="mb-2 text-sm font-semibold text-white">Live fee calculator</h4>
                    <p className="mb-4 text-xs text-gray-400">Enter a test weight to see the computed shipping fee (standard) before saving.</p>
                    <label className="block text-sm font-medium text-gray-300">
                      Test weight (kg)
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={testWeightKg}
                        onChange={(e) => setTestWeightKg(Number(e.target.value))}
                        className={`${inputClass} mt-2`}
                        placeholder="1"
                      />
                    </label>
                    <div className="mt-4 rounded-xl bg-[#1a1a1a] px-4 py-3">
                      <span className="text-xs text-gray-400">Computed shipping fee (standard)</span>
                      <p className="mt-1 text-2xl font-bold text-primary">₦{liveFeeNaira.toFixed(2)}</p>
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
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('notifications')}
              className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-[#181818]"
            >
              <Bell className="h-6 w-6 shrink-0 text-primary" />
              <span className="text-lg font-semibold text-white">Notifications</span>
              {openSections.notifications ? (
                <ChevronDown className="ml-auto h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="ml-auto h-5 w-5 text-gray-400" />
              )}
            </button>
            {openSections.notifications && (
              <div className="border-t border-[#1f1f1f] p-6">
                <p className="mb-5 text-sm text-gray-400">Choose how admins receive important alerts. Use “Send test” to verify each channel.</p>

                <div className="space-y-5">
                  {/* SMS */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setSmsEnabled((prev) => !prev)}
                      className="flex flex-1 cursor-pointer items-start gap-4 text-left transition hover:opacity-90"
                    >
                      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#2f2f2f] transition-colors duration-200 ${smsEnabled ? 'bg-primary' : 'bg-[#1e1e1e]'}`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-out ${smsEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </span>
                      <div>
                        <span className="block text-sm font-semibold text-white">SMS Notifications</span>
                        <span className="text-xs text-gray-400">
                          Triggered by: order status changes, delivery updates, payout alerts, and urgent platform issues. Instant alerts for critical updates.
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleTestSend('sms'); }}
                      disabled={testSending.sms || !smsEnabled}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {testSending.sms ? 'Sending...' : 'Send test'}
                    </button>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setEmailEnabled((prev) => !prev)}
                      className="flex flex-1 cursor-pointer items-start gap-4 text-left transition hover:opacity-90"
                    >
                      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#2f2f2f] transition-colors duration-200 ${emailEnabled ? 'bg-primary' : 'bg-[#1e1e1e]'}`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-out ${emailEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </span>
                      <div>
                        <span className="block text-sm font-semibold text-white">Email Notifications</span>
                        <span className="text-xs text-gray-400">
                          Triggered by: daily digests, new orders, refund requests, seller verifications, and broadcast announcements. Summaries and important communication.
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleTestSend('email'); }}
                      disabled={testSending.email || !emailEnabled}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {testSending.email ? 'Sending...' : 'Send test'}
                    </button>
                  </div>

                  {/* Push */}
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setPushEnabled((prev) => !prev)}
                      className="flex flex-1 cursor-pointer items-start gap-4 text-left transition hover:opacity-90"
                    >
                      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#2f2f2f] transition-colors duration-200 ${pushEnabled ? 'bg-primary' : 'bg-[#1e1e1e]'}`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-out ${pushEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </span>
                      <div>
                        <span className="block text-sm font-semibold text-white">Push Notifications</span>
                        <span className="text-xs text-gray-400">
                          Triggered by: real-time order updates, new support tickets, delivery milestones, and instant alerts when the admin panel is open. Desktop notifications for live events.
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleTestSend('push'); }}
                      disabled={testSending.push || !pushEnabled}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {testSending.push ? 'Sending...' : 'Send test'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ——— Refunds ——— */}
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('refunds')}
              className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-[#181818]"
            >
              <RefreshCw className="h-6 w-6 shrink-0 text-primary" />
              <span className="text-lg font-semibold text-white">Refunds</span>
              {openSections.refunds ? (
                <ChevronDown className="ml-auto h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="ml-auto h-5 w-5 text-gray-400" />
              )}
            </button>
            {openSections.refunds && (
              <div className="border-t border-[#1f1f1f] p-6">
                <p className="mb-5 text-sm text-gray-400">
                  Auto-approve low-value refund requests under a threshold to reduce manual review. Use the threshold below for bulk approve on the Refund Management page.
                </p>
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setRefundAutoApproveEnabled((prev) => !prev)}
                      className="flex flex-1 cursor-pointer items-start gap-4 text-left transition hover:opacity-90"
                    >
                      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#2f2f2f] transition-colors duration-200 ${refundAutoApproveEnabled ? 'bg-primary' : 'bg-[#1e1e1e]'}`}>
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-out ${refundAutoApproveEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </span>
                      <div>
                        <span className="block text-sm font-semibold text-white">Auto-approve low-value refunds</span>
                        <span className="text-xs text-gray-400">
                          When enabled, refund requests under the threshold can be bulk-approved from Refund Management.
                        </span>
                      </div>
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Threshold (₦)
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={refundThresholdNaira}
                        onChange={(e) => setRefundThresholdNaira(Number(e.target.value))}
                        className={`${inputClass} mt-2 max-w-[140px]`}
                        placeholder="500"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Refunds at or below this amount (e.g. ₦500) are eligible for bulk approve.</p>
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
