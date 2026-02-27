import { useCallback, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { DeliveryMapModal } from '../../components/admin/DeliveryMapModal';
import { IssueResolutionModal } from '../../components/admin/IssueResolutionModal';
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
import {
  useActiveDeliveries,
  useAssignDeliveryMutation,
  useAvailableRiders,
  useDeliveryByOrder,
  useDeliveryStatusMutation,
} from '../../lib/admin/hooks/useAdminDeliveries';
import { useAdminOrderDetail } from '../../lib/admin/hooks/useAdminOrders';
import { useTableKeyboardNav } from '../../lib/admin/hooks/useTableKeyboardNav';
import { getStatusTone } from '../../lib/admin/statusTones';
import { AdminDelivery } from '../../lib/admin/types';
import type { AvailableRider } from '../../lib/admin/api';
import { toast } from 'react-hot-toast';
import { formatNgnFromKobo } from '../../lib/api/utils';
import { MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const DELIVERY_FILTERS = ['ALL', 'PREPARING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'ISSUE'] as const;
type DeliveryFilter = (typeof DELIVERY_FILTERS)[number];

const DELIVERY_TABLE_COLUMNS = [
  { id: 'deliveryId', label: 'Delivery ID' },
  { id: 'orderId', label: 'Order ID' },
  { id: 'rider', label: 'Rider' },
  { id: 'pickup', label: 'Pickup' },
  { id: 'dropoff', label: 'Drop-off' },
  { id: 'status', label: 'Status' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'eta', label: 'ETA' },
  { id: 'actions', label: 'Actions' },
];

const DELIVERY_LABEL: Record<string, string> = {
  PREPARING: 'Preparing',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  ISSUE: 'Issue',
};

// Default pickup (e.g. warehouse) for proximity sort — Lagos
const DEFAULT_PICKUP_LAT = 6.5244;
const DEFAULT_PICKUP_LNG = 3.3792;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getRiderDisplayName(
  delivery: AdminDelivery,
  riders: AvailableRider[] | undefined
): string {
  if (!delivery.riderId) return 'Unassigned';
  const r = riders?.find((x) => x.id === delivery.riderId);
  if (r) return r.name;
  if (typeof delivery.rider === 'string') return delivery.rider;
  return delivery.rider?.name ?? 'Unknown Rider';
}

function RiderAvatar({ name }: { name: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary"
      aria-hidden
    >
      {initial}
    </span>
  );
}

function getDropoffLabel(d: AdminDelivery): string {
  if (d.deliveryAddressInfo) {
    const a = d.deliveryAddressInfo;
    return [a.line1, a.city, a.state].filter(Boolean).join(', ') || a.fullAddress || '—';
  }
  return d.deliveryAddress || '—';
}

export default function AdminDeliveries() {
  const [filter, setFilter] = useState<DeliveryFilter>('ALL');
  const [selectedDelivery, setSelectedDelivery] = useState<AdminDelivery | null>(null);
  const [assignOrderId, setAssignOrderId] = useState('');
  const [assignRider, setAssignRider] = useState('');
  const [assignEta, setAssignEta] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapModalDelivery, setMapModalDelivery] = useState<AdminDelivery | null>(null);
  const [issueResolutionDelivery, setIssueResolutionDelivery] = useState<AdminDelivery | null>(null);

  const { data: deliveries, isLoading, isError, error, refetch, dataUpdatedAt } = useActiveDeliveries({
    refetchInterval: autoRefresh ? 30000 : 30_000, // near-real-time: 30s when not in manual-only mode
  });
  const [tableColumns, setTableColumns] = useColumnVisibility(DELIVERY_TABLE_COLUMNS);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const assignDelivery = useAssignDeliveryMutation();
  const updateStatus = useDeliveryStatusMutation();
  const { data: availableRiders, isLoading: loadingRiders } = useAvailableRiders();
  const deliveryForAssignOrder = useDeliveryByOrder(assignOrderId.trim() || null);

  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];
    if (filter === 'ALL') return deliveries;
    return deliveries.filter((d) => d.status === filter);
  }, [deliveries, filter]);

  const visibleCols = tableColumns.filter((c) => c.visible);
  const { getRowProps } = useTableKeyboardNav({
    rowCount: filteredDeliveries.length,
    selectedIndex: selectedRowIndex,
    onSelectIndex: setSelectedRowIndex,
    onOpenRow: (index) => setSelectedDelivery(filteredDeliveries[index] ?? null),
    enabled: filteredDeliveries.length > 0,
  });

  const handleExportDeliveriesCSV = () => {
    const cols = visibleCols.filter((c) => c.id !== 'actions').map((c) => ({ id: c.id, label: c.label }));
    const rows = filteredDeliveries.map((d) => ({
      deliveryId: d.id,
      orderId: d.orderId,
      rider: getRiderDisplayName(d, availableRiders),
      pickup: d.vendorName || 'Vendor (Unknown)',
      dropoff: getDropoffLabel(d),
      status: DELIVERY_LABEL[d.status] ?? d.status,
      assigned: new Date(d.createdAt).toLocaleString(),
      eta: d.eta ? new Date(d.eta).toLocaleString() : '—',
    }));
    const csv = buildCSV(cols, rows);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `deliveries-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const inTransit = deliveries?.filter((d) => d.status === 'IN_TRANSIT').length ?? 0;
  const preparing = deliveries?.filter((d) => d.status === 'PREPARING').length ?? 0;
  const deliveredToday = deliveries?.filter((d) => d.status === 'DELIVERED').length ?? 0;
  const issueCount = deliveries?.filter((d) => d.status === 'ISSUE').length ?? 0;

  const filterCounts = useMemo(() => {
    const counts: Record<DeliveryFilter, number> = {
      ALL: deliveries?.length ?? 0,
      PREPARING: preparing,
      PICKED_UP: deliveries?.filter((d) => d.status === 'PICKED_UP').length ?? 0,
      IN_TRANSIT: inTransit,
      DELIVERED: deliveredToday,
      ISSUE: issueCount,
    };
    return counts;
  }, [deliveries, preparing, inTransit, deliveredToday, issueCount]);

  const ridersByProximity = useMemo(() => {
    if (!availableRiders?.length) return [];
    return [...availableRiders].sort((a, b) => {
      const latA = a.riderProfile?.currentLat;
      const lngA = a.riderProfile?.currentLng;
      const latB = b.riderProfile?.currentLat;
      const lngB = b.riderProfile?.currentLng;
      const hasA = latA != null && lngA != null;
      const hasB = latB != null && lngB != null;
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      const kmA = haversineKm(DEFAULT_PICKUP_LAT, DEFAULT_PICKUP_LNG, latA!, lngA!);
      const kmB = haversineKm(DEFAULT_PICKUP_LAT, DEFAULT_PICKUP_LNG, latB!, lngB!);
      return kmA - kmB;
    });
  }, [availableRiders]);

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
    setAssignOrderId('');
    setAssignRider('');
    setAssignEta('');
  };

  const mapPickup = useMemo(() => {
    const d = mapModalDelivery;
    return {
      lat: d?.vendorLatitude ? Number(d.vendorLatitude) : DEFAULT_PICKUP_LAT,
      lng: d?.vendorLongitude ? Number(d.vendorLongitude) : DEFAULT_PICKUP_LNG,
      label: d?.vendorName || 'Pickup Location',
    };
  }, [mapModalDelivery]);
  const mapDropoff = useMemo(() => {
    const d = mapModalDelivery;
    if (!d?.deliveryAddressInfo) return null;
    return {
      lat: DEFAULT_PICKUP_LAT + 0.02,
      lng: DEFAULT_PICKUP_LNG + 0.01,
      label: d.deliveryAddressInfo.line1 || 'Drop-off',
    };
  }, [mapModalDelivery]);

  const handleMarkFailed = useCallback(() => {
    if (!issueResolutionDelivery) return;
    updateStatus.mutate(
      { deliveryId: issueResolutionDelivery.id, status: 'ISSUE' },
      {
        onSuccess: () => {
          setIssueResolutionDelivery(null);
          toast.success('Marked as failed / issue.');
        },
      }
    );
  }, [issueResolutionDelivery, updateStatus]);

  const handleContactRider = useCallback(() => {
    if (!issueResolutionDelivery) return;
    const rider = availableRiders?.find((r) => r.id === issueResolutionDelivery.riderId);
    const phone = rider?.phone;
    if (phone) {
      window.open(`tel:${phone}`, '_blank');
      toast.success('Opening phone dialer.');
    } else {
      toast.error('Rider phone not available.');
    }
  }, [issueResolutionDelivery, availableRiders]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Delivery Command"
            tag="Logistics"
            subtitle="Monitor dispatch performance and keep riders accountable for every hand-off."
          />

          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminCard
              title="On the road"
              description="Riders currently in motion."
              onClick={() => setFilter('IN_TRANSIT')}
            >
              <p className="text-3xl font-semibold text-primary">{inTransit}</p>
            </AdminCard>
            <AdminCard
              title="Preparing"
              description="Packages ready for pick-up."
              onClick={() => setFilter('PREPARING')}
            >
              <p className="text-3xl font-semibold text-[#76e4f7]">{preparing}</p>
            </AdminCard>
            <AdminCard
              title="Delivered today"
              description="Completed confirmations today."
              onClick={() => setFilter('DELIVERED')}
            >
              <p className="text-3xl font-semibold text-[#6ce7a2]">{deliveredToday}</p>
            </AdminCard>
            <AdminCard
              title="Issue / Failed deliveries"
              description="Triage and resolve problems."
              onClick={() => setFilter('ISSUE')}
              accent="red"
            >
              <p className="text-3xl font-semibold text-red-400">{issueCount}</p>
            </AdminCard>
          </section>

          <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">Quick assignment</h2>
            <p className="mt-1 text-sm text-gray-400">
              Assign a rider to an order that just cleared payment. Riders are suggested by proximity to pickup.
            </p>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-[1.5fr_repeat(2,1fr)_auto_auto]"
              onSubmit={handleAssign}
            >
              <input
                value={assignOrderId}
                onChange={(e) => setAssignOrderId(e.target.value)}
                placeholder="Order ID"
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              <select
                value={assignRider}
                onChange={(e) => setAssignRider(e.target.value)}
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                disabled={loadingRiders}
              >
                <option value="">Select Rider</option>
                {ridersByProximity.map((rider) => {
                  const lat = rider.riderProfile?.currentLat;
                  const lng = rider.riderProfile?.currentLng;
                  const hasLoc = lat != null && lng != null;
                  const km = hasLoc
                    ? haversineKm(DEFAULT_PICKUP_LAT, DEFAULT_PICKUP_LNG, lat, lng).toFixed(1)
                    : '—';
                  const status = rider.riderProfile?.isAvailable ? 'Available' : 'Busy';
                  return (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} · {status} · {km} km
                    </option>
                  );
                })}
              </select>
              <input
                type="datetime-local"
                value={assignEta}
                onChange={(e) => setAssignEta(e.target.value)}
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setMapModalDelivery(deliveryForAssignOrder.data ?? null);
                  setMapModalOpen(true);
                }}
                disabled={!assignOrderId.trim()}
                className="flex items-center justify-center gap-2 rounded-full border border-[#2a2a2a] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <MapPin className="h-4 w-4" />
                View on Map
              </button>
              <button
                type="submit"
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
              >
                Assign
              </button>
            </form>
          </section>

          <AdminToolbar className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Filter
              </span>
              {DELIVERY_FILTERS.map((item) => (
                <AdminFilterChip
                  key={item}
                  active={filter === item}
                  count={filterCounts[item]}
                  onClick={() => setFilter(item)}
                >
                  {item === 'ALL' ? 'All deliveries' : DELIVERY_LABEL[item] ?? item}
                </AdminFilterChip>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-[#2a2a2a] bg-[#151515] text-primary focus:ring-primary"
                />
                <span>Auto-refresh (30s)</span>
              </label>
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
            <>
              <AdminTableToolbar
                columns={tableColumns}
                onColumnsChange={setTableColumns}
                onExportCSV={handleExportDeliveriesCSV}
                lastUpdatedAt={dataUpdatedAt}
                onRefresh={() => refetch()}
                isRefreshing={isLoading}
                className="mb-4"
              />
              <DataTableContainer className="mt-6">
                <DataTable>
                  <DataTableHead>
                    <tr>
                      {visibleCols.map((c) => (
                        <th
                          key={c.id}
                          className={c.id === 'actions' ? 'px-6 py-4 text-right text-gray-500' : 'px-6 py-4 text-white'}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {filteredDeliveries.map((delivery, index) => {
                      const riderName = getRiderDisplayName(delivery, availableRiders);
                      const rowProps = getRowProps(index);
                      const isSelected = rowProps['data-selected'];
                      return (
                        <tr
                          key={delivery.id}
                          {...rowProps}
                          onClick={() => {
                            setSelectedRowIndex(index);
                            setSelectedDelivery(delivery);
                          }}
                          className={clsx(
                            'cursor-pointer transition hover:bg-[#10151d]',
                            isSelected && 'bg-[#10151d] ring-1 ring-inset ring-primary/50'
                          )}
                        >
                          {visibleCols.some((c) => c.id === 'deliveryId') && (
                            <DataTableCell>
                              <span className="font-mono text-xs text-gray-400">
                                {delivery.id.slice(0, 8)}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'orderId') && (
                            <DataTableCell>
                              <span className="font-mono text-sm font-semibold text-white">
                                #{delivery.orderId.slice(0, 8)}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'rider') && (
                            <DataTableCell>
                              <div className="flex items-center gap-2">
                                <RiderAvatar name={riderName} />
                                <span className="text-sm text-gray-200">{riderName}</span>
                              </div>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'pickup') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-400">
                                {delivery.vendorName || 'Vendor Location'}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'dropoff') && (
                            <DataTableCell>
                              <span className="max-w-[160px] truncate text-sm text-gray-300" title={getDropoffLabel(delivery)}>
                                {getDropoffLabel(delivery)}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'status') && (
                            <DataTableCell>
                              <StatusBadge
                                tone={getStatusTone(delivery.status)}
                                label={DELIVERY_LABEL[delivery.status] ?? delivery.status}
                              />
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'assigned') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-300">
                                {new Date(delivery.createdAt).toLocaleString()}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'eta') && (
                            <DataTableCell>
                              <span className="text-sm text-gray-300">
                                {delivery.eta ? new Date(delivery.eta).toLocaleString() : '—'}
                              </span>
                            </DataTableCell>
                          )}
                          {visibleCols.some((c) => c.id === 'actions') && (
                            <DataTableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMapModalDelivery(delivery);
                                    setMapModalOpen(true);
                                  }}
                                  className="rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                                >
                                  Map
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDelivery(delivery)}
                                  className="rounded-full border border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIssueResolutionDelivery(delivery)}
                                  className="flex items-center gap-1 rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-red-400 transition hover:bg-red-500/10"
                                  title="Report issue / quick resolution"
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Issue
                                </button>
                              </div>
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
                  tone={getStatusTone(selectedDelivery.status)}
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

            {/* Vendor Pickup Display */}
            <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
                Pickup Location
              </p>
              <div className="bg-[#131924] rounded-lg p-3 space-y-1">
                <p className="text-sm text-gray-200 font-medium">
                  {selectedDelivery.vendorName || 'Vendor (Unknown)'}
                </p>
                {selectedDelivery.pickupAddress && (
                  <p className="text-sm text-gray-300">
                    {selectedDelivery.pickupAddress}
                  </p>
                )}
                {selectedDelivery.pickupInstructions && (
                  <p className="text-xs text-[#ffcc99] mt-2 pt-2 border-t border-[#1f1f1f]">
                    <strong>Instructions:</strong> {selectedDelivery.pickupInstructions}
                  </p>
                )}
                {selectedDelivery.vendorLatitude && selectedDelivery.vendorLongitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDelivery.vendorLatitude},${selectedDelivery.vendorLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs text-[#76e4f7] hover:underline font-medium"
                  >
                    Route to Vendor (Google Maps) ↗
                  </a>
                )}
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
                    {orderDetail.amount ? formatNgnFromKobo(orderDetail.amount) : '—'}
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

      <DeliveryMapModal
        open={mapModalOpen}
        onClose={() => {
          setMapModalOpen(false);
          setMapModalDelivery(null);
        }}
        pickup={mapPickup}
        dropoff={mapDropoff}
        title="View on Map"
      />

      <IssueResolutionModal
        open={Boolean(issueResolutionDelivery)}
        onClose={() => setIssueResolutionDelivery(null)}
        delivery={issueResolutionDelivery}
        riderName={issueResolutionDelivery ? getRiderDisplayName(issueResolutionDelivery, availableRiders) : ''}
        onReassign={() => {
          if (issueResolutionDelivery) setSelectedDelivery(issueResolutionDelivery);
        }}
        onMarkFailed={handleMarkFailed}
        onContactRider={handleContactRider}
      />
    </AdminLayout>
  );
}
