import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareModal from './ShareModal';

interface ShareButtonProps {
  productId: string;
  productTitle: string;
  className?: string;
  variant?: 'default' | 'ghost';
}

export default function ShareButton({
  productId,
  productTitle,
  className = '',
  variant = 'default',
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const baseClass = variant === 'ghost'
    ? 'flex items-center gap-2 text-[#ffcc99]/80 hover:text-[#FF6B00] transition bg-transparent border-0 px-0 py-0'
    : 'flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] hover:bg-[#ff6600]/10 transition';

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`${baseClass} ${className}`}
        aria-label="Share product"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm font-medium">Share</span>
      </button>

      {isModalOpen && (
        <ShareModal
          productId={productId}
          productTitle={productTitle}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
