import { useMemo, useState } from 'react';
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

export default function AdminWarehouse() {
  const [search, setSearch] = useState('');
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

  const { data: stock, isLoading: stockLoading, isError: stockError, error: stockErrObj, refetch: refetchStock } =
    useWarehouseStock();
  const { data: movements, isLoading: movementLoading } = useWarehouseMovements();
  const { data: lowStock } = useLowStock(10);

  const createInbound = useCreateInboundMutation();
  const createOutbound = useCreateOutboundMutation();
  const adjustStock = useAdjustStockMutation();

  const filteredStock = useMemo(() => {
    if (!stock) return [];
    if (!search.trim()) return stock;
    const query = search.trim().toLowerCase();
    return stock.filter((item) =>
      item.productTitle.toLowerCase().includes(query) || item.sellerName.toLowerCase().includes(query)
    );
  }, [stock, search]);

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
    if (!adjustForm.productId || !adjustForm.reason.trim() || adjustForm.quantity === 0) {
      return;
    }
    await adjustStock.mutateAsync({
      productId: adjustForm.productId,
      quantity: adjustForm.quantity,
      reason: adjustForm.reason.trim(),
    });
    setAdjustForm({ productId: '', quantity: 0, reason: '' });
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

          <section className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">Inventory actions</h2>
            <p className="mt-1 text-sm text-gray-400">Keep counts accurate by logging every inbound, outbound, or manual adjustment.</p>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <form className="space-y-3" onSubmit={handleInboundSubmit}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Inbound stock</p>
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
                <input
                  type="number"
                  value={adjustForm.quantity || ''}
                  onChange={(event) =>
                    setAdjustForm((prev) => ({ ...prev, quantity: Number(event.target.value) }))
                  }
                  placeholder="Adjustment (+/-)"
                  className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
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
              className="w-full rounded-full border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
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
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredStock.map((item) => (
                    <tr key={item.productId} className="transition hover:bg-[#10151d]">
                      <DataTableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{item.productTitle}</span>
                          <span className="text-xs text-gray-500">ID {item.productId.slice(0, 8)}</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm text-gray-300">{item.sellerName}</span>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-sm font-semibold text-primary">{item.quantity.toLocaleString()}</span>
                      </DataTableCell>
                    </tr>
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableContainer>
          )}

          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-white">Stock movements</h2>
            {movementLoading ? (
              <LoadingState />
            ) : movements && movements.length > 0 ? (
              <div className="space-y-3">
                {movements.map((movement) => (
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
                    </div>
                    <StatusBadge tone={movementTone[movement.type] ?? 'info'} label={movementLabel[movement.type] ?? movement.type} />
                  </div>
                ))}
            </div>
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

