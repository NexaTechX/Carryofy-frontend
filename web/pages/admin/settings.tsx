import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AlertCircle, Check, X } from 'lucide-react';
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

const inputClass =
  'w-full rounded-xl border border-[#1f1f1f] bg-[#131313] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-primary focus:outline-none disabled:opacity-50';

export default function AdminSettings() {
  // Data fetching
  const { data: platformSettings, isLoading: platformLoading } = usePlatformSettings();
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers();

  // Mutations
  const updatePlatform = useUpdatePlatformSettings();
  const createTeam = useCreateTeamMember();
  const updateTeam = useUpdateTeamMember();
  const deleteTeam = useDeleteTeamMember();

  // Form state
  const [commissionPercentage, setCommissionPercentage] = useState(15);
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

  // Team member modal state
  const [memberModal, setMemberModal] = useState<TeamMemberForm | null>(null);

  // Confirmation dialog
  const confirmation = useConfirmation();

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load settings into form
  useEffect(() => {
    if (platformSettings) {
      setCommissionPercentage(platformSettings.commissionPercentage);
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
    }
  }, [platformSettings]);

  const commissionBreakdown = useMemo(() => {
    const orderAmount = 100000;
    const commissionValue = orderAmount * (commissionPercentage / 100);
    const sellerReceives = orderAmount - commissionValue;

    return {
      orderAmount,
      commissionValue,
      sellerReceives,
    };
  }, [commissionPercentage]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (commissionPercentage < 0 || commissionPercentage > 100) {
      newErrors.commissionPercentage = 'Commission must be between 0 and 100';
    }

    if (baseFee < 0) {
      newErrors.baseFee = 'Base fee cannot be negative';
    }

    if (perMileFee < 0) {
      newErrors.perMileFee = 'Per mile fee cannot be negative';
    }

    if (baseFeeNaira < 0) {
      newErrors.baseFeeNaira = 'Base fee cannot be negative';
    }

    if (perKgFeeNaira < 0) {
      newErrors.perKgFeeNaira = 'Per kg fee cannot be negative';
    }

    if (defaultWeightKg < 0) {
      newErrors.defaultWeightKg = 'Default weight cannot be negative';
    }

    if (standardMultiplier < 0) {
      newErrors.standardMultiplier = 'Standard multiplier cannot be negative';
    }

    if (expressMultiplier < 0) {
      newErrors.expressMultiplier = 'Express multiplier cannot be negative';
    }

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
      });
      showToast('success', 'Settings saved successfully');
    } catch (error) {
      showToast('error', 'Failed to save settings');
      console.error('Save error:', error);
    }
  };

  const handleAddTeamMember = () => {
    setMemberModal({
      name: '',
      email: '',
      role: 'Support',
    });
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
          payload: {
            name: memberModal.name,
            email: memberModal.email,
            role: memberModal.role,
          },
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
      <div className="space-y-8 px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Settings</h1>
            <p className="text-sm text-gray-400">Manage platform-wide configurations</p>
          </div>
          <button
            onClick={handleSave}
            disabled={updatePlatform.isPending}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9140] disabled:opacity-50"
          >
            {updatePlatform.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Toast Notification */}
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

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-lg">
            <header className="mb-5">
              <h2 className="text-lg font-semibold text-white">Platform Commission (DEPRECATED)</h2>
              <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400 font-medium mb-1">⚠️ This field is deprecated</p>
                <p className="text-xs text-gray-400">
                  Commission is now configured strictly per category. This field is kept for legacy compatibility only and is NOT used for commission resolution. 
                  All categories must have commissionB2C configured. Products cannot be created or approved without category commission.
                </p>
              </div>
            </header>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Commission Percentage (Legacy - Not Used)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={commissionPercentage}
                  onChange={(event) => setCommissionPercentage(Number(event.target.value))}
                  disabled
                  className={`${inputClass} mt-2 opacity-50 cursor-not-allowed ${errors.commissionPercentage ? 'border-red-500' : ''}`}
                  title="This field is deprecated and disabled. Commission is configured per category."
                />
                {errors.commissionPercentage && (
                  <span className="mt-1 text-xs text-red-500">{errors.commissionPercentage}</span>
                )}
                <p className="mt-1 text-xs text-gray-500">This field is disabled. Configure commission in category settings instead.</p>
              </label>

              <div className="rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Order Amount</span>
                  <span>₦{commissionBreakdown.orderAmount.toLocaleString()}</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm text-primary">
                  <span>Commission ({commissionPercentage}%)</span>
                  <span>₦{commissionBreakdown.commissionValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-3 text-sm font-semibold text-white">
                  <span>Seller Receives</span>
                  <span>₦{commissionBreakdown.sellerReceives.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-lg">
            <header className="mb-5">
              <h2 className="text-lg font-semibold text-white">Shipping Fee Rules (In-House Logistics)</h2>
              <p className="text-sm text-gray-400">Control how shipping fees are calculated. All fees are global — no seller overrides.</p>
            </header>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Calculation Mode
                <select
                  value={shippingCalculationMode}
                  onChange={(e) => setShippingCalculationMode(e.target.value as 'FLAT' | 'WEIGHT')}
                  className={`${inputClass} mt-2 appearance-none`}
                >
                  <option value="WEIGHT">Weight-based</option>
                  <option value="FLAT">Flat rate</option>
                </select>
                <span className="mt-1 block text-xs text-gray-500">FLAT: fixed fee. WEIGHT: base + per kg.</span>
              </label>

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
                <span className="mt-1 block text-xs text-gray-500">Fixed base amount in Naira (used in WEIGHT mode)</span>
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
                <span className="mt-1 block text-xs text-gray-500">Amount in Naira per kg (used in WEIGHT mode)</span>
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
                  Standard Multiplier
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
                  Express Multiplier
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
          </section>
        </div>

        <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Admin Roles and Permissions</h2>
              <p className="text-sm text-gray-400">Control access across your admin team.</p>
            </div>
            <button
              type="button"
              onClick={handleAddTeamMember}
              className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-black"
            >
              Add Team Member
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#151515]">
            <table className="min-w-full divide-y divide-[#2a2a2a] text-sm">
              <thead className="bg-[#1a1a1a] text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a] text-gray-300">
                {teamMembers && teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 font-medium text-white">{member.name}</td>
                      <td className="px-6 py-4">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {member.role}
                        </span>
                      </td>
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
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No team members yet. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-[#1f1f1f] bg-[#111111] p-6 shadow-lg">
          <header className="mb-5">
            <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
            <p className="text-sm text-gray-400">Choose how admins receive important alerts.</p>
          </header>

          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setSmsEnabled((prev) => !prev)}
              role="switch"
              aria-checked={smsEnabled}
              className="flex w-full items-center gap-4 rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4 text-left transition hover:border-primary/60 hover:bg-[#181818]"
            >
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#2f2f2f] transition-colors duration-200 ${
                  smsEnabled ? 'bg-primary' : 'bg-[#1e1e1e]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-out ${
                    smsEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">SMS Notifications</span>
                <span className="text-xs text-gray-400">Instant alerts for urgent platform updates.</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setEmailEnabled((prev) => !prev)}
              role="switch"
              aria-checked={emailEnabled}
              className="flex w-full items-center gap-4 rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4 text-left transition hover:border-primary/60 hover:bg-[#181818]"
            >
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#2f2f2f] transition-colors duration-200 ${
                  emailEnabled ? 'bg-primary' : 'bg-[#1e1e1e]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-out ${
                    emailEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">Email Notifications</span>
                <span className="text-xs text-gray-400">Daily summaries and important communication.</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPushEnabled((prev) => !prev)}
              role="switch"
              aria-checked={pushEnabled}
              className="flex w-full items-center gap-4 rounded-2xl border border-[#2a2a2a] bg-[#151515] p-4 text-left transition hover:border-primary/60 hover:bg-[#181818]"
            >
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#2f2f2f] transition-colors duration-200 ${
                  pushEnabled ? 'bg-primary' : 'bg-[#1e1e1e]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-out ${
                    pushEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">Push Notifications</span>
                <span className="text-xs text-gray-400">Desktop notifications for real-time events.</span>
              </span>
            </button>
          </div>
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
