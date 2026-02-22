import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import { tokenManager, userManager } from '../../lib/auth';
import {
  Bookmark,
  ShoppingCart,
  Trash2,
  Package,
  ShoppingBag,
  ChevronLeft,
  Share2,
  Layers,
  Plus,
  Pencil,
  X,
} from 'lucide-react';
import { getWishlist, removeFromWishlist, WishlistItem } from '../../lib/api/wishlist';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import { useCart } from '../../lib/contexts/CartContext';
import type { ShopProductCardProduct } from '../../components/buyer/shop/ShopProductCard';

type ListType = 'personal' | 'business';

const CUSTOM_LISTS_STORAGE_KEY = 'carryofy-custom-saved-lists';

interface SavedList {
  id: string;
  name: string;
  type: ListType;
  products: ShopProductCardProduct[];
  updatedAt: string;
}

const formatPrice = (priceInKobo: number) =>
  `₦${(priceInKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
};

function loadCustomLists(): SavedList[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_LISTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomLists(lists: SavedList[]) {
  if (typeof window === 'undefined') return;
  const custom = lists.filter((l) => l.id !== 'personal');
  localStorage.setItem(CUSTOM_LISTS_STORAGE_KEY, JSON.stringify(custom));
}

function wishlistItemToProduct(item: WishlistItem): ShopProductCardProduct {
  const p = item.product;
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    images: p.images || [],
    quantity: p.quantity || 0,
    status: p.status,
    seller: p.seller ? { id: p.seller.id, businessName: p.seller.businessName, isVerified: true } : { id: '', businessName: 'Seller', isVerified: false },
    fulfilledByCarryofy: true,
  };
}

export default function SavedListsPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [lists, setLists] = useState<SavedList[]>([]);
  const [apiItems, setApiItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<{ [key: string]: boolean }>({});
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState<ListType>('personal');

  useEffect(() => {
    setMounted(true);
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role && user.role !== 'BUYER' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (mounted) fetchWishlist();
  }, [mounted]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWishlist();
      const items = response.items || [];
      setApiItems(items);

      // Build lists from API wishlist (only add Personal when it has products)
      const personalProducts = items.map(wishlistItemToProduct);
      const personalList =
        personalProducts.length > 0
          ? [
              {
                id: 'personal',
                name: 'Personal',
                type: 'personal' as const,
                products: personalProducts,
                updatedAt: items[0]?.createdAt || new Date().toISOString(),
              },
            ]
          : [];

      // Merge with custom lists from localStorage
      const customLists = loadCustomLists();
      setLists([...personalList, ...customLists]);
    } catch (err: any) {
      console.error('Error fetching saved lists:', err);
      if (err.response?.status === 500) {
        setError('Server error: The saved lists service is unavailable. Please check backend logs.');
      } else if (err.response?.status === 401) {
        setError('Please log in to view your saved lists');
      } else {
        setError(err.response?.data?.message || 'Failed to load saved lists. Please try again.');
      }
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async (productId: string) => {
    try {
      setRemovingItems((prev) => ({ ...prev, [productId]: true }));
      await removeFromWishlist(productId);
      setLists((prev) =>
        prev.map((list) => ({
          ...list,
          products: list.products.filter((p) => p.id !== productId),
        }))
      );
      setApiItems((prev) => prev.filter((i) => i.productId !== productId));
      showSuccessToast('Removed from list');
    } catch (err: any) {
      console.error('Error removing:', err);
      showErrorToast(err.response?.data?.message || 'Failed to remove');
    } finally {
      setRemovingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId);
      showSuccessToast('Product added to cart!');
    } catch (err: any) {
      showErrorToast('Failed to add product to cart');
    }
  };

  const handleAddAllToCart = (list: SavedList) => {
    list.products.forEach((p) => {
      if (p.quantity > 0) addToCart(p.id);
    });
    showSuccessToast(`Added ${list.products.length} items to cart`);
  };

  const handleDeleteList = (listId: string) => {
    setLists((prev) => {
      const next = prev.filter((l) => l.id !== listId);
      saveCustomLists(next);
      return next;
    });
    if (selectedListId === listId) setSelectedListId(null);
    showSuccessToast('List deleted');
  };

  const handleSaveListName = (listId: string) => {
    setLists((prev) => {
      const next = prev.map((l) =>
        l.id === listId ? { ...l, name: editName || l.name } : l
      );
      saveCustomLists(next);
      return next;
    });
    setEditingListId(null);
    setEditName('');
  };

  const handleCreateList = () => {
    const name = newListName.trim() || 'New List';
    const newList: SavedList = {
      id: `custom-${Date.now()}`,
      name,
      type: newListType,
      products: [],
      updatedAt: new Date().toISOString(),
    };
    setLists((prev) => {
      const next = [...prev, newList];
      saveCustomLists(next);
      return next;
    });
    setShowCreateModal(false);
    setNewListName('');
    setNewListType('personal');
    showSuccessToast('List created');
  };

  const handleShareList = () => {
    if (navigator.share) {
      const list = lists.find((l) => l.id === selectedListId);
      if (list) {
        navigator
          .share({
            title: `${list.name} - Carryofy`,
            text: `Check out my saved list "${list.name}" on Carryofy`,
            url: window.location.href,
          })
          .then(() => showSuccessToast('List shared'))
          .catch(() => showErrorToast('Could not share'));
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccessToast('Link copied to clipboard');
    }
  };

  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) : null;
  const isEmpty = !loading && !error && lists.length === 0;

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Saved Lists | Carryofy</title>
        <meta name="description" content="Save products for later, create shopping lists, or build procurement templates on Carryofy." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BuyerLayout>
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-white text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Bookmark className="w-8 h-8 text-[#FF6B00]" />
                Saved Lists
              </h1>
              <p className="text-[#ffcc99] text-base md:text-lg">
                Save products for later, create shopping lists, or build procurement templates
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#ff8533] transition"
            >
              <Plus className="w-5 h-5" />
              Create New List
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B00]" />
              <p className="text-[#ffcc99] mt-4">Loading saved lists...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center mb-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={fetchWishlist} className="px-6 py-2 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#cc5200] transition">
                Try Again
              </button>
            </div>
          )}

          {/* Individual List View */}
          {!loading && selectedList && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedListId(null)}
                  className="flex items-center gap-1 text-[#ffcc99] hover:text-white transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <span className="text-[#ffcc99]/60">/</span>
                <span className="text-white font-semibold">{selectedList.name}</span>
                <button
                  onClick={handleShareList}
                  className="ml-auto flex items-center gap-2 px-4 py-2 border border-[#FF6B00]/50 text-[#FF6B00] rounded-lg font-semibold hover:bg-[#FF6B00]/10 transition"
                >
                  <Share2 className="w-4 h-4" />
                  Share List
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {selectedList.products.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <Package className="w-16 h-16 text-[#ffcc99]/30 mb-4" />
                    <p className="text-[#ffcc99] mb-2">This list is empty</p>
                    <p className="text-[#ffcc99]/70 text-sm mb-4">Save products while browsing to add them here</p>
                    <Link
                      href="/buyer/products"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-black rounded-lg font-semibold hover:bg-[#ff8533] transition"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Browse Products
                    </Link>
                  </div>
                ) : selectedList.products.map((product) => (
                  <article
                    key={product.id}
                    className="group bg-[#1A1A1A] border border-[#2a2a2a] rounded-xl overflow-hidden hover:border-[#FF6B00]/50 transition-all duration-300 flex flex-col"
                  >
                    <Link href={`/buyer/products/${product.id}`} className="flex flex-col flex-1">
                      <div className="aspect-square bg-[#111111] relative overflow-hidden">
                        {product.images?.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#ffcc99]/30">
                            <Package className="w-14 h-14" />
                          </div>
                        )}
                        {product.quantity === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-red-400 font-semibold text-sm">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover:text-[#FF6B00] transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-[#ffcc99] text-xs truncate mb-1">{product.seller?.businessName || 'Seller'}</p>
                        <p className="text-[#FF6B00] font-bold text-lg">{formatPrice(product.price)}</p>
                      </div>
                    </Link>
                    <div className="p-4 pt-0 flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleRemoveFromList(product.id)}
                        disabled={removingItems[product.id]}
                        className="flex items-center gap-1 px-3 py-2 text-red-400 text-sm border border-red-500/30 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                        title="Remove from list"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={product.quantity === 0}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#FF6B00] text-black text-sm font-bold rounded-lg hover:bg-[#ff8533] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                      <Link
                        href={`/buyer/bulk-order`}
                        className="flex items-center gap-1 px-3 py-2 border border-[#FF6B00]/50 text-[#FF6B00] text-sm font-semibold rounded-lg hover:bg-[#FF6B00]/10"
                      >
                        <Layers className="w-4 h-4" />
                        Bulk Order
                      </Link>
                    </div>
                  </article>
                ))
                }
              </div>
            </div>
          )}

          {/* List Management View */}
          {!loading && !selectedList && !isEmpty && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-xl overflow-hidden hover:border-[#FF6B00]/60 transition flex flex-col"
                >
                  {/* Thumbnail collage */}
                  <div className="relative h-32 bg-[#111111] grid grid-cols-2 grid-rows-2 gap-px p-1">
                    {list.products.length === 0 ? (
                      <div className="col-span-2 row-span-2 flex items-center justify-center">
                        <Bookmark className="w-12 h-12 text-[#ffcc99]/20" />
                      </div>
                    ) : (
                      list.products.slice(0, 4).map((p) => (
                        <div key={p.id} className="relative aspect-square overflow-hidden bg-[#1a1a1a]">
                          {p.images?.[0] ? (
                            <Image src={p.images[0]} alt="" fill sizes="120px" className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package className="w-8 h-8 text-[#ffcc99]/30" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {editingListId === list.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-[#111111] border border-[#FF6B00]/50 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveListName(list.id)}
                            className="px-3 py-1.5 bg-[#FF6B00] text-black text-sm font-bold rounded-lg"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-white font-bold text-lg truncate flex-1">{list.name}</h3>
                          <button
                            onClick={() => {
                              setEditingListId(list.id);
                              setEditName(list.name);
                            }}
                            className="p-1.5 text-[#ffcc99]/60 hover:text-[#FF6B00] rounded transition"
                            title="Edit list name"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <span
                      className={`inline-flex self-start px-2 py-0.5 rounded text-xs font-semibold mb-2 ${
                        list.type === 'personal'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {list.type === 'personal' ? 'Personal' : 'Business'}
                    </span>

                    <p className="text-[#ffcc99]/70 text-sm mb-3">
                      {list.products.length} product{list.products.length !== 1 ? 's' : ''} · Updated {formatDate(list.updatedAt)}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedListId(list.id)}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B00] text-black rounded-lg font-bold hover:bg-[#ff8533] transition"
                      >
                        View List
                      </button>
                      <button
                        onClick={() => handleAddAllToCart(list)}
                        className="flex items-center justify-center gap-1 px-4 py-2.5 border border-[#FF6B00] text-[#FF6B00] rounded-lg font-semibold hover:bg-[#FF6B00]/10 transition"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart (All)
                      </button>
                      <Link
                        href="/buyer/bulk-order"
                        className="flex items-center justify-center gap-1 px-4 py-2.5 border border-[#FF6B00]/50 text-[#ffcc99] rounded-lg font-semibold hover:bg-[#FF6B00]/10 transition"
                      >
                        <Layers className="w-4 h-4" />
                        Convert to Bulk Order
                      </Link>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && isEmpty && (
            <div className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-2xl p-12 text-center max-w-xl mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center">
                <Bookmark className="w-12 h-12 text-[#FF6B00]" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">No saved lists yet</h2>
              <p className="text-[#ffcc99] mb-8">
                Save products as you browse — for personal shopping or business procurement
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/buyer/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#ff8533] transition"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Start Browsing
                </Link>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#FF6B00] text-[#FF6B00] rounded-xl font-bold hover:bg-[#FF6B00]/10 transition"
                >
                  <Plus className="w-5 h-5" />
                  Create a List
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create New List Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="w-full max-w-md bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-2xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-xl font-bold">Create New List</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-[#ffcc99]/60 hover:text-white rounded-lg transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">List name</label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. Groceries, Office supplies"
                    className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:border-[#FF6B00]"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[#ffcc99] text-sm font-medium mb-2">List type</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setNewListType('personal')}
                      className={`flex-1 px-4 py-3 rounded-xl border font-medium transition ${
                        newListType === 'personal'
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                          : 'bg-[#111111] border-[#2a2a2a] text-[#ffcc99] hover:border-[#FF6B00]/30'
                      }`}
                    >
                      Personal
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewListType('business')}
                      className={`flex-1 px-4 py-3 rounded-xl border font-medium transition ${
                        newListType === 'business'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-[#111111] border-[#2a2a2a] text-[#ffcc99] hover:border-[#FF6B00]/30'
                      }`}
                    >
                      Business
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-[#2a2a2a] text-[#ffcc99] rounded-xl font-semibold hover:bg-[#2a2a2a] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateList}
                  className="flex-1 px-4 py-3 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#ff8533] transition"
                >
                  Create List
                </button>
              </div>
            </div>
          </div>
        )}
      </BuyerLayout>
    </>
  );
}
