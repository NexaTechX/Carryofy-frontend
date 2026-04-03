import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function UnsubscribedPage() {
  const router = useRouter();
  const channel = typeof router.query.channel === "string" ? router.query.channel : "";
  const err = typeof router.query.error === "string" ? router.query.error : "";
  const ok = err !== "invalid" && channel === "product-updates";

  return (
    <>
      <Head>
        <title>Email preferences | Carryofy</title>
      </Head>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-md w-full rounded-2xl border border-[#ff6600]/30 bg-[#1a1a1a] p-8 text-center">
          {ok ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-white text-xl font-bold mb-2">You&apos;re unsubscribed</h1>
              <p className="text-[#ffcc99]/80 text-sm leading-relaxed mb-6">
                We won&apos;t send you new product or catalog promotion emails anymore. You can turn
                them back on anytime from your account notification settings.
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
              <h1 className="text-white text-xl font-bold mb-2">Link invalid or expired</h1>
              <p className="text-[#ffcc99]/80 text-sm leading-relaxed mb-6">
                This unsubscribe link could not be applied. Sign in and update your preferences
                manually, or request a fresh link from the footer of a recent email.
              </p>
            </>
          )}
          <Link
            href="/settings/notifications"
            className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#ff6600] text-black font-bold hover:bg-[#cc5200] transition"
          >
            Notification settings
          </Link>
          <Link
            href="/"
            className="inline-block mt-4 text-[#ff6600] text-sm font-medium hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
