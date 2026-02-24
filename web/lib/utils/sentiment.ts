/**
 * Simple client-side sentiment from review text.
 * Returns Positive | Neutral | Negative for display as a tag.
 */
export type SentimentLabel = 'Positive' | 'Neutral' | 'Negative';

const POSITIVE = [
  'great', 'good', 'love', 'excellent', 'amazing', 'perfect', 'happy', 'best', 'awesome',
  'recommend', 'wonderful', 'fantastic', 'smooth', 'fast', 'helpful', 'pleased', 'quality',
  'nice', 'satisfied', 'quick', 'professional', 'clean', 'fresh', 'worth',
];
const NEGATIVE = [
  'bad', 'terrible', 'worst', 'horrible', 'awful', 'disappointed', 'waste', 'broken',
  'slow', 'late', 'missing', 'damaged', 'wrong', 'poor', 'never', 'unhappy', 'rude',
  'fake', 'scam', 'refund', 'cancel', 'complaint', 'unacceptable', 'useless', 'fail',
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function getSentiment(text: string | null | undefined): SentimentLabel {
  if (!text || !text.trim()) return 'Neutral';
  const tokens = tokenize(text);
  if (tokens.length === 0) return 'Neutral';

  const posSet = new Set(POSITIVE);
  const negSet = new Set(NEGATIVE);
  let pos = 0;
  let neg = 0;
  for (const t of tokens) {
    if (posSet.has(t)) pos++;
    if (negSet.has(t)) neg++;
  }

  const score = pos - neg;
  if (score > 0) return 'Positive';
  if (score < 0) return 'Negative';
  return 'Neutral';
}
