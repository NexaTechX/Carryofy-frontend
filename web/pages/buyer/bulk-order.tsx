import { useState, useCallback, useEffect } from 'react';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import SEO from '../../components/seo/SEO';
import { useAuth } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { useCart } from '../../lib/contexts/CartContext';
import { Trash2, ShoppingCart, Loader2, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import Link from 'next/link';

interface SearchProduct {
  id: string;
  title: string;
  price?: number;
  seller?: { id: string; businessName: string };
}

interface BulkItem {
    id: string;
    title?: string; // For display when added from search
    quantity: number;
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

export default function BulkOrderPage() {
    const { isAuthenticated, user, isLoading: authLoading } = useAuth();
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

    const addProductToList = (productId: string, title?: string, defaultQty = 10) => {
        if (items.some((i) => i.id === productId)) return;
        setItems((prev) => [...prev, { id: productId, title: title ?? 'Unknown', quantity: defaultQty }]);
        setValidatedItems(null);
        setSearchQuery('');
        setSearchResults([]);
        setSearchDropdownOpen(false);
    };

    const handleQuantityChange = (index: number, value: number) => {
        const newItems = [...items];
        newItems[index].quantity = Math.max(1, value);
        setItems(newItems);
        setValidatedItems(null);
    };

    const removeItemRow = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        setValidatedItems(null);
    };

    const validateOrder = async () => {
        // Basic frontend validation
        const filledItems = items.filter(i => i.id.trim() !== '');
        if (filledItems.length === 0) {
            setValidationError('Please add at least one product using the search above.');
            return;
        }

        try {
            setValidating(true);
            setValidationError(null);

            const response = await apiClient.post('/bulk-orders/validate', filledItems.map(i => ({
                productId: i.id.trim(),
                quantity: i.quantity
            })));

            const data = response.data?.items ? response.data : response.data?.data;

            if (data && Array.isArray(data.items)) {
                setValidatedItems(data.items);
            } else {
                throw new Error('Invalid response format');
            }

        } catch (err: any) {
            console.error('Validation error:', err);
            setValidationError(err.response?.data?.message || 'Failed to validate items. Please try again.');
            setValidatedItems(null);
        } finally {
            setValidating(false);
        }
    };

    const addAllToCart = async () => {
        if (!validatedItems) return;

        const validItemsToAdd = validatedItems.filter(i => !i.error && i.priceKobo > 0);

        if (validItemsToAdd.length === 0) {
            showErrorToast('No valid items to add to cart.');
            return;
        }

        try {
            setAddingToCart(true);
            // We add items sequentially or parallel. 
            // Context's addToCart typically handles one by one.
            // Ideally we'd have a bulkAddToCart endpoint, but looping works for MVP.

            let successCount = 0;
            for (const item of validItemsToAdd) {
                try {
                    await addToCart(item.productId, item.quantity);
                    successCount++;
                } catch (e) {
                    console.error(`Failed to add ${item.productId}`, e);
                }
            }

            if (successCount === validItemsToAdd.length) {
                showSuccessToast(`Added ${successCount} items to cart!`);
            } else {
                showSuccessToast(`Added ${successCount} of ${validItemsToAdd.length} items to cart.`);
            }

        } catch (err) {
            showErrorToast('Failed to add items to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const formatPrice = (priceKobo: number) => {
        return `₦${(priceKobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    };

    const grandTotal = validatedItems?.reduce((sum, item) => sum + (item.totalKobo || 0), 0) || 0;
    const hasErrors = validatedItems?.some(i => !!i.error);

    if (authLoading) {
        return (
            <BuyerLayout>
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#ff6600] animate-spin" />
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
                    <Link href={`/auth/login?redirect=/buyer/bulk-order`} className="px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold">
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
                description="Place large orders quickly using Product IDs or SKUs. Best for wholesale and business buyers."
            />

            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-2">Bulk Order</h1>
                <p className="text-[#ffcc99] mb-8">
                    Search and add wholesale products below. Tiered pricing is applied automatically for bulk quantities.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#ffcc99] mb-2">Search wholesale products</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ffcc99]/60" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setSearchDropdownOpen(true);
                                    }}
                                    onFocus={() => setSearchDropdownOpen(true)}
                                    onBlur={() => setTimeout(() => setSearchDropdownOpen(false), 200)}
                                    placeholder="Type product name to find and add..."
                                    className="w-full pl-10 pr-4 py-2 bg-black border border-[#ff6600]/30 rounded-lg text-white placeholder-[#ffcc99]/50 text-sm focus:outline-none focus:border-[#ff6600]"
                                />
                                {searchDropdownOpen && (searchQuery.length >= 2 || searchResults.length > 0) && (
                                    <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-[#0d0d0d] border border-[#ff6600]/30 rounded-lg shadow-xl z-10">
                                        {searching ? (
                                            <div className="p-4 text-center text-[#ffcc99] text-sm flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Searching...
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
                                                        addProductToList(p.id, p.title);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-[#ff6600]/10 border-b border-[#ff6600]/10 last:border-0 flex justify-between items-center"
                                                >
                                                    <span className="text-white text-sm truncate pr-2">{p.title}</span>
                                                    <span className="text-[#ff6600] text-xs font-medium shrink-0">Add to list</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Your List</h2>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setItems([])}
                                    className="text-xs text-[#ffcc99]/70 hover:text-[#ff6600]"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="space-y-3 mb-6">
                            {items.length === 0 ? (
                                <div className="py-12 text-center rounded-xl border border-dashed border-[#ff6600]/30 bg-black/30">
                                    <Search className="w-12 h-12 text-[#ff6600]/40 mx-auto mb-3" />
                                    <p className="text-[#ffcc99]/80 text-sm mb-1">Search above to add products</p>
                                    <p className="text-[#ffcc99]/50 text-xs mb-4">Type a product name and click to add to your list</p>
                                    <Link href="/buyer/products?b2bOnly=true" className="text-[#ff6600] hover:text-[#ff9955] text-sm font-medium">
                                        Browse wholesale products
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-12 gap-2 text-sm text-[#ffcc99]/70 font-medium px-2">
                                        <div className="col-span-7">Product</div>
                                        <div className="col-span-4">Quantity</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {items.map((item, index) => (
                                        <div key={`${item.id}-${index}`} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-7">
                                                <div className="bg-black/50 border border-[#ff6600]/20 rounded-lg px-3 py-2 text-white text-sm truncate">
                                                    {item.title || 'Unknown'}
                                                </div>
                                            </div>
                                            <div className="col-span-4">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(index, Math.max(1, parseInt(e.target.value, 10) || 0))}
                                                    className="w-full bg-black border border-[#ff6600]/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff6600] text-sm"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => removeItemRow(index)}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={validateOrder}
                                disabled={validating || items.length === 0}
                                className="ml-auto flex items-center gap-2 px-6 py-2 bg-[#ff6600] text-black rounded-xl font-bold hover:bg-[#cc5200] transition disabled:opacity-50"
                            >
                                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Verify & Price
                            </button>
                        </div>

                        {validationError && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                {validationError}
                            </div>
                        )}
                    </div>

                    {/* Summary Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

                            {!validatedItems ? (
                                <p className="text-[#ffcc99]/60 text-sm text-center py-8">
                                    Enter items and click "Verify & Price" to see totals.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-[#ff6600]/30">
                                        {validatedItems.map((item, i) => (
                                            <div key={i} className={`text-sm p-3 rounded-lg border ${item.error ? 'border-red-500/30 bg-red-500/5' : 'border-[#ff6600]/10 bg-black/40'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`${item.error ? 'text-red-400' : 'text-white'} font-medium truncate w-[70%]`}>
                                                        {item.title}
                                                    </span>
                                                    {!item.error && (
                                                        <span className="text-[#ff6600] font-mono">{formatPrice(item.totalKobo)}</span>
                                                    )}
                                                </div>
                                                {item.error ? (
                                                    <p className="text-red-400 text-xs">{item.error}</p>
                                                ) : (
                                                    <div className="flex justify-between text-[#ffcc99]/60 text-xs">
                                                        <span>Qty: {item.quantity}</span>
                                                        <span>@ {formatPrice(item.priceKobo)}/unit</span>
                                                    </div>
                                                )}
                                                {item.moq > 1 && !item.error && item.quantity < item.moq && (
                                                    <p className="text-yellow-500 text-xs mt-1">Below MOQ: {item.moq}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-[#ff6600]/30 pt-4 mt-2">
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span className="text-white">Total Estimate</span>
                                            <span className="text-[#ff6600]">{formatPrice(grandTotal)}</span>
                                        </div>
                                        {hasErrors && (
                                            <p className="text-red-400 text-xs mt-2 text-right">Some items have errors and won't be added.</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={addAllToCart}
                                        disabled={addingToCart || hasErrors || grandTotal === 0}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-black rounded-xl font-bold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                    >
                                        {addingToCart ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                                        Add Valid Items to Cart
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </BuyerLayout>
    );
}
