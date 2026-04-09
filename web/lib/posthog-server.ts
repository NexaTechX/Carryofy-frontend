import { PostHog } from "posthog-node";

/**
 * Short-lived server usage (getServerSideProps, Route Handlers, server actions).
 * Always await shutdown() when done so events flush.
 */
export function getPostHogServer(): PostHog {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
}
