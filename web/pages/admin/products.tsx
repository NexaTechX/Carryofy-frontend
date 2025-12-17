import { useMemo, useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
  AdminDrawer,
  AdminEmptyState,
  AdminPageHeader,
  AdminToolbar,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import { useAllProducts } from '../../lib/admin/hooks/useAllProducts';
import {
  useApproveProductMutation,
  useRejectProductMutation,
} from '../../lib/admin/hooks/usePendingProducts';
import {
  useBulkApproveProducts,
  useBulkRejectProducts,
  useBulkDeleteProducts,
  useBulkStatusChange,
} from '../../lib/admin/hooks/useBulkProducts';
import { PendingProduct } from '../../lib/admin/types';
import { toast } from 'react-hot-toast';
import { Check, X, Trash2, MoreVertical } from 'lucide-react';

const NGN_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const productStatusLabel: Record<string, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
};

const productStatusTone: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  PENDING_APPROVAL: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  ARCHIVED: 'danger',
};

type FilterTab = 'all' | 'pending' | 'active' | 'inactive';

export default function AdminProducts() {
  const { data: allProducts, isLoading, isError, error, refetch } = useAllProducts();
  const approveProduct = useApproveProductMutation();
  const rejectProduct = useRejectProductMutation();
  const bulkApprove = useBulkApproveProducts();
  const bulkReject = useBulkRejectProducts();
  const bulkDelete = useBulkDeleteProducts();
  const bulkStatusChange = useBulkStatusChange();

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedProduct, setFocusedProduct] = useState<PendingProduct | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    let filtered = allProducts;

    // Filter by status
    if (filterTab === 'pending') {
      filtered = filtered.filter((p) => p.status === 'PENDING_APPROVAL');
    } else if (filterTab === 'active') {
      filtered = filtered.filter((p) => p.status === 'ACTIVE');
    } else if (filterTab === 'inactive') {
      filtered = filtered.filter((p) => p.status === 'INACTIVE' || p.status === 'ARCHIVED');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          p.seller?.businessName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allProducts, filterTab, searchQuery]);

  // Calculate counts
  const counts = useMemo(() => {
    if (!allProducts) return { all: 0, pending: 0, active: 0, inactive: 0 };

    return {
      all: allProducts.length,
      pending: allProducts.filter((p) => p.status === 'PENDING_APPROVAL').length,
      active: allProducts.filter((p) => p.status === 'ACTIVE').length,
      inactive: allProducts.filter((p) => p.status === 'INACTIVE' || p.status === 'ARCHIVED').length,
    };
  }, [allProducts]);

  const handleApproveSingle = async (product: PendingProduct) => {
    await approveProduct.mutateAsync(product.id);
    toast.success(`${product.title} has been approved.`);
    refetch();
    setFocusedProduct((current) =>
      current && current.id === product.id ? { ...current, status: 'ACTIVE' } : current
    );
  };

  const handleRejectSingle = async (product: PendingProduct) => {
    await rejectProduct.mutateAsync(product.id);
    toast.success(`${product.title} has been rejected.`);
    refetch();
    setFocusedProduct((current) =>
      current && current.id === product.id ? { ...current, status: 'INACTIVE' } : current
    );
  };

  // Bulk selection handlers
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  // Bulk action handlers
  const handleBulkApprove = async () => {
    if (selectedProductIds.size === 0) return;
    const productIds = Array.from(selectedProductIds);
    await bulkApprove.mutateAsync(productIds);
    setSelectedProductIds(new Set());
    refetch();
  };

  const handleBulkReject = () => {
    if (selectedProductIds.size === 0) return;
    setBulkRejectModalOpen(true);
  };

  const confirmBulkReject = async (reason?: string) => {
    const productIds = Array.from(selectedProductIds);
    await bulkReject.mutateAsync({ productIds, reason });
    setSelectedProductIds(new Set());
    setBulkRejectModalOpen(false);
    refetch();
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.size} product(s)? This action cannot be undone.`)) {
      return;
    }
    const productIds = Array.from(selectedProductIds);
    await bulkDelete.mutateAsync(productIds);
    setSelectedProductIds(new Set());
    refetch();
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedProductIds.size === 0) return;
    const productIds = Array.from(selectedProductIds);
    await bulkStatusChange.mutateAsync({ productIds, status });
    setSelectedProductIds(new Set());
    setBulkStatusModalOpen(false);
    refetch();
  };

  // Update showBulkActions based on selection
  useEffect(() => {
    setShowBulkActions(selectedProductIds.size > 0);
  }, [selectedProductIds]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Products"
            tag="Catalog Management"
            subtitle="View and manage all products in the marketplace. Review pending submissions, monitor active listings, and manage inventory."
          />

          {/* Stats Cards */}
          <section className="mb-10 grid gap-4 sm:grid-cols-4">
            <AdminCard
              title="Total Products"
              description="All marketplace listings"
              className="border-[#1f2534] bg-[#0f1524]"
            >
              <p className="text-3xl font-semibold text-white">{counts.all}</p>
            </AdminCard>
            <AdminCard
              title="Pending Approval"
              description="Awaiting review"
              className="border-[#3a2a1f] bg-[#15100d]"
            >
              <p className="text-3xl font-semibold text-primary">{counts.pending}</p>
            </AdminCard>
            <AdminCard
              title="Active Listings"
              description="Live on marketplace"
              className="border-[#1f3a1f] bg-[#0d150d]"
            >
              <p className="text-3xl font-semibold text-green-500">{counts.active}</p>
            </AdminCard>
            <AdminCard
              title="Inactive"
              description="Archived or rejected"
              className="border-[#2a2a2a] bg-[#111111]"
            >
              <p className="text-3xl font-semibold text-gray-400">{counts.inactive}</p>
            </AdminCard>
          </section>

          {/* Bulk Actions Bar */}
          {showBulkActions && selectedProductIds.size > 0 && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {selectedProductIds.size} product(s) selected
                </span>
                <div className="flex gap-2">
                  {filterTab === 'pending' && (
                    <button
                      onClick={handleBulkApprove}
                      disabled={bulkApprove.isPending}
                      className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Approve Selected
                    </button>
                  )}
                  {filterTab === 'pending' && (
                    <button
                      onClick={handleBulkReject}
                      disabled={bulkReject.isPending}
                      className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject Selected
                    </button>
                  )}
                  <button
                    onClick={() => setBulkStatusModalOpen(true)}
                    disabled={bulkStatusChange.isPending}
                    className="flex items-center gap-2 rounded-full border border-primary/50 bg-[#0f1524] px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    <MoreVertical className="w-4 h-4" />
                    Change Status
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDelete.isPending}
                    className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedProductIds(new Set())}
                    className="rounded-full border border-gray-600 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-gray-500"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs & Search */}
          <AdminToolbar className="mb-6 justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterTab('all')}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  filterTab === 'all'
                    ? 'bg-primary text-black'
                    : 'border border-[#2a2a2a] bg-[#151515] text-gray-400 hover:border-primary hover:text-primary'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setFilterTab('pending')}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  filterTab === 'pending'
                    ? 'bg-primary text-black'
                    : 'border border-[#2a2a2a] bg-[#151515] text-gray-400 hover:border-primary hover:text-primary'
                }`}
              >
                Pending ({counts.pending})
              </button>
              <button
                onClick={() => setFilterTab('active')}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  filterTab === 'active'
                    ? 'bg-primary text-black'
                    : 'border border-[#2a2a2a] bg-[#151515] text-gray-400 hover:border-primary hover:text-primary'
                }`}
              >
                Active ({counts.active})
              </button>
              <button
                onClick={() => setFilterTab('inactive')}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  filterTab === 'inactive'
                    ? 'bg-primary text-black'
                    : 'border border-[#2a2a2a] bg-[#151515] text-gray-400 hover:border-primary hover:text-primary'
                }`}
              >
                Inactive ({counts.inactive})
              </button>
            </div>

            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-full border border-[#1f2432] bg-[#0e131d] px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
          </AdminToolbar>

          {/* Products Table */}
          {isLoading ? (
            <LoadingState fullscreen />
          ) : isError ? (
            <AdminEmptyState
              title="Unable to load products"
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
          ) : !filteredProducts || filteredProducts.length === 0 ? (
            <AdminEmptyState
              title="No products found"
              description={searchQuery ? 'Try adjusting your search query.' : 'No products match the selected filter.'}
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-600 bg-[#0e131d] text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-white">Product</th>
                    <th className="px-6 py-4 text-left text-white">Seller</th>
                    <th className="px-6 py-4 text-left text-white">Status</th>
                    <th className="px-6 py-4 text-left text-white">Price</th>
                    <th className="px-6 py-4 text-left text-white">Stock</th>
                    <th className="px-6 py-4 text-right text-gray-500">Actions</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="transition hover:bg-[#10151d]">
                      <DataTableCell>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="h-4 w-4 rounded border-gray-600 bg-[#0e131d] text-primary focus:ring-primary"
                        />
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => setFocusedProduct(product)}
                            className="text-left text-sm font-semibold text-white hover:text-primary"
                          >
                            {product.title}
                          </button>
                          <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
                            #{product.id.slice(0, 8)}
                          </span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm text-gray-300">
                          {product.seller?.businessName ?? 'Unknown seller'}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge
                          tone={productStatusTone[product.status] ?? 'neutral'}
                          label={productStatusLabel[product.status] ?? product.status}
                        />
                      </DataTableCell>
                      <DataTableCell>{NGN_FORMATTER.format(product.price / 100)}</DataTableCell>
                      <DataTableCell>
                        <span className="text-sm text-gray-300">{product.quantity}</span>
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {product.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveSingle(product)}
                                disabled={approveProduct.isPending}
                                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectSingle(product)}
                                disabled={rejectProduct.isPending}
                                className="rounded-full border border-[#3a1f1f] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setFocusedProduct(product)}
                            className="text-xs font-semibold text-primary transition hover:text-primary-light"
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

      {/* Product Details Drawer */}
      <AdminDrawer
        open={Boolean(focusedProduct)}
        onClose={() => setFocusedProduct(null)}
        title={focusedProduct?.title}
        description={focusedProduct?.seller?.businessName}
        footer={
          focusedProduct && focusedProduct.status === 'PENDING_APPROVAL' ? (
            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => focusedProduct && handleRejectSingle(focusedProduct)}
                disabled={rejectProduct.isPending}
                className="rounded-full border border-[#3a1f1f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff9aa8] transition hover:border-[#ff9aa8] hover:text-[#ffb8c6] disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => focusedProduct && handleApproveSingle(focusedProduct)}
                disabled={approveProduct.isPending}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          ) : null
        }
      >
        {focusedProduct ? (
          <div className="space-y-6 text-sm text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Product ID
                </p>
                <p className="mt-1 font-mono text-sm text-white">{focusedProduct.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Status
                </p>
                <StatusBadge
                  tone={productStatusTone[focusedProduct.status] ?? 'neutral'}
                  label={productStatusLabel[focusedProduct.status] ?? focusedProduct.status}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Gallery
              </p>
              {focusedProduct.images && focusedProduct.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {focusedProduct.images.slice(0, 4).map((src) => (
                    <div
                      key={src}
                      className="h-28 overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#10151d]"
                      style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-700 bg-[#10151d] p-6 text-center text-xs text-gray-500">
                  No images uploaded.
                </div>
              )}
            </div>

            {focusedProduct.description ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Description
                </p>
                <p className="mt-2 leading-relaxed text-gray-300">{focusedProduct.description}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Price
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {NGN_FORMATTER.format(focusedProduct.price / 100)}
                </p>
              </div>
              <div className="rounded-xl border border-[#1f1f1f] bg-[#10151d] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Stock
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{focusedProduct.quantity}</p>
              </div>
            </div>
          </div>
        ) : null}
      </AdminDrawer>

      {/* Bulk Reject Modal */}
      {bulkRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md rounded-2xl border border-[#1f2534] bg-[#0f1524] p-6">
            <h3 className="mb-4 text-lg font-bold text-white">Reject Products</h3>
            <p className="mb-4 text-sm text-gray-400">
              You are about to reject {selectedProductIds.size} product(s). This action cannot be undone.
            </p>
            <textarea
              placeholder="Rejection reason (optional)"
              className="mb-4 w-full rounded-lg border border-[#1f2534] bg-[#0a0f1a] p-3 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
              rows={3}
              id="rejection-reason"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const reason = (document.getElementById('rejection-reason') as HTMLTextAreaElement)?.value;
                  confirmBulkReject(reason);
                }}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setBulkRejectModalOpen(false)}
                className="flex-1 rounded-full border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Change Modal */}
      {bulkStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md rounded-2xl border border-[#1f2534] bg-[#0f1524] p-6">
            <h3 className="mb-4 text-lg font-bold text-white">Change Product Status</h3>
            <p className="mb-4 text-sm text-gray-400">
              Change status for {selectedProductIds.size} product(s) to:
            </p>
            <div className="mb-4 space-y-2">
              {Object.entries(productStatusLabel).map(([status, label]) => (
                <button
                  key={status}
                  onClick={() => handleBulkStatusChange(status)}
                  className="w-full rounded-lg border border-[#1f2534] bg-[#0a0f1a] px-4 py-2 text-left text-sm text-white transition hover:border-primary hover:bg-primary/10"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setBulkStatusModalOpen(false)}
              className="w-full rounded-full border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
