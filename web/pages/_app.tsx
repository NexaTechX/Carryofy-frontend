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

// PostHog initializes in instrumentation-client.ts (Next.js client bundle entry).

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
            background: '#ffffff',
            color: '#111111',
            border: '1px solid rgba(255, 102, 0, 0.45)',
            borderRadius: '12px',
            padding: '16px',
            paddingRight: '40px',
            boxShadow: '0 8px 24px -8px rgba(255, 107, 0, 0.35)',
          },
          success: {
            duration: 2500,
            iconTheme: {
              primary: '#ff6600',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid rgba(255, 102, 0, 0.5)',
            },
          },
          error: {
            duration: 3500,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
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
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-[#ff6600]/20 transition-colors group shrink-0"
                    aria-label="Close notification"
                  >
                    <X className="w-4 h-4 text-[#ff6600] group-hover:text-[#111111] transition-colors" />
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

