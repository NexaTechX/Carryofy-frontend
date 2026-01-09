// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Enable Replay for better debugging
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.1,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text content and user input. Don't leave anything unmasked.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Set the environment
  environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV,

  // Filter out health check and other non-essential errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "atomicFindClose",
    "fb_xd_fragment",
    "bmi_SafeAddOnload",
    "EBCallBackMessageReceived",
    // Network errors
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    // Third-party scripts
    "Non-Error promise rejection captured",
  ],

  // Filter out specific URLs (optional)
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    // Browser extensions
    /^moz-extension:\/\//i,
    // Local development
    /localhost/i,
  ],
});
