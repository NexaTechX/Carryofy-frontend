import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Canonical route is `/admin/deliveries` — keep this alias for old bookmarks. */
export default function AdminDeliveryRedirect() {
  const router = useRouter();
  useEffect(() => {
    void router.replace('/admin/deliveries');
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-background text-sm text-foreground/60">
      Redirecting to Deliveries…
    </div>
  );
}
