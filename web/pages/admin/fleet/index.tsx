import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import useSWR from 'swr';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
} from '../../../components/admin/ui';
import {
  fetchAdminFleetOperators,
  createAdminFleetOperator,
  adminSetFleetActive,
  type AdminFleetOperatorRow,
} from '../../../lib/admin/api';
import { formatNgnFromKobo } from '../../../lib/api/utils';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function AdminFleetListPage() {
  const { data, isLoading, mutate } = useSWR('admin-fleet-operators', fetchAdminFleetOperators);
  const rows: AdminFleetOperatorRow[] = Array.isArray(data) ? data : [];

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    password: '',
  });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createAdminFleetOperator({
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password.trim() || undefined,
      });
      toast.success(
        res.temporaryPassword
          ? `Fleet created. Temporary password: ${res.temporaryPassword}`
          : 'Fleet operator created',
      );
      setOpen(false);
      setForm({ name: '', contactName: '', phone: '', email: '', password: '' });
      mutate();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Create failed';
      toast.error(typeof msg === 'string' ? msg : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await adminSetFleetActive(id, !isActive);
      toast.success(!isActive ? 'Fleet activated' : 'Fleet deactivated');
      mutate();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Fleet operators · Admin</title>
      </Head>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Fleet operators"
            tag="Logistics"
            subtitle="Partner fleets: riders, pooled earnings, payouts."
            actions={
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
              >
                <Plus className="h-4 w-4" />
                Create fleet
              </button>
            }
          />

          <AdminCard>
            {isLoading ? (
              <LoadingState label="Loading fleets…" />
            ) : rows.length === 0 ? (
              <AdminEmptyState title="No fleets" description="Create a fleet operator to get started." />
            ) : (
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <DataTableCell>Name</DataTableCell>
                      <DataTableCell>Contact</DataTableCell>
                      <DataTableCell>Riders</DataTableCell>
                      <DataTableCell>Total earnings</DataTableCell>
                      <DataTableCell>Status</DataTableCell>
                      <DataTableCell className="text-right">Actions</DataTableCell>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-zinc-800">
                        <DataTableCell>
                          <Link
                            href={`/admin/fleet/${r.id}`}
                            className="font-medium text-amber-500 hover:text-amber-400"
                          >
                            {r.name}
                          </Link>
                        </DataTableCell>
                        <DataTableCell>
                          <div className="text-white">{r.contactName}</div>
                          <div className="text-xs text-zinc-500">{r.email}</div>
                        </DataTableCell>
                        <DataTableCell>{r.riderCount}</DataTableCell>
                        <DataTableCell>{formatNgnFromKobo(r.totalEarningsKobo)}</DataTableCell>
                        <DataTableCell>{r.isActive ? 'Active' : 'Inactive'}</DataTableCell>
                        <DataTableCell className="text-right">
                          <button
                            type="button"
                            onClick={() => toggleActive(r.id, r.isActive)}
                            className="text-sm text-amber-500 hover:text-amber-400"
                          >
                            {r.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </DataTableCell>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>
            )}
          </AdminCard>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-[#0f1218] p-6">
            <h2 className="text-lg font-semibold text-white">Create fleet operator</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              {(['name', 'contactName', 'phone', 'email', 'password'] as const).map((field) => (
                <label key={field} className="block text-sm">
                  <span className="text-zinc-400 capitalize">{field === 'contactName' ? 'Contact name' : field}</span>
                  <input
                    required={field !== 'password'}
                    type={field === 'password' ? 'password' : 'text'}
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
                    placeholder={field === 'password' ? 'Optional — auto-generated if empty' : ''}
                  />
                </label>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
