import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import { AdminGuard } from '../components/auth/AdminGuard';
import { AuthProvider } from '../lib/auth';
import { CartProvider } from '../lib/contexts/CartContext';


export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

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
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#ffcc99',
            border: '1px solid rgba(255, 102, 0, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#ff6600',
              secondary: '#1a1a1a',
            },
            style: {
              border: '1px solid rgba(255, 102, 0, 0.5)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1a1a1a',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.5)',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

