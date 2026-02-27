import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search, AlertTriangle } from 'lucide-react';
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
  AdminTableToolbar,
  useColumnVisibility,
  buildCSV,
  downloadBlob,
} from '../../components/admin/ui';
import { useTableKeyboardNav } from '../../lib/admin/hooks/useTableKeyboardNav';
import { getStatusTone } from '../../lib/admin/statusTones';
import {
  useAdminOrders,
  useAdminOrderDetail,
  useOrderStatusMutation,
  useOrderValidTransitions,
} from '../../lib/admin/hooks/useAdminOrders';
import {
  useAssignDeliveryMutation,
  useDeliveryByOrder,
  useAvailableRiders,
} from '../../lib/admin/hooks/useAdminDeliveries';
import { AdminDeliveryStatus, AdminOrder, AdminOrderStatus } from '../../lib/admin/types';
import { toast } from 'react-hot-toast';
import { formatNgnFromKobo } from '../../lib/api/utils';
import clsx from 'clsx';

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

const ORDER_FILTERS = ['ALL', ...ORDER_STATUS_OPTIONS.map((item) => item.value)] as const;

const ORDER_TABLE_COLUMNS = [
  { id: 'orderId', label: 'Order ID' },
  { id: 'customer', label: 'Customer' },
  { id: 'seller', label: 'Seller' },
  { id: 'items', label: 'Items' },
  { id: 'orderValue', label: 'Order value' },
  { id: 'status', label: 'Status' },
  { id: 'rider', label: 'Assigned Rider' },
  { id: 'timeElapsed', label: 'Time elapsed' },
];
type OrderFilter = (typeof ORDER_FILTERS)[number];

const STALLED_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

function timeElapsed(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ${mins % 60}m ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

function getOrderSeller(order: AdminOrder): string {
  const first = order.items?.[0]?.product?.seller?.businessName;
  if (first) return first;
  const names = [...new Set(order.items?.map((i) => i.product?.seller?.businessName).filter(Boolean))] as string[];
  return names[0] ?? '—';
}

function getRiderName(order: AdminOrder): string {
  const d = order.delivery;
  if (!d?.riderId && !d?.rider) return '—';
  if (typeof d.rider === 'string') return d.rider;
  if (d.rider?.name) return d.rider.name;
  return 'Assigned';
}

/** Stat strip card config: key, label, color, count getter, show pulse when active. */
const STAT_STRIP = [
  {
    key: 'PENDING_PAYMENT',
    label: 'Pending Payment',
    description: 'Awaiting customer confirmation.',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    pulse: true,
  },
  {
    key: 'PAID',
    label: 'Payment Confirmed',
    description: 'Paid, ready for warehouse.',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    pulse: true,
  },
  {
    key: 'PROCESSING',
    label: 'Preparing in Warehouse',
    description: 'Orders being packed.',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    pulse: true,
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    description: 'Riders on the move.',
    color: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
    pulse: true,
  },
  {
    key: 'DELIVERED_TODAY',
    label: 'Delivered Today',
    description: 'Completed today.',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
    pulse: false,
  },
  {
    key: 'CANCELLED_TODAY',
    label: 'Cancelled Today',
    description: 'Cancelled today.',
    color: 'border-red-500/40 bg-red-500/10 text-red-400',
    pulse: false,
  },
] as const;

function getStatCount(orders: AdminOrder[] | undefined, key: string): number {
  if (!orders) return 0;
  if (key === 'DELIVERED_TODAY') {
    return orders.filter((o) => o.status === 'DELIVERED' && isToday(o.updatedAt)).length;
  }
  if (key === 'CANCELLED_TODAY') {
    return orders.filter((o) => o.status === 'CANCELED' && isToday(o.updatedAt)).length;
  }
  return orders.filter((o) => o.status === key).length;
}

function isStalled(order: AdminOrder): boolean {
  if (order.status === 'DELIVERED' || order.status === 'CANCELED') return false;
  const updated = new Date(order.updatedAt).getTime();
  return Date.now() - updated > STALLED_THRESHOLD_MS;
}

export default function AdminOrders() {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderFilter>('ALL');
  const [focusedOrder, setFocusedOrder] = useState<AdminOrder | null>(null);
  const [search, setSearch] = useState('');

  const { data: orders, isLoading, isError, error, refetch, dataUpdatedAt } = useAdminOrders({ refetchInterval: 30_000 });
  const [tableColumns, setTableColumns] = useColumnVisibility(ORDER_TABLE_COLUMNS);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);

  useEffect(() => {
    const orderId = router.query.orderId;
    if (typeof orderId !== 'string') return;
    const order = orders?.find((o) => o.id === orderId);
    setFocusedOrder(order ?? ({ id: orderId } as AdminOrder));
  }, [router.query.orderId, orders]);

  useEffect(() => {
    const status = router.query.status;
    if (typeof status !== 'string') return;
    const valid = ORDER_FILTERS.includes(status as OrderFilter);
    if (valid) setFilter(status as OrderFilter);
  }, [router.query.status]);

  const updateOrderStatus = useOrderStatusMutation();
  const assignDelivery = useAssignDeliveryMutation();
  const { data: availableRiders, isLoading: loadingRiders } = useAvailableRiders();

  const filteredByStatus = useMemo(() => {
    if (!orders) return [];
    if (filter === 'ALL') return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return filteredByStatus;
    const q = search.trim().toLowerCase();
    return filteredByStatus.filter((order) => {
      const id = order.id.toLowerCase();
      const name = (order.user?.name ?? '').toLowerCase();
      const email = (order.user?.email ?? '').toLowerCase();
      const seller = getOrderSeller(order).toLowerCase();
      return id.includes(q) || name.includes(q) || email.includes(q) || seller.includes(q);
    });
  }, [filteredByStatus, search]);

  const visibleCols = tableColumns.filter((c) => c.visible);
  const { getRowProps } = useTableKeyboardNav({
    rowCount: filteredOrders.length,
    selectedIndex: selectedRowIndex,
    onSelectIndex: setSelectedRowIndex,
    onOpenRow: (index) => setFocusedOrder(filteredOrders[index] ?? null),
    enabled: filteredOrders.length > 0,
  });

  const handleExportOrdersCSV = () => {
    const cols = visibleCols.map((c) => ({ id: c.id, label: c.label }));
    const rows = filteredOrders.map((order) => ({
      orderId: order.id,
      customer: order.user?.name ?? '',
      seller: getOrderSeller(order),
      items: order.items?.length ?? 0,
      orderValue: formatNgnFromKobo(order.amount),
      status: ORDER_STATUS_OPTIONS.find((o) => o.value === order.status)?.label ?? order.status,
      rider: getRiderName(order),
      timeElapsed: timeElapsed(order.updatedAt),
    }));
    const csv = buildCSV(cols, rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `orders-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const stalledOrders = useMemo(() => (orders ?? []).filter(isStalled), [orders]);

  const filterCounts = useMemo(() => {
    const list = orders ?? [];
    return {
      ALL: list.length,
      PENDING_PAYMENT: list.filter((o) => o.status === 'PENDING_PAYMENT').length,
      PAID: list.filter((o) => o.status === 'PAID').length,
      PROCESSING: list.filter((o) => o.status === 'PROCESSING').length,
      OUT_FOR_DELIVERY: list.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
      DELIVERED: list.filter((o) => o.status === 'DELIVERED').length,
      CANCELED: list.filter((o) => o.status === 'CANCELED').length,
    };
  }, [orders]);

  const focusedOrderId = focusedOrder?.id ?? null;
  const { data: orderDetail } = useAdminOrderDetail(focusedOrderId);
  const { data: deliveryDetail } = useDeliveryByOrder(focusedOrderId);
  const { data: validTransitions = [] } = useOrderValidTransitions(focusedOrderId);

  const detailOrder = orderDetail ?? focusedOrder;

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
    const form = event.currentTarget;
    const formData = new FormData(form);
    const riderId = String(formData.get('riderId') || '');
    const eta = formData.get('eta') ? new Date(String(formData.get('eta'))).toISOString() : undefined;

    if (!detailOrder) return;

    await assignDelivery.mutateAsync({
      orderId: detailOrder.id,
      riderId: riderId || undefined,
      eta,
    });

    toast.success('Delivery assigned.');
    form.reset();
  };

  const handleEscalateStalled = () => {
    if (stalledOrders.length > 0) {
      setFocusedOrder(stalledOrders[0]);
      setFilter('ALL');
    }
  };

  const customerType = (order: AdminOrder) => order.customerType ?? 'B2C';

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Order Control Center"
            tag="Fulfilment Operations"
            subtitle="Track every transaction across Carryofy, act on stalled orders, and coordinate fulfilment teams in one place."
          />

          {/* Horizontally scrollable stat strip — full funnel */}
          <section className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-[#111] scrollbar-thumb-[#333]">
              {STAT_STRIP.map((stat) => {
                const count = getStatCount(orders, stat.key);
                return (
                  <div
                    key={stat.key}
                    className={clsx(
                      'shrink-0 w-[180px] rounded-xl border p-4 transition',
                      stat.color
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {stat.pulse && count > 0 && (
                        <span
                          className="relative flex h-2 w-2"
                          aria-hidden
                        >
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                        </span>
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                        {stat.label}
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{count}</p>
                    <p className="mt-0.5 text-xs opacity-80">{stat.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stalled Orders banner */}
          {stalledOrders.length > 0 && (
            <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-200">
                    Stalled Orders — {stalledOrders.length} order{stalledOrders.length !== 1 ? 's' : ''} in same status for over 2 hours
                  </p>
                  <p className="text-xs text-amber-200/80">
                    Review and escalate to unblock fulfilment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEscalateStalled}
                className="shrink-0 rounded-full border border-amber-500/60 bg-amber-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-200 transition hover:bg-amber-500/30"
              >
                Escalate
              </button>
            </div>
          )}

          {/* Status filter tabs with count badges */}
          <AdminToolbar className="mb-4 flex-wrap gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Filter by status
            </span>
            <div className="flex flex-wrap gap-2">
              {ORDER_FILTERS.map((option) => (
                <AdminFilterChip
                  key={option}
                  active={filter === option}
                  count={filterCounts[option]}
                  onClick={() => setFilter(option)}
                >
                  {option === 'ALL'
                    ? 'All orders'
                    : ORDER_STATUS_OPTIONS.find((item) => item.value === option)?.label ?? option}
                </AdminFilterChip>
              ))}
            </div>
          </AdminToolbar>

          {/* Search bar */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                placeholder="Search by Order ID, customer, or seller…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#1f1f1f] bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

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
              description={search.trim() ? 'Try a different search or clear the filter.' : 'Adjust your filters or come back later.'}
            />
          ) : (
            <>
              <AdminTableToolbar
                columns={tableColumns}
                onColumnsChange={setTableColumns}
                onExportCSV={handleExportOrdersCSV}
                lastUpdatedAt={dataUpdatedAt}
                onRefresh={() => refetch()}
                isRefreshing={isLoading}
                className="mb-4"
              />
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      {visibleCols.map((c) => (
                        <th key={c.id} className="px-6 py-4 text-white">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredOrders.map((order, index) => {
                      const rowProps = getRowProps(index);
                      const isSelected = rowProps['data-selected'];
                      return (
                        <tr
                          key={order.id}
                          {...rowProps}
                          onClick={() => {
                            setSelectedRowIndex(index);
                            setFocusedOrder(order);
                          }}
                          className={clsx(
                            'cursor-pointer transition hover:bg-[#10151d]',
                            isSelected && 'bg-[#10151d] ring-1 ring-inset ring-primary/50'
                          )}
                        >
                          {visibleCols.some((c) => c.id === 'orderId') && (
                            <DataTableCell>
                              <span className="font-mono text-sm font-semibold text-white">
                                #{order.id.slice(0, 8)}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'customer') && (
                            <DataTableCell>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm text-gray-200">
                                  {order.user?.name ?? '—'}
                                </span>
                                <span
                                  className={clsx(
                                    'inline-flex w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                                    customerType(order) === 'B2B'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-gray-600/30 text-gray-400'
                                  )}
                                >
                                  {customerType(order)}
                                </span>
                              </div>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'seller') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-300">{getOrderSeller(order)}</span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'items') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-300">{order.items?.length ?? 0}</span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'orderValue') && (
                            <DataTableCell>
                              <span className="text-sm font-semibold text-white">
                                {formatNgnFromKobo(order.amount)}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'status') && (
                            <DataTableCell>
                              <StatusBadge
                                tone={getStatusTone(order.status)}
                                label={
                                  ORDER_STATUS_OPTIONS.find((item) => item.value === order.status)?.label ??
                                  order.status
                                }
                              />
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'rider') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-400">{getRiderName(order)}</span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'timeElapsed') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-500">{timeElapsed(order.updatedAt)}</span>
                            </DataTableCell>
                          )}
                        </tr>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>
            </>
          )}
        </div>
      </div>

      <AdminDrawer
        open={Boolean(focusedOrderId)}
        onClose={() => setFocusedOrder(null)}
        title={detailOrder?.id ? `Order #${detailOrder.id.slice(0, 8)}` : 'Order details'}
        description={detailOrder?.amount ? `Total ${formatNgnFromKobo(detailOrder.amount)}` : ''}
      >
        {detailOrder ? (
          <div className="space-y-6 text-sm text-gray-300">
            {/* Action buttons: Reassign Rider / Cancel / Force Complete */}
            <section className="flex flex-wrap gap-2">
              {canAssignDelivery && (
                <a href="#delivery-section" className="rounded-full border border-primary bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition hover:bg-primary/20">
                  Reassign Rider
                </a>
              )}
              {detailOrder.status !== 'DELIVERED' && detailOrder.status !== 'CANCELED' && (
                <button
                  type="button"
                  onClick={() => detailOrder.id && handleStatusUpdate(detailOrder.id, 'CANCELED')}
                  className="rounded-full border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/20"
                >
                  Cancel
                </button>
              )}
              {detailOrder.status !== 'DELIVERED' && detailOrder.status !== 'CANCELED' && (
                <button
                  type="button"
                  onClick={() => detailOrder.id && handleStatusUpdate(detailOrder.id, 'DELIVERED')}
                  className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  Force Complete
                </button>
              )}
            </section>

            <p className="text-xs text-amber-200/90">
              Only the buyer can normally mark an order as Delivered. Use Force Complete for disputes or manual resolution.
            </p>

            {/* Status + timeline */}
            <section className="space-y-3 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Status</p>
                  <StatusBadge
                    tone={getStatusTone(detailOrder.status)}
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
                  onChange={(e) =>
                    detailOrder.id && handleStatusUpdate(detailOrder.id, e.target.value as AdminOrderStatus)
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
              <div className="border-t border-[#1f1f1f] pt-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Timeline</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Created — {new Date(detailOrder.createdAt).toLocaleString()}
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-gray-500" />
                    Last updated — {new Date(detailOrder.updatedAt).toLocaleString()}
                  </li>
                  {deliveryDetail?.eta && (
                    <li className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      ETA — {new Date(deliveryDetail.eta).toLocaleString()}
                    </li>
                  )}
                </ul>
              </div>
            </section>

            {/* Customer info */}
            <section className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Customer</p>
              <div className="mt-2 grid gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Name</span>
                  <span className="text-gray-200">{detailOrder.user?.name ?? '—'}</span>
                  <span className={clsx('rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', customerType(detailOrder) === 'B2B' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-600/30 text-gray-400')}>
                    {customerType(detailOrder)}
                  </span>
                </div>
                <div><span className="text-gray-500">Email</span> <span className="text-gray-200">{detailOrder.user?.email ?? '—'}</span></div>
                {detailOrder.user?.phone && <div><span className="text-gray-500">Phone</span> <span className="text-gray-200">{detailOrder.user.phone}</span></div>}
              </div>
              {detailOrder.address && (
                <div className="mt-3 border-t border-[#1f1f1f] pt-3">
                  <p className="text-xs text-gray-500">Delivery address</p>
                  <p className="mt-1 text-gray-200">
                    {detailOrder.address.line1}
                    {detailOrder.address.line2 && `, ${detailOrder.address.line2}`}
                  </p>
                  <p className="text-gray-300">{detailOrder.address.city}, {detailOrder.address.state}</p>
                </div>
              )}
            </section>

            {/* Seller info */}
            <section className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Seller</p>
              <p className="mt-2 text-gray-200">{getOrderSeller(detailOrder)}</p>
            </section>

            {/* Line items */}
            <section id="line-items" className="space-y-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Line Items</p>
              <div className="space-y-3">
                {detailOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-[#1f1f1f] bg-[#131924] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{item.product?.title ?? 'Product'}</p>
                      <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {formatNgnFromKobo(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Financial Breakdown (Admin Only) */}
            <section className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
                Financial Breakdown
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Items Subtotal</span>
                  <span className="text-white">{formatNgnFromKobo(detailOrder.subtotalKobo ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping (Customer Paid)</span>
                  <span className="text-white">{formatNgnFromKobo(detailOrder.shippingFeeKobo ?? 0)}</span>
                </div>
                {detailOrder.couponDiscountKobo ? (
                  <div className="flex justify-between">
                    <span className="text-red-400/80">Coupon Discount</span>
                    <span className="text-red-400">-{formatNgnFromKobo(detailOrder.couponDiscountKobo)}</span>
                  </div>
                ) : null}
                <div className="my-2 border-t border-[#1f1f1f] pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-400">Customer Total</span>
                    <span className="text-primary">{formatNgnFromKobo(detailOrder.amount)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-primary/20 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Carryofy Internal Audit</p>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Rider Fee (Our Cost)</span>
                    <span className="text-[#6ce7a2]">{formatNgnFromKobo(detailOrder.riderCostKobo ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Platform Profit (Margin)</span>
                    <span className="text-[#76e4f7] font-bold">{formatNgnFromKobo(detailOrder.carryofyMarginKobo ?? 0)}</span>
                  </div>
                  {detailOrder.distanceKmForPricing != null && (
                    <p className="text-[10px] text-gray-500 italic mt-1">
                      Distance: {detailOrder.distanceKmForPricing}km | Weight: {detailOrder.chargeableWeightKg ?? '—'}kg
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Delivery / Rider (Reassign) */}
            <section id="delivery-section" className="space-y-3 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Delivery & Rider</p>
              {deliveryDetail ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge
                      tone={getStatusTone(deliveryDetail.status)}
                      label={
                        DELIVERY_STATUS_OPTIONS.find((o) => o.value === deliveryDetail.status)?.label ?? deliveryDetail.status
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="font-semibold uppercase tracking-[0.16em]">Rider</span>
                      <p className="mt-1 text-sm text-gray-200">
                        {deliveryDetail.riderId
                          ? (availableRiders?.find((r) => r.id === deliveryDetail.riderId)?.name ??
                            (typeof deliveryDetail.rider === 'string' ? deliveryDetail.rider : deliveryDetail.rider?.name) ??
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
                  {(deliveryDetail.deliveryAddressInfo || deliveryDetail.deliveryAddress) && (
                    <div className="mt-4 border-t border-[#1f1f1f] pt-4">
                      <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">Delivery Address</span>
                      <div className="mt-2 rounded-lg bg-[#131924] p-3 text-xs text-gray-200">
                        {deliveryDetail.deliveryAddressInfo ? (
                          <>
                            <p>{deliveryDetail.deliveryAddressInfo.line1}{deliveryDetail.deliveryAddressInfo.line2 ? `, ${deliveryDetail.deliveryAddressInfo.line2}` : ''}</p>
                            <p>{deliveryDetail.deliveryAddressInfo.city}, {deliveryDetail.deliveryAddressInfo.state}</p>
                          </>
                        ) : (
                          <p>{deliveryDetail.deliveryAddress}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {!canAssignDelivery ? (
                    <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      Update order status to Payment Confirmed or Packaging to reassign a rider.
                    </p>
                  ) : (
                    <form className="mt-4 space-y-3 rounded-lg border border-[#1f1f1f] bg-[#131924] p-3" onSubmit={handleAssignDelivery}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Reassign Rider</p>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reassign-riderId" className="text-xs text-gray-500">Select Rider</label>
                        <select
                          id="reassign-riderId"
                          name="riderId"
                          defaultValue={deliveryDetail.riderId || ''}
                          className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                          disabled={loadingRiders}
                        >
                          <option value="">Unassigned</option>
                          {availableRiders?.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} {r.riderProfile?.vehicleNumber ? `(${r.riderProfile.vehicleNumber})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="reassign-eta" className="text-xs text-gray-500">Estimated arrival</label>
                        <input
                          id="reassign-eta"
                          name="eta"
                          type="datetime-local"
                          defaultValue={deliveryDetail.eta ? new Date(deliveryDetail.eta).toISOString().slice(0, 16) : ''}
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
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                      Update order status to Payment Confirmed or Packaging before assigning delivery.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-400">No delivery assigned. Assign a rider below.</p>
                      <form className="space-y-3" onSubmit={handleAssignDelivery}>
                        <div className="flex flex-col gap-2 text-xs text-gray-500">
                          <label htmlFor="riderId" className="font-semibold uppercase tracking-[0.16em]">Select Rider</label>
                          <select
                            id="riderId"
                            name="riderId"
                            className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary hover:border-primary focus:outline-none"
                            disabled={loadingRiders}
                          >
                            <option value="">Select a rider</option>
                            {availableRiders?.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} {r.riderProfile?.vehicleNumber ? `(${r.riderProfile.vehicleNumber})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2 text-xs text-gray-500">
                          <label htmlFor="eta" className="font-semibold uppercase tracking-[0.16em]">Estimated arrival</label>
                          <input
                            id="eta"
                            name="eta"
                            type="datetime-local"
                            className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loadingRiders || (availableRiders?.length === 0)}
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
          </div>
        ) : (
          <LoadingState label="Fetching order details…" />
        )}
      </AdminDrawer>
    </AdminLayout>
  );
}
