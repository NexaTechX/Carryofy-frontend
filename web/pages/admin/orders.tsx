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
} from '../../lib/admin/hooks/useAdminOrders';
import {
  useAssignDeliveryMutation,
  useDeliveryByOrder,
  useDeliveryStatusMutation,
} from '../../lib/admin/hooks/useAdminDeliveries';
import { AdminDeliveryStatus, AdminOrder, AdminOrderStatus } from '../../lib/admin/types';
import { toast } from 'react-hot-toast';

const ORDER_STATUS_OPTIONS: { value: AdminOrderStatus; label: string }[] = [
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PROCESSING', label: 'Processing' },
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

  const detailOrder = orderDetail ?? focusedOrder;

  const handleStatusUpdate = (orderId: string, status: AdminOrderStatus) => {
    updateOrderStatus.mutate({ orderId, status }, { onSuccess: () => setFocusedOrder(null) });
  };

  const handleAssignDelivery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rider = String(formData.get('rider') || '');
    const eta = formData.get('eta') ? new Date(String(formData.get('eta'))).toISOString() : undefined;

    if (!detailOrder) return;

    await assignDelivery.mutateAsync({
      orderId: detailOrder.id,
      rider: rider || undefined,
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
        title={detailOrder ? `Order #${detailOrder.id.slice(0, 8)}` : 'Order details'}
        description={detailOrder ? `Total ${NGN_FORMATTER.format(detailOrder.amount / 100)}` : ''}
      >
        {detailOrder ? (
          <div className="space-y-6 text-sm text-gray-300">
            <section className="space-y-3 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
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
                    handleStatusUpdate(detailOrder.id, event.target.value as AdminOrderStatus)
                  }
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
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
            </section>

            <section className="space-y-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Line Items
              </p>
              <div className="space-y-3">
                {detailOrder.items.map((item) => (
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
                    >
                      {DELIVERY_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-semibold uppercase tracking-[0.16em]">Rider</span>
                      <p className="mt-1 text-sm text-gray-200">{deliveryDetail.rider ?? 'Unassigned'}</p>
                    </div>
                    <div>
                      <span className="font-semibold uppercase tracking-[0.16em]">ETA</span>
                      <p className="mt-1 text-sm text-gray-200">
                        {deliveryDetail.eta ? new Date(deliveryDetail.eta).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="space-y-3" onSubmit={handleAssignDelivery}>
                  <div className="flex flex-col gap-2 text-xs text-gray-500">
                    <label htmlFor="rider" className="font-semibold uppercase tracking-[0.16em]">
                      Rider / Partner
                    </label>
                    <input
                      id="rider"
                      name="rider"
                      placeholder="Eg. Segun Ade – Dispatch Co."
                      className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
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
                    className="w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                  >
                    Assign delivery
                  </button>
                </form>
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

