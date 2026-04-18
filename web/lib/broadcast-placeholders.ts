/**
 * Merge tags supported by admin broadcast ComposeMessage and CB/apps/api BroadcastService.
 */
const PREVIEW_FIRST_NAME = 'Alex';
const PREVIEW_BUSINESS_NAME = 'Alex Supplies Ltd';
const PREVIEW_ORDER_COUNT = '12';

export function applyBroadcastPlaceholderPreview(text: string): string {
  return text
    .split('[First Name]')
    .join(PREVIEW_FIRST_NAME)
    .split('[Business Name]')
    .join(PREVIEW_BUSINESS_NAME)
    .split('[Order Count]')
    .join(PREVIEW_ORDER_COUNT);
}
