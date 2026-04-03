import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminDrawer,
  AdminEmptyState,
  AdminPageHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableContainer,
  DataTableHead,
  LoadingState,
  StatusBadge,
} from '../../components/admin/ui';
import {
  useAdminPromotions,
  useAdminCampaigns,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useUploadPromotionImageMutation,
  type Promotion,
  type PromotionPlacement,
  type CreatePromotionPayload,
} from '../../lib/admin/hooks/usePromotions';
import { toast } from 'react-hot-toast';
import { Megaphone, Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

const PLACEMENT_LABELS: Record<PromotionPlacement, string> = {
  HOMEPAGE_HERO: 'Legacy (deprecated)',
  TOP_ANNOUNCEMENT: 'Top Announcement Bar',
  HOMEPAGE_PROMO: 'Legacy (deprecated)',
  CATEGORY_PAGE: 'Category Page',
  BUYER_DASHBOARD: 'Buyer Home',
  BUYER_SHOP: 'Buyer Shop',
};

/** Placements available for new promotions. Legacy enum values may still appear on old rows. */
const PLACEMENT_OPTIONS: { value: PromotionPlacement; label: string }[] = [
  { value: 'TOP_ANNOUNCEMENT', label: PLACEMENT_LABELS.TOP_ANNOUNCEMENT },
  { value: 'BUYER_DASHBOARD', label: PLACEMENT_LABELS.BUYER_DASHBOARD },
  { value: 'BUYER_SHOP', label: PLACEMENT_LABELS.BUYER_SHOP },
  { value: 'CATEGORY_PAGE', label: PLACEMENT_LABELS.CATEGORY_PAGE },
];

function placementOptionsForForm(
  editingPromotion: Promotion | null,
): { value: PromotionPlacement; label: string }[] {
  const p = editingPromotion?.placement;
  if (p === 'HOMEPAGE_HERO' || p === 'HOMEPAGE_PROMO') {
    const hasInList = PLACEMENT_OPTIONS.some((o) => o.value === p);
    if (!hasInList) {
      return [
        {
          value: p,
          label: `${PLACEMENT_LABELS[p]} — not displayed; change placement to reuse`,
        },
        ...PLACEMENT_OPTIONS,
      ];
    }
  }
  return PLACEMENT_OPTIONS;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function toDayBoundaryIso(value: string, boundary: 'start' | 'end') {
  if (!value) return '';
  const time = boundary === 'start' ? 'T00:00:00' : 'T23:59:59.999';
  return new Date(`${value}${time}`).toISOString();
}

type BuyerPreviewFields = Pick<Promotion, 'placement' | 'imageUrl' | 'mobileImageUrl'>;

/** Thumbnails match buyer app surfaces: dashboard carousel vs shop strip vs announcement bar. */
function PromotionBuyerPreview({ promotion: p }: { promotion: BuyerPreviewFields }) {
  const src = p.imageUrl?.trim() || p.mobileImageUrl?.trim();
  if (!src) {
    return (
      <div className="flex h-12 w-[5.5rem] items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#111111] text-gray-500">
        <ImageIcon className="h-5 w-5" aria-hidden />
      </div>
    );
  }

  if (p.placement === 'BUYER_SHOP') {
    return (
      <div
        className="w-[5.5rem] shrink-0 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-px shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        title="Preview: slim strip on Buyer Shop (below search)"
      >
        <div className="h-7 w-full overflow-hidden rounded-md bg-[#111111]">
          <img src={src} alt="" className="h-full w-full object-cover object-center" />
        </div>
      </div>
    );
  }

  if (p.placement === 'BUYER_DASHBOARD') {
    return (
      <div
        className="w-[5.5rem] shrink-0 rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] p-px shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        title="Preview: carousel on Buyer Home (above stats)"
      >
        <div className="aspect-[21/9] w-full overflow-hidden rounded-md bg-[#111111]">
          <img src={src} alt="" className="h-full w-full object-cover object-center" />
        </div>
      </div>
    );
  }

  if (p.placement === 'TOP_ANNOUNCEMENT') {
    return (
      <div
        className="w-[5.5rem] shrink-0 rounded border border-[#2a2a2a] bg-[#111111] p-1"
        title="Preview: top announcement bar"
      >
        <div className="h-2.5 w-full overflow-hidden rounded-sm bg-[#1a1a1a]">
          <img src={src} alt="" className="h-full w-full object-cover object-center" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-12 w-[5.5rem] overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#111111]"
      title="Preview: buyer app styling"
    >
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

export default function AdminPromotions() {
  const [placementFilter, setPlacementFilter] = useState<PromotionPlacement | ''>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [form, setForm] = useState<CreatePromotionPayload>({
    title: '',
    description: '',
    imageUrl: '',
    mobileImageUrl: '',
    redirectUrl: '',
    placement: 'TOP_ANNOUNCEMENT',
    categorySlug: '',
    priority: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    campaignId: '',
  });

  const { data, isLoading, isError, error, refetch } = useAdminPromotions(
    placementFilter || undefined
  );
  const { data: campaignsData } = useAdminCampaigns();
  const createPromotion = useCreatePromotionMutation();
  const updatePromotion = useUpdatePromotionMutation();
  const deletePromotion = useDeletePromotionMutation();
  const uploadImage = useUploadPromotionImageMutation();
  const confirmation = useConfirmation();

  const promotions = data?.promotions ?? [];
  const campaigns = campaignsData?.campaigns ?? [];

  const openCreate = () => {
    setEditingPromotion(null);
    setForm({
      title: '',
      description: '',
      imageUrl: '',
      mobileImageUrl: '',
      redirectUrl: '',
      placement: 'TOP_ANNOUNCEMENT',
      categorySlug: '',
      priority: 0,
      startDate: '',
      endDate: '',
      isActive: true,
      campaignId: '',
    });
    setDrawerOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditingPromotion(p);
    setForm({
      title: p.title,
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
      mobileImageUrl: p.mobileImageUrl ?? '',
      redirectUrl: p.redirectUrl ?? '',
      placement: p.placement,
      categorySlug: p.categorySlug ?? '',
      priority: p.priority,
      startDate: toDateInputValue(p.startDate),
      endDate: toDateInputValue(p.endDate),
      isActive: p.isActive,
      campaignId: p.campaignId ?? '',
    });
    setDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      toast.error('End date must be the same as or after the start date.');
      return;
    }
    const payload = {
      ...form,
      campaignId: form.campaignId || undefined,
      imageUrl: form.imageUrl || undefined,
      mobileImageUrl: form.mobileImageUrl || undefined,
      redirectUrl: form.redirectUrl || undefined,
      categorySlug:
        form.placement === 'CATEGORY_PAGE'
          ? form.categorySlug?.trim() || undefined
          : undefined,
      description: form.description || undefined,
      startDate: toDayBoundaryIso(form.startDate, 'start'),
      endDate: toDayBoundaryIso(form.endDate, 'end'),
    };
    if (editingPromotion) {
      updatePromotion.mutate(
        { id: editingPromotion.id, payload },
        { onSuccess: () => setDrawerOpen(false) }
      );
    } else {
      createPromotion.mutate(payload, { onSuccess: () => setDrawerOpen(false) });
    }
  };

  const handleDelete = (p: Promotion) => {
    confirmation
      .confirm({
        title: 'Delete promotion',
        message: `Delete "${p.title}"? This cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger',
      })
      .then((confirmed) => {
        if (confirmed) deletePromotion.mutate(p.id);
      });
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageUrl' | 'mobileImageUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadImage.mutate(file, {
      onSuccess: (res) => {
        setForm((prev) => ({ ...prev, [field]: res.url }));
        toast.success('Image uploaded');
      },
    });
  };

  if (isError) {
    const err = error as { message?: string; response?: { status?: number } };
    const is403 = err?.response?.status === 403;
    const message = is403
      ? "You don't have permission to manage promotions. The server returned 403 (Forbidden). Ensure you're logged in with an account that has the Admin role."
      : `Failed to load promotions: ${err?.message ?? 'Unknown error'}`;
    return (
      <AdminLayout>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-red-400">{message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded border border-gray-600 px-3 py-1 text-sm hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Promotions"
            tag="Banners & Campaigns"
            subtitle="Banner-style promotions for logged-in buyers. Primary surfaces: Buyer Home (dashboard carousel) and Buyer Shop (strip under the search bar). Also: top announcement bar and category-targeted banners."
          />

          <div className="mb-6 rounded-xl border border-[#2a2a2a] bg-[#0b1018] px-4 py-3 text-sm text-gray-300">
            <p className="font-medium text-white">Where banners appear (buyer app)</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-gray-400">
              <li>
                <span className="text-gray-200">Buyer Home</span> — full-width carousel above your stats cards (
                <code className="text-xs text-primary/90">/buyer</code>)
              </li>
              <li>
                <span className="text-gray-200">Buyer Shop</span> — slim strip below the shop header (
                <code className="text-xs text-primary/90">/buyer/products</code>)
              </li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              Other placements: announcement bar (site-wide chrome) and category filters on the shop catalog.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-4">
            <select
              value={placementFilter}
              onChange={(e) =>
                setPlacementFilter(e.target.value as PromotionPlacement | '')
              }
              className="rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-sm text-white"
            >
              <option value="">All placements</option>
              {PLACEMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add promotion
            </button>
          </div>

          {isLoading ? (
            <LoadingState label="Loading promotions..." />
          ) : promotions.length === 0 ? (
            <AdminEmptyState
              icon={<Megaphone className="h-5 w-5" />}
              title="No promotions yet"
              description="Create a promotion for Buyer Home, Buyer Shop, the announcement bar, or category pages."
              action={
                <button
                  type="button"
                  onClick={openCreate}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                >
                  Add promotion
                </button>
              }
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead>
                  <DataTableCell className="w-24" title="Preview uses buyer app framing (dashboard vs shop).">
                    Preview
                  </DataTableCell>
                  <DataTableCell>Title</DataTableCell>
                  <DataTableCell>Placement</DataTableCell>
                  <DataTableCell>Start</DataTableCell>
                  <DataTableCell>End</DataTableCell>
                  <DataTableCell>Priority</DataTableCell>
                  <DataTableCell>Status</DataTableCell>
                  <DataTableCell className="text-right">Actions</DataTableCell>
                </DataTableHead>
                <DataTableBody>
                  {promotions.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[#1f1f1f] transition hover:bg-[#0f1419]"
                    >
                      <DataTableCell>
                        <PromotionBuyerPreview promotion={p} />
                      </DataTableCell>
                      <DataTableCell>
                        <span className="font-medium">{p.title}</span>
                        {p.campaignName && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({p.campaignName})
                          </span>
                        )}
                        {p.placement === 'CATEGORY_PAGE' && p.categorySlug && (
                          <div className="mt-1 text-xs text-gray-500">
                            Category: {p.categorySlug}
                          </div>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        {PLACEMENT_LABELS[p.placement]}
                      </DataTableCell>
                      <DataTableCell>{formatDate(p.startDate)}</DataTableCell>
                      <DataTableCell>{formatDate(p.endDate)}</DataTableCell>
                      <DataTableCell>{p.priority}</DataTableCell>
                      <DataTableCell>
                        <StatusBadge
                          tone={p.isActive ? 'success' : 'neutral'}
                          label={p.isActive ? 'Active' : 'Inactive'}
                        />
                      </DataTableCell>
                      <DataTableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded p-1.5 text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="ml-1 rounded p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingPromotion ? 'Edit promotion' : 'Create promotion'}
        description="Banner art, placement in the buyer app, and schedule."
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm hover:bg-[#1f1f1f]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="promotion-form"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            >
              {editingPromotion ? 'Save' : 'Create'}
            </button>
          </div>
        }
      >
        <form id="promotion-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Desktop image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
                placeholder="Or upload below"
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
              />
              <label className="flex cursor-pointer items-center rounded-lg border border-[#2a2a2a] px-3 py-2 text-sm text-gray-400 hover:bg-[#1f1f1f]">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'imageUrl')}
                  disabled={uploadImage.isPending}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Mobile image URL (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.mobileImageUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, mobileImageUrl: e.target.value }))
                }
                placeholder="Or upload below"
                className="flex-1 rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
              />
              <label className="flex cursor-pointer items-center rounded-lg border border-[#2a2a2a] px-3 py-2 text-sm text-gray-400 hover:bg-[#1f1f1f]">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, 'mobileImageUrl')}
                  disabled={uploadImage.isPending}
                />
              </label>
            </div>
          </div>
          {(form.imageUrl?.trim() || form.mobileImageUrl?.trim()) &&
            (form.placement === 'BUYER_DASHBOARD' || form.placement === 'BUYER_SHOP') && (
              <div className="rounded-lg border border-[#2a2a2a] bg-[#0b1018] p-3">
                <p className="mb-2 text-xs font-medium text-gray-400">
                  Preview in buyer app ({form.placement === 'BUYER_DASHBOARD' ? 'Buyer Home' : 'Buyer Shop'})
                </p>
                <div className="flex items-center gap-3">
                  <PromotionBuyerPreview
                    promotion={{
                      placement: form.placement,
                      imageUrl: form.imageUrl,
                      mobileImageUrl: form.mobileImageUrl,
                    }}
                  />
                  <p className="text-xs leading-snug text-gray-500">
                    {form.placement === 'BUYER_DASHBOARD'
                      ? 'Wide carousel slot above dashboard stats — matches /buyer.'
                      : 'Slim strip under the shop search bar — matches /buyer/products.'}
                  </p>
                </div>
              </div>
            )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Redirect URL (optional)
            </label>
            <input
              type="url"
              value={form.redirectUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, redirectUrl: e.target.value }))
              }
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Placement
            </label>
            <select
              value={form.placement}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  placement: e.target.value as PromotionPlacement,
                }))
              }
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
            >
              {placementOptionsForForm(editingPromotion).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {form.placement === 'TOP_ANNOUNCEMENT' &&
                'Slim bar at the top of the app chrome (all roles / areas that show the announcement).'}
              {form.placement === 'BUYER_DASHBOARD' &&
                'Buyer Home (/buyer): full-width carousel above the stats cards. Use a strong banner image and optional redirect.'}
              {form.placement === 'BUYER_SHOP' &&
                'Buyer Shop (/buyer/products): slim strip directly under the search/sort header, above the product grid.'}
              {form.placement === 'CATEGORY_PAGE' &&
                'Shown on the buyer catalog when the selected category matches (optional slug).'}
              {(form.placement === 'HOMEPAGE_HERO' || form.placement === 'HOMEPAGE_PROMO') &&
                'Legacy placement: not displayed anywhere. Pick Buyer Home, Buyer Shop, or another active placement to reuse this promotion.'}
            </p>
          </div>
          {form.placement === 'CATEGORY_PAGE' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Category slug (optional)
              </label>
              <input
                type="text"
                value={form.categorySlug ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categorySlug: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
                placeholder="e.g. electronics"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to show on all category pages.
              </p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Priority (higher = first)
            </label>
            <input
              type="number"
              min={0}
              value={form.priority}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  priority: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Start date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                End date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
                required
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-gray-500">
            Promotions stay active for the full selected days, from 12:00 AM on the start date to 11:59 PM on the end date.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Campaign (optional)
            </label>
            <select
              value={form.campaignId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, campaignId: e.target.value }))
              }
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0b1018] px-3 py-2 text-white"
            >
              <option value="">None</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-600 text-primary"
            />
            <span className="text-sm text-gray-300">Active</span>
          </label>
        </form>
      </AdminDrawer>

      <ConfirmationDialog
        open={confirmation.open}
        onCancel={confirmation.handleCancel}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        variant={confirmation.variant}
      />
    </AdminLayout>
  );
}
