import { useMemo, useState } from 'react';
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
  useAdminCategories,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useToggleCategoryMutation,
  useDeleteCategoryMutation,
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../lib/admin/hooks/useCategories';
import { toast } from 'react-hot-toast';
import { Package, Plus, X } from 'lucide-react';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export default function AdminCategories() {
  const { data, isLoading, isError, error, refetch } = useAdminCategories(true);
  const createCategory = useCreateCategoryMutation();
  const updateCategory = useUpdateCategoryMutation();
  const toggleCategory = useToggleCategoryMutation();
  const deleteCategory = useDeleteCategoryMutation();
  const confirmation = useConfirmation();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateCategoryPayload>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: DEFAULT_COLORS[0],
    displayOrder: 0,
    commissionB2C: 15,
    commissionB2B: null,
  });

  const categories = data?.categories || [];

  const stats = useMemo(() => {
    return {
      total: categories.length,
      active: categories.filter((c) => c.isActive).length,
      inactive: categories.filter((c) => !c.isActive).length,
      totalProducts: categories.reduce((sum, c) => sum + (c.productCount || 0), 0),
    };
  }, [categories]);

  const handleCreateOpen = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: DEFAULT_COLORS[0],
      displayOrder: categories.length,
      commissionB2C: 15,
      commissionB2B: null,
    });
    setIsCreateModalOpen(true);
  };

  const handleEditOpen = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || DEFAULT_COLORS[0],
      displayOrder: category.displayOrder,
      commissionB2C: category.commissionB2C ?? 15,
      commissionB2B: category.commissionB2B ?? null,
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    await createCategory.mutateAsync(formData);
    setIsCreateModalOpen(false);
    refetch();
  };

  const handleEdit = async () => {
    if (!selectedCategory) return;

    const payload: UpdateCategoryPayload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      icon: formData.icon,
      color: formData.color,
      displayOrder: formData.displayOrder,
      commissionB2C: formData.commissionB2C,
      commissionB2B: formData.commissionB2B,
    };

    await updateCategory.mutateAsync({
      categoryId: selectedCategory.id,
      payload,
    });
    setIsEditModalOpen(false);
    setSelectedCategory(null);
    refetch();
  };

  const handleToggleActive = async (category: Category) => {
    await toggleCategory.mutateAsync(category.id);
    refetch();
  };

  const handleDelete = async (category: Category) => {
    const confirmed = await confirmation.confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    confirmation.setLoading(true);
    try {
      await deleteCategory.mutateAsync(category.id);
      refetch();
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      confirmation.setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  return (
    <>
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Categories"
            tag="Product Categories"
            subtitle="Manage product categories for marketplace organization and filtering"
          >
            <button
              onClick={handleCreateOpen}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
            >
              <Plus className="h-4 w-4" />
              Create Category
            </button>
          </AdminPageHeader>

          {/* Stats Cards */}
          <section className="mb-10 grid gap-4 sm:grid-cols-4">
            <AdminCard title="Total Categories" description="All categories">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </AdminCard>
            <AdminCard title="Active" description="Currently active">
              <p className="text-3xl font-bold text-green-400">{stats.active}</p>
            </AdminCard>
            <AdminCard title="Inactive" description="Disabled categories">
              <p className="text-3xl font-bold text-gray-400">{stats.inactive}</p>
            </AdminCard>
            <AdminCard title="Total Products" description="Products in categories">
              <p className="text-3xl font-bold text-blue-400">{stats.totalProducts}</p>
            </AdminCard>
          </section>

          {/* Categories Table */}
          {isLoading ? (
            <LoadingState label="Loading categories..." />
          ) : isError ? (
            <AdminEmptyState
              icon={<Package className="h-5 w-5" />}
              title="Error loading categories"
              description={error instanceof Error ? error.message : 'Failed to load categories'}
              action={(
                <button
                  onClick={() => refetch()}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                >
                  Retry
                </button>
              )}
            />
          ) : categories.length === 0 ? (
            <AdminEmptyState
              icon={<Package className="h-5 w-5" />}
              title="No categories yet"
              description="Create your first category to organize products"
              action={(
                <button
                  onClick={handleCreateOpen}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                >
                  Create Category
                </button>
              )}
            />
          ) : (
            <DataTableContainer>
              <DataTable>
                <DataTableHead
                  columns={['Category', 'Slug', 'B2C %', 'B2B %', 'Products', 'Status', 'Display Order', 'Actions']}
                />
                <DataTableBody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          {category.color && (
                            <div
                              className="h-8 w-8 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-gray-400">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <code className="rounded bg-[#1a1a1a] px-2 py-1 text-xs text-gray-300">
                          {category.slug}
                        </code>
                      </DataTableCell>
                      <DataTableCell>
                        <p className="text-gray-300">{(category.commissionB2C ?? 15)}%</p>
                      </DataTableCell>
                      <DataTableCell>
                        <p className="text-gray-300">
                          {category.commissionB2B != null ? `${category.commissionB2B}%` : '—'}
                        </p>
                      </DataTableCell>
                      <DataTableCell>
                        <p className="text-gray-300">{category.productCount || 0}</p>
                      </DataTableCell>
                      <DataTableCell>
                        <StatusBadge
                          tone={category.isActive ? 'success' : 'neutral'}
                          label={category.isActive ? 'Active' : 'Inactive'}
                        />
                      </DataTableCell>
                      <DataTableCell>
                        <p className="text-gray-300">{category.displayOrder}</p>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditOpen(category)}
                            className="rounded-full border border-gray-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(category)}
                            className="rounded-full border border-gray-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-blue-500 hover:text-blue-400"
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            disabled={(category.productCount ?? 0) > 0}
                            className="rounded-full border border-gray-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
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

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-lg bg-[#0f1729] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create Category</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  placeholder="e.g., Grains & Rice"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  placeholder="e.g., grains-rice"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  rows={3}
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">B2C Commission (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={formData.commissionB2C ?? 15}
                    onChange={(e) => setFormData({ ...formData, commissionB2C: parseFloat(e.target.value) || 15 })}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">B2B Commission (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={formData.commissionB2B ?? ''}
                    onChange={(e) => setFormData({ ...formData, commissionB2B: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                    placeholder="Optional"
                  />
                  <p className="mt-0.5 text-xs text-gray-500">Empty = use B2C</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Color</label>
                <div className="flex gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`h-8 w-8 rounded-full transition ${
                        formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f1729]' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-full border border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createCategory.isPending}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50"
                >
                  {createCategory.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-lg bg-[#0f1729] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Edit Category</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedCategory(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">B2C Commission (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={formData.commissionB2C ?? 15}
                    onChange={(e) => setFormData({ ...formData, commissionB2C: parseFloat(e.target.value) || 15 })}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">B2B Commission (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={formData.commissionB2B ?? ''}
                    onChange={(e) => setFormData({ ...formData, commissionB2B: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                    placeholder="Optional"
                  />
                  <p className="mt-0.5 text-xs text-gray-500">Empty = use B2C</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Color</label>
                <div className="flex gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`h-8 w-8 rounded-full transition ${
                        formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f1729]' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  min="0"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedCategory(null);
                  }}
                  className="rounded-full border border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={updateCategory.isPending}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50"
                >
                  {updateCategory.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
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
    </>
  );
}

