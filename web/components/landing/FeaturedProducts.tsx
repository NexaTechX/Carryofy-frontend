import Image from 'next/image';
import Link from 'next/link';

export default function FeaturedProducts() {
  const products = [
    {
      name: 'Ankara Handbag',
      description: 'Stylish and unique.',
      image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80',
    },
    {
      name: 'Leather Sandals',
      description: 'Comfortable and durable.',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    },
    {
      name: 'Adire Fabric',
      description: 'Vibrant and colorful.',
      image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&q=80',
    },
    {
      name: 'Beaded Jewelry',
      description: 'Elegant and traditional.',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80',
    },
    {
      name: 'Woven Basket',
      description: 'Handcrafted and versatile.',
      image: 'https://images.pexels.com/photos/32837686/pexels-photo-32837686.jpeg',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-black">
          Featured Products
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto">
          {products.map((product, index) => (
            <Link 
              key={index} 
              href="/buyer"
              className="text-center group cursor-pointer"
            >
              <div className="relative w-full aspect-square mb-3 sm:mb-4 bg-gray-200 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-primary transition">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-black mb-1 px-1 group-hover:text-primary transition">{product.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 px-1">{product.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

