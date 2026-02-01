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
import {
  useAdminCustomers,
  useCustomerDetail,
  useUpdateCustomerStatus,
  type AdminCustomer,
  type UserRole,
  type UserStatus,
} from '../../lib/admin/hooks/useCustomers';
import { toast } from 'react-hot-toast';

const NGN_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const ROLE_FILTERS: Array<'ALL' | UserRole> = ['ALL', 'BUYER', 'SELLER', 'RIDER', 'ADMIN'];
const STATUS_FILTERS: Array<'ALL' | UserStatus> = ['ALL', 'ACTIVE', 'SUSPENDED', 'RIDER_PENDING'];

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

const ROLE_LABEL: Record<UserRole, string> = {
  BUYER: 'Buyer',
  SELLER: 'Seller',
  ADMIN: 'Admin',
  RIDER: 'Rider',
};

export default function AdminCustomers() {
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const queryParams = {
    page,
    limit: 20,
    search: search || undefined,
    role: roleFilter !== 'ALL' ? roleFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  };

  const { data, isLoading, isError, error, refetch } = useAdminCustomers(queryParams);
  const { 
    data: customerDetail, 
    isLoading: isLoadingDetail, 
    isError: isDetailError, 
    error: detailError,
    refetch: refetchDetail 
  } = useCustomerDetail(selectedCustomerId);
  const updateStatus = useUpdateCustomerStatus();

  const customers = data?.users || [];
  const pagination = data?.pagination;

  // Calculate stats
  const totalCustomers = pagination?.total || 0;
  const activeCustomers = customers.filter((c) => c.status === 'ACTIVE').length;
  const suspendedCustomers = customers.filter((c) => c.status === 'SUSPENDED').length;
  const buyersCount = customers.filter((c) => c.role === 'BUYER').length;

  const handleStatusToggle = (customer: AdminCustomer) => {
    const newStatus: UserStatus = customer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    
    if (customer.role === 'ADMIN') {
      toast.error('Cannot suspend admin accounts');
      return;
    }

    updateStatus.mutate({
      customerId: customer.id,
      status: newStatus,
    });
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

          {/* Stats Cards */}
          <section className="mb-10 grid gap-4 sm:grid-cols-4">
            <AdminCard title="Total Customers" description="All registered users">
              <p className="text-3xl font-semibold text-white">{totalCustomers}</p>
            </AdminCard>
            <AdminCard title="Active" description="Active user accounts">
              <p className="text-3xl font-semibold text-green-500">{activeCustomers}</p>
            </AdminCard>
            <AdminCard title="Suspended" description="Suspended accounts">
              <p className="text-3xl font-semibold text-red-500">{suspendedCustomers}</p>
            </AdminCard>
            <AdminCard title="Buyers" description="Customer accounts">
              <p className="text-3xl font-semibold text-primary">{buyersCount}</p>
            </AdminCard>
          </section>

          {/* Filters and Search */}
          <AdminToolbar className="mb-6 flex-wrap gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Role:</span>
              {ROLE_FILTERS.map((role) => (
                <AdminFilterChip
                  key={role}
                  active={roleFilter === role}
                  onClick={() => setRoleFilter(role)}
                >
                  {role === 'ALL' ? 'All Roles' : ROLE_LABEL[role]}
                </AdminFilterChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status:</span>
              {STATUS_FILTERS.map((status) => (
                <AdminFilterChip
                  key={status}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All Status' : STATUS_LABEL[status]}
                </AdminFilterChip>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-auto w-64 rounded-full border border-[#1f2432] bg-[#0e131d] px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
          </AdminToolbar>

          {/* Customers Table */}
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
                      <th className="px-6 py-4 text-left text-white">Customer</th>
                      <th className="px-6 py-4 text-left text-white">Role</th>
                      <th className="px-6 py-4 text-left text-white">Activity</th>
                      <th className="px-6 py-4 text-left text-white">Total</th>
                      <th className="px-6 py-4 text-left text-white">Status</th>
                      <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="transition hover:bg-[#10151d]">
                        <DataTableCell>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerId(customer.id)}
                              className="text-left text-sm font-semibold text-white hover:text-primary"
                            >
                              {customer.name}
                            </button>
                            <span className="text-xs text-gray-500">{customer.email}</span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="text-sm text-gray-300">{ROLE_LABEL[customer.role]}</span>
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
                          <span className="ml-1 text-sm font-semibold text-primary">
                            {customer.role === 'ADMIN' ? (
                              customer.lastLoginAt
                                ? new Date(customer.lastLoginAt).toLocaleDateString()
                                : '—'
                            ) : (
                              NGN_FORMATTER.format(customer.totalSpent / 100)
                            )}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            tone={STATUS_TONE[customer.status]}
                            label={STATUS_LABEL[customer.status]}
                          />
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleStatusToggle(customer)}
                              disabled={updateStatus.isPending || customer.role === 'ADMIN'}
                              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                customer.status === 'ACTIVE'
                                  ? 'border border-[#3a1f1f] text-[#ff9aa8] hover:border-[#ff9aa8] hover:text-[#ffb8c6]'
                                  : 'border border-green-700 text-green-500 hover:border-green-500 hover:text-green-400'
                              }`}
                            >
                              {customer.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerId(customer.id)}
                              className="rounded-full border border-gray-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                            >
                              View
                            </button>
                          </div>
                        </DataTableCell>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.total)} of {pagination.total} customers
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-white transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
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
            <button
              type="button"
              onClick={() => handleStatusToggle(customerDetail)}
              disabled={updateStatus.isPending}
              className={`w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                customerDetail.status === 'ACTIVE'
                  ? 'border border-[#3a1f1f] text-[#ff9aa8] hover:border-[#ff9aa8] hover:bg-[#ff9aa8] hover:text-white'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {customerDetail.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
            </button>
          ) : null
        }
      >
        {isLoadingDetail ? (
          <LoadingState label="Loading customer details..." />
        ) : isDetailError ? (
          <AdminEmptyState
            title="Unable to load customer details"
            description={
              (detailError as any)?.response?.data?.message ||
              (detailError instanceof Error 
                ? detailError.message 
                : 'Please try again later.')
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
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Role</p>
                <p className="mt-1 text-sm text-white">{ROLE_LABEL[customerDetail.role]}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</p>
                <StatusBadge
                  tone={STATUS_TONE[customerDetail.status]}
                  label={STATUS_LABEL[customerDetail.status]}
                  className="mt-2"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Verified</p>
                <p className="mt-1 text-sm text-white">{customerDetail.verified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Phone</p>
                <p className="mt-1 text-sm text-white">{customerDetail.phone || '—'}</p>
              </div>
            </div>

            {/* Role-specific stats */}
            {customerDetail.role === 'BUYER' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total Orders</p>
                  <p className="mt-2 text-2xl font-bold text-white">{customerDetail.orderCount}</p>
                </div>
                <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total Spent</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {NGN_FORMATTER.format(customerDetail.totalSpent / 100)}
                  </p>
                </div>
              </div>
            )}
            {customerDetail.role === 'SELLER' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Products</p>
                  <p className="mt-2 text-2xl font-bold text-white">{customerDetail.productCount ?? 0}</p>
                </div>
                <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Orders (with their products)</p>
                  <p className="mt-2 text-2xl font-bold text-white">{customerDetail.orderCount}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total Sales</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {NGN_FORMATTER.format(customerDetail.totalSpent / 100)}
                  </p>
                </div>
              </div>
            )}
            {customerDetail.role === 'RIDER' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Deliveries Completed</p>
                  <p className="mt-2 text-2xl font-bold text-white">{customerDetail.deliveryCount ?? customerDetail.orderCount}</p>
                </div>
                <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total Earnings</p>
                  <p className="mt-2 text-2xl font-bold text-primary">
                    {NGN_FORMATTER.format(customerDetail.totalSpent / 100)}
                  </p>
                </div>
              </div>
            )}
            {customerDetail.role === 'ADMIN' && (
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Last Login</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {customerDetail.lastLoginAt
                    ? new Date(customerDetail.lastLoginAt).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            )}

            {/* Addresses (buyers) */}
            {customerDetail.role === 'BUYER' && customerDetail.addresses && customerDetail.addresses.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Delivery Addresses
                </p>
                <div className="space-y-2">
                  {customerDetail.addresses.map((address) => (
                    <div
                      key={address.id}
                      className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3"
                    >
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

            {/* Recent Orders (buyers only) */}
            {customerDetail.role === 'BUYER' && customerDetail.orders && customerDetail.orders.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Recent Orders
                </p>
                <div className="space-y-2">
                  {customerDetail.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {NGN_FORMATTER.format(order.amount / 100)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent earnings (sellers only) — gross = real sales */}
            {customerDetail.role === 'SELLER' && customerDetail.sellerEarnings && customerDetail.sellerEarnings.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Recent Sales (Gross)
                </p>
                <div className="space-y-2">
                  {customerDetail.sellerEarnings.map((e) => (
                    <div
                      key={e.orderId}
                      className="flex items-center justify-between rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">Order #{e.orderId.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(e.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">
                          {NGN_FORMATTER.format((e.gross ?? e.net) / 100)}
                        </p>
                        {e.net != null && e.gross !== e.net && (
                          <p className="text-xs text-gray-500">Net: {NGN_FORMATTER.format(e.net / 100)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent deliveries (riders only) */}
            {customerDetail.role === 'RIDER' && customerDetail.riderDeliveries && customerDetail.riderDeliveries.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Recent Deliveries
                </p>
                <div className="space-y-2">
                  {customerDetail.riderDeliveries.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border border-[#1f1f1f] bg-[#10151d] p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">Order #{d.orderId.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          {d.deliveredAt
                            ? new Date(d.deliveredAt).toLocaleDateString()
                            : d.status}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        {NGN_FORMATTER.format(d.amount / 100)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-semibold uppercase tracking-[0.16em]">Registered</span>
                <p className="mt-1 text-sm text-white">
                  {new Date(customerDetail.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="font-semibold uppercase tracking-[0.16em]">Last Login</span>
                <p className="mt-1 text-sm text-white">
                  {customerDetail.lastLoginAt
                    ? new Date(customerDetail.lastLoginAt).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </AdminDrawer>
    </AdminLayout>
  );
}

