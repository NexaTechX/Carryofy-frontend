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
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useRouter } from 'next/router';



if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: false, // handled manually below
    capture_pageleave: true,
  });
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => posthog.capture('$pageview');
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

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

  // Initialize Firebase Analytics after first paint to reduce IndexedDB races with HMR/navigation.
  useEffect(() => {
    const run = () => {
      initAnalytics().then((analyticsInstance) => {
        if (analyticsInstance) {
          console.log('✅ Firebase Analytics initialized');
        }
      });
    };
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 0);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <PostHogProvider client={posthog}>
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
    </PostHogProvider>
  );
}

