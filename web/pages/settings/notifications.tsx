import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../lib/auth";
import { Loader2 } from "lucide-react";

/**
 * Redirects to the appropriate notification preferences UI.
 * Used by "Manage your notification preferences" links in emails (e.g. new-arrival digest).
 */
export default function SettingsNotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace("/auth/login?redirect=/settings/notifications");
      return;
    }
    if (user.role === "SELLER" || user.role === "ADMIN") {
      router.replace("/seller/notifications");
      return;
    }
    router.replace("/buyer/profile");
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <>
      <Head>
        <title>Notification preferences | Carryofy</title>
      </Head>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6600]" />
      </div>
    </>
  );
}
