/** Structural shape only — avoids duplicate @sentry/core typings from nested deps. */
type SentryEventLike = {
  message?: string;
  exception?: { values?: Array<{ type?: string; value?: string }> };
};

type SentryBeforeSendHint = { originalException?: unknown };

function isFirebaseIndexedDbNoiseFromString(msg: string): boolean {
  const t = msg.trim();
  const lower = t.toLowerCase();
  if (
    lower.includes("idbdatabase") ||
    lower.includes("connection is closing") ||
    lower.includes("transaction was aborted") ||
    lower.includes("app/idb-get") ||
    lower.includes("app/idb-set")
  ) {
    return true;
  }
  if (lower.includes("unknownerror") && lower.includes("connection")) {
    return true;
  }
  // Firebase wraps some IndexedDB aborts as Error("AbortError: AbortError")
  if (/^aborterror:\s*aborterror$/i.test(t)) {
    return true;
  }
  return false;
}

function isFirebaseIndexedDbNoise(error: unknown): boolean {
  if (!error) return false;
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error);
  return isFirebaseIndexedDbNoiseFromString(msg);
}

/** Drop benign Firebase IndexedDB races (HMR, tab backgrounding) that still reach Sentry. */
export function shouldDropFirebaseIndexedDbEvent(
  event: SentryEventLike,
  hint: SentryBeforeSendHint
): boolean {
  if (isFirebaseIndexedDbNoise(hint.originalException)) {
    return true;
  }
  if (event.message && isFirebaseIndexedDbNoiseFromString(event.message)) {
    return true;
  }
  const values = event.exception?.values;
  if (values) {
    for (const ex of values) {
      if (ex.value && isFirebaseIndexedDbNoiseFromString(ex.value)) {
        return true;
      }
      const combined = [ex.type, ex.value].filter(Boolean).join(": ");
      if (isFirebaseIndexedDbNoiseFromString(combined)) {
        return true;
      }
    }
  }
  return false;
}
