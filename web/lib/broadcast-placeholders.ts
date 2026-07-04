/**
 * Merge tags supported by admin broadcast ComposeMessage and CB/apps/api BroadcastService.
 */
import type { RecipientKey } from '../hooks/useBroadcast';

const PREVIEW_FIRST_NAME = 'Alex';
const PREVIEW_BUSINESS_NAME = 'Alex Supplies Ltd';
const PREVIEW_ORDER_COUNT = '12';

const RECIPIENT_LABELS: Record<RecipientKey, string> = {
  buyers: 'Buyers',
  sellers: 'Sellers',
  riders: 'Riders',
};

/** Tokens that only populate for specific recipient segments. */
export const SEGMENT_SPECIFIC_TOKENS: Array<{
  token: string;
  appliesTo: RecipientKey[];
}> = [
  { token: '[Business Name]', appliesTo: ['sellers'] },
];

export function applyBroadcastPlaceholderPreview(text: string): string {
  return text
    .split('[First Name]')
    .join(PREVIEW_FIRST_NAME)
    .split('[Business Name]')
    .join(PREVIEW_BUSINESS_NAME)
    .split('[Order Count]')
    .join(PREVIEW_ORDER_COUNT);
}

export function getTokenSegmentWarnings(
  message: string,
  selectedRecipients: RecipientKey[],
): string[] {
  if (!message.trim() || selectedRecipients.length === 0) return [];

  const warnings: string[] = [];

  for (const { token, appliesTo } of SEGMENT_SPECIFIC_TOKENS) {
    if (!message.includes(token)) continue;

    const incompatible = selectedRecipients.filter((key) => !appliesTo.includes(key));
    if (incompatible.length === 0) continue;

    const incompatibleLabels = incompatible.map((key) => RECIPIENT_LABELS[key]).join('/');
    warnings.push(
      `⚠️ ${token} won't populate for ${incompatibleLabels} in this broadcast.`,
    );
  }

  return warnings;
}
