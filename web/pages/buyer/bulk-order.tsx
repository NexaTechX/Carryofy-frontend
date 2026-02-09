import { useState, useCallback } from 'react';
import BuyerLayout from '../../components/buyer/BuyerLayout';
import SEO from '../../components/seo/SEO';
import { useAuth, userManager } from '../../lib/auth';
import apiClient from '../../lib/api/client';
import { useCart } from '../../lib/contexts/CartContext';
import { Plus, Trash2, ShoppingCart, Loader2, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import Link from 'next/link';

interface BulkItem {
    id: string; // SKU/Product ID
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
    const [items, setItems] = useState<BulkItem[]>([{ id: '', quantity: 10 }]);
    const [validating, setValidating] = useState(false);
    const [validatedItems, setValidatedItems] = useState<ValidatedItem[] | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [addingToCart, setAddingToCart] = useState(false);

    const handleItemChange = (index: number, field: keyof BulkItem, value: string | number) => {
        const newItems = [...items];
        if (field === 'quantity') {
            newItems[index].quantity = Math.max(1, Number(value));
        } else {
            newItems[index].id = String(value);
        }
        setItems(newItems);
        setValidatedItems(null); // Reset validation on change
    };

    const addItemRow = () => {
        setItems([...items, { id: '', quantity: 10 }]);
    };

    const removeItemRow = (index: number) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
            setValidatedItems(null);
        }
    };

    const validateOrder = async () => {
        // Basic frontend validation
        const filledItems = items.filter(i => i.id.trim() !== '');
        if (filledItems.length === 0) {
            setValidationError('Please enter at least one Product ID/SKU.');
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
            setValidationError(err.response?.data?.message || 'Failed to validate items. Please check IDs.');
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
                    Enter Product IDs and quantities to order quickly. Tiered pricing is applied automatically.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Section */}
                    <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Order Items</h2>
                            <button
                                onClick={() => setItems([{ id: '', quantity: 10 }])}
                                className="text-xs text-[#ffcc99]/70 hover:text-[#ff6600]"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="grid grid-cols-12 gap-2 text-sm text-[#ffcc99]/70 font-medium px-2">
                                <div className="col-span-8">Product ID / SKU</div>
                                <div className="col-span-3">Quantity</div>
                                <div className="col-span-1"></div>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-8">
                                        <input
                                            type="text"
                                            value={item.id}
                                            onChange={(e) => handleItemChange(index, 'id', e.target.value)}
                                            placeholder="e.g. prod_chk2..."
                                            className="w-full bg-black border border-[#ff6600]/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff6600] text-sm font-mono"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            className="w-full bg-black border border-[#ff6600]/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ff6600] text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        {items.length > 1 && (
                                            <button
                                                onClick={() => removeItemRow(index)}
                                                className="text-red-400 hover:text-red-300 p-1"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={addItemRow}
                                className="flex items-center gap-2 px-4 py-2 bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/30 rounded-xl hover:bg-[#ff6600]/20 transition text-sm font-bold"
                            >
                                <Plus className="w-4 h-4" /> Add Row
                            </button>

                            <button
                                onClick={validateOrder}
                                disabled={validating}
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
