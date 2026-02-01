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
  useActiveDeliveries,
  useAssignDeliveryMutation,
  useAvailableRiders,
} from '../../lib/admin/hooks/useAdminDeliveries';
import { useAdminOrderDetail } from '../../lib/admin/hooks/useAdminOrders';
import { AdminDelivery } from '../../lib/admin/types';
import { toast } from 'react-hot-toast';

const DELIVERY_FILTERS = ['ALL', 'PREPARING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'ISSUE'] as const;
type DeliveryFilter = (typeof DELIVERY_FILTERS)[number];

const DELIVERY_TONE: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
  PREPARING: 'info',
  PICKED_UP: 'warning',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  ISSUE: 'danger',
};

const DELIVERY_LABEL: Record<string, string> = {
  PREPARING: 'Preparing',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  ISSUE: 'Issue',
};

// Admins cannot set delivery status to Delivered — only the buyer confirms receipt
const DELIVERY_STATUS_OPTIONS_ADMIN_EDIT = DELIVERY_FILTERS.filter(
  (s) => s !== 'ALL' && s !== 'DELIVERED',
);

export default function AdminDeliveries() {
  const [filter, setFilter] = useState<DeliveryFilter>('ALL');
  const [selectedDelivery, setSelectedDelivery] = useState<AdminDelivery | null>(null);
  const [assignOrderId, setAssignOrderId] = useState('');
  const [assignRider, setAssignRider] = useState('');
  const [assignEta, setAssignEta] = useState('');

  const { data: deliveries, isLoading, isError, error, refetch } = useActiveDeliveries();
  const assignDelivery = useAssignDeliveryMutation();
  const { data: availableRiders, isLoading: loadingRiders } = useAvailableRiders();

  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];
    if (filter === 'ALL') return deliveries;
    return deliveries.filter((delivery) => delivery.status === filter);
  }, [deliveries, filter]);

  const inTransit = deliveries?.filter((delivery) => delivery.status === 'IN_TRANSIT').length ?? 0;
  const preparing = deliveries?.filter((delivery) => delivery.status === 'PREPARING').length ?? 0;
  const deliveredToday = deliveries?.filter((delivery) => delivery.status === 'DELIVERED').length ?? 0;

  const detailOrderId = selectedDelivery?.orderId ?? null;
  const { data: orderDetail } = useAdminOrderDetail(detailOrderId);

  const handleAssign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignOrderId.trim()) {
      toast.error('Order ID is required.');
      return;
    }

    await assignDelivery.mutateAsync({
      orderId: assignOrderId.trim(),
      riderId: assignRider.trim() || undefined,
      eta: assignEta ? new Date(assignEta).toISOString() : undefined,
    });

    toast.success('Delivery assignment created.');
    setAssignOrderId('');
    setAssignRider('');
    setAssignEta('');
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Delivery Command"
            tag="Logistics"
            subtitle="Monitor dispatch performance and keep riders accountable for every hand-off."
          />

          <section className="mb-8 grid gap-4 sm:grid-cols-3">
            <AdminCard title="On the road" description="Riders currently in motion.">
              <p className="text-3xl font-semibold text-primary">{inTransit}</p>
            </AdminCard>
            <AdminCard title="Preparing" description="Packages ready for pick-up.">
              <p className="text-3xl font-semibold text-[#76e4f7]">{preparing}</p>
            </AdminCard>
            <AdminCard title="Delivered today" description="Completed confirmations today.">
              <p className="text-3xl font-semibold text-[#6ce7a2]">{deliveredToday}</p>
            </AdminCard>
          </section>

          <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">Quick assignment</h2>
            <p className="mt-1 text-sm text-gray-400">
              Assign a rider to an order that just cleared payment.
            </p>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-[1.5fr_repeat(2,1fr)_auto]"
              onSubmit={handleAssign}
            >
              <input
                value={assignOrderId}
                onChange={(event) => setAssignOrderId(event.target.value)}
                placeholder="Order ID"
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              <select
                value={assignRider}
                onChange={(event) => setAssignRider(event.target.value)}
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                disabled={loadingRiders}
              >
                <option value="">Select Rider</option>
                {availableRiders?.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name} {rider.riderProfile?.vehicleNumber ? `(${rider.riderProfile.vehicleNumber})` : ''}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={assignEta}
                onChange={(event) => setAssignEta(event.target.value)}
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
              >
                Assign
              </button>
            </form>
          </section>

          <AdminToolbar className="mb-6 flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Filter
            </span>
            <div className="flex flex-wrap gap-2">
              {DELIVERY_FILTERS.map((item) => (
                <AdminFilterChip key={item} active={filter === item} onClick={() => setFilter(item)}>
                  {item === 'ALL' ? 'All deliveries' : DELIVERY_LABEL[item] ?? item}
                </AdminFilterChip>
              ))}
            </div>
          </AdminToolbar>

          {isLoading ? (
            <LoadingState fullscreen />
          ) : isError ? (
            <AdminEmptyState
              title="Unable to load deliveries"
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
          ) : filteredDeliveries.length === 0 ? (
            <AdminEmptyState
              title="No deliveries match the filter"
              description="Switch filters or come back once new dispatches start."
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-6 py-4 text-white">Order</th>
                    <th className="px-6 py-4 text-white">Rider</th>
                    <th className="px-6 py-4 text-white">ETA</th>
                    <th className="px-6 py-4 text-white">Status</th>
                    <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="transition hover:bg-[#10151d]">
                      <DataTableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">
                            #{delivery.orderId.slice(0, 8)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Updated {new Date(delivery.updatedAt).toLocaleString()}
                          </span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm text-gray-200">
                          {delivery.riderId
                            ? (availableRiders?.find(r => r.id === delivery.riderId)?.name || 
                               (typeof delivery.rider === 'string' ? delivery.rider : delivery.rider?.name) || 
                               'Unknown Rider')
                            : 'Unassigned'}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm text-gray-300">
                          {delivery.eta ? new Date(delivery.eta).toLocaleString() : '—'}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge
                          tone={DELIVERY_TONE[delivery.status] ?? 'info'}
                          label={DELIVERY_LABEL[delivery.status] ?? delivery.status}
                        />
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedDelivery(delivery)}
                          className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                        >
                          View
                        </button>
                      </DataTableCell>
                    </tr>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableContainer>
          )}
        </div>
      </div>

      <AdminDrawer
        open={Boolean(selectedDelivery)}
        onClose={() => setSelectedDelivery(null)}
        title={selectedDelivery ? `Delivery for #${selectedDelivery.orderId.slice(0, 8)}` : 'Delivery details'}
        description={selectedDelivery ? DELIVERY_LABEL[selectedDelivery.status] : ''}
      >
        {selectedDelivery ? (
          <div className="space-y-6 text-sm text-gray-300">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge
                  tone={DELIVERY_TONE[selectedDelivery.status] ?? 'info'}
                  label={DELIVERY_LABEL[selectedDelivery.status] ?? selectedDelivery.status}
                />
                <span className="text-xs text-gray-500 uppercase tracking-[0.16em]">Status (from rider)</span>
              </div>
              <p className="text-xs text-amber-200/90">
                Admin assigns a rider only. The rider sees the task and updates status (Picked up, In transit, etc.). You monitor location and status here.
              </p>
            </div>

            {/* Assign/Update Rider Section */}
            <div className="space-y-3 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Assign Rider
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const riderId = formData.get('riderId') as string;
                  const eta = formData.get('eta') as string;

                  if (!selectedDelivery) return;

                  await assignDelivery.mutateAsync({
                    orderId: selectedDelivery.orderId,
                    riderId: riderId || undefined,
                    eta: eta ? new Date(eta).toISOString() : undefined,
                  });
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Select Rider
                  </label>
                  <select
                    name="riderId"
                    defaultValue={selectedDelivery.riderId || ''}
                    className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    disabled={loadingRiders}
                  >
                    <option value="">Unassigned</option>
                    {availableRiders?.map((rider) => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name} {rider.riderProfile?.vehicleNumber ? `(${rider.riderProfile.vehicleNumber})` : ''}
                      </option>
                    ))}
                  </select>
                  {loadingRiders && (
                    <p className="mt-1 text-xs text-gray-500">Loading riders...</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 mb-2">
                    Estimated Delivery Time
                  </label>
                  <input
                    type="datetime-local"
                    name="eta"
                    defaultValue={
                      selectedDelivery.eta
                        ? new Date(selectedDelivery.eta).toISOString().slice(0, 16)
                        : ''
                    }
                    className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-primary/90"
                >
                  Assign Rider
                </button>
              </form>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Current Rider</p>
                <p className="mt-1 text-sm text-white">
                  {selectedDelivery.riderId
                    ? (availableRiders?.find(r => r.id === selectedDelivery.riderId)?.name || 
                       (typeof selectedDelivery.rider === 'string' ? selectedDelivery.rider : selectedDelivery.rider?.name) || 
                       'Unknown Rider')
                    : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">ETA</p>
                <p className="mt-1 text-sm text-white">
                  {selectedDelivery.eta ? new Date(selectedDelivery.eta).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Created</p>
                <p className="mt-1 text-sm text-white">
                  {new Date(selectedDelivery.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Updated</p>
                <p className="mt-1 text-sm text-white">
                  {new Date(selectedDelivery.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Delivery Address Display */}
            {(selectedDelivery.deliveryAddressInfo || selectedDelivery.deliveryAddress) && (
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
                  Delivery Address
                </p>
                <div className="bg-[#131924] rounded-lg p-3 space-y-1">
                  {selectedDelivery.deliveryAddressInfo ? (
                    <>
                      <p className="text-sm text-gray-200 font-medium">
                        {selectedDelivery.deliveryAddressInfo.line1}
                        {selectedDelivery.deliveryAddressInfo.line2 && `, ${selectedDelivery.deliveryAddressInfo.line2}`}
                      </p>
                      <p className="text-sm text-gray-300">
                        {selectedDelivery.deliveryAddressInfo.city}, {selectedDelivery.deliveryAddressInfo.state}
                      </p>
                      {selectedDelivery.deliveryAddressInfo.postalCode && (
                        <p className="text-xs text-gray-400">
                          Postal Code: {selectedDelivery.deliveryAddressInfo.postalCode}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {selectedDelivery.deliveryAddressInfo.country}
                      </p>
                      {selectedDelivery.deliveryAddressInfo.fullAddress && (
                        <p className="text-xs text-[#ffcc99] mt-2 pt-2 border-t border-[#1f1f1f]">
                          <strong>Full Address:</strong> {selectedDelivery.deliveryAddressInfo.fullAddress}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-200">
                      {selectedDelivery.deliveryAddress}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  This address is visible to assigned riders for navigation and delivery.
                </p>
              </div>
            )}

            {orderDetail ? (
              <div className="space-y-3 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Order summary
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-200">
                    {orderDetail.items?.length ?? 0} item{(orderDetail.items?.length ?? 0) > 1 ? 's' : ''}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {orderDetail.amount ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(
                      orderDetail.amount / 100
                    ) : '—'}
                  </span>
                </div>
                <div className="space-y-2">
                  {orderDetail.items?.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs text-gray-400">
                      <span>{item.product?.title ?? 'Product'}</span>
                      <span>Qty {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Fetching order details…</p>
            )}

            <p className="text-xs text-gray-500">
              Update rider contact or ETA to keep buyers informed about their delivery.
            </p>
          </div>
        ) : (
          <LoadingState label="Fetching delivery…" />
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}
