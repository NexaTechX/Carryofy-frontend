import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
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
  ListPlus,
} from 'lucide-react';
import { removeFromWishlist, WishlistItem } from '../../lib/api/wishlist';
import { useWishlist } from '../../lib/hooks/useWishlist';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import { useCart } from '../../lib/contexts/CartContext';
import type { ShopProductCardProduct } from '../../components/buyer/shop/ShopProductCard';

type ListType = 'personal' | 'business';

const CUSTOM_LISTS_STORAGE_KEY = 'carryofy-custom-saved-lists';
/** API wishlist is shown as this list (id must stay `personal` for storage helpers). */
const PERSONAL_LIST_ID = 'personal';
const PERSONAL_LIST_NAME = 'Saved for later';

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
  const custom = lists.filter((l) => l.id !== PERSONAL_LIST_ID);
  localStorage.setItem(CUSTOM_LISTS_STORAGE_KEY, JSON.stringify(custom));
}

function isPersonalList(listId: string) {
  return listId === PERSONAL_LIST_ID;
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
  const { items, loading, initialized, loadError, refreshWishlist, replaceWishlistItems } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [lists, setLists] = useState<SavedList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<{ [key: string]: boolean }>({});
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListType, setNewListType] = useState<ListType>('personal');
  const [addAllForListId, setAddAllForListId] = useState<string | null>(null);
  const [clearingPersonal, setClearingPersonal] = useState(false);

  const customListsForSelect = lists.filter((l) => !isPersonalList(l.id));

  const syncListInUrl = useCallback(
    (listId: string | null) => {
      if (!router.isReady) return;
      if (listId) {
        void router.replace({ pathname: '/buyer/wishlist', query: { list: listId } }, undefined, { shallow: true });
      } else {
        void router.replace({ pathname: '/buyer/wishlist' }, undefined, { shallow: true });
      }
    },
    [router]
  );

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
    if (!initialized) return;
    const personalProducts = items.map(wishlistItemToProduct);
    const personalList: SavedList[] = [
      {
        id: PERSONAL_LIST_ID,
        name: PERSONAL_LIST_NAME,
        type: 'personal',
        products: personalProducts,
        updatedAt: items[0]?.createdAt || new Date().toISOString(),
      },
    ];
    const customLists = loadCustomLists();
    setLists([...personalList, ...customLists]);
  }, [initialized, items]);

  useEffect(() => {
    if (!mounted || !initialized || loading || !router.isReady) return;
    const q = router.query.list;
    if (typeof q !== 'string' || !q) return;
    if (lists.some((l) => l.id === q)) {
      setSelectedListId(q);
    }
  }, [mounted, initialized, loading, router.isReady, router.query.list, lists]);

  useEffect(() => {
    if (!showCreateModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCreateModal]);

  const handleRemoveFromList = async (productId: string, listId: string) => {
    if (isPersonalList(listId)) {
      try {
        setRemovingItems((prev) => ({ ...prev, [productId]: true }));
        const res = await removeFromWishlist(productId);
        replaceWishlistItems(res.items || []);
        showSuccessToast('Removed from saved list');
      } catch (err: any) {
        console.error('Error removing:', err);
        showErrorToast(err.response?.data?.message || 'Failed to remove');
      } finally {
        setRemovingItems((prev) => ({ ...prev, [productId]: false }));
      }
      return;
    }

    setRemovingItems((prev) => ({ ...prev, [productId]: true }));
    try {
      setLists((prev) => {
        const next = prev.map((list) =>
          list.id === listId ? { ...list, products: list.products.filter((p) => p.id !== productId), updatedAt: new Date().toISOString() } : list
        );
        saveCustomLists(next);
        return next;
      });
      showSuccessToast('Removed from list');
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

  const handleAddAllToCart = async (list: SavedList) => {
    const eligible = list.products.filter((p) => p.quantity > 0);
    if (eligible.length === 0) {
      showErrorToast('No in-stock items in this list');
      return;
    }
    setAddAllForListId(list.id);
    let ok = 0;
    try {
      for (const p of eligible) {
        const success = await addToCart(p.id);
        if (success) ok += 1;
      }
      if (ok === eligible.length) {
        showSuccessToast(`Added ${ok} item${ok !== 1 ? 's' : ''} to cart`);
      } else if (ok > 0) {
        showSuccessToast(`Added ${ok} of ${eligible.length} item${eligible.length !== 1 ? 's' : ''} to cart`);
      } else {
        showErrorToast('Could not add items to cart');
      }
    } finally {
      setAddAllForListId(null);
    }
  };

  const copyProductToCustomList = (targetListId: string, product: ShopProductCardProduct) => {
    setLists((prev) => {
      const target = prev.find((l) => l.id === targetListId);
      if (!target || isPersonalList(target.id)) {
        return prev;
      }
      if (target.products.some((p) => p.id === product.id)) {
        showErrorToast('Already in that list');
        return prev;
      }
      showSuccessToast(`Copied to "${target.name}"`);
      const next = prev.map((l) =>
        l.id === targetListId
          ? {
              ...l,
              products: [...l.products.filter((p) => p.id !== product.id), product],
              updatedAt: new Date().toISOString(),
            }
          : l
      );
      saveCustomLists(next);
      return next;
    });
  };

  const handleClearPersonalList = async () => {
    const personal = lists.find((l) => isPersonalList(l.id));
    const ids = personal?.products.map((p) => p.id) ?? [];
    if (ids.length === 0) return;
    if (!window.confirm(`Remove all ${ids.length} saved product${ids.length !== 1 ? 's' : ''} from your account?`)) return;
    setClearingPersonal(true);
    try {
      let last: WishlistItem[] = [];
      for (const id of ids) {
        try {
          const res = await removeFromWishlist(id);
          last = res.items || [];
        } catch (e) {
          console.error(e);
        }
      }
      replaceWishlistItems(last);
      showSuccessToast('Saved list cleared');
    } finally {
      setClearingPersonal(false);
    }
  };

  const handleDeleteList = (listId: string) => {
    if (isPersonalList(listId)) return;
    setLists((prev) => {
      const next = prev.filter((l) => l.id !== listId);
      saveCustomLists(next);
      return next;
    });
    if (selectedListId === listId) {
      setSelectedListId(null);
      syncListInUrl(null);
    }
    showSuccessToast('List deleted');
  };

  const handleSaveListName = (listId: string) => {
    if (isPersonalList(listId)) {
      setEditingListId(null);
      setEditName('');
      return;
    }
    setLists((prev) => {
      const next = prev.map((l) =>
        l.id === listId ? { ...l, name: editName.trim() || l.name, updatedAt: new Date().toISOString() } : l
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
    const list = lists.find((l) => l.id === selectedListId);
    if (!list || !selectedListId) return;
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/buyer/wishlist?list=${encodeURIComponent(selectedListId)}`
        : '';
    if (navigator.share) {
      navigator
        .share({
          title: `${list.name} - Carryofy`,
          text: `Open my Carryofy list: ${list.name}`,
          url: shareUrl,
        })
        .then(() => showSuccessToast('List shared'))
        .catch(() => {
          void navigator.clipboard.writeText(shareUrl).then(
            () => showSuccessToast('Link copied'),
            () => showErrorToast('Could not share or copy')
          );
        });
    } else {
      void navigator.clipboard.writeText(shareUrl).then(
        () => showSuccessToast('Link copied to clipboard'),
        () => showErrorToast('Could not copy link')
      );
    }
  };

  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) : null;
  const personalRow = lists.find((l) => isPersonalList(l.id));
  const hasCustomLists = lists.some((l) => !isPersonalList(l.id));
  const isEmpty =
    initialized &&
    !loading &&
    !loadError &&
    (personalRow ? personalRow.products.length === 0 : true) &&
    !hasCustomLists;

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
              <p className="text-[#ffcc99] text-base md:text-lg max-w-2xl">
                Tap the heart while shopping to add items to <span className="text-white font-medium">Saved for later</span>.
                Create named lists for projects or repeat orders, then copy products from your main saved list into them.
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
          {(!initialized || loading) && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B00]" />
              <p className="text-[#ffcc99] mt-4">Loading saved lists...</p>
            </div>
          )}

          {/* Error */}
          {loadError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center mb-8">
              <p className="text-red-400 mb-4">{loadError}</p>
              <button
                type="button"
                onClick={() => void refreshWishlist()}
                className="px-6 py-2 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#cc5200] transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Individual List View */}
          {initialized && !loading && !loadError && selectedList && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedListId(null);
                    syncListInUrl(null);
                  }}
                  className="flex items-center gap-1 text-[#ffcc99] hover:text-white transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <span className="text-[#ffcc99]/60">/</span>
                <span className="text-white font-semibold">{selectedList.name}</span>
                {isPersonalList(selectedList.id) && selectedList.products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleClearPersonalList()}
                    disabled={clearingPersonal}
                    className="px-3 py-2 text-sm text-red-400/90 border border-red-500/40 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {clearingPersonal ? 'Clearing…' : 'Clear all'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleShareList}
                  className="ml-auto flex items-center gap-2 px-4 py-2 border border-[#FF6B00]/50 text-[#FF6B00] rounded-lg font-semibold hover:bg-[#FF6B00]/10 transition"
                >
                  <Share2 className="w-4 h-4" />
                  Share list link
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {selectedList.products.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <Package className="w-16 h-16 text-[#ffcc99]/30 mb-4" />
                    <p className="text-[#ffcc99] mb-2">This list is empty</p>
                    <p className="text-[#ffcc99]/70 text-sm mb-4 max-w-md mx-auto">
                      {isPersonalList(selectedList.id)
                        ? 'Use the heart on product cards while you shop — items appear here on your account.'
                        : 'Copy products from Saved for later into this list, or remove items you no longer need here.'}
                    </p>
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
                    <div className="p-4 pt-0 flex flex-col gap-2">
                      {isPersonalList(selectedList.id) && customListsForSelect.length > 0 && (
                        <label className="flex items-center gap-2 text-xs text-[#ffcc99]/80">
                          <ListPlus className="w-3.5 h-3.5 shrink-0 text-[#FF6B00]" />
                          <span className="sr-only">Copy to named list</span>
                          <select
                            aria-label="Copy product to a named list"
                            className="flex-1 min-w-0 bg-[#111111] border border-[#2a2a2a] rounded-lg px-2 py-2 text-white text-xs focus:outline-none focus:border-[#FF6B00]"
                            defaultValue=""
                            onChange={(e) => {
                              const v = e.target.value;
                              e.target.value = '';
                              if (v) copyProductToCustomList(v, product);
                            }}
                          >
                            <option value="">Copy to named list…</option>
                            {customListsForSelect.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromList(product.id, selectedList.id)}
                          disabled={removingItems[product.id]}
                          className="flex items-center gap-1 px-3 py-2 text-red-400 text-sm border border-red-500/30 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                          title={isPersonalList(selectedList.id) ? 'Remove from account saved list' : 'Remove from this list'}
                        >
                          <Trash2 className="w-4 h-4" />
                          {isPersonalList(selectedList.id) ? 'Unsave' : 'Remove'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleAddToCart(product.id)}
                          disabled={product.quantity === 0}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#FF6B00] text-black text-sm font-bold rounded-lg hover:bg-[#ff8533] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                        <Link
                          href="/buyer/bulk-order"
                          className="flex items-center gap-1 px-3 py-2 border border-[#FF6B00]/50 text-[#FF6B00] text-sm font-semibold rounded-lg hover:bg-[#FF6B00]/10"
                        >
                          <Layers className="w-4 h-4" />
                          Bulk Order
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
                }
              </div>
            </div>
          )}

          {/* List Management View */}
          {initialized && !loading && !loadError && !selectedList && !isEmpty && (
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
                          {!isPersonalList(list.id) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingListId(list.id);
                                setEditName(list.name);
                              }}
                              className="p-1.5 text-[#ffcc99]/60 hover:text-[#FF6B00] rounded transition"
                              title="Edit list name"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
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
                      {isPersonalList(list.id) ? 'Account sync' : list.type === 'personal' ? 'Personal' : 'Business'}
                    </span>

                    <p className="text-[#ffcc99]/70 text-sm mb-3">
                      {list.products.length} product{list.products.length !== 1 ? 's' : ''} · Updated {formatDate(list.updatedAt)}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedListId(list.id);
                          syncListInUrl(list.id);
                        }}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B00] text-black rounded-lg font-bold hover:bg-[#ff8533] transition"
                      >
                        View List
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleAddAllToCart(list)}
                        disabled={addAllForListId === list.id}
                        className="flex items-center justify-center gap-1 px-4 py-2.5 border border-[#FF6B00] text-[#FF6B00] rounded-lg font-semibold hover:bg-[#FF6B00]/10 transition disabled:opacity-50"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {addAllForListId === list.id ? 'Adding…' : 'Add to Cart (All)'}
                      </button>
                      <Link
                        href="/buyer/bulk-order"
                        className="flex items-center justify-center gap-1 px-4 py-2.5 border border-[#FF6B00]/50 text-[#ffcc99] rounded-lg font-semibold hover:bg-[#FF6B00]/10 transition"
                      >
                        <Layers className="w-4 h-4" />
                        Convert to Bulk Order
                      </Link>
                      {!isPersonalList(list.id) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteList(list.id)}
                          className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {initialized && !loading && !loadError && isEmpty && (
            <div className="bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-2xl p-12 text-center max-w-xl mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center">
                <Bookmark className="w-12 h-12 text-[#FF6B00]" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">No saved lists yet</h2>
              <p className="text-[#ffcc99] mb-8 max-w-md mx-auto">
                Tap the heart on any product to build your account list, then create named lists and copy items into them for quotes or repeat buying.
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
            role="presentation"
          >
            <div
              className="w-full max-w-md bg-[#1a1a1a] border border-[#FF6B00]/30 rounded-2xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-list-title"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 id="create-list-title" className="text-white text-xl font-bold">
                  Create New List
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-[#ffcc99]/60 hover:text-white rounded-lg transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateList();
                }}
              >
                <div>
                  <label htmlFor="new-list-name" className="block text-[#ffcc99] text-sm font-medium mb-2">
                    List name
                  </label>
                  <input
                    id="new-list-name"
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. Groceries, Office supplies"
                    className="w-full px-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#ffcc99]/50 focus:outline-none focus:border-[#FF6B00]"
                    autoFocus
                  />
                </div>
                <div>
                  <span className="block text-[#ffcc99] text-sm font-medium mb-2">List type</span>
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
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 border border-[#2a2a2a] text-[#ffcc99] rounded-xl font-semibold hover:bg-[#2a2a2a] transition"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#ff8533] transition">
                    Create List
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </BuyerLayout>
    </>
  );
}
