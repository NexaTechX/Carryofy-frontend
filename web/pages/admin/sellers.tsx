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
  useAdminSellers,
  useApproveSellerMutation,
  useRejectSellerMutation,
} from '../../lib/admin/hooks/useAdminSellers';
import { AdminSeller } from '../../lib/admin/types';
import { toast } from 'react-hot-toast';

const SELLER_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;
type SellerFilter = (typeof SELLER_FILTERS)[number];

const statusTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate));

export default function AdminSellers() {
  const [filter, setFilter] = useState<SellerFilter>('PENDING');
  const [selectedSeller, setSelectedSeller] = useState<AdminSeller | null>(null);

  const { data: sellers, isLoading, isError, error, refetch } = useAdminSellers();
  const approveSeller = useApproveSellerMutation();
  const rejectSeller = useRejectSellerMutation();

  const pendingCount = sellers?.filter((seller) => seller.kycStatus === 'PENDING').length ?? 0;
  const approvedCount = sellers?.filter((seller) => seller.kycStatus === 'APPROVED').length ?? 0;
  const rejectedCount = sellers?.filter((seller) => seller.kycStatus === 'REJECTED').length ?? 0;

  const filteredSellers = useMemo(() => {
    if (!sellers) return [];
    if (filter === 'ALL') return sellers;
    return sellers.filter((seller) => seller.kycStatus === filter);
  }, [sellers, filter]);

  const handleApprove = (seller: AdminSeller) => {
    approveSeller.mutate(seller.id, {
      onSuccess: () => {
        toast.success(`${seller.businessName} has been approved.`);
        setSelectedSeller((current) =>
          current && current.id === seller.id ? { ...current, kycStatus: 'APPROVED' } : current
        );
      },
    });
  };

  const handleReject = (seller: AdminSeller) => {
    rejectSeller.mutate(seller.id, {
      onSuccess: () => {
        toast.success(`${seller.businessName} has been rejected.`);
        setSelectedSeller((current) =>
          current && current.id === seller.id ? { ...current, kycStatus: 'REJECTED' } : current
        );
      },
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Seller Governance"
            tag="Marketplace Trust"
            subtitle="Review incoming KYC submissions, manage existing merchants, and keep the marketplace compliant."
          />

          <section className="mb-10 grid gap-4 sm:grid-cols-3">
            <AdminCard
              title="Awaiting Review"
              description="New sellers requiring an approval decision."
              className="border-[#3a2a1f] bg-[#15100d]"
            >
              <p className="text-3xl font-semibold text-primary">{pendingCount}</p>
            </AdminCard>
            <AdminCard
              title="Approved Sellers"
              description="Trusted sellers actively listing products."
              className="border-[#1f2f21] bg-[#0f1811]"
            >
              <p className="text-3xl font-semibold text-[#6ef2a1]">{approvedCount}</p>
            </AdminCard>
            <AdminCard
              title="Rejected / On Hold"
              description="Applications requiring follow-up."
              className="border-[#3a1f1f] bg-[#181010]"
            >
              <p className="text-3xl font-semibold text-[#ff9aa8]">{rejectedCount}</p>
            </AdminCard>
          </section>

          <AdminToolbar className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Filter by status
            </span>
            <div className="flex flex-wrap gap-2">
              {SELLER_FILTERS.map((item) => (
                <AdminFilterChip
                  key={item}
                  active={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item === 'ALL' ? 'All Sellers' : statusLabel[item]}
                </AdminFilterChip>
              ))}
            </div>
          </AdminToolbar>

          {isLoading ? (
            <LoadingState fullscreen />
          ) : isError ? (
            <AdminEmptyState
              title="Unable to load sellers"
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
          ) : filteredSellers.length === 0 ? (
            <AdminEmptyState
              title="No sellers in this view"
              description="Adjust your filters or check back when new submissions arrive."
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-6 py-4 text-white">Business</th>
                    <th className="px-6 py-4 text-white">Status</th>
                    <th className="px-6 py-4 text-white">Created</th>
                    <th className="px-6 py-4 text-white">Updated</th>
                    <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredSellers.map((seller) => (
                    <tr
                      key={seller.id}
                      className="transition hover:bg-[#10151d]"
                    >
                      <DataTableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{seller.businessName}</span>
                          <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
                            Seller ID: {seller.id.slice(0, 8)}…
                          </span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge tone={statusTone[seller.kycStatus]} label={statusLabel[seller.kycStatus]} />
                      </DataTableCell>
                      <DataTableCell>{formatDate(seller.createdAt)}</DataTableCell>
                      <DataTableCell>{formatDate(seller.updatedAt)}</DataTableCell>
                      <DataTableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {seller.kycStatus === 'PENDING' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(seller)}
                                disabled={approveSeller.isPending}
                                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(seller)}
                                disabled={rejectSeller.isPending}
                                className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setSelectedSeller(seller)}
                            className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
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
          )}
        </div>
      </div>

      <AdminDrawer
        open={Boolean(selectedSeller)}
        onClose={() => setSelectedSeller(null)}
        title={selectedSeller?.businessName}
        description={selectedSeller ? statusLabel[selectedSeller.kycStatus] : undefined}
        footer={
          selectedSeller?.kycStatus === 'PENDING' ? (
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => selectedSeller && handleReject(selectedSeller)}
                className="rounded-full border border-[#3a1f1f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6]"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => selectedSeller && handleApprove(selectedSeller)}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
              >
                Approve Seller
              </button>
            </div>
          ) : null
        }
      >
        {selectedSeller ? (
          <div className="space-y-6 text-sm text-gray-300">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Seller ID
              </p>
              <p className="mt-1 font-mono text-sm text-white">{selectedSeller.id}</p>
            </div>
            <div className="grid gap-4 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Current Status
                </p>
                <StatusBadge
                  tone={statusTone[selectedSeller.kycStatus]}
                  label={statusLabel[selectedSeller.kycStatus]}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Created
                  </span>
                  <p className="mt-1 text-sm text-white">{formatDate(selectedSeller.createdAt)}</p>
                </div>
                <div>
                  <span className="font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Updated
                  </span>
                  <p className="mt-1 text-sm text-white">{formatDate(selectedSeller.updatedAt)}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Seller details are currently limited to KYC status. Extend this drawer with additional
              context such as contact information, submitted documents, and recent activity once the
              backend exposes that data.
            </p>
          </div>
        ) : null}
      </AdminDrawer>
    </AdminLayout>
  );
}

