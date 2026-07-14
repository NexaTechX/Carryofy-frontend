import Head from 'next/head';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { Eye, EyeOff, Plus } from 'lucide-react';
import FleetLayout from '../../components/fleet/FleetLayout';
import { useAuth } from '../../lib/auth';
import { isFleetPortalUser } from '../../lib/fleet/roles';
import {
  assignFleetDelivery,
  createFleetRider,
  fetchFleetRiders,
} from '../../lib/api/fleet';
import { formatNgnFromKobo } from '../../lib/api/utils';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  vehicleType: 'bike',
  vehicleNumber: '',
};

export default function FleetRidersPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [deliveryId, setDeliveryId] = useState('');
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: riders = [], mutate } = useSWR(
    isAuthenticated && isFleetPortalUser(user?.role) ? 'fleet-riders' : null,
    fetchFleetRiders,
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) router.push('/auth/login');
    else if (!isFleetPortalUser(user.role)) router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  if (!user || !isFleetPortalUser(user.role)) return null;

  const handleAssign = async (riderUserId: string) => {
    const id = deliveryId.trim();
    if (!id) {
      toast.error('Enter a delivery ID');
      return;
    }
    setAssigningUserId(riderUserId);
    try {
      await assignFleetDelivery(id, riderUserId);
      toast.success('Delivery assigned');
      setDeliveryId('');
      mutate();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Assignment failed';
      toast.error(typeof msg === 'string' ? msg : 'Assignment failed');
    } finally {
      setAssigningUserId(null);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setShowPassword(false);
    setForm(EMPTY_FORM);
  };

  const handleCreateRider = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createFleetRider({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber.trim(),
      });
      toast.success('Rider added successfully');
      closeModal();
      mutate();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create rider';
      toast.error(typeof msg === 'string' ? msg : 'Failed to create rider');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FleetLayout>
      <Head>
        <title>Fleet riders · Carryofy</title>
      </Head>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Riders</h1>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Add Rider
          </button>
        </div>

        <div className="rounded-xl border border-border-custom bg-card p-4">
          <p className="text-sm text-foreground/60">
            Enter a delivery UUID, then click <strong className="text-foreground/80">Assign</strong> next to a rider.
          </p>
          <input
            type="text"
            value={deliveryId}
            onChange={(e) => setDeliveryId(e.target.value)}
            placeholder="Delivery ID (UUID)"
            className="mt-3 w-full max-w-xl rounded-lg border border-border-custom bg-[var(--color-surface-2)] px-3 py-2 text-sm text-foreground placeholder:text-foreground/35"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-custom">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border-custom bg-[var(--color-surface-2)] text-xs uppercase text-foreground/45">
              <tr>
                <th className="px-4 py-3">Rider</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Current delivery</th>
                <th className="px-4 py-3">Week earnings</th>
                <th className="px-4 py-3 text-right">Assign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {riders.map((r) => (
                <tr key={r.userId} className="text-foreground/70">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-xs text-foreground/45">{r.email}</div>
                  </td>
                  <td className="px-4 py-3">{r.vehicleType ?? '—'}</td>
                  <td className="px-4 py-3">{r.isAvailable ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.currentDelivery
                      ? `${r.currentDelivery.orderId.slice(0, 8)}… (${r.currentDelivery.status})`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{formatNgnFromKobo(r.weekEarningsKobo)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={assigningUserId === r.userId}
                      onClick={() => handleAssign(r.userId)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      {assigningUserId === r.userId ? '…' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {riders.length === 0 && (
            <p className="p-6 text-center text-foreground/45">No riders assigned to this fleet yet.</p>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border-custom bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Add rider</h2>
            <p className="mt-1 text-sm text-foreground/45">
              Create a fleet rider account they can use to log in to the rider app.
            </p>
            <form onSubmit={handleCreateRider} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-foreground/60">Full name</span>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border-custom bg-[var(--color-surface-2)] px-3 py-2 text-foreground"
                />
              </label>
              <label className="block text-sm">
                <span className="text-foreground/60">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border-custom bg-[var(--color-surface-2)] px-3 py-2 text-foreground"
                />
              </label>
              <label className="block text-sm">
                <span className="text-foreground/60">Phone</span>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+2348012345678"
                  className="mt-1 w-full rounded-lg border border-border-custom bg-[var(--color-surface-2)] px-3 py-2 text-foreground placeholder:text-foreground/35"
                />
              </label>
              <label className="block text-sm">
                <span className="text-foreground/60">Password</span>
                <div className="relative mt-1">
                  <input
                    required
                    minLength={8}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full rounded-lg border border-border-custom bg-[var(--color-surface-2)] px-3 py-2 pr-10 text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground/60 hover:text-foreground/80"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-foreground/60">
                  The rider will use this email and password to log in. They can reset their password
                  independently via the forgot password flow in the rider app.
                </p>
              </label>
              <label className="block text-sm">
                <span className="text-foreground/60">Vehicle type</span>
                <select
                  required
                  value={form.vehicleType}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border-custom bg-[var(--color-surface-2)] px-3 py-2 text-foreground"
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-foreground/60">Vehicle number</span>
                <input
                  required
                  type="text"
                  value={form.vehicleNumber}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border-custom bg-[var(--color-surface-2)] px-3 py-2 text-foreground"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-border-custom px-4 py-2 text-sm text-foreground/70 hover:bg-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {submitting ? 'Creating…' : 'Add rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FleetLayout>
  );
}
