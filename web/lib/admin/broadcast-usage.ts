import { BroadcastType } from './types';

const STORAGE_KEY_USAGE = 'carryofy_broadcast_type_usage';
const STORAGE_KEY_LAST_PAYLOAD = 'carryofy_broadcast_last_payload';

export interface BroadcastTypeUsage {
  type: BroadcastType;
  lastUsedAt: string | null; // ISO string
  count: number;
}

export function getBroadcastTypeUsage(): Record<BroadcastType, BroadcastTypeUsage> {
  if (typeof window === 'undefined') {
    return {} as Record<BroadcastType, BroadcastTypeUsage>;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USAGE);
    const parsed = raw ? JSON.parse(raw) : {};
    const types: BroadcastType[] = [
      BroadcastType.PRODUCT_LAUNCH,
      BroadcastType.PROMOTION,
      BroadcastType.SYSTEM_UPDATE,
      BroadcastType.OPERATIONAL_NOTICE,
      BroadcastType.URGENT_ALERT,
    ];
    const result: Record<string, BroadcastTypeUsage> = {};
    for (const type of types) {
      const u = parsed[type];
      result[type] = {
        type: type as BroadcastType,
        lastUsedAt: u?.lastUsedAt ?? null,
        count: typeof u?.count === 'number' ? u.count : 0,
      };
    }
    return result as Record<BroadcastType, BroadcastTypeUsage>;
  } catch {
    return {} as Record<BroadcastType, BroadcastTypeUsage>;
  }
}

export function recordBroadcastTypeUsage(type: BroadcastType): void {
  const usage = getBroadcastTypeUsage();
  const now = new Date().toISOString();
  usage[type] = {
    type,
    lastUsedAt: now,
    count: (usage[type]?.count ?? 0) + 1,
  };
  try {
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(usage));
  } catch {
    // ignore
  }
}

export function getRecommendedBroadcastType(): BroadcastType | null {
  const usage = getBroadcastTypeUsage();
  let maxCount = 0;
  let recommended: BroadcastType | null = null;
  for (const u of Object.values(usage)) {
    if (u.count > maxCount) {
      maxCount = u.count;
      recommended = u.type;
    }
  }
  return recommended;
}

export function getLastBroadcastPayloadByType(type: BroadcastType): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_PAYLOAD);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed[type] ?? null;
  } catch {
    return null;
  }
}

export function setLastBroadcastPayloadByType(type: BroadcastType, payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_PAYLOAD);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[type] = payload;
    localStorage.setItem(STORAGE_KEY_LAST_PAYLOAD, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
