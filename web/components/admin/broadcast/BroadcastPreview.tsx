import { useState } from 'react';
import { Mail, Bell, Smartphone, Monitor } from 'lucide-react';
import type { CreateBroadcastPayload, BroadcastProductOption } from '../../../lib/admin/types';
import { fetchBroadcastProducts } from '../../../lib/admin/api';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';

interface BroadcastPreviewProps {
  payload: Partial<CreateBroadcastPayload>;
  products?: BroadcastProductOption[];
}

export default function BroadcastPreview({ payload, products = [] }: BroadcastPreviewProps) {
  const [previewType, setPreviewType] = useState<'email' | 'inApp'>('email');
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('desktop');

  // Fetch products if productIds are provided
  const { data: fetchedProducts = [] } = useQuery({
    queryKey: ['broadcast', 'preview-products', payload.productIds],
    queryFn: async () => {
      if (!payload.productIds?.length) return [];
      // We'd need a batch fetch endpoint, for now return empty
      return [];
    },
    enabled: false, // Disabled for now
  });

  const displayProducts = products.length > 0 ? products : fetchedProducts;

  const getRoleMessage = (role: 'BUYER' | 'SELLER' | 'RIDER') => {
    const roleMsg = payload.roleSpecificMessages?.[role];
    return {
      body: roleMsg?.body || payload.body || '',
      ctaLabel: roleMsg?.ctaLabel || payload.ctaLabel || '',
      ctaLink: roleMsg?.ctaLink || payload.ctaLink || '',
    };
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  };

  const sanitizeHtml = (html: string): string => {
    if (!html || typeof html !== 'string') {
      return '';
    }
    // Sanitize HTML with DOMPurify - allow safe HTML tags only
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'b', 'i', 'u', 'br', 'span', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'form', 'input', 'button', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
      KEEP_CONTENT: true,
    });
  };

  const sanitizeUrl = (url: string): string => {
    if (!url || typeof url !== 'string') {
      return '';
    }
    const trimmed = url.trim().toLowerCase();
    
    // Reject dangerous protocols
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:') ||
      trimmed.startsWith('file:') ||
      trimmed.startsWith('about:')
    ) {
      return '#';
    }

    // Only allow http, https, mailto, tel, or relative URLs
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('./') ||
      trimmed.startsWith('../')
    ) {
      return url.trim();
    }

    // Default to https for URLs without protocol
    return `https://${url.trim()}`;
  };

  return (
    <div className="sticky top-4 h-[calc(100vh-2rem)] flex flex-col rounded-xl border border-white/[0.08] bg-[#0e1117]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-white">Preview</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreviewType('email')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              previewType === 'email'
                ? 'bg-primary/20 text-primary'
                : 'bg-white/[0.02] text-gray-400 hover:bg-white/[0.05]'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setPreviewType('inApp')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              previewType === 'inApp'
                ? 'bg-primary/20 text-primary'
                : 'bg-white/[0.02] text-gray-400 hover:bg-white/[0.05]'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            In-App
          </button>
        </div>
      </div>

      {/* Device toggle */}
      {previewType === 'email' && (
        <div className="flex items-center justify-center gap-2 border-b border-white/[0.06] p-2">
          <button
            type="button"
            onClick={() => setDeviceType('desktop')}
            className={`p-1.5 rounded transition-colors ${
              deviceType === 'desktop' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceType('mobile')}
            className={`p-1.5 rounded transition-colors ${
              deviceType === 'mobile' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className={`mx-auto bg-white rounded-lg shadow-lg ${
            deviceType === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
          }`}
        >
          {previewType === 'email' ? (
            <div className="p-6 text-gray-900">
              <div className="mb-4 border-b pb-4">
                <h2 className="text-lg font-semibold">{payload.subject || 'Email Subject'}</h2>
                <p className="text-sm text-gray-500 mt-1">From: Carryofy</p>
              </div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(getRoleMessage(payload.audience?.[0] || 'BUYER').body || '<p>Message body will appear here</p>'),
                }}
              />
              {displayProducts.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {displayProducts.slice(0, 4).map((product) => (
                    <div key={product.id} className="border rounded-lg p-3">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      <h4 className="font-medium text-sm">{product.title}</h4>
                      {product.price && (
                        <p className="text-sm text-gray-600 mt-1">₦{(product.price / 100).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {getRoleMessage(payload.audience?.[0] || 'BUYER').ctaLabel && (
                <div className="mt-6">
                  <a
                    href={sanitizeUrl(getRoleMessage(payload.audience?.[0] || 'BUYER').ctaLink || '#')}
                    className="inline-block px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    {getRoleMessage(payload.audience?.[0] || 'BUYER').ctaLabel}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-[#090c11]">
              <div className="bg-white/[0.05] rounded-lg p-4 border border-white/[0.08]">
                <h3 className="font-semibold text-white text-sm mb-1">
                  {payload.subject || 'Notification Title'}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-3">
                  {stripHtml(getRoleMessage(payload.audience?.[0] || 'BUYER').body || 'Notification message')}
                </p>
                {getRoleMessage(payload.audience?.[0] || 'BUYER').ctaLabel && (
                  <button className="mt-3 text-xs text-primary font-medium">
                    {getRoleMessage(payload.audience?.[0] || 'BUYER').ctaLabel} →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
