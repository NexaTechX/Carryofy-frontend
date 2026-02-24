import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminCard,
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
import {
  Package,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Pencil,
  Power,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  Utensils,
  Shirt,
  Home,
  Zap,
  BookOpen,
  Music,
  Gift,
  Leaf,
} from 'lucide-react';
import { useConfirmation } from '../../lib/hooks/useConfirmation';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

const DEFAULT_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#64748b',
];

const CATEGORY_ICONS = [
  { value: '', label: 'None' },
  { value: 'Package', label: 'Package' },
  { value: 'ShoppingBag', label: 'Shopping Bag' },
  { value: 'Utensils', label: 'Utensils' },
  { value: 'Shirt', label: 'Shirt' },
  { value: 'Home', label: 'Home' },
  { value: 'Zap', label: 'Zap' },
  { value: 'BookOpen', label: 'Book' },
  { value: 'Music', label: 'Music' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Leaf', label: 'Leaf' },
];

const IconComponent = ({ name }: { name: string }) => {
  const map: Record<string, React.ComponentType<{ className?: string }>> = {
    Package,
    ShoppingBag,
    Utensils,
    Shirt,
    Home,
    Zap,
    BookOpen,
    Music,
    Gift,
    Leaf,
  };
  const C = name ? map[name] : null;
  return C ? <C className="h-4 w-4" /> : <Package className="h-4 w-4 opacity-50" />;
};

type SortKey = 'b2c' | 'b2b' | 'products' | null;
type SortDir = 'asc' | 'desc';

export default function AdminCategories() {
  const { data, isLoading, isError, error, refetch } = useAdminCategories(true);
  const createCategory = useCreateCategoryMutation();
  const updateCategory = useUpdateCategoryMutation();
  const toggleCategory = useToggleCategoryMutation();
  const deleteCategory = useDeleteCategoryMutation();
  const confirmation = useConfirmation();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showOnlyZeroProducts, setShowOnlyZeroProducts] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editingCell, setEditingCell] = useState<{
    categoryId: string;
    field: 'commissionB2C' | 'commissionB2B';
  } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [colorPickerCategoryId, setColorPickerCategoryId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CreateCategoryPayload & { parentId?: string | null }>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: DEFAULT_COLORS[0],
    commissionB2C: 15,
    commissionB2B: null,
    parentId: null,
  });

  const categories = data?.categories || [];

  const stats = useMemo(() => {
    const zeroProduct = categories.filter((c) => (c.productCount ?? 0) === 0);
    return {
      total: categories.length,
      active: categories.filter((c) => c.isActive).length,
      inactive: categories.filter((c) => !c.isActive).length,
      totalProducts: categories.reduce((sum, c) => sum + (c.productCount || 0), 0),
      zeroProductCount: zeroProduct.length,
    };
  }, [categories]);

  const maxProductCount = useMemo(
    () => Math.max(1, ...categories.map((c) => c.productCount ?? 0)),
    [categories]
  );

  const getSubcategories = useCallback(
    (parentId: string | null): Category[] => {
      return categories.filter((c) => (c as Category & { parentId?: string | null }).parentId === parentId);
    },
    [categories]
  );

  const getSubcategoryCount = useCallback(
    (categoryId: string) => getSubcategories(categoryId).length,
    [getSubcategories]
  );

  const displayedCategories = useMemo(() => {
    let list = showOnlyZeroProducts
      ? categories.filter((c) => (c.productCount ?? 0) === 0)
      : [...categories];
    if (sortBy === 'b2c') {
      list = [...list].sort((a, b) => {
        const va = a.commissionB2C ?? 15;
        const vb = b.commissionB2C ?? 15;
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    } else if (sortBy === 'b2b') {
      list = [...list].sort((a, b) => {
        const va = a.commissionB2B ?? -1;
        const vb = b.commissionB2B ?? -1;
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    } else if (sortBy === 'products') {
      list = [...list].sort((a, b) => {
        const va = a.productCount ?? 0;
        const vb = b.productCount ?? 0;
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    }
    return list;
  }, [categories, showOnlyZeroProducts, sortBy, sortDir]);

  useEffect(() => {
    if (editingCell && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [editingCell]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const handleCreateOpen = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: DEFAULT_COLORS[0],
      commissionB2C: 15,
      commissionB2B: null,
      parentId: null,
    });
    setIsCreateDrawerOpen(true);
  };

  const handleEditOpen = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || DEFAULT_COLORS[0],
      commissionB2C: category.commissionB2C ?? 15,
      commissionB2B: category.commissionB2B ?? null,
    });
    setIsEditModalOpen(true);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    const { parentId: _p, ...payload } = formData;
    await createCategory.mutateAsync(payload);
    setIsCreateDrawerOpen(false);
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
      commissionB2C: formData.commissionB2C,
      commissionB2B: formData.commissionB2B,
    };
    await updateCategory.mutateAsync({ categoryId: selectedCategory.id, payload });
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
      message: `Are you sure you want to delete "${category.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    confirmation.setLoading(true);
    try {
      await deleteCategory.mutateAsync(category.id);
      refetch();
    } catch {
      // mutation handles toast
    } finally {
      confirmation.setLoading(false);
    }
  };

  const startInlineEdit = (category: Category, field: 'commissionB2C' | 'commissionB2B') => {
    const val = field === 'commissionB2B' && category.commissionB2B == null ? '' : String(category[field] ?? 15);
    setEditingCell({ categoryId: category.id, field });
    setEditingValue(val);
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    const category = categories.find((c) => c.id === editingCell.categoryId);
    if (!category) return;
    const num = editingValue.trim() === '' ? null : parseFloat(editingValue);
    if (num !== null && (num < 0 || num > 100)) {
      toast.error('Commission must be between 0 and 100');
      return;
    }
    const payload: UpdateCategoryPayload =
      editingCell.field === 'commissionB2C'
        ? { commissionB2C: num ?? 15 }
        : { commissionB2B: num ?? null };
    await updateCategory.mutateAsync({ categoryId: editingCell.categoryId, payload });
    setEditingCell(null);
    refetch();
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveInlineEdit();
    if (e.key === 'Escape') setEditingCell(null);
  };

  const setCategoryColor = async (categoryId: string, color: string) => {
    await updateCategory.mutateAsync({ categoryId, payload: { color } });
    setColorPickerCategoryId(null);
    refetch();
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
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

            <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <AdminCard
                title="Categories with Zero Products"
                description="Add products or deactivate empty categories"
                accent="red"
                onClick={() => {
                  setShowOnlyZeroProducts(true);
                }}
              >
                <p className="text-3xl font-bold text-red-400">{stats.zeroProductCount}</p>
                {stats.zeroProductCount > 0 && (
                  <p className="mt-1 text-xs text-red-300/80">Click to view and take action</p>
                )}
              </AdminCard>
            </section>

            {showOnlyZeroProducts && stats.zeroProductCount > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-200">
                  Showing only categories with zero products. Add products to these categories or deactivate them to
                  keep the catalog clean.
                </p>
                <button
                  onClick={() => setShowOnlyZeroProducts(false)}
                  className="ml-auto rounded-full border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-primary hover:text-primary"
                >
                  Show all categories
                </button>
              </div>
            )}

            {isLoading ? (
              <LoadingState label="Loading categories..." />
            ) : isError ? (
              <AdminEmptyState
                icon={<Package className="h-5 w-5" />}
                title="Error loading categories"
                description={error instanceof Error ? error.message : 'Failed to load categories'}
                action={
                  <button
                    onClick={() => refetch()}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                  >
                    Retry
                  </button>
                }
              />
            ) : displayedCategories.length === 0 ? (
              <AdminEmptyState
                icon={<Package className="h-5 w-5" />}
                title={showOnlyZeroProducts ? 'No empty categories' : 'No categories yet'}
                description={
                  showOnlyZeroProducts
                    ? 'All categories have at least one product.'
                    : 'Create your first category to organize products'
                }
                action={
                  !showOnlyZeroProducts ? (
                    <button
                      onClick={handleCreateOpen}
                      className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light"
                    >
                      Create Category
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowOnlyZeroProducts(false)}
                      className="rounded-full border border-gray-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                    >
                      Show all categories
                    </button>
                  )
                }
              />
            ) : (
              <DataTableContainer>
              <DataTable>
                  <thead className="bg-[#161616] text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    <tr>
                      <th className="w-10 px-4 py-4" />
                      <th className="px-6 py-4 text-left text-white">Category</th>
                      <th className="px-6 py-4 text-left text-white">Slug</th>
                      <th className="px-6 py-4 text-left text-white">
                        <button
                          type="button"
                          onClick={() => handleSort('b2c')}
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          B2C %
                          {sortBy !== 'b2c' && <ArrowUpDown className="ml-1 h-3.5 w-3 opacity-60" />}
                          {sortBy === 'b2c' && (sortDir === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3" /> : <ArrowDown className="ml-1 h-3.5 w-3" />)}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-white">
                        <button
                          type="button"
                          onClick={() => handleSort('b2b')}
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          B2B %
                          {sortBy !== 'b2b' && <ArrowUpDown className="ml-1 h-3.5 w-3 opacity-60" />}
                          {sortBy === 'b2b' && (sortDir === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3" /> : <ArrowDown className="ml-1 h-3.5 w-3" />)}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-white">
                        <button
                          type="button"
                          onClick={() => handleSort('products')}
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          Products
                          {sortBy !== 'products' && <ArrowUpDown className="ml-1 h-3.5 w-3 opacity-60" />}
                          {sortBy === 'products' && (sortDir === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3" /> : <ArrowDown className="ml-1 h-3.5 w-3" />)}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-white">Subcategories</th>
                      <th className="px-6 py-4 text-left text-white">Status</th>
                      <th className="px-6 py-4 text-left text-white">Order</th>
                      <th className="px-6 py-4 text-right text-white">Actions</th>
                    </tr>
                  </thead>
                  <DataTableBody>
                    {displayedCategories.map((category) => {
                      const subCount = getSubcategoryCount(category.id);
                      const isExpanded = expandedRows.has(category.id);
                      const subcategories = getSubcategories(category.id);
                      return (
                        <React.Fragment key={category.id}>
                          <tr className="group">
                            <DataTableCell className="w-10">
                              {subCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(category.id)}
                                  className="rounded p-0.5 text-gray-400 hover:text-white"
                                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              ) : (
                                <span className="inline-block w-4" />
                              )}
                            </DataTableCell>
                            <DataTableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setColorPickerCategoryId((id) => (id === category.id ? null : category.id))
                                    }
                                    className="h-8 w-8 shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-white/30"
                                    style={{ backgroundColor: category.color || DEFAULT_COLORS[0] }}
                                    title="Change color"
                                  />
                                  {colorPickerCategoryId === category.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        aria-hidden
                                        onClick={() => setColorPickerCategoryId(null)}
                                      />
                                      <div className="absolute left-0 top-10 z-20 flex flex-wrap gap-1 rounded-lg border border-[#2a2a2a] bg-[#161616] p-2 shadow-xl">
                                        {DEFAULT_COLORS.map((color) => (
                                          <button
                                            key={color}
                                            type="button"
                                            onClick={() => setCategoryColor(category.id, color)}
                                            className="h-6 w-6 rounded-full transition hover:scale-110"
                                            style={{ backgroundColor: color }}
                                          />
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-white">{category.name}</p>
                                  {category.description && (
                                    <p className="truncate text-xs text-gray-400">{category.description}</p>
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
                              {editingCell?.categoryId === category.id && editingCell?.field === 'commissionB2C' ? (
                                <input
                                  ref={inlineInputRef}
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.01}
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveInlineEdit}
                                  onKeyDown={handleInlineKeyDown}
                                  className="w-16 rounded border border-primary bg-[#1a1a1a] px-2 py-1 text-sm text-white focus:outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startInlineEdit(category, 'commissionB2C')}
                                  className="rounded px-1 py-0.5 text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                                  title="Click to edit"
                                >
                                  {(category.commissionB2C ?? 15)}%
                                </button>
                              )}
                            </DataTableCell>
                            <DataTableCell>
                              {editingCell?.categoryId === category.id && editingCell?.field === 'commissionB2B' ? (
                                <input
                                  ref={inlineInputRef}
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={0.01}
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveInlineEdit}
                                  onKeyDown={handleInlineKeyDown}
                                  placeholder="—"
                                  className="w-16 rounded border border-primary bg-[#1a1a1a] px-2 py-1 text-sm text-white focus:outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startInlineEdit(category, 'commissionB2B')}
                                  className="rounded px-1 py-0.5 text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                                  title="Click to edit"
                                >
                                  {category.commissionB2B != null ? `${category.commissionB2B}%` : '—'}
                                </button>
                              )}
                            </DataTableCell>
                            <DataTableCell>
                              <div className="min-w-[120px]">
                                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                                  <span className="text-gray-300">{category.productCount ?? 0}</span>
                                  {maxProductCount > 0 && (
                                    <span className="text-gray-500">
                                      {Math.round(((category.productCount ?? 0) / maxProductCount) * 100)}%
                                    </span>
                                  )}
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1a1a1a]">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{
                                      width: `${maxProductCount ? Math.min(100, ((category.productCount ?? 0) / maxProductCount) * 100) : 0}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </DataTableCell>
                            <DataTableCell>
                              <span className="text-gray-400">{subCount}</span>
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
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => handleEditOpen(category)}
                                  className="inline-flex items-center gap-1 rounded-full border border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleActive(category)}
                                  className="inline-flex items-center gap-1 rounded-full border border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-blue-500 hover:text-blue-400"
                                  title={category.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                  {category.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDelete(category)}
                                  disabled={(category.productCount ?? 0) > 0}
                                  className="inline-flex items-center gap-1 rounded-full border border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Delete (only when no products)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </DataTableCell>
                          </tr>
                          {isExpanded && subCount > 0 && (
                            <tr className="bg-[#0d0d0d]">
                              <td colSpan={10} className="px-6 py-3">
                                <div className="pl-12">
                                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Subcategories
                                  </p>
                                  {subcategories.length === 0 ? (
                                    <p className="text-sm text-gray-500">No subcategories</p>
                                  ) : (
                                    <ul className="space-y-1 text-sm text-gray-300">
                                      {subcategories.map((sub) => (
                                        <li key={sub.id} className="flex items-center gap-2">
                                          {sub.color && (
                                            <span
                                              className="h-3 w-3 rounded-full"
                                              style={{ backgroundColor: sub.color }}
                                            />
                                          )}
                                          {sub.name} ({sub.productCount ?? 0} products)
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </DataTableBody>
                </DataTable>
              </DataTableContainer>
            )}
          </div>
        </div>

        <AdminDrawer
          open={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          title="Create Category"
          description="Add a new product category. Slug is auto-generated from the name."
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateDrawerOpen(false)}
                className="rounded-full border border-gray-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={createCategory.isPending}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-primary-light disabled:opacity-50"
              >
                {createCategory.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
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
              <label className="mb-1 block text-sm font-medium text-gray-300">Slug (auto-generated)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-gray-400 focus:border-primary focus:outline-none"
                placeholder="e.g., grains-rice"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                rows={3}
                placeholder="Brief description..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Color</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={`h-8 w-8 rounded-full transition ${
                      formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b1018]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
              >
                {CATEGORY_ICONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {formData.icon && (
                <div className="mt-2 flex items-center gap-2 text-gray-400">
                  <IconComponent name={formData.icon} />
                  <span className="text-xs">Preview</span>
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Parent category (subcategory)</label>
              <select
                value={formData.parentId ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, parentId: e.target.value || null }))
                }
                className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
              >
                <option value="">None (top-level)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-0.5 text-xs text-gray-500">Optional. Subcategories are supported when enabled in the API.</p>
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commissionB2C: parseFloat(e.target.value) || 15,
                    }))
                  }
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      commissionB2B: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  placeholder="Optional"
                />
                <p className="mt-0.5 text-xs text-gray-500">Empty = use B2C</p>
              </div>
            </div>
          </div>
        </AdminDrawer>

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
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          commissionB2C: parseFloat(e.target.value) || 15,
                        }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          commissionB2B: e.target.value ? parseFloat(e.target.value) : null,
                        }))
                      }
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
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, color }))}
                        className={`h-8 w-8 rounded-full transition ${
                          formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f1729]' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-white focus:border-primary focus:outline-none"
                  >
                    {CATEGORY_ICONS.map((opt) => (
                      <option key={opt.value || 'none'} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
