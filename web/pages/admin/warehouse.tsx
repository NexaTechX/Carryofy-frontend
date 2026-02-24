import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
import {
  useAdjustStockMutation,
  useCreateInboundMutation,
  useCreateOutboundMutation,
  useLowStock,
  useWarehouseMovements,
  useWarehouseStock,
} from '../../lib/admin/hooks/useWarehouseStock';
import { AdjustStockPayload, CreateInboundPayload, CreateOutboundPayload } from '../../lib/admin/types';
import type { WarehouseStockItem } from '../../lib/admin/types';

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

function InventoryRow({
  item,
  getStockRowClass,
  LOW_STOCK_THRESHOLD: threshold,
  isEditing,
  editValue,
  onEditStart,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onRestock,
  onAdjust,
}: {
  item: WarehouseStockItem;
  getStockRowClass: (qty: number) => string;
  LOW_STOCK_THRESHOLD: number;
  isEditing: boolean;
  editValue: string;
  onEditStart: () => void;
  onEditChange: (v: string) => void;
  onEditSubmit: (newQty: number) => Promise<void>;
  onEditCancel: () => void;
  onRestock: () => void;
  onAdjust: () => void;
}) {
  const num = parseInt(editValue, 10);
  const validQty = Number.isInteger(num) && num >= 0 ? num : item.quantity;

  return (
    <tr className={`transition hover:bg-[#10151d] ${getStockRowClass(item.quantity)}`}>
      <DataTableCell className="w-12">
        <div className="relative h-10 w-10 rounded-lg border border-[#2a2a2a] bg-[#151515] overflow-hidden flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg text-gray-500" aria-hidden>📦</span>
          )}
        </div>
      </DataTableCell>
      <DataTableCell>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{item.productTitle}</span>
          <span className="text-xs text-gray-500">ID {item.productId.slice(0, 8)}</span>
          {item.quantity === 0 && <span className="text-xs text-red-400 font-medium">Out of stock</span>}
          {item.quantity > 0 && item.quantity <= threshold && <span className="text-xs text-amber-400 font-medium">Low stock</span>}
        </div>
      </DataTableCell>
      <DataTableCell>
        <span className="text-sm text-gray-300">{item.sellerName}</span>
      </DataTableCell>
      <DataTableCell>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={() => { onEditSubmit(validQty); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditSubmit(validQty);
                if (e.key === 'Escape') onEditCancel();
              }}
              className="w-24 rounded border border-primary bg-[#151515] px-2 py-1 text-sm text-white focus:outline-none"
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={onEditStart}
            className={`text-sm font-semibold text-left hover:underline ${
              item.quantity === 0 ? 'text-red-400' : item.quantity <= threshold ? 'text-amber-400' : 'text-primary'
            }`}
          >
            {item.quantity.toLocaleString()}
          </button>
        )}
      </DataTableCell>
      <DataTableCell>
        <div className="flex gap-2">
          <button type="button" onClick={onRestock} className="rounded px-2 py-1 text-xs font-medium text-primary border border-primary/50 hover:bg-primary/10 transition">Restock</button>
          <button type="button" onClick={onAdjust} className="rounded px-2 py-1 text-xs font-medium text-[#f97316] border border-[#f97316]/50 hover:bg-[#f97316]/10 transition">Adjust</button>
        </div>
      </DataTableCell>
    </tr>
  );
}

/** Heuristic: urgency 1–10 (10 = critical). Days until stockout when no velocity data. */
function getRestockUrgency(quantity: number): { score: number; label: string } {
  if (quantity <= 0) return { score: 10, label: 'Critical' };
  if (quantity <= 2) return { score: 9, label: 'Urgent' };
  if (quantity <= 5) return { score: 7, label: 'High' };
  if (quantity <= LOW_STOCK_THRESHOLD) return { score: 5, label: 'Medium' };
  return { score: 3, label: 'Low' };
}

/** Estimate days until stockout from quantity; uses placeholder when sales velocity unavailable. */
function getDaysUntilStockout(quantity: number, _salesVelocity?: number): number | null {
  if (quantity <= 0) return 0;
  const dailyRate = _salesVelocity ?? undefined;
  if (dailyRate != null && dailyRate > 0) return Math.max(0, Math.floor(quantity / dailyRate));
  return null; // unknown
}

type ActionTab = 'inbound' | 'outbound' | 'adjust';
type ActionStep = 'form' | 'preview';
type ViewFilter = 'all' | 'low-stock' | 'out-of-stock';

export default function AdminWarehouse() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter | null>(null);
  const [sortBy, setSortBy] = useState<'quantity' | 'product' | 'seller'>('quantity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [movementProductFilter, setMovementProductFilter] = useState('');
  const [movementStartDate, setMovementStartDate] = useState('');
  const [movementEndDate, setMovementEndDate] = useState('');
  const [movementsView, setMovementsView] = useState<'table' | 'timeline'>('table');
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [actionsTab, setActionsTab] = useState<ActionTab>('inbound');
  const [actionsStep, setActionsStep] = useState<ActionStep>('form');
  const [editingQuantityProductId, setEditingQuantityProductId] = useState<string | null>(null);
  const [editingQuantityValue, setEditingQuantityValue] = useState<string>('');
  const inventoryTableRef = useRef<HTMLDivElement>(null);

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

  // Sync view filter from URL (e.g. /admin/warehouse?stock=out from Products "Out of Stock" card)
  useEffect(() => {
    const stockParam = router.query.stock;
    if (stockParam === 'out') {
      setViewFilter('out-of-stock');
    }
  }, [router.query.stock]);

  const filteredStock = useMemo(() => {
    if (!stock) return [];
    let list = stock;
    if (viewFilter === 'low-stock') {
      list = list.filter((item) => item.quantity <= LOW_STOCK_THRESHOLD);
    } else if (viewFilter === 'out-of-stock') {
      list = list.filter((item) => item.quantity === 0);
    }
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
  }, [stock, search, sortBy, sortOrder, viewFilter]);

  const scrollToInventoryTable = useCallback(() => {
    inventoryTableRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleHeaderCardClick = useCallback(
    (filter: ViewFilter | null) => {
      setViewFilter(filter);
      if (filter === 'out-of-stock') {
        router.replace({ pathname: '/admin/warehouse', query: { stock: 'out' } }, undefined, { shallow: true });
      } else {
        router.replace('/admin/warehouse', undefined, { shallow: true });
      }
      scrollToInventoryTable();
    },
    [router, scrollToInventoryTable]
  );

  const totalSkus = stock?.length ?? 0;
  const totalUnits = stock?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const lowStockCount = lowStock?.length ?? 0;
  const outOfStockCount = stock?.filter((item) => item.quantity === 0).length ?? 0;

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
    setActionsTab('inbound');
    setActionsStep('form');
    setActionsDrawerOpen(true);
  };

  const handleQuickAdjust = (productId: string) => {
    setAdjustForm((prev) => ({ ...prev, productId }));
    setActionsTab('adjust');
    setActionsStep('form');
    setActionsDrawerOpen(true);
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

          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => handleHeaderCardClick(null)}
              className="text-left transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#090c11] rounded-2xl"
            >
              <AdminCard title="Active SKUs" description="Distinct products in storage. Click to view all.">
                <p className="text-3xl font-semibold text-white">{totalSkus}</p>
              </AdminCard>
            </button>
            <button
              type="button"
              onClick={() => handleHeaderCardClick(null)}
              className="text-left transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-[#090c11] rounded-2xl"
            >
              <AdminCard title="Units on hand" description="Total inventory available for sale. Click to view table.">
                <p className="text-3xl font-semibold text-primary">{totalUnits.toLocaleString()}</p>
              </AdminCard>
            </button>
            <button
              type="button"
              onClick={() => handleHeaderCardClick('low-stock')}
              className="text-left transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#f97316]/50 focus:ring-offset-2 focus:ring-offset-[#090c11] rounded-2xl"
            >
              <AdminCard title="Low stock alerts" description="Products below safety threshold. Click to filter table.">
                <p className="text-3xl font-semibold text-[#f97316]">{lowStockCount}</p>
              </AdminCard>
            </button>
            <button
              type="button"
              onClick={() => handleHeaderCardClick('out-of-stock')}
              className="text-left transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-[#090c11] rounded-2xl"
            >
              <AdminCard
                title="Out of stock"
                description="Zero quantity. Click to view warehouse filtered by out of stock."
                accent="red"
              >
                <p className="text-3xl font-semibold text-red-400">{outOfStockCount}</p>
              </AdminCard>
            </button>
          </section>

          {lowStock && lowStock.length > 0 && (
            <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-amber-400">
                Low stock – needs attention
              </h2>
              <p className="mb-4 text-xs text-amber-400/80">
                Restock urgency and days-until-stockout are estimated; connect sales velocity for accurate forecasts.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-500/20">
                      <th className="px-4 py-3 text-left text-amber-400/90">Product</th>
                      <th className="px-4 py-3 text-left text-amber-400/90">Seller</th>
                      <th className="px-4 py-3 text-left text-amber-400/90">Quantity</th>
                      <th className="px-4 py-3 text-left text-amber-400/90">Urgency</th>
                      <th className="px-4 py-3 text-left text-amber-400/90">Est. days until stockout</th>
                      <th className="px-4 py-3 text-left text-amber-400/90">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => {
                      const urgency = getRestockUrgency(item.quantity);
                      const daysOut = getDaysUntilStockout(item.quantity);
                      return (
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
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400"
                              title={`Urgency score: ${urgency.score}/10`}
                            >
                              <span className="font-semibold">{urgency.score}/10</span>
                              <span className="text-amber-400/90">— {urgency.label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {daysOut === 0 ? (
                              <span className="text-red-400 font-medium">Out of stock</span>
                            ) : daysOut != null ? (
                              <span>~{daysOut} days</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                handleQuickRestock(item);
                                setActionsDrawerOpen(true);
                                setActionsTab('inbound');
                              }}
                              className="rounded px-3 py-1.5 text-xs font-medium text-primary border border-primary/50 hover:bg-primary/10 transition"
                            >
                              Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section id="inventory-actions" className="mb-8 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <h2 className="text-lg font-semibold text-white">Inventory actions</h2>
            <p className="mt-1 text-sm text-gray-400">Keep counts accurate by logging every inbound, outbound, or manual adjustment.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => { setActionsDrawerOpen(true); setActionsTab('inbound'); setActionsStep('form'); }}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-primary-light"
              >
                Inbound
              </button>
              <button
                type="button"
                onClick={() => { setActionsDrawerOpen(true); setActionsTab('outbound'); setActionsStep('form'); }}
                className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                Outbound
              </button>
              <button
                type="button"
                onClick={() => { setActionsDrawerOpen(true); setActionsTab('adjust'); setActionsStep('form'); }}
                className="rounded-full border border-[#f97316] px-5 py-2.5 text-sm font-semibold text-[#f97316] transition hover:bg-[#f97316]/10"
              >
                Adjust
              </button>
            </div>
          </section>

          <AdminDrawer
            open={actionsDrawerOpen}
            onClose={() => { setActionsDrawerOpen(false); setActionsStep('form'); }}
            title="Inventory action"
            description={actionsStep === 'form' ? 'Fill the form and continue to preview.' : 'Review and confirm before submitting.'}
            className="max-w-lg"
            footer={
              actionsStep === 'preview' ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActionsStep('form')}
                    className="rounded-full border border-[#2a2a2a] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1f1f1f]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (actionsTab === 'inbound') await handleInboundSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
                        else if (actionsTab === 'outbound') await handleOutboundSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
                        else await handleAdjustSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
                      } finally {
                        setActionsDrawerOpen(false);
                        setActionsStep('form');
                      }
                    }}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-black hover:bg-primary-light"
                  >
                    Confirm & submit
                  </button>
                </div>
              ) : null
            }
          >
            <div className="flex border-b border-[#1f1f1f] gap-1 mb-4 -mx-6 px-6">
              {(['inbound', 'outbound', 'adjust'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setActionsTab(tab); setActionsStep('form'); }}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition ${
                    actionsTab === tab ? 'bg-[#1f1f1f] text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'inbound' ? 'Inbound' : tab === 'outbound' ? 'Outbound' : 'Adjust'}
                </button>
              ))}
            </div>

            {actionsStep === 'form' ? (
              <>
                {actionsTab === 'inbound' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Product *</label>
                      <select
                        value={inboundForm.productId}
                        onChange={(e) => handleProductSelection(e.target.value)}
                        className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                      >
                        <option value="">Select product</option>
                        {productOptions.map((item) => (
                          <option key={item.productId} value={item.productId}>{item.productTitle} — {item.sellerName}</option>
                        ))}
                      </select>
                      {!inboundForm.productId && <p className="mt-1 text-xs text-red-400">Required</p>}
                    </div>
                    {selectedInboundProduct && <p className="text-xs text-gray-500">Seller: {selectedInboundProduct.sellerName}</p>}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min={1}
                        value={inboundForm.quantity || ''}
                        onChange={(e) => setInboundForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                      />
                      {(inboundForm.quantity ?? 0) < 1 && <p className="mt-1 text-xs text-red-400">Must be at least 1</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Shelf ID (optional)</label>
                      <input value={inboundForm.shelfId} onChange={(e) => setInboundForm((prev) => ({ ...prev, shelfId: e.target.value }))} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Notes (optional)</label>
                      <textarea value={inboundForm.notes} onChange={(e) => setInboundForm((prev) => ({ ...prev, notes: e.target.value }))} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" rows={2} />
                    </div>
                    <button type="button" onClick={() => setActionsStep('preview')} disabled={!inboundForm.productId || !inboundForm.sellerId || (inboundForm.quantity ?? 0) < 1} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-black hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed">Continue to preview</button>
                  </div>
                )}
                {actionsTab === 'outbound' && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                      <p className="text-xs text-amber-400"><strong>Do NOT use for paid orders</strong> — stock is deducted automatically on payment confirmation.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Order ID *</label>
                      <input value={outboundForm.orderId} onChange={(e) => setOutboundForm((prev) => ({ ...prev, orderId: e.target.value }))} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" placeholder="Reference or order ID" />
                      {!outboundForm.orderId?.trim() && <p className="mt-1 text-xs text-red-400">Required</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Product *</label>
                      <select value={outboundForm.productId} onChange={(e) => setOutboundForm((prev) => ({ ...prev, productId: e.target.value }))} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none">
                        <option value="">Select product</option>
                        {productOptions.map((item) => <option key={item.productId} value={item.productId}>{item.productTitle}</option>)}
                      </select>
                      {selectedOutboundProduct && <p className="mt-1 text-xs text-gray-500">Available: {selectedOutboundProduct.quantity.toLocaleString()} units</p>}
                      {!outboundForm.productId && <p className="mt-1 text-xs text-red-400">Required</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Quantity *</label>
                      <input type="number" min={1} value={outboundForm.quantity || ''} onChange={(e) => setOutboundForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" />
                      {(outboundForm.quantity ?? 0) < 1 && <p className="mt-1 text-xs text-red-400">Must be at least 1</p>}
                      {selectedOutboundProduct && outboundForm.quantity > selectedOutboundProduct.quantity && <p className="mt-1 text-xs text-red-400">Exceeds available ({selectedOutboundProduct.quantity})</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Notes (optional)</label>
                      <textarea value={outboundForm.notes} onChange={(e) => setOutboundForm((prev) => ({ ...prev, notes: e.target.value }))} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" rows={2} />
                    </div>
                    <button type="button" onClick={() => setActionsStep('preview')} disabled={!outboundForm.orderId?.trim() || !outboundForm.productId || (outboundForm.quantity ?? 0) < 1 || (selectedOutboundProduct != null && outboundForm.quantity > selectedOutboundProduct.quantity)} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-black hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed">Continue to preview</button>
                  </div>
                )}
                {actionsTab === 'adjust' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Product *</label>
                      <select value={adjustForm.productId} onChange={(e) => setAdjustForm((prev) => ({ ...prev, productId: e.target.value }))} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none">
                        <option value="">Select product</option>
                        {productOptions.map((item) => <option key={item.productId} value={item.productId}>{item.productTitle}</option>)}
                      </select>
                      {selectedAdjustProduct && <p className="mt-1 text-xs text-gray-500">Current stock: {selectedAdjustProduct.quantity.toLocaleString()} units</p>}
                      {!adjustForm.productId && <p className="mt-1 text-xs text-red-400">Required</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Direction</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setAdjustDirection('increase')} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${adjustDirection === 'increase' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-[#2a2a2a] bg-[#151515] text-gray-400'}`}>Increase</button>
                        <button type="button" onClick={() => setAdjustDirection('decrease')} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${adjustDirection === 'decrease' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-[#2a2a2a] bg-[#151515] text-gray-400'}`}>Decrease</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Amount *</label>
                      <input type="number" min={1} value={adjustAmount} onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value) || 1))} className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" />
                      {adjustDirection === 'decrease' && selectedAdjustProduct && adjustAmount > selectedAdjustProduct.quantity && <p className="mt-1 text-xs text-red-400">Max decrease: {selectedAdjustProduct.quantity}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Reason *</label>
                      <textarea value={adjustForm.reason} onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="e.g. Cycle count correction" className="w-full rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none" rows={2} />
                      {!adjustForm.reason?.trim() && <p className="mt-1 text-xs text-red-400">Required</p>}
                    </div>
                    <button type="button" onClick={() => setActionsStep('preview')} disabled={!adjustForm.productId || !adjustForm.reason?.trim() || (adjustDirection === 'decrease' && selectedAdjustProduct && adjustAmount > selectedAdjustProduct.quantity)} className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-black hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed">Continue to preview</button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-[#2a2a2a] bg-[#151515] p-4 space-y-2 text-sm">
                {actionsTab === 'inbound' && (
                  <>
                    <p><span className="text-gray-500">Product:</span> {(selectedInboundProduct?.productTitle ?? inboundForm.productId) || '—'}</p>
                    <p><span className="text-gray-500">Quantity:</span> {inboundForm.quantity}</p>
                    {inboundForm.shelfId && <p><span className="text-gray-500">Shelf:</span> {inboundForm.shelfId}</p>}
                    {inboundForm.notes && <p><span className="text-gray-500">Notes:</span> {inboundForm.notes}</p>}
                  </>
                )}
                {actionsTab === 'outbound' && (
                  <>
                    <p><span className="text-gray-500">Order ID:</span> {outboundForm.orderId}</p>
                    <p><span className="text-gray-500">Product:</span> {(selectedOutboundProduct?.productTitle ?? outboundForm.productId) || '—'}</p>
                    <p><span className="text-gray-500">Quantity:</span> {outboundForm.quantity}</p>
                    {outboundForm.notes && <p><span className="text-gray-500">Notes:</span> {outboundForm.notes}</p>}
                  </>
                )}
                {actionsTab === 'adjust' && (
                  <>
                    <p><span className="text-gray-500">Product:</span> {(selectedAdjustProduct?.productTitle ?? adjustForm.productId) || '—'}</p>
                    <p><span className="text-gray-500">Change:</span> {adjustDirection === 'increase' ? '+' : '-'}{adjustAmount}</p>
                    <p><span className="text-gray-500">Reason:</span> {adjustForm.reason}</p>
                  </>
                )}
              </div>
            )}
          </AdminDrawer>

          <div ref={inventoryTableRef} className="scroll-mt-6">
            <AdminToolbar className="mb-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products or sellers"
                className="flex-1 rounded-full border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              {viewFilter === 'low-stock' && (
                <button
                  type="button"
                  onClick={() => setViewFilter(null)}
                  className="rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/30"
                >
                  Showing low stock only ×
                </button>
              )}
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
            <AdminEmptyState title="No products found" description="Try a different search or clear the low-stock filter." />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <th className="px-6 py-4 text-white w-12"> </th>
                    <th
                      className="px-6 py-4 text-white cursor-pointer select-none hover:text-primary"
                      onClick={() => { setSortBy('product'); setSortOrder(sortBy === 'product' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                    >
                      Product {sortBy === 'product' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th
                      className="px-6 py-4 text-white cursor-pointer select-none hover:text-primary"
                      onClick={() => { setSortBy('seller'); setSortOrder(sortBy === 'seller' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                    >
                      Seller {sortBy === 'seller' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th
                      className="px-6 py-4 text-white cursor-pointer select-none hover:text-primary"
                      onClick={() => { setSortBy('quantity'); setSortOrder(sortBy === 'quantity' ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                    >
                      Quantity {sortBy === 'quantity' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                    <th className="px-6 py-4 text-white">Actions</th>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredStock.map((item) => (
                    <InventoryRow
                      key={item.productId}
                      item={item}
                      getStockRowClass={getStockRowClass}
                      LOW_STOCK_THRESHOLD={LOW_STOCK_THRESHOLD}
                      isEditing={editingQuantityProductId === item.productId}
                      editValue={editingQuantityValue}
                      onEditStart={() => { setEditingQuantityProductId(item.productId); setEditingQuantityValue(String(item.quantity)); }}
                      onEditChange={setEditingQuantityValue}
                      onEditSubmit={async (newQty) => {
                        const delta = newQty - item.quantity;
                        if (delta === 0) { setEditingQuantityProductId(null); return; }
                        await adjustStock.mutateAsync({ productId: item.productId, quantity: delta, reason: 'Inline quantity update' });
                        setEditingQuantityProductId(null);
                      }}
                      onEditCancel={() => { setEditingQuantityProductId(null); }}
                      onRestock={() => handleQuickRestock(item)}
                      onAdjust={() => handleQuickAdjust(item.productId)}
                    />
                  ))}
                </DataTableBody>
              </DataTable>
            </DataTableContainer>
          )}
          </div>

          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">Stock movements</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-lg border border-[#2a2a2a] bg-[#151515] p-0.5">
                  <button
                    type="button"
                    onClick={() => setMovementsView('table')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${movementsView === 'table' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementsView('timeline')}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${movementsView === 'timeline' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Timeline
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['Date', 'Type', 'Product', 'Quantity Change', 'Reason', 'Actor'];
                    const rows = filteredMovements.map((m) => [
                      new Date(m.createdAt).toISOString(),
                      movementLabel[m.type] ?? m.type,
                      m.product?.title ?? m.productId,
                      m.quantity > 0 ? `+${m.quantity}` : String(m.quantity),
                      m.reason ?? '',
                      m.createdBy ?? '—',
                    ]);
                    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `warehouse-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-full border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-xs font-medium text-gray-300 hover:bg-[#1f1f1f] hover:text-white transition"
                >
                  Download Audit Log (CSV)
                </button>
              </div>
            </div>
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
                className="rounded-lg border border-[#2a2a2a] bg-[#151515] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              <input
                type="date"
                value={movementEndDate}
                onChange={(e) => setMovementEndDate(e.target.value)}
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
              movementsView === 'table' ? (
                <DataTableContainer>
                  <DataTable>
                    <DataTableHead>
                      <tr>
                        <th className="px-6 py-4 text-left text-white">Date</th>
                        <th className="px-6 py-4 text-left text-white">Type</th>
                        <th className="px-6 py-4 text-left text-white">Product</th>
                        <th className="px-6 py-4 text-left text-white">Quantity Change</th>
                        <th className="px-6 py-4 text-left text-white">Reason</th>
                        <th className="px-6 py-4 text-left text-white">Actor</th>
                      </tr>
                    </DataTableHead>
                    <DataTableBody>
                      {filteredMovements.map((movement) => (
                        <tr key={movement.id} className="border-b border-[#1f1f1f] last:border-0 hover:bg-[#10151d]">
                          <DataTableCell className="text-gray-300">
                            {new Date(movement.createdAt).toLocaleString()}
                          </DataTableCell>
                          <DataTableCell>
                            <StatusBadge tone={movementTone[movement.type] ?? 'info'} label={movementLabel[movement.type] ?? movement.type} />
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-white">{movement.product?.title ?? movement.productId}</span>
                            {movement.orderId && (
                              <Link href={`/admin/orders?orderId=${movement.orderId}`} className="ml-2 text-xs text-primary hover:underline">
                                Order #{movement.orderId.slice(0, 8)}
                              </Link>
                            )}
                          </DataTableCell>
                          <DataTableCell>
                            <span className={movement.quantity > 0 ? 'text-green-400' : 'text-red-400'}>
                              {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">({movement.previousQuantity} → {movement.newQuantity})</span>
                          </DataTableCell>
                          <DataTableCell className="text-gray-400">{movement.reason ?? '—'}</DataTableCell>
                          <DataTableCell className="text-gray-400">{movement.createdBy ?? '—'}</DataTableCell>
                        </tr>
                      ))}
                    </DataTableBody>
                  </DataTable>
                </DataTableContainer>
              ) : (
                <div className="relative border-l-2 border-[#2a2a2a] pl-6 space-y-0">
                  {filteredMovements.map((movement) => (
                    <div key={movement.id} className="relative pb-8 last:pb-0">
                      <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-[#2a2a2a] border-2 border-[#111111]" />
                      <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <StatusBadge tone={movementTone[movement.type] ?? 'info'} label={movementLabel[movement.type] ?? movement.type} />
                          <span className="text-xs text-gray-500">{new Date(movement.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-medium text-white">{movement.product?.title ?? movement.productId}</p>
                        <p className="text-xs text-gray-400">
                          Quantity: {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity} ({movement.previousQuantity} → {movement.newQuantity})
                          {movement.createdBy && ` · ${movement.createdBy}`}
                        </p>
                        {movement.reason && <p className="text-xs text-gray-500 mt-1">{movement.reason}</p>}
                        {movement.orderId && (
                          <Link href={`/admin/orders?orderId=${movement.orderId}`} className="inline-block mt-2 text-xs text-primary hover:underline">Order #{movement.orderId.slice(0, 8)}</Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
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

