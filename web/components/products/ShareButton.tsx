import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareModal from './ShareModal';

interface ShareButtonProps {
  productId: string;
  productTitle: string;
  className?: string;
}

export default function ShareButton({
  productId,
  productTitle,
  className = '',
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#ff6600]/30 rounded-xl text-white hover:border-[#ff6600] hover:bg-[#ff6600]/10 transition ${className}`}
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
