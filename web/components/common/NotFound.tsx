import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileQuestion, Home } from 'lucide-react';
import SEO from '../seo/SEO';

interface NotFoundProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

export default function NotFound({ 
  title = '404 - Page Not Found',
  message = "The page you're looking for doesn't exist or has been moved.",
  showHomeButton = true 
}: NotFoundProps) {
  const router = useRouter();

  return (
    <>
      <SEO
        title={title}
        description={message}
        noindex
      />
      <div className="min-h-screen flex flex-col bg-black">
        <main className="flex-grow flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <FileQuestion className="w-24 h-24 text-[#ffcc99]/30 mx-auto mb-6" />
            <h1 className="text-white text-3xl font-bold mb-4">Page Not Found</h1>
            <p className="text-[#ffcc99] mb-8">
              {message}
            </p>
            {showHomeButton && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6600] text-black font-bold rounded-xl hover:bg-[#cc5200] transition"
              >
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

