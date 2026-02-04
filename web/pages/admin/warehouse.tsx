import { useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
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
import {
  useAdjustStockMutation,
  useCreateInboundMutation,
  useCreateOutboundMutation,
  useLowStock,
  useWarehouseMovements,
  useWarehouseStock,
} from '../../lib/admin/hooks/useWarehouseStock';
import { AdjustStockPayload, CreateInboundPayload, CreateOutboundPayload } from '../../lib/admin/types';

const movementTone: Record<string, 'info' | 'warning' | 'success'> = {
  INBOUND: 'success',
  OUTBOUND: 'warning',
  ADJUSTMENT: 'info',
};

const movementLabel: Record<string, string> = {
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
  ADJUSTMENT: 'Adjustment',
};

const LOW_STOCK_THRESHOLD = 10;

export default function AdminWarehouse() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'quantity' | 'product' | 'seller'>('quantity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [movementProductFilter, setMovementProductFilter] = useState('');
  const [movementStartDate, setMovementStartDate] = useState('');
  const [movementEndDate, setMovementEndDate] = useState('');
  const [inboundForm, setInboundForm] = useState<CreateInboundPayload>({
    productId: '',
    sellerId: '',
    quantity: 0,
    shelfId: '',
    notes: '',
  });
  const [outboundForm, setOutboundForm] = useState<CreateOutboundPayload>({
    orderId: '',
    productId: '',
    quantity: 0,
    notes: '',
  });
  const [adjustForm, setAdjustForm] = useState<AdjustStockPayload>({
    productId: '',
    quantity: 0,
    reason: '',
  });
  const [adjustDirection, setAdjustDirection] = useState<'increase' | 'decrease'>('increase');
  const [adjustAmount, setAdjustAmount] = useState<number>(1);

  const { data: stock, isLoading: stockLoading, isError: stockError, error: stockErrObj, refetch: refetchStock } =
    useWarehouseStock();
  const { data: movements, isLoading: movementLoading } = useWarehouseMovements();
  const { data: lowStock } = useLowStock(10);

  const createInbound = useCreateInboundMutation();
  const createOutbound = useCreateOutboundMutation();
  const adjustStock = useAdjustStockMutation();

  const filteredStock = useMemo(() => {
    if (!stock) return [];
    let list = stock;
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.productTitle.toLowerCase().includes(query) ||
          item.sellerName.toLowerCase().includes(query)
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'quantity') {
        cmp = a.quantity - b.quantity;
      } else if (sortBy === 'product') {
        cmp = a.productTitle.localeCompare(b.productTitle);
      } else {
        cmp = a.sellerName.localeCompare(b.sellerName);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [stock, search, sortBy, sortOrder]);

  const totalSkus = stock?.length ?? 0;
  const totalUnits = stock?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const lowStockCount = lowStock?.length ?? 0;

  const productOptions = stock ?? [];

  const selectedInboundProduct = useMemo(
    () => productOptions.find((item) => item.productId === inboundForm.productId),
    [productOptions, inboundForm.productId]
  );

  const selectedOutboundProduct = useMemo(
    () => productOptions.find((item) => item.productId === outboundForm.productId),
    [productOptions, outboundForm.productId]
  );

  const selectedAdjustProduct = useMemo(
    () => productOptions.find((item) => item.productId === adjustForm.productId),
    [productOptions, adjustForm.productId]
  );

  const handleInboundSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inboundForm.productId || !inboundForm.sellerId || inboundForm.quantity <= 0) {
      return;
    }
    await createInbound.mutateAsync({
      productId: inboundForm.productId,
      sellerId: inboundForm.sellerId,
      quantity: inboundForm.quantity,
      shelfId: inboundForm.shelfId || undefined,
      notes: inboundForm.notes || undefined,
    });
    setInboundForm({ productId: '', sellerId: '', quantity: 0, shelfId: '', notes: '' });
  };

  const handleOutboundSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!outboundForm.productId || !outboundForm.orderId || outboundForm.quantity <= 0) {
      return;
    }
    await createOutbound.mutateAsync({
      orderId: outboundForm.orderId,
      productId: outboundForm.productId,
      quantity: outboundForm.quantity,
      notes: outboundForm.notes || undefined,
    });
    setOutboundForm({ orderId: '', productId: '', quantity: 0, notes: '' });
  };

  const handleAdjustSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const quantity = adjustDirection === 'increase' ? adjustAmount : -adjustAmount;
    if (!adjustForm.productId || !adjustForm.reason.trim() || quantity === 0) {
      return;
    }
    const product = productOptions.find((p) => p.productId === adjustForm.productId);
    if (quantity < 0 && product && product.quantity + quantity < 0) {
      return; // Would go negative - validation handled by API, but we can show feedback
    }
    await adjustStock.mutateAsync({
      productId: adjustForm.productId,
      quantity,
      reason: adjustForm.reason.trim(),
    });
    setAdjustForm({ productId: '', quantity: 0, reason: '' });
    setAdjustAmount(1);
  };

  const handleProductSelection = (productId: string) => {
    const selected = productOptions.find((item) => item.productId === productId);
    setInboundForm((prev) => ({
      ...prev,
      productId,
      sellerId: selected?.sellerId ?? '',
    }));
    setOutboundForm((prev) => ({
      ...prev,
      productId,
    }));
    setAdjustForm((prev) => ({ ...prev, productId }));
  };

  const handleQuickRestock = (item: { productId: string; sellerId: string }) => {
    setInboundForm((prev) => ({
      ...prev,
      productId: item.productId,
      sellerId: item.sellerId,
      quantity: 1,
    }));
    document.getElementById('inventory-actions')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickAdjust = (productId: string) => {
    setAdjustForm((prev) => ({ ...prev, productId }));
    document.getElementById('inventory-actions')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStockRowClass = (quantity: number) => {
    if (quantity === 0) return 'bg-red-500/5 border-l-4 border-l-red-500';
    if (quantity <= LOW_STOCK_THRESHOLD) return 'bg-amber-500/5 border-l-4 border-l-amber-500';
    return '';
  };

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    return movements.filter((m) => {
      if (movementTypeFilter !== 'ALL' && m.type !== movementTypeFilter) return false;
      if (movementProductFilter && m.productId !== movementProductFilter) return false;
      const d = new Date(m.createdAt).getTime();
      if (movementStartDate && d < new Date(movementStartDate).setHours(0, 0, 0, 0)) return false;
      if (movementEndDate && d > new Date(movementEndDate).setHours(23, 59, 59, 999)) return false;
      return true;
    });
  }, [movements, movementTypeFilter, movementProductFilter, movementStartDate, movementEndDate]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Warehouse & Inventory"
            tag="Operations"
            subtitle="Keep a pulse on SKUs stored in Carryofy facilities and act on inbound, outbound, or adjustments quickly."
          />

          <section className="mb-8 grid gap-4 sm:grid-cols-3">
            <AdminCard title="Active SKUs" description="Distinct products in storage.">
              <p className="text-3xl font-semibold text-white">{totalSkus}</p>
            </AdminCard>
            <AdminCard title="Units on hand" description="Total inventory available for sale.">
              <p className="text-3xl font-semibold text-primary">{totalUnits.toLocaleString()}</p>
            </AdminCard>
            <AdminCard title="Low stock alerts" description="Products below safety threshold.">
              <p className="text-3xl font-semibold text-[#f97316]">{lowStockCount}</p>
            </AdminCard>
          </section>

          {lowStock && lowStock.length > 0 && (
            <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-400">
                Low stock – needs attention
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-500/20">
                      <th className="px-4 py-3 text-left text-amber-400/90">Product</th>
                      <th className="px-4 py-3 text-left text-amber-400/90">Seller</th>
                      <th className="px-4 py-3 text-left text-amber-400/90">Quantity</th>
                      <th className="px-4 py-3 text-left text-amber-400/90">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => (
                      <tr key={item.productId} className="border-b border-amber-500/10 last:border-0">
                        <td className="px-4 py-3 text-white">{item.productTitle}</td>
                        <td className="px-4 py-3 text-gray-400">{item.sellerName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              item.quantity === 0 ? 'font-semibold text-red-400' : 'font-medium text-amber-400'
                            }
                          >
                            {item.quantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(item)}
                            className="rounded px-3 py-1.5 text-xs font-medium text-primary border border-primary/50 hover:bg-primary/10 transition"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section id="inventory-actions" className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">Inventory actions</h2>
            <p className="mt-1 text-sm text-gray-400">Keep counts accurate by logging every inbound, outbound, or manual adjustment.</p>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <form className="space-y-3" onSubmit={handleInboundSubmit}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Inbound stock</p>
                <p className="text-xs text-gray-400">Receive new stock from suppliers. Use when products arrive at warehouse.</p>
                <select
                  value={inboundForm.productId}
                  onChange={(event) => handleProductSelection(event.target.value)}
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Select product</option>
                  {productOptions.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.productTitle} — {item.sellerName}
                    </option>
                  ))}
                </select>
                {selectedInboundProduct ? (
                  <p className="text-xs text-gray-500">Seller: {selectedInboundProduct.sellerName}</p>
                ) : null}
                <input
                  type="number"
                  min={1}
                  value={inboundForm.quantity || ''}
                  onChange={(event) =>
                    setInboundForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))
                  }
                  placeholder="Quantity"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <input
                  value={inboundForm.shelfId}
                  onChange={(event) => setInboundForm((prev) => ({ ...prev, shelfId: event.target.value }))}
                  placeholder="Shelf ID (optional)"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <textarea
                  value={inboundForm.notes}
                  onChange={(event) => setInboundForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Notes"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                >
                  Receive stock
              </button>
              </form>

              <form className="space-y-3" onSubmit={handleOutboundSubmit}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Outbound task</p>
                <p className="text-xs text-gray-400">Manual deduction for non-order reasons (e.g. damaged, lost, sample).</p>
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                  <p className="text-xs text-amber-400">
                    <strong>Do NOT use for paid orders</strong> — stock is deducted automatically on payment confirmation.
                  </p>
                </div>
                <input
                  value={outboundForm.orderId}
                  onChange={(event) => setOutboundForm((prev) => ({ ...prev, orderId: event.target.value }))}
                  placeholder="Order ID"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <select
                  value={outboundForm.productId}
                  onChange={(event) => setOutboundForm((prev) => ({ ...prev, productId: event.target.value }))}
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Select product</option>
                  {productOptions.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.productTitle}
                    </option>
                  ))}
                </select>
                {selectedOutboundProduct ? (
                  <p className="text-xs text-gray-500">Available: {selectedOutboundProduct.quantity.toLocaleString()} units</p>
                ) : null}
                <input
                  type="number"
                  min={1}
                  value={outboundForm.quantity || ''}
                  onChange={(event) =>
                    setOutboundForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))
                  }
                  placeholder="Quantity"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <textarea
                  value={outboundForm.notes}
                  onChange={(event) => setOutboundForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Notes"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                >
                  Create outbound
              </button>
              </form>

              <form className="space-y-3" onSubmit={handleAdjustSubmit}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Adjust stock</p>
                <p className="text-xs text-gray-400">Correct inventory discrepancies. Use positive to add, negative to subtract.</p>
                <select
                  value={adjustForm.productId}
                  onChange={(event) => setAdjustForm((prev) => ({ ...prev, productId: event.target.value }))}
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                >
                  <option value="">Select product</option>
                  {productOptions.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.productTitle}
                    </option>
                  ))}
                </select>
                {selectedAdjustProduct ? (
                  <p className="text-xs text-gray-500">Current stock: {selectedAdjustProduct.quantity.toLocaleString()} units</p>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('increase')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      adjustDirection === 'increase'
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : 'border-[#2a2a2a] bg-[#151515] text-gray-400 hover:text-white'
                    }`}
                  >
                    Increase
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDirection('decrease')}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      adjustDirection === 'decrease'
                        ? 'border-red-500 bg-red-500/20 text-red-400'
                        : 'border-[#2a2a2a] bg-[#151515] text-gray-400 hover:text-white'
                    }`}
                  >
                    Decrease
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={(event) => setAdjustAmount(Math.max(1, Number(event.target.value) || 1))}
                  placeholder="Amount"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                {adjustDirection === 'decrease' && selectedAdjustProduct && adjustAmount > selectedAdjustProduct.quantity && (
                  <p className="text-xs text-red-400">Would result in negative stock. Max decrease: {selectedAdjustProduct.quantity}</p>
                )}
                <textarea
                  value={adjustForm.reason}
                  onChange={(event) => setAdjustForm((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Reason"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-full border border-[#f97316] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f97316] transition hover:bg-[#f97316] hover:text-black"
                >
                  Apply adjustment
                </button>
              </form>
            </div>
          </section>

          <AdminToolbar className="mb-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products or sellers"
              className="flex-1 rounded-full border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'quantity' | 'product' | 'seller')}
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="quantity">Quantity</option>
                <option value="product">Product</option>
                <option value="seller">Seller</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-1.5 text-xs text-gray-400 hover:text-white focus:outline-none"
              >
                {sortOrder === 'asc' ? 'Low first' : 'High first'}
              </button>
            </div>
          </AdminToolbar>

          {stockLoading ? (
            <LoadingState fullscreen />
          ) : stockError ? (
            <AdminEmptyState
              title="Unable to load stock"
              description={stockErrObj instanceof Error ? stockErrObj.message : 'Please try again.'}
              action={
                <button
                  type="button"
                  onClick={() => refetchStock()}
                  className="rounded-full border border-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-black"
                >
                  Retry
                </button>
              }
            />
          ) : filteredStock.length === 0 ? (
            <AdminEmptyState title="No products found" description="Try a different search query." />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-6 py-4 text-white">Product</th>
                    <th className="px-6 py-4 text-white">Seller</th>
                    <th className="px-6 py-4 text-white">Quantity</th>
                    <th className="px-6 py-4 text-white">Actions</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredStock.map((item) => (
                    <tr
                      key={item.productId}
                      className={`transition hover:bg-[#10151d] ${getStockRowClass(item.quantity)}`}
                    >
                      <DataTableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{item.productTitle}</span>
                          <span className="text-xs text-gray-500">ID {item.productId.slice(0, 8)}</span>
                          {item.quantity === 0 && (
                            <span className="text-xs text-red-400 font-medium">Out of stock</span>
                          )}
                          {item.quantity > 0 && item.quantity <= LOW_STOCK_THRESHOLD && (
                            <span className="text-xs text-amber-400 font-medium">Low stock</span>
                          )}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm text-gray-300">{item.sellerName}</span>
                      </DataTableCell>
                      <DataTableCell>
                        <span
                          className={`text-sm font-semibold ${
                            item.quantity === 0 ? 'text-red-400' : item.quantity <= LOW_STOCK_THRESHOLD ? 'text-amber-400' : 'text-primary'
                          }`}
                        >
                          {item.quantity.toLocaleString()}
                        </span>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(item)}
                            className="rounded px-2 py-1 text-xs font-medium text-primary border border-primary/50 hover:bg-primary/10 transition"
                          >
                            Restock
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item.productId)}
                            className="rounded px-2 py-1 text-xs font-medium text-[#f97316] border border-[#f97316]/50 hover:bg-[#f97316]/10 transition"
                          >
                            Adjust
                          </button>
                        </div>
                      </DataTableCell>
                    </tr>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableContainer>
          )}

          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-white">Stock movements</h2>
            <div className="mb-4 flex flex-wrap gap-3">
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="ALL">All types</option>
                <option value="INBOUND">Inbound</option>
                <option value="OUTBOUND">Outbound</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
              <select
                value={movementProductFilter}
                onChange={(e) => setMovementProductFilter(e.target.value)}
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="">All products</option>
                {productOptions.map((item) => (
                  <option key={item.productId} value={item.productId}>
                    {item.productTitle}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={movementStartDate}
                onChange={(e) => setMovementStartDate(e.target.value)}
                placeholder="From"
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              <input
                type="date"
                value={movementEndDate}
                onChange={(e) => setMovementEndDate(e.target.value)}
                placeholder="To"
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              {(movementTypeFilter !== 'ALL' || movementProductFilter || movementStartDate || movementEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setMovementTypeFilter('ALL');
                    setMovementProductFilter('');
                    setMovementStartDate('');
                    setMovementEndDate('');
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
            {movementLoading ? (
              <LoadingState />
            ) : filteredMovements.length > 0 ? (
              <div className="space-y-3">
                {filteredMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex flex-col gap-2 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {movementLabel[movement.type] ?? movement.type}
                      </p>
                      {movement.product ? (
                        <p className="text-xs text-gray-400">{movement.product.title ?? movement.product.id}</p>
                      ) : null}
                      <p className="text-xs text-gray-500">
                        {new Date(movement.createdAt).toLocaleString()} — Qty {movement.quantity} (from {movement.previousQuantity} to {movement.newQuantity})
                      </p>
                      {movement.reason ? (
                        <p className="text-xs text-gray-400">{movement.reason}</p>
                      ) : null}
                      {movement.orderId ? (
                        <Link
                          href={`/admin/orders?orderId=${movement.orderId}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Order #{movement.orderId.slice(0, 8)}
                        </Link>
                      ) : null}
                    </div>
                    <StatusBadge tone={movementTone[movement.type] ?? 'info'} label={movementLabel[movement.type] ?? movement.type} />
                  </div>
                ))}
              </div>
            ) : movements && movements.length > 0 ? (
              <AdminEmptyState
                title="No movements match filters"
                description="Try adjusting your filters to see more results."
              />
            ) : (
              <AdminEmptyState
                title="No movements logged"
                description="Inbound, outbound, or adjustments will appear here for audit purposes."
              />
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}

