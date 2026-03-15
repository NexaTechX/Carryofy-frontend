import React, { useState, useMemo } from 'react';
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
  HOMEPAGE_HERO: 'Homepage Hero',
  TOP_ANNOUNCEMENT: 'Top Announcement Bar',
  HOMEPAGE_PROMO: 'Homepage Promo Section',
  CATEGORY_PAGE: 'Category Page',
};

const PLACEMENT_OPTIONS: { value: PromotionPlacement; label: string }[] = [
  { value: 'HOMEPAGE_HERO', label: PLACEMENT_LABELS.HOMEPAGE_HERO },
  { value: 'TOP_ANNOUNCEMENT', label: PLACEMENT_LABELS.TOP_ANNOUNCEMENT },
  { value: 'HOMEPAGE_PROMO', label: PLACEMENT_LABELS.HOMEPAGE_PROMO },
  { value: 'CATEGORY_PAGE', label: PLACEMENT_LABELS.CATEGORY_PAGE },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
    placement: 'HOMEPAGE_HERO',
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
      placement: 'HOMEPAGE_HERO',
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
      priority: p.priority,
      startDate: p.startDate.slice(0, 10),
      endDate: p.endDate.slice(0, 10),
      isActive: p.isActive,
      campaignId: p.campaignId ?? '',
    });
    setDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      campaignId: form.campaignId || undefined,
      imageUrl: form.imageUrl || undefined,
      mobileImageUrl: form.mobileImageUrl || undefined,
      redirectUrl: form.redirectUrl || undefined,
      description: form.description || undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : '',
      endDate: form.endDate ? new Date(form.endDate).toISOString() : '',
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
    return (
      <AdminLayout>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-red-400">
            Failed to load promotions: {(error as Error)?.message}
          </p>
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
            subtitle="Manage homepage banners, announcement bars, and campaign promotions."
          />

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
              description="Create a promotion to show banners on the homepage or announcement bar."
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
                  <DataTableCell className="w-20">Preview</DataTableCell>
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
                        <div className="h-12 w-20 overflow-hidden rounded border border-[#2a2a2a] bg-[#1a1a1a]">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-500">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <span className="font-medium">{p.title}</span>
                        {p.campaignName && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({p.campaignName})
                          </span>
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
        description="Banner image, placement, and schedule."
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
              {PLACEMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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
