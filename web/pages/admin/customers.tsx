import { useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminDrawer,
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  AdminFilterChip,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import RoleDistributionDonut from '../../components/admin/charts/RoleDistributionDonut';
import {
  useAdminCustomers,
  useCustomerDetail,
  useCustomerStats,
  useUpdateCustomerStatus,
  type AdminCustomer,
  type UserRole,
  type UserStatus,
  type LastActiveFilter,
} from '../../lib/admin/hooks/useCustomers';
import { toast } from 'react-hot-toast';
import { formatNgnFromKobo } from '../../lib/api/utils';
import {
  MoreVertical,
  Eye,
  PauseCircle,
  PlayCircle,
  Trash2,
  UserCog,
  CheckCircle,
  Mail,
  Download,
} from 'lucide-react';

const ROLE_FILTERS: Array<'ALL' | UserRole> = ['ALL', 'BUYER', 'SELLER', 'RIDER', 'ADMIN'];
const STATUS_FILTERS: Array<'ALL' | UserStatus> = ['ALL', 'ACTIVE', 'SUSPENDED', 'RIDER_PENDING'];

const LAST_ACTIVE_OPTIONS: Array<{ value: '' | LastActiveFilter; label: string }> = [
  { value: '', label: 'Any' },
  { value: '7', label: 'Active (7 days)' },
  { value: '30', label: 'Active (30 days)' },
  { value: '90', label: 'Active (90 days)' },
  { value: 'inactive', label: 'Inactive' },
];

const STATUS_TONE: Record<UserStatus, 'success' | 'danger' | 'warning'> = {
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  RIDER_PENDING: 'warning',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  RIDER_PENDING: 'Pending Approval',
};

function getEffectiveStatus(customer: { status: UserStatus; verified: boolean }): { tone: 'success' | 'danger' | 'warning' | 'neutral'; label: string } {
  if (customer.status === 'ACTIVE' && !customer.verified) {
    return { tone: 'warning', label: 'Unverified' };
  }
  return { tone: STATUS_TONE[customer.status], label: STATUS_LABEL[customer.status] };
}

const ROLE_LABEL: Record<UserRole, string> = {
  BUYER: 'Buyer',
  SELLER: 'Seller',
  ADMIN: 'Admin',
  RIDER: 'Rider',
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function formatJoinDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatLastActive(lastLoginAt?: string): string {
  if (!lastLoginAt) return 'Never';
  const d = new Date(lastLoginAt);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminCustomers() {
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [lastActiveFilter, setLastActiveFilter] = useState<'' | LastActiveFilter>('');
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      role: roleFilter !== 'ALL' ? roleFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      lastActive: lastActiveFilter || undefined,
      joinedFrom: joinedFrom ? new Date(joinedFrom).toISOString().slice(0, 10) : undefined,
      joinedTo: joinedTo ? new Date(joinedTo).toISOString().slice(0, 10) : undefined,
    }),
    [page, search, roleFilter, statusFilter, lastActiveFilter, joinedFrom, joinedTo]
  );

  const { data, isLoading, isError, error, refetch } = useAdminCustomers(queryParams);
  const { data: stats } = useCustomerStats();
  const {
    data: customerDetail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useCustomerDetail(selectedCustomerId);
  const updateStatus = useUpdateCustomerStatus();

  const customers = data?.users || [];
  const pagination = data?.pagination;

  const roleDistributionData = useMemo(
    () => [
      { role: 'BUYER', label: 'Buyers', count: stats?.buyers ?? 0, color: '#ff6600' },
      { role: 'SELLER', label: 'Sellers', count: stats?.sellers ?? 0, color: '#0ea5e9' },
      { role: 'RIDER', label: 'Riders', count: stats?.riders ?? 0, color: '#22c55e' },
      { role: 'ADMIN', label: 'Admins', count: Math.max(0, (stats?.total ?? 0) - (stats?.buyers ?? 0) - (stats?.sellers ?? 0) - (stats?.riders ?? 0)), color: '#a855f7' },
    ],
    [stats]
  );

  const handleStatusToggle = (customer: AdminCustomer, newStatus: UserStatus) => {
    if (customer.role === 'ADMIN') {
      toast.error('Cannot change admin account status');
      return;
    }
    updateStatus.mutate({ customerId: customer.id, status: newStatus });
    setActionMenuOpen(null);
  };

  const handleDelete = (customer: AdminCustomer) => {
    if (customer.role === 'ADMIN') {
      toast.error('Cannot delete admin accounts');
      return;
    }
    toast('Delete customer – connect to API when endpoint is ready.');
    setActionMenuOpen(null);
  };

  const handleImpersonate = (customer: AdminCustomer) => {
    toast('Impersonate – open support session in new tab when implemented.');
    setActionMenuOpen(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(customers.map((c) => c.id)));
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one customer');
      return;
    }
    toast('Bulk export – generate CSV when endpoint is ready.');
  };

  const handleBulkSendEmail = () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one customer');
      return;
    }
    toast(`Send email to ${selectedIds.size} customer(s) – connect to campaign API when ready.`);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Customer Management"
            tag="User Directory"
            subtitle="View and manage all users, monitor customer activity, and control account access."
          />

          {/* 6 Stat Cards – 2 rows of 3 */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminCard title="Total Customers" description="All registered users" contentClassName="!gap-0">
              <p className="text-2xl font-semibold text-white">{stats?.total ?? '—'}</p>
            </AdminCard>
            <AdminCard title="Buyers" description="Customer accounts" contentClassName="!gap-0">
              <p className="text-2xl font-semibold text-primary">{stats?.buyers ?? '—'}</p>
            </AdminCard>
            <AdminCard title="Sellers" description="Seller accounts" contentClassName="!gap-0">
              <p className="text-2xl font-semibold text-cyan-400">{stats?.sellers ?? '—'}</p>
            </AdminCard>
            <AdminCard title="Riders" description="Delivery riders" contentClassName="!gap-0">
              <p className="text-2xl font-semibold text-emerald-400">{stats?.riders ?? '—'}</p>
            </AdminCard>
            <AdminCard title="Unverified" description="Active, not verified" contentClassName="!gap-0">
              <p className="text-2xl font-semibold text-amber-400">{stats?.unverified ?? '—'}</p>
            </AdminCard>
            <AdminCard title="Suspended" description="Suspended accounts" contentClassName="!gap-0">
              <p className="text-2xl font-semibold text-red-500">{stats?.suspended ?? '—'}</p>
            </AdminCard>
          </section>

          {/* Filters */}
          <AdminToolbar className="mb-6 flex-wrap gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Role:</span>
              {ROLE_FILTERS.map((role) => (
                <AdminFilterChip key={role} active={roleFilter === role} onClick={() => setRoleFilter(role)}>
                  {role === 'ALL' ? 'All Roles' : ROLE_LABEL[role]}
                </AdminFilterChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status:</span>
              {STATUS_FILTERS.map((status) => (
                <AdminFilterChip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
                  {status === 'ALL' ? 'All Status' : STATUS_LABEL[status]}
                </AdminFilterChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Joined:</span>
              <input
                type="date"
                value={joinedFrom}
                onChange={(e) => setJoinedFrom(e.target.value)}
                className="rounded-lg border border-[#1f2432] bg-[#0e131d] px-3 py-1.5 text-sm text-white"
              />
              <span className="text-gray-500">–</span>
              <input
                type="date"
                value={joinedTo}
                onChange={(e) => setJoinedTo(e.target.value)}
                className="rounded-lg border border-[#1f2432] bg-[#0e131d] px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Last active:</span>
              <select
                value={lastActiveFilter}
                onChange={(e) => setLastActiveFilter((e.target.value || '') as '' | LastActiveFilter)}
                className="rounded-lg border border-[#1f2432] bg-[#0e131d] px-3 py-1.5 text-sm text-white"
              >
                {LAST_ACTIVE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'any'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto w-64 rounded-full border border-[#1f2432] bg-[#0e131d] px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
          </AdminToolbar>

          {/* Role distribution donut + Bulk actions */}
          <div className="mb-6 flex flex-wrap items-start gap-6">
            <div className="w-72 shrink-0">
              <RoleDistributionDonut data={roleDistributionData} title="Role distribution" height={200} />
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm text-gray-400">{selectedIds.size} selected</span>
                  <button
                    type="button"
                    onClick={handleBulkExport}
                    className="inline-flex items-center gap-2 rounded-full border border-[#1f2432] bg-[#0e131d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                  >
                    <Download className="h-4 w-4" /> Bulk Export
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkSendEmail}
                    className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                  >
                    <Mail className="h-4 w-4" /> Send Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-gray-500 hover:text-white"
                  >
                    Clear selection
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingState fullscreen />
          ) : isError ? (
            <AdminEmptyState
              title="Unable to load customers"
              description={error instanceof Error ? error.message : 'Please try again later.'}
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                >
                  Retry
                </button>
              }
            />
          ) : customers.length === 0 ? (
            <AdminEmptyState
              title="No customers found"
              description={search ? 'Try adjusting your search query.' : 'No customers match the selected filters.'}
            />
          ) : (
            <>
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="w-10 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={customers.length > 0 && selectedIds.size === customers.length}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-600 bg-[#0e131d] text-primary focus:ring-primary"
                        />
                      </th>
                      <th className="px-4 py-4 text-left text-white">Customer</th>
                      <th className="px-4 py-4 text-left text-white">Phone</th>
                      <th className="px-4 py-4 text-left text-white">Role</th>
                      <th className="px-4 py-4 text-left text-white">Joined</th>
                      <th className="px-4 py-4 text-left text-white">Last active</th>
                      <th className="px-4 py-4 text-left text-white">Activity</th>
                      <th className="px-4 py-4 text-left text-white">Total</th>
                      <th className="px-4 py-4 text-left text-white">Status</th>
                      <th className="px-4 py-4 text-right text-gray-500">Actions</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className="cursor-pointer transition hover:bg-[#10151d]"
                      >
                        <DataTableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(customer.id)}
                            onChange={() => toggleSelect(customer.id)}
                            className="rounded border-gray-600 bg-[#0e131d] text-primary focus:ring-primary"
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1f2432] text-xs font-semibold text-white"
                              title="Avatar"
                            >
                              {getInitials(customer.name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-white">{customer.name}</span>
                              <span className="text-xs text-gray-500">{customer.email}</span>
                            </div>
                            {customer.verified && (
                              <span title="Verified"><CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden /></span>
                            )}
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm text-gray-400">{customer.phone || '—'}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm text-gray-300">{ROLE_LABEL[customer.role]}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-gray-500">{formatJoinDate(customer.createdAt)}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-gray-500">{formatLastActive(customer.lastLoginAt)}</span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-gray-500">
                            {customer.role === 'BUYER' && 'Orders'}
                            {customer.role === 'SELLER' && 'Products'}
                            {customer.role === 'RIDER' && 'Deliveries'}
                            {customer.role === 'ADMIN' && '—'}
                          </span>
                          <span className="ml-1 text-sm text-gray-300">
                            {customer.role === 'BUYER' && customer.orderCount}
                            {customer.role === 'SELLER' && (customer.productCount ?? 0)}
                            {customer.role === 'RIDER' && (customer.deliveryCount ?? customer.orderCount)}
                            {customer.role === 'ADMIN' && '—'}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-xs text-gray-500">
                            {customer.role === 'BUYER' && 'Spent'}
                            {customer.role === 'SELLER' && 'Sales'}
                            {customer.role === 'RIDER' && 'Earnings'}
                            {customer.role === 'ADMIN' && (customer.lastLoginAt ? 'Last login' : '—')}
                          </span>
                          <span className="ml-1 block text-sm font-semibold text-primary">
                            {customer.role === 'ADMIN'
                              ? customer.lastLoginAt
                                ? new Date(customer.lastLoginAt).toLocaleDateString()
                                : '—'
                              : formatNgnFromKobo(customer.totalSpent)}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge tone={getEffectiveStatus(customer).tone} label={getEffectiveStatus(customer).label} />
                        </DataTableCell>
                        <DataTableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpen(actionMenuOpen === customer.id ? null : customer.id);
                              }}
                              className="rounded border border-[#2a2a2a] p-1.5 text-gray-400 transition hover:border-primary hover:bg-[#0f1419] hover:text-primary"
                              title="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {actionMenuOpen === customer.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  aria-hidden
                                  onClick={() => setActionMenuOpen(null)}
                                />
                                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-[#2a2a2a] bg-[#0f1419] py-1 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomerId(customer.id);
                                      setActionMenuOpen(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#1a1f2e] hover:text-white"
                                  >
                                    <Eye className="h-4 w-4" /> View
                                  </button>
                                  {customer.status === 'ACTIVE' && customer.role !== 'ADMIN' && (
                                    <button
                                      type="button"
                                      onClick={() => handleStatusToggle(customer, 'SUSPENDED')}
                                      disabled={updateStatus.isPending}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-400 hover:bg-[#1a1f2e] disabled:opacity-50"
                                    >
                                      <PauseCircle className="h-4 w-4" /> Suspend
                                    </button>
                                  )}
                                  {customer.status === 'SUSPENDED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleStatusToggle(customer, 'ACTIVE')}
                                      disabled={updateStatus.isPending}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-400 hover:bg-[#1a1f2e] disabled:opacity-50"
                                    >
                                      <PlayCircle className="h-4 w-4" /> Unsuspend
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(customer)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-[#1a1f2e]"
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleImpersonate(customer)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-[#1a1f2e] hover:text-white"
                                  >
                                    <UserCog className="h-4 w-4" /> Impersonate
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </DataTableCell>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} customers
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-white transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= pagination.totalPages}
                      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-white transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Customer Detail Drawer */}
      <AdminDrawer
        open={Boolean(selectedCustomerId)}
        onClose={() => setSelectedCustomerId(null)}
        title={customerDetail?.name || 'Customer Details'}
        description={customerDetail?.email}
        footer={
          customerDetail && customerDetail.role !== 'ADMIN' ? (
            <div className="flex gap-2">
              {customerDetail.status === 'ACTIVE' ? (
                <button
                  type="button"
                  onClick={() => handleStatusToggle(customerDetail, 'SUSPENDED')}
                  disabled={updateStatus.isPending}
                  className="flex-1 rounded-full border border-red-900/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-400 transition hover:bg-red-900/20 disabled:opacity-50"
                >
                  Suspend Account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusToggle(customerDetail, 'ACTIVE')}
                  disabled={updateStatus.isPending}
                  className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  Activate Account
                </button>
              )}
            </div>
          ) : null
        }
      >
        {isLoadingDetail ? (
          <LoadingState label="Loading customer details..." />
        ) : isDetailError ? (
          <AdminEmptyState
            title="Unable to load customer details"
            description={
              (detailError as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
              (detailError instanceof Error ? detailError.message : 'Please try again later.')
            }
            action={
              <button
                type="button"
                onClick={() => refetchDetail()}
                className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
              >
                Retry
              </button>
            }
          />
        ) : customerDetail ? (
          <div className="space-y-6 text-sm text-gray-300">
            {/* Profile */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Role</p>
                <p className="mt-1 text-sm text-white">{ROLE_LABEL[customerDetail.role]}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</p>
                <StatusBadge tone={getEffectiveStatus(customerDetail).tone} label={getEffectiveStatus(customerDetail).label} className="mt-2" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Verified</p>
                <p className="mt-1 text-sm text-white">{customerDetail.verified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Phone</p>
                <p className="mt-1 text-sm text-white">{customerDetail.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Joined</p>
                <p className="mt-1 text-sm text-white">{formatJoinDate(customerDetail.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Last active</p>
                <p className="mt-1 text-sm text-white">{formatLastActive(customerDetail.lastLoginAt)}</p>
              </div>
            </div>

            {/* Total spend / Order history */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total spend</p>
              <p className="mt-2 text-2xl font-bold text-primary">{formatNgnFromKobo(customerDetail.totalSpent)}</p>
            </div>

            {customerDetail.role === 'BUYER' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total Orders</p>
                  <p className="mt-2 text-2xl font-bold text-white">{customerDetail.orderCount}</p>
                </div>
              </div>
            )}

            {/* Reviews written & Support tickets */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Reviews written</p>
                <p className="mt-2 text-xl font-bold text-white">{customerDetail.reviewsWritten ?? 0}</p>
              </div>
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Support tickets</p>
                <p className="mt-2 text-xl font-bold text-white">{customerDetail.supportTicketsRaised ?? 0}</p>
              </div>
            </div>

            {/* Order history */}
            {customerDetail.role === 'BUYER' && customerDetail.orders && customerDetail.orders.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Order history</p>
                <div className="space-y-2">
                  {customerDetail.orders.slice(0, 10).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">{formatNgnFromKobo(order.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seller earnings */}
            {customerDetail.role === 'SELLER' && customerDetail.sellerEarnings && customerDetail.sellerEarnings.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Recent sales</p>
                <div className="space-y-2">
                  {customerDetail.sellerEarnings.slice(0, 5).map((e) => (
                    <div
                      key={e.orderId}
                      className="flex items-center justify-between rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3"
                    >
                      <p className="text-sm font-semibold text-white">Order #{e.orderId.slice(0, 8)}</p>
                      <p className="text-sm font-semibold text-primary">{formatNgnFromKobo((e.gross ?? e.net))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rider deliveries */}
            {customerDetail.role === 'RIDER' && customerDetail.riderDeliveries && customerDetail.riderDeliveries.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Recent deliveries</p>
                <div className="space-y-2">
                  {customerDetail.riderDeliveries.slice(0, 5).map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3"
                    >
                      <p className="text-sm font-semibold text-white">Order #{d.orderId.slice(0, 8)}</p>
                      <p className="text-sm font-semibold text-primary">{formatNgnFromKobo(d.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addresses */}
            {customerDetail.role === 'BUYER' && customerDetail.addresses && customerDetail.addresses.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Delivery addresses</p>
                <div className="space-y-2">
                  {customerDetail.addresses.map((address) => (
                    <div key={address.id} className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3">
                      <p className="text-xs font-semibold text-primary">{address.label}</p>
                      <p className="mt-1 text-sm text-gray-300">
                        {address.line1}
                        {address.line2 && `, ${address.line2}`}
                      </p>
                      <p className="text-sm text-gray-400">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Account activity log */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Account activity</p>
              {customerDetail.activityLog && customerDetail.activityLog.length > 0 ? (
                <div className="space-y-2">
                  {customerDetail.activityLog.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3"
                    >
                      <span className="text-sm text-gray-300">{entry.action}</span>
                      <span className="text-xs text-gray-500">{formatLastActive(entry.at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4 text-xs text-gray-500">No activity log available.</p>
              )}
            </div>
          </div>
        ) : null}
      </AdminDrawer>
    </AdminLayout>
  );
}
