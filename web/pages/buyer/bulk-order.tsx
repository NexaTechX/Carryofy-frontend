import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import SEO from '../../components/seo/SEO';
import { useAuth } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { useCart } from '../../lib/contexts/CartContext';
import {
  Layers,
  Trash2,
  ShoppingCart,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  ShieldCheck,
  FileSpreadsheet,
  Plus,
  Minus,
  FileText,
} from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface SearchProduct {
  id: string;
  title: string;
  price?: number;
  images?: string[];
  seller?: { id: string; businessName: string; isVerified?: boolean };
  moq?: number;
}

interface BulkItem {
  id: string;
  title: string;
  quantity: number;
  priceKobo?: number;
  moq?: number;
  seller?: { businessName: string; isVerified?: boolean };
  images?: string[];
}

interface ValidatedItem {
  productId: string;
  title: string;
  priceKobo: number;
  totalKobo: number;
  quantity: number;
  moq: number;
  availableStock: number;
  error?: string;
}

const STEPS = [
  { id: 1, label: 'Build Your List', short: 'List' },
  { id: 2, label: 'Verify & Price', short: 'Verify' },
  { id: 3, label: 'Checkout or Request Quote', short: 'Checkout' },
];

export default function BulkOrderPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState<BulkItem[]>([]);
  const [validating, setValidating] = useState(false);
  const [validatedItems, setValidatedItems] = useState<ValidatedItem[] | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const currentStep = validatedItems ? 3 : items.length > 0 ? 2 : 1;

  const fetchSearchResults = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiClient.get('/products', {
        params: { search: q.trim(), limit: 15, inStockOnly: true, b2bOnly: true },
      });
      const data = res.data?.data ?? res.data;
      const list = data?.products ?? data?.items ?? (Array.isArray(data) ? data : []);
      setSearchResults(Array.isArray(list) ? list : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchSearchResults(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, fetchSearchResults]);

  const addProductToList = (product: SearchProduct | Partial<BulkItem>, defaultQty?: number) => {
    const id = ('id' in product ? product.id : undefined) ?? '';
    const title = 'title' in product ? (product.title ?? 'Unknown') : 'Unknown';
    const moq = 'moq' in product ? (product.moq ?? 1) : 1;
    const qty = defaultQty ?? moq ?? 10;
    if (items.some((i) => i.id === id)) return;
    setItems((prev) => [
      ...prev,
      {
        id,
        title,
        quantity: Math.max(qty, moq),
        priceKobo: 'priceKobo' in product ? product.priceKobo : ('price' in product && product.price ? product.price : undefined),
        moq,
        seller: 'seller' in product ? product.seller : undefined,
        images: 'images' in product ? product.images : undefined,
      },
    ]);
    setValidatedItems(null);
    setSearchQuery('');
    setSearchResults([]);
    setSearchDropdownOpen(false);
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const newItems = [...items];
    const item = newItems[index];
    const moq = item.moq ?? 1;
    const newQty = Math.max(moq, item.quantity + delta);
    newItems[index].quantity = newQty;
    setItems(newItems);
    setValidatedItems(null);
  };

  const handleQuantityInput = (index: number, value: number) => {
    const newItems = [...items];
    const moq = newItems[index].moq ?? 1;
    newItems[index].quantity = Math.max(moq, value);
    setItems(newItems);
    setValidatedItems(null);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setValidatedItems(null);
  };

  const validateOrder = async () => {
    const filledItems = items.filter((i) => i.id.trim() !== '');
    if (filledItems.length === 0) {
      setValidationError('Please add at least one product using the search above.');
      return;
    }

    try {
      setValidating(true);
      setValidationError(null);
      const response = await apiClient.post(
        '/bulk-orders/validate',
        filledItems.map((i) => ({ productId: i.id.trim(), quantity: i.quantity }))
      );
      const data = response.data?.items ? response.data : response.data?.data;
      if (data && Array.isArray(data.items)) {
        setValidatedItems(data.items);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setValidationError(e?.response?.data?.message || 'Failed to validate items. Please try again.');
      setValidatedItems(null);
    } finally {
      setValidating(false);
    }
  };

  const proceedToCheckout = async () => {
    if (!validatedItems) {
      validateOrder();
      return;
    }
    const validItems = validatedItems.filter((i) => !i.error && i.priceKobo > 0);
    if (validItems.length === 0) {
      showErrorToast('No valid items to add. Please verify your list first.');
      return;
    }
    try {
      setAddingToCart(true);
      let successCount = 0;
      for (const item of validItems) {
        try {
          await addToCart(item.productId, item.quantity);
          successCount++;
        } catch {
          // continue
        }
      }
      showSuccessToast(`Added ${successCount} items to cart!`);
      router.push('/buyer/checkout');
    } catch {
      showErrorToast('Failed to add items to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const requestQuote = () => {
    if (!validatedItems && items.length > 0) {
      validateOrder();
      return;
    }
    router.push('/buyer/quotes?from=bulk');
  };

  const formatPrice = (priceKobo: number) => {
    return `₦${(priceKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const lineTotal = (item: BulkItem) => {
    const price = validatedItems
      ? validatedItems.find((v) => v.productId === item.id)?.priceKobo
      : item.priceKobo;
    return price ? price * item.quantity : 0;
  };

  const subtotal =
    validatedItems?.reduce((sum, i) => sum + (i.totalKobo || 0), 0) ??
    items.reduce((sum, i) => sum + lineTotal(i), 0);

  const canVerify = items.length > 0;
  const hasErrors = validatedItems?.some((i) => !!i.error) ?? false;
  const discountPercent = items.length >= 5 ? 10 : items.length >= 3 ? 5 : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);

  if (authLoading) {
    return (
      <BuyerLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
        </div>
      </BuyerLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <BuyerLayout>
        <SEO title="Restricted Access | Carryofy" description="Please sign in to place bulk orders." />
        <div className="max-w-md mx-auto my-20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Sign in required</h1>
          <p className="text-[#ffcc99] mb-6">Please sign in to place bulk orders.</p>
          <Link
            href="/auth/login?redirect=/buyer/bulk-order"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#ff8533] transition"
          >
            Sign In
          </Link>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <SEO
        title="Bulk Order | Carryofy"
        description="Add multiple products, set quantities, and get wholesale pricing automatically."
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <h1 className="text-3xl font-bold text-white">Bulk Order</h1>
          </div>
          <p className="text-[#ffcc99]/80 text-base mb-6">
            Add multiple products, set quantities, and get wholesale pricing automatically.
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-[#FF6B00] text-black'
                      : 'bg-[#1a1a1a] text-[#ffcc99]/60 border border-[#2a2a2a]'
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.short}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <span className="text-[#ffcc99]/40 text-xs">→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Product List Builder */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 sm:p-6">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffcc99]/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchDropdownOpen(true);
                  }}
                  onFocus={() => setSearchDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setSearchDropdownOpen(false), 200)}
                  placeholder="Search wholesale products by name or SKU"
                  className="w-full pl-11 pr-4 py-3 bg-[#111111] border border-[#2a2a2a] rounded-xl text-white placeholder:text-[#ffcc99]/50 text-sm focus:outline-none focus:border-[#FF6B00]/50 transition-colors"
                />
                {searchDropdownOpen && (searchQuery.length >= 2 || searchResults.length > 0) && (
                  <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-xl z-20">
                    {searching ? (
                      <div className="p-6 flex items-center justify-center gap-2 text-[#ffcc99]">
                        <Loader2 className="w-5 h-5 animate-spin" /> Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-[#ffcc99]/70 text-sm">No wholesale products found. Try a different search.</div>
                    ) : (
                      searchResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addProductToList({
                              id: p.id,
                              title: p.title,
                              priceKobo: p.price != null ? p.price : undefined,
                              moq: p.moq ?? 1,
                              seller: p.seller,
                              images: p.images,
                            });
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[#FF6B00]/10 border-b border-[#2a2a2a]/50 last:border-0 flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
                            {p.images?.[0] ? (
                              <Image src={p.images[0]} alt="" width={48} height={48} className="object-cover w-full h-full" />
                            ) : (
                              <span className="text-[#ffcc99]/30 text-xs">—</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{p.title}</p>
                            <p className="text-[#ffcc99]/70 text-xs">
                              {p.seller?.businessName ?? 'Seller'}
                              {p.moq && p.moq > 0 ? ` · MOQ ${p.moq}` : ''}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[#FF6B00] font-semibold text-sm">
                              {p.price != null ? formatPrice(p.price) : '—'}
                            </p>
                            <span className="text-[#FF6B00] text-xs font-medium">Add</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-[#ffcc99]/50">
                <button type="button" className="hover:text-[#FF6B00] transition inline-flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3" /> Import from CSV
                </button>
                {' '}— for power B2B buyers
              </p>

              <div className="flex justify-between items-center mb-4 mt-6">
                <h2 className="text-lg font-bold text-white">Your List</h2>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setItems([]); setValidatedItems(null); }}
                    className="text-xs text-[#ffcc99]/70 hover:text-[#FF6B00] transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="py-16 text-center rounded-xl border-2 border-dashed border-[#2a2a2a] bg-[#111111]/50">
                  <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-[#FF6B00]/60" />
                  </div>
                  <p className="text-white font-semibold mb-1">Your bulk list is empty</p>
                  <p className="text-[#ffcc99]/70 text-sm mb-4">Search for products above or browse wholesale catalogue</p>
                  <Link
                    href="/buyer/products?b2bOnly=true"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B00]/20 text-[#FF6B00] rounded-lg text-sm font-medium hover:bg-[#FF6B00]/30 transition"
                  >
                    Browse Wholesale Products
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-[#111111] border border-[#2a2a2a] hover:border-[#FF6B00]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-lg bg-[#1a1a1a] shrink-0 overflow-hidden flex items-center justify-center">
                          {item.images?.[0] ? (
                            <Image src={item.images[0]} alt="" width={56} height={56} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-[#ffcc99]/20 text-xs">—</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm line-clamp-2">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[#ffcc99]/70 text-xs">{item.seller?.businessName ?? 'Seller'}</span>
                            {item.seller?.isVerified !== false && (
                              <span className="inline-flex items-center gap-0.5 text-green-400 text-[10px]">
                                <ShieldCheck className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-[#ffcc99]/60 text-xs mt-0.5">
                            {item.priceKobo ? formatPrice(item.priceKobo) : '—'}/unit
                            {item.moq && item.moq > 0 ? ` · MOQ ${item.moq}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <div className="flex items-center rounded-lg border border-[#2a2a2a] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, -1)}
                            disabled={item.quantity <= (item.moq ?? 1)}
                            className="w-9 h-9 flex items-center justify-center text-[#ffcc99] hover:bg-[#FF6B00]/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={item.moq ?? 1}
                            value={item.quantity}
                            onChange={(e) => handleQuantityInput(index, parseInt(e.target.value, 10) || (item.moq ?? 1))}
                            className="w-14 h-9 bg-transparent text-white text-center text-sm focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(index, 1)}
                            className="w-9 h-9 flex items-center justify-center text-[#ffcc99] hover:bg-[#FF6B00]/20 hover:text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-[#FF6B00] font-semibold text-sm w-20 text-right">
                          {lineTotal(item) ? formatPrice(lineTotal(item)) : '—'}
                        </span>
                        <button
                          onClick={() => removeItemRow(index)}
                          className="p-2 text-[#ffcc99]/60 hover:text-red-400 transition"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={validateOrder}
                    disabled={validating || !canVerify}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#ff8533] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Verify & Price
                  </button>
                </div>
              )}

              {validationError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {validationError}
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary (sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-[#ffcc99]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{subtotal ? formatPrice(subtotal) : '—'}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <span className="text-green-400 text-sm font-medium">
                      {discountPercent}% bulk discount applied
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[#ffcc99]/70 text-sm">
                  <span>Delivery estimate</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] my-4" />

              <div className="space-y-3">
                <button
                  onClick={proceedToCheckout}
                  disabled={addingToCart || hasErrors || !!(validatedItems && validatedItems.every((i) => i.error))}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B00] text-black rounded-xl font-bold hover:bg-[#ff8533] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                  Proceed to Checkout
                </button>
                <button
                  onClick={requestQuote}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[#FF6B00]/50 text-[#FF6B00] rounded-xl font-semibold hover:bg-[#FF6B00]/10 transition"
                >
                  <FileText className="w-4 h-4" />
                  Request Quote Instead
                </button>
              </div>

              <p className="mt-4 text-[#ffcc99]/50 text-xs">
                Prices are verified at checkout. Final pricing may vary based on seller confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
