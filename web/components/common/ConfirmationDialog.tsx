import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmationDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  if (!open) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      buttonBg: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
    },
    info: {
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#ff6600]/30 rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
            <AlertCircle className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
            <p className="text-[#ffcc99] text-sm">{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1 text-[#ffcc99] hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-[#ff6600]/30 text-[#ffcc99] rounded-xl font-medium hover:bg-[#ff6600]/10 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 ${styles.buttonBg} text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
