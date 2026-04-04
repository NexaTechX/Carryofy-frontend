import Head from 'next/head';
import React, { useState } from 'react';
import Image from 'next/image';
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
  useAdminBanners,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useUploadBannerImageMutation,
} from '../../lib/admin/hooks/useBanners';
import type { MarketingBanner, BannerPlacement, CreateBannerPayload } from '../../lib/admin/types';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { toast } from 'react-hot-toast';
import { ImageIcon, Megaphone, Pencil, Plus, Trash2, Upload } from 'lucide-react';

const PLACEMENT_OPTIONS: { value: BannerPlacement; label: string }[] = [
  { value: 'HERO', label: 'Hero (buyer home carousel)' },
  { value: 'SHOP', label: 'Shop page (slim strip)' },
  { value: 'BOTH', label: 'Both' },
];

const inputClass =
  'w-full rounded-xl border border-[#1f1f1f] bg-[#131313] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-primary focus:outline-none disabled:opacity-50';

const emptyForm = (): CreateBannerPayload => ({
  imageUrl: '',
  headline: '',
  subline: '',
  ctaLabel: 'Shop now',
  ctaUrl: '/buyer/products',
  placement: 'HERO',
  isActive: true,
  sortOrder: 0,
});

function bannerToForm(b: MarketingBanner): CreateBannerPayload {
  return {
    imageUrl: b.imageUrl,
    headline: b.headline,
    subline: b.subline ?? '',
    ctaLabel: b.ctaLabel,
    ctaUrl: b.ctaUrl,
    placement: b.placement,
    isActive: b.isActive,
    sortOrder: b.sortOrder,
  };
}

export default function AdminBannersPage() {
  const { data: banners = [], isLoading, isError, error, refetch } = useAdminBanners();
  const createBanner = useCreateBannerMutation();
  const updateBanner = useUpdateBannerMutation();
  const deleteBanner = useDeleteBannerMutation();
  const uploadImage = useUploadBannerImageMutation();
  const confirmation = useConfirmation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingBanner | null>(null);
  const [form, setForm] = useState<CreateBannerPayload>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDrawerOpen(true);
  };

  const openEdit = (b: MarketingBanner) => {
    setEditing(b);
    setForm(bannerToForm(b));
    setDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl?.trim()) {
      toast.error('Upload or paste an image URL');
      return;
    }
    const payload: CreateBannerPayload = {
      ...form,
      imageUrl: form.imageUrl.trim(),
      headline: form.headline.trim(),
      subline: form.subline?.trim() ?? '',
      ctaLabel: form.ctaLabel.trim(),
      ctaUrl: form.ctaUrl.trim(),
    };
    if (editing) {
      updateBanner.mutate(
        { id: editing.id, payload },
        { onSuccess: () => setDrawerOpen(false) },
      );
    } else {
      createBanner.mutate(payload, { onSuccess: () => setDrawerOpen(false) });
    }
  };

  const handleDelete = (b: MarketingBanner) => {
    confirmation
      .confirm({
        title: 'Delete banner',
        message: `Delete "${b.headline}"?`,
        confirmText: 'Delete',
        variant: 'danger',
      })
      .then((confirmed) => {
        if (confirmed) deleteBanner.mutate(b.id);
      });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    uploadImage.mutate(file, {
      onSuccess: (res) => {
        setForm((prev) => ({ ...prev, imageUrl: res.url }));
        toast.success('Image uploaded');
      },
    });
  };

  if (isError) {
    const err = error as { message?: string };
    return (
      <AdminLayout>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-red-400">Failed to load banners: {err?.message ?? 'Unknown error'}</p>
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
    <>
      <Head>
        <title>Banners | Admin | Carryofy</title>
      </Head>
      <AdminLayout>
        <div className="min-h-screen bg-[#090c11]">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
            <AdminPageHeader
              title="Banners"
              tag="Marketing"
              subtitle="Manage buyer home hero carousel and shop page strip. Use display location Hero, Shop, or Both; lower sort order appears first."
            />

            <div className="mb-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Add banner
              </button>
            </div>

            {isLoading ? (
              <LoadingState label="Loading banners…" />
            ) : banners.length === 0 ? (
              <AdminEmptyState
                icon={<Megaphone className="h-5 w-5" />}
                title="No banners yet"
                description="Create banners with image, copy, CTA, and where they appear (Hero, Shop, or Both)."
                action={
                  <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:opacity-90"
                  >
                    Add banner
                  </button>
                }
              />
            ) : (
              <DataTableContainer>
                <DataTable>
                  <DataTableHead>
                    <DataTableCell className="w-28">Preview</DataTableCell>
                    <DataTableCell>Headline</DataTableCell>
                    <DataTableCell>Location</DataTableCell>
                    <DataTableCell>Order</DataTableCell>
                    <DataTableCell>Status</DataTableCell>
                    <DataTableCell className="text-right">Actions</DataTableCell>
                  </DataTableHead>
                  <DataTableBody>
                    {banners.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-[#1f1f1f] transition hover:bg-[#0f1419]"
                      >
                        <DataTableCell>
                          <div className="relative h-12 w-20 overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#111]">
                            {b.imageUrl ? (
                              <Image src={b.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-600">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <span className="font-medium text-gray-100">{b.headline}</span>
                        </DataTableCell>
                        <DataTableCell>
                          {PLACEMENT_OPTIONS.find((o) => o.value === b.placement)?.label ?? b.placement}
                        </DataTableCell>
                        <DataTableCell>{b.sortOrder}</DataTableCell>
                        <DataTableCell>
                          <StatusBadge
                            tone={b.isActive ? 'success' : 'neutral'}
                            label={b.isActive ? 'Active' : 'Inactive'}
                          />
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(b)}
                            className="rounded p-1.5 text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b)}
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
          title={editing ? 'Edit banner' : 'Create banner'}
          className="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-medium text-gray-400">Image</span>
              {form.imageUrl ? (
                <div className="relative mt-2 aspect-[21/9] w-full overflow-hidden rounded-xl border border-[#2a2a2a]">
                  <Image src={form.imageUrl} alt="" fill className="object-cover" sizes="400px" />
                </div>
              ) : (
                <div className="mt-2 flex aspect-[21/9] items-center justify-center rounded-xl border border-dashed border-[#2a2a2a] bg-[#111] text-xs text-gray-500">
                  No image
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-black">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadImage.isPending ? 'Uploading…' : 'Upload'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadImage.isPending}
                    onChange={handleFile}
                  />
                </label>
              </div>
              <input
                className={`${inputClass} mt-2`}
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                required
              />
            </div>

            <label className="block">
              <span className="text-xs font-medium text-gray-400">Headline</span>
              <input
                className={`${inputClass} mt-1`}
                value={form.headline}
                onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                maxLength={200}
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-400">Subline</span>
              <textarea
                className={`${inputClass} mt-1 min-h-[72px]`}
                value={form.subline ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, subline: e.target.value }))}
                maxLength={500}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-gray-400">CTA label</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={form.ctaLabel}
                  onChange={(e) => setForm((p) => ({ ...p, ctaLabel: e.target.value }))}
                  maxLength={80}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-400">CTA link</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={form.ctaUrl}
                  onChange={(e) => setForm((p) => ({ ...p, ctaUrl: e.target.value }))}
                  maxLength={2048}
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-gray-400">Display location</span>
              <select
                className={`${inputClass} mt-1`}
                value={form.placement}
                onChange={(e) =>
                  setForm((p) => ({ ...p, placement: e.target.value as BannerPlacement }))
                }
              >
                {PLACEMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                Active
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-400">Sort order</span>
                <input
                  type="number"
                  min={0}
                  className={`${inputClass} mt-1`}
                  value={form.sortOrder ?? 0}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))
                  }
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-[#2a2a2a] px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createBanner.isPending || updateBanner.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {editing ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </AdminDrawer>

        <ConfirmationDialog
          open={confirmation.open}
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          variant={confirmation.variant}
          onConfirm={confirmation.handleConfirm}
          onCancel={confirmation.handleCancel}
          loading={confirmation.loading}
        />
      </AdminLayout>
    </>
  );
}
