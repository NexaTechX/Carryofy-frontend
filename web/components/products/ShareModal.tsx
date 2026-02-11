import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Twitter, Facebook, Instagram } from 'lucide-react';
import { shareProduct } from '../../lib/api/sharing';
import { showSuccessToast, showErrorToast } from '../../lib/ui/toast';
import { useAuth } from '../../lib/auth';

interface ShareModalProps {
  productId: string;
  productTitle: string;
  onClose: () => void;
}

export default function ShareModal({
  productId,
  productTitle,
  onClose,
}: ShareModalProps) {
  const { isAuthenticated } = useAuth();
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate share URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://carryofy.com';
    const url = `${baseUrl}/buyer/products/${productId}?ref=share`;
    setShareUrl(url);
    setLoading(false);
  }, [productId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showSuccessToast('Link copied to clipboard!');
      
      // Track copy event if authenticated
      if (isAuthenticated) {
        try {
          await shareProduct(productId, 'copy');
        } catch (error) {
          // Silently fail - tracking is not critical
        }
      }

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showErrorToast('Failed to copy link');
    }
  };

  const handleSocialShare = async (platform: string, shareUrl: string) => {
    // Track share event if authenticated
    if (isAuthenticated) {
      try {
        await shareProduct(productId, platform);
      } catch (error) {
        // Silently fail - tracking is not critical
      }
    }

    // Open share URL
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const getWhatsAppUrl = () => {
    const text = encodeURIComponent(`Check out ${productTitle} on Carryofy: ${shareUrl}`);
    return `https://wa.me/?text=${text}`;
  };

  const getTwitterUrl = () => {
    const text = encodeURIComponent(productTitle);
    const url = encodeURIComponent(shareUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  };

  const getFacebookUrl = () => {
    const url = encodeURIComponent(shareUrl);
    return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6600]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-xl font-bold flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Product
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Title */}
        <p className="text-white/80 text-sm mb-6 line-clamp-2">{productTitle}</p>

        {/* Share URL */}
        <div className="mb-6">
          <label className="block text-white text-sm font-medium mb-2">Share Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-[#ff6600]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6600]"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                copied
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-[#ff6600] text-black hover:bg-[#cc5200]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 inline mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 inline mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Sharing Buttons */}
        <div>
          <label className="block text-white text-sm font-medium mb-3">Share on</label>
          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp */}
            <button
              onClick={() => handleSocialShare('whatsapp', getWhatsAppUrl())}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366]/20 border border-[#25D366]/50 rounded-lg text-[#25D366] hover:bg-[#25D366]/30 transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">WhatsApp</span>
            </button>

            {/* Twitter/X */}
            <button
              onClick={() => handleSocialShare('twitter', getTwitterUrl())}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2]/20 border border-[#1DA1F2]/50 rounded-lg text-[#1DA1F2] hover:bg-[#1DA1F2]/30 transition"
            >
              <Twitter className="w-5 h-5" />
              <span className="font-medium">Twitter</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleSocialShare('facebook', getFacebookUrl())}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2]/20 border border-[#1877F2]/50 rounded-lg text-[#1877F2] hover:bg-[#1877F2]/30 transition"
            >
              <Facebook className="w-5 h-5" />
              <span className="font-medium">Facebook</span>
            </button>

            {/* Instagram (Copy Link) */}
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#833AB4]/20 to-[#E1306C]/20 border border-[#E1306C]/50 rounded-lg text-[#E1306C] hover:from-[#833AB4]/30 hover:to-[#E1306C]/30 transition"
            >
              <Instagram className="w-5 h-5" />
              <span className="font-medium">Instagram</span>
            </button>
          </div>
        </div>

        {/* Native Share API (if available) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <div className="mt-4">
            <button
              onClick={async () => {
                try {
                  await navigator.share({
                    title: productTitle,
                    text: `Check out ${productTitle} on Carryofy`,
                    url: shareUrl,
                  });
                  
                  // Track share event if authenticated
                  if (isAuthenticated) {
                    try {
                      await shareProduct(productId, 'other');
                    } catch (error) {
                      // Silently fail
                    }
                  }
                } catch (error) {
                  // User cancelled or error occurred
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#ff6600]/10 border border-[#ff6600]/30 rounded-lg text-[#ff6600] hover:bg-[#ff6600]/20 transition"
            >
              <Share2 className="w-4 h-4" />
              <span className="font-medium">More Options</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
