import type { CreateBroadcastPayload, BroadcastAudience } from './types';

// Spam keywords that might trigger email filters
const SPAM_KEYWORDS = [
  'free money',
  'click here now',
  'limited time',
  'act now',
  'urgent',
  'guaranteed',
  'no risk',
  'winner',
  'congratulations',
  'claim your prize',
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate CTA link matches audience role
 */
export function validateCtaLink(ctaLink: string, audience: BroadcastAudience[]): string | null {
  if (!ctaLink) return null;

  const link = ctaLink.toLowerCase();
  const hasBuyer = audience.includes('BUYER');
  const hasSeller = audience.includes('SELLER');
  const hasRider = audience.includes('RIDER');

  // Check if link matches any selected audience
  const buyerMatch = link.includes('/buyer/') || link.includes('/products') || link.includes('/shop');
  const sellerMatch = link.includes('/seller/') || link.includes('/dashboard');
  const riderMatch = link.includes('/rider/') || link.includes('/deliveries');

  if (hasBuyer && !buyerMatch && !sellerMatch && !riderMatch) {
    return 'CTA link should typically point to buyer routes (/buyer/*) for buyer audience';
  }
  if (hasSeller && !sellerMatch && !buyerMatch && !riderMatch) {
    return 'CTA link should typically point to seller routes (/seller/*) for seller audience';
  }
  if (hasRider && !riderMatch && !buyerMatch && !sellerMatch) {
    return 'CTA link should typically point to rider routes (/rider/*) for rider audience';
  }

  return null;
}

/**
 * Check subject line for spam risk
 */
export function checkSpamRisk(subject: string): { risk: 'low' | 'medium' | 'high'; reasons: string[] } {
  const reasons: string[] = [];
  let risk: 'low' | 'medium' | 'high' = 'low';

  // Check length
  if (subject.length > 50) {
    reasons.push('Subject line is longer than 50 characters (recommended: ≤50)');
    risk = 'medium';
  }

  // Check for spam keywords
  const lowerSubject = subject.toLowerCase();
  const foundKeywords = SPAM_KEYWORDS.filter((keyword) => lowerSubject.includes(keyword));
  if (foundKeywords.length > 0) {
    reasons.push(`Contains potential spam keywords: ${foundKeywords.join(', ')}`);
    risk = foundKeywords.length > 2 ? 'high' : 'medium';
  }

  // Check for excessive capitalization
  const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
  if (capsRatio > 0.5 && subject.length > 10) {
    reasons.push('Excessive capitalization may trigger spam filters');
    risk = risk === 'high' ? 'high' : 'medium';
  }

  // Check for excessive punctuation
  const punctuationCount = (subject.match(/[!?]/g) || []).length;
  if (punctuationCount > 2) {
    reasons.push('Multiple exclamation/question marks may trigger spam filters');
    risk = risk === 'high' ? 'high' : 'medium';
  }

  return { risk, reasons };
}

/**
 * Validate broadcast payload
 */
export function validateBroadcastPayload(payload: Partial<CreateBroadcastPayload>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!payload.type) {
    errors.push('Broadcast type is required');
  }
  if (!payload.audience || payload.audience.length === 0) {
    errors.push('At least one audience must be selected');
  }
  if (!payload.channels || (!payload.channels.email && !payload.channels.inApp)) {
    errors.push('At least one channel (email or in-app) must be selected');
  }
  if (payload.channels?.email && !payload.subject?.trim()) {
    errors.push('Subject is required when email channel is selected');
  }
  if (!payload.body?.trim()) {
    errors.push('Message body is required');
  }

  // CTA validation
  if (payload.ctaLabel && !payload.ctaLink) {
    warnings.push('CTA label provided but no CTA link');
  }
  if (payload.ctaLink && !payload.ctaLabel) {
    warnings.push('CTA link provided but no CTA label');
  }

  // CTA link validation
  if (payload.ctaLink && payload.audience) {
    const ctaWarning = validateCtaLink(payload.ctaLink, payload.audience);
    if (ctaWarning) {
      warnings.push(ctaWarning);
    }
  }

  // Spam risk check
  if (payload.subject) {
    const spamCheck = checkSpamRisk(payload.subject);
    if (spamCheck.risk === 'high') {
      errors.push(`High spam risk detected: ${spamCheck.reasons.join('; ')}`);
    } else if (spamCheck.risk === 'medium') {
      warnings.push(`Medium spam risk: ${spamCheck.reasons.join('; ')}`);
    }
  }

  // Rate limit validation
  if (payload.rateLimit?.usersPerMinute) {
    if (payload.rateLimit.usersPerMinute < 1) {
      errors.push('Rate limit must be at least 1 user per minute');
    }
    if (payload.rateLimit.usersPerMinute > 10000) {
      warnings.push('Rate limit exceeds 10,000 users/minute - this may cause performance issues');
    }
  }

  // Scheduling validation
  if (payload.scheduling && payload.scheduling.sendNow === false) {
    if (!payload.scheduling.scheduledFor) {
      errors.push('Scheduled time is required when scheduling for later');
    } else {
      const scheduledDate = new Date(payload.scheduling.scheduledFor);
      if (scheduledDate <= new Date()) {
        errors.push('Scheduled time must be in the future');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
