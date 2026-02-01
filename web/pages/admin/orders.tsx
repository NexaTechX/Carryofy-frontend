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
  useAdminOrders,
  useAdminOrderDetail,
  useOrderStatusMutation,
  useOrderValidTransitions,
} from '../../lib/admin/hooks/useAdminOrders';
import {
  useAssignDeliveryMutation,
  useDeliveryByOrder,
  useDeliveryStatusMutation,
  useAvailableRiders,
} from '../../lib/admin/hooks/useAdminDeliveries';
import { AdminDeliveryStatus, AdminOrder, AdminOrderStatus } from '../../lib/admin/types';
import { toast } from 'react-hot-toast';

const ORDER_STATUS_OPTIONS: { value: AdminOrderStatus; label: string }[] = [
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PAID', label: 'Payment Confirmed' },
  { value: 'PROCESSING', label: 'Packaging' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELED', label: 'Canceled' },
];

const DELIVERY_STATUS_OPTIONS: { value: AdminDeliveryStatus; label: string }[] = [
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'ISSUE', label: 'Issue' },
];

// Admins cannot set delivery status to Delivered — only the buyer confirms receipt
const DELIVERY_STATUS_OPTIONS_ADMIN_EDIT = DELIVERY_STATUS_OPTIONS.filter(
  (o) => o.value !== 'DELIVERED',
);

const ORDER_STATUS_TONE: Record<AdminOrderStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'neutral',
  PROCESSING: 'warning',
  OUT_FOR_DELIVERY: 'warning',
  DELIVERED: 'success',
  CANCELED: 'danger',
};

const NGN_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const ORDER_FILTERS = ['ALL', ...ORDER_STATUS_OPTIONS.map((item) => item.value)] as const;
type OrderFilter = (typeof ORDER_FILTERS)[number];

export default function AdminOrders() {
  const [filter, setFilter] = useState<OrderFilter>('ALL');
  const [focusedOrder, setFocusedOrder] = useState<AdminOrder | null>(null);

  const { data: orders, isLoading, isError, error, refetch } = useAdminOrders();
  const updateOrderStatus = useOrderStatusMutation();
  const assignDelivery = useAssignDeliveryMutation();
  const updateDeliveryStatus = useDeliveryStatusMutation();
  const { data: availableRiders, isLoading: loadingRiders } = useAvailableRiders();

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (filter === 'ALL') return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const pendingCount = orders?.filter((order) => order.status === 'PENDING_PAYMENT').length ?? 0;
  const processingCount = orders?.filter((order) => order.status === 'PROCESSING').length ?? 0;
  const inTransitCount = orders?.filter((order) => order.status === 'OUT_FOR_DELIVERY').length ?? 0;

  const focusedOrderId = focusedOrder?.id ?? null;
  const { data: orderDetail } = useAdminOrderDetail(focusedOrderId);
  const { data: deliveryDetail } = useDeliveryByOrder(focusedOrderId);
  const { data: validTransitions = [] } = useOrderValidTransitions(focusedOrderId);

  const detailOrder = orderDetail ?? focusedOrder;

  // Admins cannot set order status to Delivered — only the buyer can confirm receipt (show Delivered when already set)
  const statusOptions = useMemo(() => {
    const current = detailOrder?.status;
    const allowed = new Set<AdminOrderStatus>(validTransitions as AdminOrderStatus[]);
    if (current) allowed.add(current);
    if (current === 'PAID') allowed.add('PROCESSING');
    const options = ORDER_STATUS_OPTIONS.filter(
      (opt) => allowed.has(opt.value) && opt.value !== 'DELIVERED',
    );
    if (current === 'DELIVERED') {
      options.push(ORDER_STATUS_OPTIONS.find((o) => o.value === 'DELIVERED')!);
    }
    return options;
  }, [detailOrder?.status, validTransitions]);

  const canAssignDelivery =
    detailOrder?.status === 'PAID' ||
    detailOrder?.status === 'PROCESSING' ||
    detailOrder?.status === 'OUT_FOR_DELIVERY';

  const handleStatusUpdate = (orderId: string, status: AdminOrderStatus) => {
    if (detailOrder && status === detailOrder.status) return;
    updateOrderStatus.mutate({ orderId, status }, { onSuccess: () => setFocusedOrder(null) });
  };

  const handleAssignDelivery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const riderId = String(formData.get('riderId') || '');
    const eta = formData.get('eta') ? new Date(String(formData.get('eta'))).toISOString() : undefined;

    if (!detailOrder) return;

    await assignDelivery.mutateAsync({
      orderId: detailOrder.id,
      riderId: riderId || undefined,
      eta,
    });

    toast.success('Delivery assigned.');
    event.currentTarget.reset();
  };

  const handleDeliveryStatusUpdate = async (
    deliveryId: string,
    status: AdminDeliveryStatus,
    updates?: { rider?: string; eta?: string }
  ) => {
    await updateDeliveryStatus.mutateAsync({ deliveryId, status, updates });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Order Control Center"
            tag="Fulfilment Operations"
            subtitle="Track every transaction across Carryofy, act on stalled orders, and coordinate fulfilment teams in one place."
          />

          <section className="mb-8 grid gap-4 sm:grid-cols-3">
            <AdminCard title="Pending payment" description="Awaiting customer confirmation.">
              <p className="text-3xl font-semibold text-[#ffb955]">{pendingCount}</p>
            </AdminCard>
            <AdminCard title="Preparing in warehouse" description="Orders currently being packed.">
              <p className="text-3xl font-semibold text-primary">{processingCount}</p>
            </AdminCard>
            <AdminCard title="Out for delivery" description="Riders currently on the move.">
              <p className="text-3xl font-semibold text-[#76e4f7]">{inTransitCount}</p>
            </AdminCard>
          </section>

          <AdminToolbar className="mb-6 flex-wrap gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Filter by status
            </span>
            <div className="flex flex-wrap gap-2">
              {ORDER_FILTERS.map((option) => (
                <AdminFilterChip
                  key={option}
                  active={filter === option}
                  onClick={() => setFilter(option)}
                >
                  {option === 'ALL'
                    ? 'All orders'
                    : ORDER_STATUS_OPTIONS.find((item) => item.value === option)?.label ?? option}
                </AdminFilterChip>
              ))}
            </div>
          </AdminToolbar>

          {isLoading ? (
            <LoadingState fullscreen />
          ) : isError ? (
            <AdminEmptyState
              title="Unable to load orders"
              description={error instanceof Error ? error.message : 'Please try again shortly.'}
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
          ) : filteredOrders.length === 0 ? (
            <AdminEmptyState
              title="No orders in this view"
              description="Adjust your filters or come back later."
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-6 py-4 text-white">Order</th>
                    <th className="px-6 py-4 text-white">Buyer</th>
                    <th className="px-6 py-4 text-white">Items</th>
                    <th className="px-6 py-4 text-white">Total</th>
                    <th className="px-6 py-4 text-white">Status</th>
                    <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-[#10151d]">
                      <DataTableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-white">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-200">
                            {order.user?.name ?? 'Buyer'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {order.user?.email ?? '—'}
                          </span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm text-gray-300">{order.items.length}</span>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm font-semibold text-white">
                          {NGN_FORMATTER.format(order.amount / 100)}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge
                          tone={ORDER_STATUS_TONE[order.status] ?? 'neutral'}
                          label={
                            ORDER_STATUS_OPTIONS.find((item) => item.value === order.status)?.label ??
                            order.status
                          }
                        />
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setFocusedOrder(order)}
                            className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                          >
                            View
                          </button>
                          {order.status !== 'DELIVERED' && order.status !== 'CANCELED' ? (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(order.id, 'CANCELED')}
                              className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6]"
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
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
        open={Boolean(focusedOrderId)}
        onClose={() => setFocusedOrder(null)}
        title={detailOrder?.id ? `Order #${detailOrder.id.slice(0, 8)}` : 'Order details'}
        description={detailOrder?.amount ? `Total ${NGN_FORMATTER.format(detailOrder.amount / 100)}` : ''}
      >
        {detailOrder ? (
          <div className="space-y-6 text-sm text-gray-300">
            <section className="space-y-3 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs text-amber-200/90">
                Only the buyer who placed the order can mark an order as Delivered. Admins have visibility for monitoring and dispute resolution only.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Status
                  </p>
                  <StatusBadge
                    tone={ORDER_STATUS_TONE[detailOrder.status] ?? 'neutral'}
                    label={
                      ORDER_STATUS_OPTIONS.find((item) => item.value === detailOrder.status)?.label ??
                      detailOrder.status
                    }
                    className="mt-2"
                  />
                </div>
                <select
                  className="rounded-full border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 focus:border-primary focus:outline-none"
                  value={detailOrder.status}
                  onChange={(event) =>
                    detailOrder.id && handleStatusUpdate(detailOrder.id, event.target.value as AdminOrderStatus)
                  }
                  disabled={statusOptions.length <= 1}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em]">Customer</span>
                  <p className="mt-1 text-sm text-gray-200">
                    {detailOrder.user?.name ?? '—'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em]">Email</span>
                  <p className="mt-1 text-sm text-gray-200">
                    {detailOrder.user?.email ?? '—'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em]">Created</span>
                  <p className="mt-1 text-sm text-gray-200">
                    {new Date(detailOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em]">Updated</span>
                  <p className="mt-1 text-sm text-gray-200">
                    {new Date(detailOrder.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Delivery Address */}
              {detailOrder.address && (
                <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
                  <span className="font-semibold uppercase tracking-[0.16em] text-gray-500 block mb-2">
                    Delivery Address
                  </span>
                  <div className="bg-[#131924] rounded-lg p-3 space-y-1">
                    <p className="text-sm text-gray-200">
                      {detailOrder.address.line1}
                      {detailOrder.address.line2 && `, ${detailOrder.address.line2}`}
                    </p>
                    <p className="text-sm text-gray-300">
                      {detailOrder.address.city}, {detailOrder.address.state}
                    </p>
                    {detailOrder.address.postalCode && (
                      <p className="text-xs text-gray-400">
                        Postal Code: {detailOrder.address.postalCode}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {detailOrder.address.country}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Line Items
              </p>
              <div className="space-y-3">
                {detailOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[#1f1f1f] bg-[#131924] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.product?.title ?? 'Product'}
                      </p>
                      <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {NGN_FORMATTER.format((item.price * item.quantity) / 100)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Delivery
              </p>
              <p className="text-xs text-amber-200/90">
                Only the buyer can confirm delivery. Admins can update status up to In Transit for monitoring and disputes.
              </p>
              {deliveryDetail ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge
                      tone="info"
                      label={
                        DELIVERY_STATUS_OPTIONS.find((option) => option.value === deliveryDetail.status)
                          ?.label ?? deliveryDetail.status
                      }
                    />
                    <select
                      className="rounded-full border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 focus:border-primary focus:outline-none"
                      value={deliveryDetail.status}
                      onChange={(event) =>
                        handleDeliveryStatusUpdate(deliveryDetail.id, event.target.value as AdminDeliveryStatus)
                      }
                      disabled={deliveryDetail.status === 'DELIVERED'}
                    >
                      {DELIVERY_STATUS_OPTIONS_ADMIN_EDIT.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      {deliveryDetail.status === 'DELIVERED' && (
                        <option value="DELIVERED">Delivered</option>
                      )}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-semibold uppercase tracking-[0.16em]">Rider</span>
                      <p className="mt-1 text-sm text-gray-200">
                        {deliveryDetail.riderId
                          ? (availableRiders?.find(r => r.id === deliveryDetail.riderId)?.name || 
                             (typeof deliveryDetail.rider === 'string' ? deliveryDetail.rider : deliveryDetail.rider?.name) || 
                             'Unknown Rider')
                          : 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold uppercase tracking-[0.16em]">ETA</span>
                      <p className="mt-1 text-sm text-gray-200">
                        {deliveryDetail.eta ? new Date(deliveryDetail.eta).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Delivery Address Display */}
                  {(deliveryDetail.deliveryAddressInfo || deliveryDetail.deliveryAddress) && (
                    <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
                      <span className="font-semibold uppercase tracking-[0.16em] text-gray-500 block mb-2">
                        Delivery Address
                      </span>
                      <div className="bg-[#131924] rounded-lg p-3 space-y-1">
                        {deliveryDetail.deliveryAddressInfo ? (
                          <>
                            <p className="text-sm text-gray-200">
                              {deliveryDetail.deliveryAddressInfo.line1}
                              {deliveryDetail.deliveryAddressInfo.line2 && `, ${deliveryDetail.deliveryAddressInfo.line2}`}
                            </p>
                            <p className="text-sm text-gray-300">
                              {deliveryDetail.deliveryAddressInfo.city}, {deliveryDetail.deliveryAddressInfo.state}
                            </p>
                            {deliveryDetail.deliveryAddressInfo.postalCode && (
                              <p className="text-xs text-gray-400">
                                Postal Code: {deliveryDetail.deliveryAddressInfo.postalCode}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {deliveryDetail.deliveryAddressInfo.country}
                            </p>
                            {deliveryDetail.deliveryAddressInfo.fullAddress && (
                              <p className="text-xs text-[#ffcc99] mt-2 pt-2 border-t border-[#1f1f1f]">
                                Full: {deliveryDetail.deliveryAddressInfo.fullAddress}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-200">
                            {deliveryDetail.deliveryAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Reassign Rider Form */}
                  {!canAssignDelivery ? (
                    <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                      Update order status to <strong>Payment Confirmed</strong> or <strong>Packaging</strong> to assign or reassign a rider. Current status: {ORDER_STATUS_OPTIONS.find((o) => o.value === detailOrder?.status)?.label ?? detailOrder?.status}.
                    </p>
                  ) : (
                  <form className="mt-4 space-y-3 rounded-lg border border-[#1f1f1f] bg-[#131924] p-3" onSubmit={handleAssignDelivery}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                      Reassign Rider
                    </p>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="reassign-riderId" className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Select Rider
                      </label>
                      <select
                        id="reassign-riderId"
                        name="riderId"
                        defaultValue={deliveryDetail.riderId || ''}
                        className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
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
                        <p className="text-xs text-gray-500">Loading riders...</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="reassign-eta" className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Estimated arrival
                      </label>
                      <input
                        id="reassign-eta"
                        name="eta"
                        type="datetime-local"
                        defaultValue={
                          deliveryDetail.eta
                            ? new Date(deliveryDetail.eta).toISOString().slice(0, 16)
                            : ''
                        }
                        className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                    >
                      Update Assignment
                    </button>
                  </form>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {!canAssignDelivery ? (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                      Update order status to <strong>Payment Confirmed</strong> or <strong>Packaging</strong> before assigning delivery. Current status: {ORDER_STATUS_OPTIONS.find((o) => o.value === detailOrder?.status)?.label ?? detailOrder?.status}.
                    </p>
                  ) : (
                  <>
                  <p className="text-sm text-gray-400">No delivery assigned yet. Assign a rider below.</p>
                  <form className="space-y-3" onSubmit={handleAssignDelivery}>
                    <div className="flex flex-col gap-2 text-xs text-gray-500">
                      <label htmlFor="riderId" className="font-semibold uppercase tracking-[0.16em]">
                        Select Rider
                      </label>
                      <select
                        id="riderId"
                        name="riderId"
                        className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                        disabled={loadingRiders}
                      >
                        <option value="">Select a rider</option>
                      {availableRiders?.map((rider) => (
                        <option key={rider.id} value={rider.id}>
                          {rider.name} {rider.riderProfile?.vehicleNumber ? `(${rider.riderProfile.vehicleNumber})` : ''}
                        </option>
                      ))}
                    </select>
                    {loadingRiders && (
                      <p className="mt-1 text-xs text-gray-500">Loading available riders...</p>
                    )}
                    {!loadingRiders && availableRiders && availableRiders.length === 0 && (
                      <p className="mt-1 text-xs text-yellow-500">No available riders at the moment.</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-gray-500">
                    <label htmlFor="eta" className="font-semibold uppercase tracking-[0.16em]">
                      Estimated arrival
                    </label>
                    <input
                      id="eta"
                      name="eta"
                      type="datetime-local"
                      className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingRiders || (availableRiders && availableRiders.length === 0)}
                    className="w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign delivery
                  </button>
                </form>
                </>
                  )}
                </div>
              )}
            </section>

            <p className="text-xs text-gray-500">
              Keep admins informed: updating order and delivery statuses here will sync across buyer
              and seller dashboards.
            </p>
          </div>
        ) : (
          <LoadingState label="Fetching order details…" />
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}

