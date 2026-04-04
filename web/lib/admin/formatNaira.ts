/** Consistent ₦ display: symbol + thousands separators, whole naira (from kobo). */
export function formatNairaKobo(kobo: number): string {
  const naira = Math.round(kobo / 100);
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export function formatNairaAmount(naira: number): string {
  return `₦${Math.round(naira).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export function pctDelta(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
