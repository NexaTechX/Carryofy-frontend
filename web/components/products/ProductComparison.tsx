import { X, ShoppingCart, Star, Package } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  quantity: number;
  keyFeatures?: string[];
  seller: {
    id: string;
    businessName: string;
  };
}

interface ProductComparisonProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export default function ProductComparison({ products, onRemove, onClear }: ProductComparisonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(products.length > 0);
  }, [products.length]);

  if (products.length === 0) return null;

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getLowestPrice = () => {
    return Math.min(...products.map(p => p.price));
  };

  const getHighestPrice = () => {
    return Math.max(...products.map(p => p.price));
  };

  return (
    <>
      {/* Floating Comparison Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#ff6600] text-black font-bold px-4 py-3 rounded-full shadow-lg hover:bg-[#cc5200] transition flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Compare ({products.length})</span>
        </button>
      </div>

      {/* Comparison Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#ff6600]/30">
              <h2 className="text-white text-2xl font-bold">Compare Products</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClear}
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:border-[#ff6600] transition text-sm"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[#ffcc99] hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${products.length + 1}, minmax(200px, 1fr))` }}>
                {/* Header Row */}
                <div className="sticky left-0 bg-[#1a1a1a] z-10">
                  <div className="font-bold text-[#ffcc99] text-sm mb-4">Features</div>
                </div>
                {products.map((product) => (
                  <div key={product.id} className="border border-[#ff6600]/20 rounded-lg p-4 bg-black/50">
                    <button
                      onClick={() => onRemove(product.id)}
                      className="float-right text-[#ffcc99] hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="clear-both">
                      {/* Product Image */}
                      <div className="aspect-square bg-black rounded-lg overflow-hidden mb-3">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#ffcc99]/50">
                            <Package className="w-12 h-12" />
                          </div>
                        )}
                      </div>

                      {/* Product Title */}
                      <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                        {product.title}
                      </h3>

                      {/* Seller */}
                      <p className="text-[#ffcc99]/60 text-xs mb-3">
                        by {product.seller.businessName}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Price Row */}
                <div className="sticky left-0 bg-[#1a1a1a] z-10 py-2">
                  <div className="font-semibold text-[#ffcc99] text-sm">Price</div>
                </div>
                {products.map((product) => (
                  <div key={`price-${product.id}`} className="py-2">
                    <div className="text-[#ff6600] font-bold text-lg">
                      {formatPrice(product.price)}
                    </div>
                    {product.price === getLowestPrice() && (
                      <span className="text-green-400 text-xs">Best Price</span>
                    )}
                  </div>
                ))}

                {/* Stock Status Row */}
                <div className="sticky left-0 bg-[#1a1a1a] z-10 py-2">
                  <div className="font-semibold text-[#ffcc99] text-sm">Availability</div>
                </div>
                {products.map((product) => (
                  <div key={`stock-${product.id}`} className="py-2">
                    {product.quantity > 0 ? (
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        In Stock ({product.quantity})
                      </span>
                    ) : (
                      <span className="text-red-400 text-sm">Out of Stock</span>
                    )}
                  </div>
                ))}

                {/* Key Features Row */}
                <div className="sticky left-0 bg-[#1a1a1a] z-10 py-2">
                  <div className="font-semibold text-[#ffcc99] text-sm">Key Features</div>
                </div>
                {products.map((product) => (
                  <div key={`features-${product.id}`} className="py-2">
                    {product.keyFeatures && product.keyFeatures.length > 0 ? (
                      <ul className="space-y-1">
                        {product.keyFeatures.map((feature, idx) => (
                          <li key={idx} className="text-[#ffcc99] text-xs flex items-start gap-1">
                            <span className="text-[#ff6600] mt-0.5">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[#ffcc99]/50 text-xs">No features listed</span>
                    )}
                  </div>
                ))}

                {/* Actions Row */}
                <div className="sticky left-0 bg-[#1a1a1a] z-10 py-2">
                  <div className="font-semibold text-[#ffcc99] text-sm">Actions</div>
                </div>
                {products.map((product) => (
                  <div key={`actions-${product.id}`} className="py-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="block w-full px-4 py-2 bg-[#ff6600] text-black font-bold rounded-lg hover:bg-[#cc5200] transition text-center text-sm mb-2"
                    >
                      View Details
                    </Link>
                    {product.quantity > 0 && (
                      <Link
                        href={`/products/${product.id}`}
                        className="block w-full px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-lg hover:border-[#ff6600] transition text-center text-sm"
                      >
                        Add to Cart
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#ff6600]/30 bg-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <div className="text-[#ffcc99] text-sm">
                  Comparing {products.length} product{products.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-3">
                  {getLowestPrice() !== getHighestPrice() && (
                    <div className="text-green-400 text-sm">
                      Price Range: {formatPrice(getLowestPrice())} - {formatPrice(getHighestPrice())}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

