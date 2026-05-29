/** Normalize order list payloads (`{ orders }` or bare array). */
export function parseOrdersList(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.orders)) return record.orders;
  }
  return [];
}
