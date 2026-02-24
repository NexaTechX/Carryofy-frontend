'use client';

import { X } from 'lucide-react';
import { AdminDelivery } from '../../lib/admin/types';

interface IssueResolutionModalProps {
  open: boolean;
  onClose: () => void;
  delivery: AdminDelivery | null;
  onReassign: () => void;
  onMarkFailed: () => void;
  onContactRider: () => void;
  riderName: string;
}

export function IssueResolutionModal({
  open,
  onClose,
  delivery,
  onReassign,
  onMarkFailed,
  onContactRider,
  riderName,
}: IssueResolutionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0b1018] shadow-xl">
        <header className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-3">
          <h3 className="text-base font-semibold text-white">Quick resolution</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        {delivery && (
          <p className="border-b border-[#1f1f1f] px-4 py-2 text-xs text-gray-500">
            Delivery #{delivery.orderId.slice(0, 8)} · {riderName || 'Unassigned'}
          </p>
        )}
        <div className="flex flex-col gap-1 p-3">
          <button
            type="button"
            onClick={() => {
              onReassign();
              onClose();
            }}
            className="rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3 text-left text-sm font-medium text-white transition hover:border-primary/50 hover:bg-[#151515]"
          >
            Reassign Rider
          </button>
          <button
            type="button"
            onClick={() => {
              onMarkFailed();
              onClose();
            }}
            className="rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3 text-left text-sm font-medium text-white transition hover:border-red-500/50 hover:bg-[#151515]"
          >
            Mark as Failed
          </button>
          <button
            type="button"
            onClick={() => {
              onContactRider();
              onClose();
            }}
            className="rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-3 text-left text-sm font-medium text-white transition hover:border-primary/50 hover:bg-[#151515]"
          >
            Contact Rider
          </button>
        </div>
      </div>
    </div>
  );
}
