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
import { useKycAuditLog } from '../../lib/admin/hooks/useKycAuditLog';
import { AdminSeller } from '../../lib/admin/types';
import { toast } from 'react-hot-toast';
import DocumentViewer from '../../components/admin/DocumentViewer';
import KycAuditLog from '../../components/admin/KycAuditLog';
import { Clock, User, FileText, Download } from 'lucide-react';
import { bulkApproveSellersRequest, bulkRejectSellersRequest } from '../../lib/admin/api';
import { formatDate } from '../../lib/api/utils';

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

export default function AdminSellers() {
  const [filter, setFilter] = useState<SellerFilter>('PENDING');
  const [selectedSeller, setSelectedSeller] = useState<AdminSeller | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [sellerToReject, setSellerToReject] = useState<AdminSeller | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedPredefinedReason, setSelectedPredefinedReason] = useState<string>('');
  const [selectedSellerIds, setSelectedSellerIds] = useState<Set<string>>(new Set());

  const PREDEFINED_REJECTION_REASONS = [
    'ID document is unclear or unreadable',
    'ID document does not match provided information',
    'Missing required documents',
    'Documents are expired or invalid',
    'Business registration documents are missing or invalid',
    'Tax ID is missing or invalid',
    'Address proof is missing or invalid',
    'BVN verification failed',
    'Duplicate ID number detected',
    'Suspicious or fraudulent information',
    'Incomplete application',
    'Other (specify below)',
  ];
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('');
  const [expirationStartDate, setExpirationStartDate] = useState('');
  const [expirationEndDate, setExpirationEndDate] = useState('');

  const { data: sellers, isLoading, isError, error, refetch } = useAdminSellers();
  const approveSeller = useApproveSellerMutation();
  const rejectSeller = useRejectSellerMutation();
  const { data: auditLogs, isLoading: auditLogsLoading } = useKycAuditLog(selectedSeller?.id || null);

  const pendingCount = sellers?.filter((seller) => seller.kycStatus === 'PENDING').length ?? 0;
  const approvedCount = sellers?.filter((seller) => seller.kycStatus === 'APPROVED').length ?? 0;
  const rejectedCount = sellers?.filter((seller) => seller.kycStatus === 'REJECTED').length ?? 0;

  const filteredSellers = useMemo(() => {
    if (!sellers) return [];
    let filtered = sellers;

    // Filter by status
    if (filter !== 'ALL') {
      filtered = filtered.filter((seller) => seller.kycStatus === filter);
    }

    // Filter by search query (business name, email, ID number, seller ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (seller) =>
          seller.businessName.toLowerCase().includes(query) ||
          seller.kyc?.idNumber?.toLowerCase().includes(query) ||
          seller.user?.email?.toLowerCase().includes(query) ||
          seller.id.toLowerCase().includes(query)
      );
    }

    // Filter by business type
    if (businessTypeFilter) {
      filtered = filtered.filter(
        (seller) => seller.kyc?.businessType === businessTypeFilter
      );
    }

    // Filter by submission date range
    if (startDate || endDate) {
      filtered = filtered.filter((seller) => {
        const submissionDate = seller.kyc?.submittedAt 
          ? new Date(seller.kyc.submittedAt) 
          : new Date(seller.createdAt);
        if (startDate && submissionDate < new Date(startDate)) return false;
        if (endDate && submissionDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Filter by expiration date range
    if (expirationStartDate || expirationEndDate) {
      filtered = filtered.filter((seller) => {
        if (!seller.kycExpiresAt) return false;
        const expirationDate = new Date(seller.kycExpiresAt);
        if (expirationStartDate && expirationDate < new Date(expirationStartDate)) return false;
        if (expirationEndDate && expirationDate > new Date(expirationEndDate)) return false;
        return true;
      });
    }

    return filtered;
  }, [sellers, filter, searchQuery, startDate, endDate, businessTypeFilter, expirationStartDate, expirationEndDate]);

  const hasActiveFilters = searchQuery.trim() || startDate || endDate || businessTypeFilter || expirationStartDate || expirationEndDate;

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setBusinessTypeFilter('');
    setExpirationStartDate('');
    setExpirationEndDate('');
  };

  const exportToCsv = () => {
    if (!filteredSellers || filteredSellers.length === 0) {
      toast.error('No sellers to export');
      return;
    }

    const headers = [
      'Seller ID',
      'Business Name',
      'Email',
      'KYC Status',
      'Business Type',
      'ID Type',
      'ID Number',
      'Registration Number',
      'Tax ID',
      'BVN',
      'Submission Count',
      'Submitted At',
      'KYC Expires At',
      'Created At',
    ];

    const rows = filteredSellers.map((seller) => [
      seller.id,
      seller.businessName || '—',
      seller.user?.email || '—',
      seller.kycStatus || '—',
      seller.kyc?.businessType || '—',
      seller.kyc?.idType || '—',
      seller.kyc?.idNumber || '—',
      seller.kyc?.registrationNumber || '—',
      seller.kyc?.taxId || '—',
      seller.kyc?.bvn || '—',
      String(seller.kyc?.submissionCount || 0),
      seller.kyc?.submittedAt ? new Date(seller.kyc.submittedAt).toLocaleString() : '—',
      seller.kycExpiresAt ? new Date(seller.kycExpiresAt).toLocaleString() : '—',
      new Date(seller.createdAt).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sellers-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleBulkResetSubmissionCount = async () => {
    if (selectedSellerIds.size === 0) {
      toast.error('Please select sellers to reset submission count');
      return;
    }

    const selectedIds = Array.from(selectedSellerIds);
    let successCount = 0;
    let failCount = 0;

    for (const sellerId of selectedIds) {
      try {
        const token = localStorage.getItem('accessToken');
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';
        const response = await fetch(
          `${apiBase}/sellers/${sellerId}/kyc/reset-submission-count`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} seller(s) submission count reset successfully`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} seller(s) failed to reset`);
    }

    setSelectedSellerIds(new Set());
    refetch();
  };

  const handleApprove = (seller: AdminSeller) => {
    approveSeller.mutate(seller.id, {
      onSuccess: () => {
        toast.success(`${seller.businessName} has been approved.`);
        setSelectedSeller((current) =>
          current && current.id === seller.id ? { ...current, kycStatus: 'APPROVED' } : current
        );
        // Refetch to get updated data
        refetch();
      },
    });
  };

  const handleReject = (seller: AdminSeller) => {
    setSellerToReject(seller);
    setRejectionReason('');
    setSelectedPredefinedReason('');
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    if (!sellerToReject) return;
    
    // Validate that a reason is provided
    const finalReason = selectedPredefinedReason === 'Other (specify below)' 
      ? rejectionReason.trim() 
      : selectedPredefinedReason || rejectionReason.trim();
    
    if (!finalReason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    rejectSeller.mutate(
      { sellerId: sellerToReject.id, rejectionReason: finalReason },
      {
      onSuccess: () => {
          toast.success(`${sellerToReject.businessName} has been rejected.`);
        setSelectedSeller((current) =>
            current && current.id === sellerToReject.id ? { ...current, kycStatus: 'REJECTED' } : current
        );
          setRejectModalOpen(false);
          setSellerToReject(null);
          setRejectionReason('');
          setSelectedPredefinedReason('');
          // Refetch to get updated data
          refetch();
      },
      }
    );
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredSellers.map(seller => seller.id));
      setSelectedSellerIds(allIds);
    } else {
      setSelectedSellerIds(new Set());
    }
  };

  const toggleSellerSelection = (sellerId: string) => {
    setSelectedSellerIds(prev => {
      const next = new Set(prev);
      if (next.has(sellerId)) {
        next.delete(sellerId);
      } else {
        next.add(sellerId);
      }
      return next;
    });
  };

  const handleBulkApprove = async () => {
    if (selectedSellerIds.size === 0) return;

    // Only approve pending sellers
    const pendingSellerIds = filteredSellers
      .filter((s) => selectedSellerIds.has(s.id) && s.kycStatus?.toUpperCase() === 'PENDING')
      .map((s) => s.id);

    if (pendingSellerIds.length === 0) {
      toast.error('No pending sellers selected. Please select sellers with PENDING status.');
      return;
    }

    try {
      const result = await bulkApproveSellersRequest(pendingSellerIds);
      toast.success(`${result.approved} seller(s) approved successfully.`);
      if (result.failed > 0) {
        toast.error(`${result.failed} seller(s) failed to approve.`);
      }
      setSelectedSellerIds(new Set());
      refetch();
    } catch (error) {
      console.error('Bulk approve error:', error);
      toast.error('Failed to approve sellers.');
    }
  };

  const handleBulkReject = () => {
    if (selectedSellerIds.size === 0) return;

    // Only reject pending sellers
    const pendingSellerIds = filteredSellers
      .filter((s) => selectedSellerIds.has(s.id) && s.kycStatus?.toUpperCase() === 'PENDING')
      .map((s) => s.id);

    if (pendingSellerIds.length === 0) {
      toast.error('No pending sellers selected. Please select sellers with PENDING status.');
      return;
    }

    setRejectModalOpen(true);
  };

  const confirmBulkReject = async () => {
    if (selectedSellerIds.size === 0) return;

    // Only reject pending sellers
    const pendingSellerIds = filteredSellers
      .filter((s) => selectedSellerIds.has(s.id) && s.kycStatus?.toUpperCase() === 'PENDING')
      .map((s) => s.id);

    if (pendingSellerIds.length === 0) {
      toast.error('No pending sellers selected. Please select sellers with PENDING status.');
      setRejectModalOpen(false);
      return;
    }

    // Validate that a reason is provided
    const finalReason = selectedPredefinedReason === 'Other (specify below)' 
      ? rejectionReason.trim() 
      : selectedPredefinedReason || rejectionReason.trim();
    
    if (!finalReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const result = await bulkRejectSellersRequest(
        pendingSellerIds,
        finalReason
      );
      toast.success(`${result.rejected} seller(s) rejected successfully.`);
      if (result.failed > 0) {
        toast.error(`${result.failed} seller(s) failed to reject.`);
      }
      setSelectedSellerIds(new Set());
      setRejectModalOpen(false);
      setSellerToReject(null);
      setRejectionReason('');
      setSelectedPredefinedReason('');
      refetch();
    } catch (error) {
      console.error('Bulk reject error:', error);
      toast.error('Failed to reject sellers.');
    }
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
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-2">
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
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search by name, ID number, email, or seller ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary flex-1 min-w-[200px]"
                />
                <select
                  value={businessTypeFilter}
                  onChange={(e) => setBusinessTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Business Types</option>
                  <option value="Individual">Individual</option>
                  <option value="Business Name">Business Name</option>
                  <option value="Company">Company</option>
                </select>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Submission:</span>
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span>-</span>
                  <input
                    type="date"
                    placeholder="End Date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Expiration:</span>
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={expirationStartDate}
                    onChange={(e) => setExpirationStartDate(e.target.value)}
                    className="px-2 py-1 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span>-</span>
                  <input
                    type="date"
                    placeholder="End Date"
                    value={expirationEndDate}
                    onChange={(e) => setExpirationEndDate(e.target.value)}
                    className="px-2 py-1 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-[#2a2a2a] rounded-lg hover:bg-[#0f1419] transition"
                  >
                    Clear Filters
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={exportToCsv}
                    className="px-4 py-1.5 border border-[#2a2a2a] text-gray-300 text-xs font-semibold rounded-lg hover:bg-[#0f1419] transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  {selectedSellerIds.size > 0 && (
                    <>
                      <span className="text-xs text-gray-400">
                        {selectedSellerIds.size} selected
                        {(() => {
                          const selectedPending = filteredSellers.filter(
                            (s) => selectedSellerIds.has(s.id) && s.kycStatus?.toUpperCase() === 'PENDING'
                          ).length;
                          return selectedPending < selectedSellerIds.size
                            ? ` (${selectedPending} pending)`
                            : '';
                        })()}
                      </span>
                      <button
                        type="button"
                        onClick={handleBulkApprove}
                        disabled={
                          filteredSellers.filter(
                            (s) => selectedSellerIds.has(s.id) && s.kycStatus?.toUpperCase() === 'PENDING'
                          ).length === 0
                        }
                        className="px-4 py-1.5 bg-primary text-black text-xs font-semibold rounded-lg hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Approve Selected
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkReject}
                        disabled={
                          filteredSellers.filter(
                            (s) => selectedSellerIds.has(s.id) && s.kycStatus?.toUpperCase() === 'PENDING'
                          ).length === 0
                        }
                        className="px-4 py-1.5 border border-[#3a1f1f] text-[#ff9aa8] text-xs font-semibold rounded-lg hover:border-[#ff9aa8] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject Selected
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkResetSubmissionCount}
                        className="px-4 py-1.5 border border-yellow-600 text-yellow-400 text-xs font-semibold rounded-lg hover:bg-yellow-600/10 transition"
                      >
                        Reset Submission Count
                      </button>
                    </>
                  )}
                </div>
              </div>
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
                    <th className="px-6 py-4 text-white w-12">
                      <input
                        type="checkbox"
                        checked={selectedSellerIds.size === filteredSellers.length && filteredSellers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-[#2a2a2a] bg-[#0f1419] text-primary focus:ring-primary"
                      />
                    </th>
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
                        <input
                          type="checkbox"
                          checked={selectedSellerIds.has(seller.id)}
                          onChange={() => toggleSellerSelection(seller.id)}
                          className="rounded border-[#2a2a2a] bg-[#0f1419] text-primary focus:ring-primary"
                        />
                      </DataTableCell>
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
                          {seller.kycStatus && seller.kycStatus.toUpperCase() === 'PENDING' ? (
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
          selectedSeller?.kycStatus && selectedSeller.kycStatus.toUpperCase() === 'PENDING' ? (
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
            {/* Seller Basic Info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Seller ID
              </p>
              <p className="mt-1 font-mono text-sm text-white">{selectedSeller.id}</p>
            </div>

            {selectedSeller.user && (
              <div className="grid gap-2 rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">
                    Contact Information
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-white">Name: {selectedSeller.user.name}</p>
                    <p className="text-white">Email: {selectedSeller.user.email}</p>
                    {selectedSeller.user.phone && (
                      <p className="text-white">Phone: {selectedSeller.user.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

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

            {/* KYC Documents Viewer */}
            {selectedSeller.kyc && (
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <DocumentViewer
                  idImage={selectedSeller.kyc.idImage}
                  addressProofImage={selectedSeller.kyc.addressProofImage}
                  idType={selectedSeller.kyc.idType}
                  idNumber={selectedSeller.kyc.idNumber}
                  businessType={selectedSeller.kyc.businessType}
                  registrationNumber={selectedSeller.kyc.registrationNumber}
                  taxId={selectedSeller.kyc.taxId}
                  bvn={selectedSeller.kyc.bvn}
                />
              </div>
            )}

            {!selectedSeller.kyc && selectedSeller.kycStatus === 'PENDING' && (
              <div className="rounded-xl border border-yellow-800/30 bg-yellow-900/10 p-4">
                <p className="text-xs text-yellow-400">
                  KYC documents not yet submitted by seller.
                </p>
              </div>
            )}

            {/* Submission Count Info */}
            {selectedSeller.kyc && selectedSeller.kyc.submissionCount !== undefined && (
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-1">
                      Submission Count
                    </p>
                    <p className="text-sm text-white">
                      {selectedSeller.kyc.submissionCount} / 3 submissions
                    </p>
                  </div>
                  {selectedSeller.kyc.submissionCount >= 3 && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedSeller) return;
                        try {
                          const token = localStorage.getItem('accessToken');
                          const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';
                          const response = await fetch(
                            `${apiBase}/sellers/${selectedSeller.id}/kyc/reset-submission-count`,
                            {
                              method: 'PUT',
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );
                          if (response.ok) {
                            toast.success('Submission count reset successfully');
                            refetch();
                            setSelectedSeller((current) =>
                              current && current.id === selectedSeller.id
                                ? { ...current, kyc: { ...current.kyc!, submissionCount: 0 } }
                                : current
                            );
                          } else {
                            toast.error('Failed to reset submission count');
                          }
                        } catch (error) {
                          toast.error('Failed to reset submission count');
                        }
                      }}
                      className="rounded-lg border border-yellow-600 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-600/10"
                    >
                      Reset Count
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Audit Log */}
            <KycAuditLog logs={auditLogs || []} isLoading={auditLogsLoading} />
          </div>
        ) : null}
      </AdminDrawer>

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[#1a1f2e] rounded-xl border border-[#2a2a2a] p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-2">Reject KYC Application</h3>
            <p className="text-sm text-gray-400 mb-4">
              {sellerToReject ? (
                <>Rejecting KYC for <span className="font-semibold text-white">{sellerToReject.businessName}</span></>
              ) : (
                <>Rejecting KYC for <span className="font-semibold text-white">{selectedSellerIds.size} selected seller(s)</span></>
              )}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rejection Reason <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedPredefinedReason}
                onChange={(e) => {
                  setSelectedPredefinedReason(e.target.value);
                  if (e.target.value !== 'Other (specify below)') {
                    setRejectionReason('');
                  }
                }}
                className="w-full p-3 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              >
                <option value="">Select a reason...</option>
                {PREDEFINED_REJECTION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {selectedPredefinedReason === 'Other (specify below)' && (
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter custom rejection reason..."
                  className="w-full p-3 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4}
                  maxLength={1000}
                  required
                />
              )}
              {!selectedPredefinedReason && (
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Or enter a custom rejection reason..."
                  className="w-full p-3 bg-[#0f1419] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4}
                  maxLength={1000}
                />
              )}
              {rejectionReason && (
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.length}/1000 characters
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setSellerToReject(null);
                  setRejectionReason('');
                  setSelectedPredefinedReason('');
                }}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-300 hover:bg-[#0f1419] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sellerToReject ? confirmReject : confirmBulkReject}
                disabled={rejectSeller.isPending}
                className="px-4 py-2 rounded-lg bg-[#ff9aa8] text-black font-semibold hover:bg-[#ffb8c6] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectSeller.isPending ? 'Rejecting...' : sellerToReject ? 'Confirm Rejection' : 'Reject Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

