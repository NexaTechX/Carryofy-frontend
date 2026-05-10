import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, FileQuestion, Home, Package } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEO from '../components/seo/SEO';

export default function Custom404() {
  const router = useRouter();
  return (
    <>
      <SEO
        title="404 — Page not found | Carryofy"
        description="This page does not exist or has been moved. Return to Carryofy to shop verified B2B suppliers in Lagos."
        noindex
      />

      <div className="flex min-h-screen flex-col bg-stone-50 font-inter text-zinc-900 antialiased">
        <Header />
        <main className="grow flex flex-col items-center justify-center px-4 py-16 sm:py-24">
          <div className="flex max-w-lg flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff6600] text-2xl font-black text-black shadow-lg shadow-[#ff6600]/25">
              C
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 shadow-sm">
              <FileQuestion className="h-3.5 w-3.5 text-[#ff6600]" aria-hidden />
              Error 404
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Page not found
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              We could not find that link. It may have been removed or the URL might be mistyped.
              Head back to Carryofy to keep sourcing verified suppliers and retailers in Lagos.
            </p>

            <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6600] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#e65c00]"
              >
                <Home className="h-4 w-4" aria-hidden />
                Back to home
              </Link>
              <Link
                href="/buyer/products"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-900 bg-transparent px-6 py-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
              >
                <Package className="h-4 w-4" aria-hidden />
                Browse products
              </Link>
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-[#ff6600]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Go back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
