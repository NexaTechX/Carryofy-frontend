import { useEffect } from 'react';
import { useRouter } from 'next/router';

/** Keep `/rider` working — canonical UI is the dashboard. */
export default function RiderIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    void router.replace('/rider/dashboard');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/60">
      Opening rider dashboard…
    </div>
  );
}
