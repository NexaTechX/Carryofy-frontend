import { useState } from 'react';
import type { RoleSpecificMessages, BroadcastAudience } from '../../../lib/admin/types';
import { ShoppingBag, Megaphone, Truck, AlertCircle } from 'lucide-react';
import { validateCtaLink } from '../../../lib/admin/broadcast-validation';

interface RoleMessageEditorProps {
  defaultBody: string;
  defaultCtaLabel?: string;
  defaultCtaLink?: string;
  roleMessages?: RoleSpecificMessages;
  onChange: (messages: RoleSpecificMessages) => void;
  selectedAudience: BroadcastAudience[];
}

const ROLE_CONFIG = {
  BUYER: { label: 'Buyer', icon: ShoppingBag, color: 'text-emerald-400' },
  SELLER: { label: 'Seller', icon: Megaphone, color: 'text-blue-400' },
  RIDER: { label: 'Rider', icon: Truck, color: 'text-amber-400' },
} as const;

const VARIABLES = [
  { key: '{{first_name}}', label: 'First Name' },
  { key: '{{city}}', label: 'City' },
  { key: '{{product_name}}', label: 'Product Name' },
];

export default function RoleMessageEditor({
  defaultBody,
  defaultCtaLabel,
  defaultCtaLink,
  roleMessages = {},
  onChange,
  selectedAudience,
}: RoleMessageEditorProps) {
  const [activeTab, setActiveTab] = useState<BroadcastAudience>(
    selectedAudience[0] || 'BUYER',
  );

  const updateMessage = (role: BroadcastAudience, field: 'body' | 'ctaLabel' | 'ctaLink', value: string) => {
    onChange({
      ...roleMessages,
      [role]: {
        ...roleMessages[role],
        [field]: value || undefined,
      },
    });
  };

  const insertVariable = (variable: string) => {
    const currentBody = roleMessages[activeTab]?.body || defaultBody;
    updateMessage(activeTab, 'body', currentBody + variable);
  };

  const getMessage = (role: BroadcastAudience, field: 'body' | 'ctaLabel' | 'ctaLink'): string => {
    return roleMessages[role]?.[field] || (field === 'body' ? defaultBody : field === 'ctaLabel' ? defaultCtaLabel || '' : defaultCtaLink || '');
  };

  const checkSpamRisk = (subject: string): { risk: 'low' | 'medium' | 'high'; warnings: string[] } => {
    const warnings: string[] = [];
    let risk: 'low' | 'medium' | 'high' = 'low';

    // Check length
    if (subject.length > 50) {
      warnings.push('Subject line is long (>50 chars)');
      risk = 'medium';
    }

    // Check for spam keywords
    const spamKeywords = ['free', 'urgent', 'act now', 'limited time', '!!!', 'click here'];
    const lowerSubject = subject.toLowerCase();
    const foundKeywords = spamKeywords.filter(keyword => lowerSubject.includes(keyword));
    
    if (foundKeywords.length > 0) {
      warnings.push(`Potential spam keywords: ${foundKeywords.join(', ')}`);
      risk = foundKeywords.length > 2 ? 'high' : 'medium';
    }

    // Check for excessive caps
    const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
    if (capsRatio > 0.5 && subject.length > 10) {
      warnings.push('Excessive capitalization');
      risk = 'medium';
    }

    return { risk, warnings };
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06]">
        {selectedAudience.map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          const isActive = activeTab === role;

          return (
            <button
              key={role}
              type="button"
              onClick={() => setActiveTab(role)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? config.color : ''}`} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Variable insertion */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500">Insert variables:</span>
        {VARIABLES.map((variable) => (
          <button
            key={variable.key}
            type="button"
            onClick={() => insertVariable(variable.key)}
            className="px-2 py-1 text-xs rounded-lg border border-white/[0.08] bg-white/[0.02] text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors"
          >
            {variable.label}
          </button>
        ))}
      </div>

      {/* Message editor for active tab */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Message body <span className="text-primary">*</span>
          </label>
          <textarea
            value={getMessage(activeTab, 'body')}
            onChange={(e) => updateMessage(activeTab, 'body', e.target.value)}
            placeholder="Write your message here. You can use HTML tags like <p>, <strong>, <a>."
            rows={8}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <p className="mt-1.5 text-xs text-gray-600">
            {!roleMessages[activeTab]?.body && (
              <span className="text-amber-400">Using default message. Leave empty to use default.</span>
            )}
            {roleMessages[activeTab]?.body && 'Supports HTML for email content.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              CTA button label <span className="text-xs text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={getMessage(activeTab, 'ctaLabel')}
              onChange={(e) => updateMessage(activeTab, 'ctaLabel', e.target.value)}
              placeholder="e.g. View new products"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-300">
                              CTA link <span className="text-xs text-gray-600">(optional)</span>
                            </label>
                            <input
                              type="text"
                              value={getMessage(activeTab, 'ctaLink')}
                              onChange={(e) => updateMessage(activeTab, 'ctaLink', e.target.value)}
                              placeholder="https://carryofy.com/buyer/products"
                              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                            {getMessage(activeTab, 'ctaLink') && (() => {
                              const ctaWarning = validateCtaLink(getMessage(activeTab, 'ctaLink')!, [activeTab]);
                              if (ctaWarning) {
                                return (
                                  <div className="mt-2 flex items-start gap-2 rounded-lg p-2 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                    <p>{ctaWarning}</p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
        </div>
      </div>
    </div>
  );
}
