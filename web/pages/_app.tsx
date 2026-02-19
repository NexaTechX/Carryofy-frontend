import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import '../styles/globals.css';
import { AdminGuard } from '../components/auth/AdminGuard';
import { AuthProvider } from '../lib/auth';
import { CartProvider } from '../lib/contexts/CartContext';
import { initAnalytics } from '../lib/firebase/config';


export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes for static data (categories, products)
            gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1, // Reduce retries for faster failure feedback
            retryDelay: 1000, // 1 second delay between retries
          },
        },
      })
  );

  // Initialize Firebase Analytics on mount (client-side only)
  useEffect(() => {
    initAnalytics().then((analyticsInstance) => {
      if (analyticsInstance) {
        console.log('✅ Firebase Analytics initialized');
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AdminGuard>
            <Component {...pageProps} />
          </AdminGuard>
        </CartProvider>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1a1a1a',
            color: '#ffcc99',
            border: '1px solid rgba(255, 102, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            paddingRight: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          },
          success: {
            duration: 2500,
            iconTheme: {
              primary: '#ff6600',
              secondary: '#1a1a1a',
            },
            style: {
              border: '1px solid rgba(255, 102, 0, 0.5)',
            },
          },
          error: {
            duration: 3500,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1a1a1a',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.5)',
            },
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t} style={{ position: 'relative' }}>
            {({ icon, message }) => (
              <div className="flex items-center gap-3 pr-6">
                {icon}
                <span className="flex-1">{message}</span>
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-[#ff6600]/20 transition-colors group flex-shrink-0"
                    aria-label="Close notification"
                  >
                    <X className="w-4 h-4 text-[#ffcc99] group-hover:text-white transition-colors" />
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>
    </QueryClientProvider>
  );
}

