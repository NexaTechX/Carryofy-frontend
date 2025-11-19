import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { Search, Trash2 } from 'lucide-react';
import { tokenManager, userManager } from '../../../lib/auth';
import Link from 'next/link';

interface Product {
  id: string;
  title: string;
  price: number;
  quantity: number;
  status: string;
  images: string[];
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!tokenManager.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const user = userManager.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch products
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const token = tokenManager.getToken();
      const user = userManager.getUser();
      
      // Get seller's products
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?sellerId=${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInKobo: number) => {
    return `₦${(priceInKobo / 100).toFixed(2)}`;
  };

  const getStockStatus = (quantity: number, status: string) => {
    if (status === 'ACTIVE' && quantity > 0) {
      return 'In Stock';
    }
    return 'Out of Stock';
  };

  const handleDeleteClick = (productId: string) => {
    setDeleteConfirm(productId);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    try {
      const token = tokenManager.getToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

      const response = await fetch(`${apiUrl}/products/${deleteConfirm}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        setProducts(products.filter(p => p.id !== deleteConfirm));
        setDeleteConfirm(null);
      } else {
        const error = await response.json();
        toast.error(`Failed to delete product: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Products - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="Manage your products on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div>
          {/* Title Section */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div className="flex min-w-72 flex-col gap-3">
              <p className="text-white tracking-light text-[32px] font-bold leading-tight">
                Products
              </p>
              <p className="text-[#ffcc99] text-sm font-normal leading-normal">
                Manage your products
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                <div className="text-[#ffcc99] flex border-none bg-[#1a1a1a] items-center justify-center pl-4 rounded-l-xl border-r-0">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  placeholder="Search products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#1a1a1a] focus:border-none h-full placeholder:text-[#ffcc99] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                />
              </div>
            </label>
          </div>

          {/* Delete Confirmation Dialog */}
          {deleteConfirm && (
            <div className="px-4 py-3">
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                <p className="text-white font-medium mb-4">Are you sure you want to delete this product?</p>
                <p className="text-[#ffcc99] text-sm mb-4">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] rounded-lg text-sm font-medium hover:bg-[#ff6600]/10 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="px-4 py-3">
            <div className="flex overflow-hidden rounded-xl border border-primary/30 bg-black">
              <table className="flex-1">
                <thead>
                  <tr className="bg-[#1a1a1a]">
                    <th className="px-4 py-3 text-left text-white w-14 text-sm font-medium leading-normal">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-white w-[400px] text-sm font-medium leading-normal">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-white w-60 text-sm font-medium leading-normal">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[#ffcc99] w-60 text-sm font-medium leading-normal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-white">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-white">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t border-t-primary/30"
                      >
                        <td className="h-[72px] px-4 py-2 w-14 text-sm font-normal leading-normal">
                          <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10"
                            style={{
                              backgroundImage: product.images?.[0]
                                ? `url(${product.images[0]})`
                                : 'none',
                              backgroundColor: '#1a1a1a',
                            }}
                          ></div>
                        </td>
                        <td className="h-[72px] px-4 py-2 w-[400px] text-white text-sm font-normal leading-normal">
                          {product.title}
                        </td>
                        <td className="h-[72px] px-4 py-2 w-[400px] text-[#ffcc99] text-sm font-normal leading-normal">
                          {formatPrice(product.price)}
                        </td>
                        <td className="h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                          <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#1a1a1a] text-white text-sm font-medium leading-normal w-full">
                            <span className="truncate">
                              {getStockStatus(product.quantity, product.status)}
                            </span>
                          </button>
                        </td>
                        <td className="h-[72px] px-4 py-2 w-60 text-sm font-bold leading-normal tracking-[0.015em]">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/seller/products/${product.id}/edit`}
                              className="text-[#ffcc99] hover:text-[#ff6600] transition-colors"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(product.id)}
                              className="text-red-400 hover:text-red-500 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SellerLayout>
    </>
  );
}

