import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import SellerLayout from '../../../components/seller/SellerLayout';
import { tokenManager, userManager } from '../../../lib/auth';

interface FormData {
  title: string;
  description: string;
  price: string;
  category: string;
  quantity: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: '',
    category: '',
    quantity: '',
  });

  useEffect(() => {
    setMounted(true);
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
    }
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingImage(true);
    try {
      const token = tokenManager.getToken();
      const formData = new FormData();
      formData.append('images', file);

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;
      
      const response = await fetch(
        `${apiUrl}/products/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUploadedImageUrls(data.urls || []);
      } else {
        const error = await response.json();
        toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (uploadedImageUrls.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    setLoading(true);
    try {
      const token = tokenManager.getToken();
      
      // Convert price from naira to kobo (multiply by 100)
      const priceInKobo = Math.round(parseFloat(formData.price) * 100);

      const productData = {
        title: formData.title,
        description: formData.description || undefined,
        price: priceInKobo,
        images: uploadedImageUrls,
        quantity: parseInt(formData.quantity),
      };

      const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
      const apiUrl = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;
      
      const response = await fetch(
        `${apiUrl}/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        }
      );

      if (response.ok) {
        toast.success('Product created successfully!');
        // Redirect to products page
        router.push('/seller/products');
      } else {
        const error = await response.json();
        toast.error(`Failed to create product: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Always render immediately - don't block with mounted check

  return (
    <>
      <Head>
        <title>Add Product - Seller Portal | Carryofy</title>
        <meta
          name="description"
          content="Add a new product to your inventory on Carryofy."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SellerLayout>
        <div className="bg-black rounded-xl p-4 min-h-full">
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <p className="text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Add Product
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Product Image Section */}
            <div className="p-4">
              <div className="flex flex-col items-stretch justify-start rounded-xl lg:flex-row lg:items-start">
                <div className="w-full lg:w-auto">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl bg-[#1a1a1a] border border-[#ff6600]/30 flex items-center justify-center min-h-[200px]"
                    style={
                      imagePreview
                        ? { backgroundImage: `url(${imagePreview})` }
                        : {}
                    }
                  >
                    {!imagePreview && (
                      <span className="text-[#ffcc99] text-sm">Product Image</span>
                    )}
                  </div>
                </div>
                <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-1 py-4 lg:px-4">
                  <p className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                    Product Details
                  </p>
                  <div className="flex items-end gap-3 justify-between">
                    <p className="text-[#ffcc99] text-base font-normal leading-normal">
                      Enter the basic information about your product.
                    </p>
                    <label className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#ff6600] text-black text-sm font-medium leading-normal hover:bg-[#cc5200] transition-colors">
                      <span className="truncate">
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Title */}
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">
                  Product Title
                </p>
                <input
                  name="title"
                  type="text"
                  placeholder="e.g., Premium Cotton T-Shirt"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-[15px] text-base font-normal leading-normal"
                />
              </label>
            </div>

            {/* Product Description */}
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">
                  Product Description
                </p>
                <textarea
                  name="description"
                  placeholder="Describe your product in detail"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] min-h-36 placeholder:text-[#ffcc99] p-[15px] text-base font-normal leading-normal"
                />
              </label>
            </div>

            {/* Price */}
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">
                  Price
                </p>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 25.00"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-[15px] text-base font-normal leading-normal"
                />
              </label>
            </div>

            {/* Category */}
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">
                  Category
                </p>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-[15px] text-base font-normal leading-normal"
                  style={{
                    backgroundImage:
                      "url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2724px%27 height=%2724px%27 fill=%27rgb(255,204,153)%27 viewBox=%270 0 256 256%27%3e%3cpath d=%27M181.66,170.34a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32,0l-48-48a8,8,0,0,1,11.32-11.32L128,212.69l42.34-42.35A8,8,0,0,1,181.66,170.34Zm-96-84.68L128,43.31l42.34,42.35a8,8,0,0,0,11.32-11.32l-48-48a8,8,0,0,0-11.32,0l-48,48A8,8,0,0,0,85.66,85.66Z%27%3e%3c/path%3e%3c/svg%3e')",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 15px center',
                    paddingRight: '45px',
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="food">Food</option>
                  <option value="books">Books</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            {/* Stock Quantity */}
            <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label className="flex flex-col min-w-40 flex-1">
                <p className="text-white text-base font-medium leading-normal pb-2">
                  Stock Quantity
                </p>
                <input
                  name="quantity"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#ff6600]/30 bg-[#1a1a1a] focus:border-[#ff6600] h-14 placeholder:text-[#ffcc99] p-[15px] text-base font-normal leading-normal"
                />
              </label>
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="flex px-4 py-3 justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/seller/products')}
                disabled={loading}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#1a1a1a] border border-[#ff6600]/30 text-[#ffcc99] text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition-colors"
              >
                <span className="truncate">Cancel</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#ff6600] text-black text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#cc5200] transition-colors"
              >
                <span className="truncate">
                  {loading ? 'Adding Product...' : 'Add Product'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </SellerLayout>
    </>
  );
}

