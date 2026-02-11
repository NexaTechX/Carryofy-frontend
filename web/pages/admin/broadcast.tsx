import { useState, useMemo } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { AdminPageHeader } from '../../components/admin/ui';
import {
  createBroadcastRequest,
  getAudienceCount,
  fetchBroadcastProducts,
} from '../../lib/admin/api';
import type {
  BroadcastAudience,
  CreateBroadcastPayload,
  BroadcastType,
  AudienceFilters,
  RoleSpecificMessages,
  Scheduling,
  RateLimit,
  AudienceCount,
  BroadcastProductOption,
} from '../../lib/admin/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Mail,
  Bell,
  Users,
  FileText,
  Send,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AudienceSelector from '../../components/admin/broadcast/AudienceSelector';
import BroadcastTypeSelector from '../../components/admin/broadcast/BroadcastTypeSelector';
import RoleMessageEditor from '../../components/admin/broadcast/RoleMessageEditor';
import ProductSelector from '../../components/admin/broadcast/ProductSelector';
import SchedulingPanel from '../../components/admin/broadcast/SchedulingPanel';
import BroadcastPreview from '../../components/admin/broadcast/BroadcastPreview';
import ReviewModal from '../../components/admin/broadcast/ReviewModal';
import { validateBroadcastPayload, checkSpamRisk, validateCtaLink } from '../../lib/admin/broadcast-validation';

const STEPS = [
  { id: 1, label: 'Audience', icon: Users },
  { id: 2, label: 'Targeting', icon: Users },
  { id: 3, label: 'Channels', icon: Mail },
  { id: 4, label: 'Message', icon: FileText },
  { id: 5, label: 'Review', icon: Send },
] as const;

export default function AdminBroadcastPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [broadcastType, setBroadcastType] = useState<BroadcastType | null>(null);
  const [audience, setAudience] = useState<BroadcastAudience[]>([]);
  const [audienceFilters, setAudienceFilters] = useState<AudienceFilters>({});
  const [channels, setChannels] = useState({ email: true, inApp: true });
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [roleSpecificMessages, setRoleSpecificMessages] = useState<RoleSpecificMessages>({});
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [autoAttachDays, setAutoAttachDays] = useState<number | undefined>();
  const [scheduling, setScheduling] = useState<Scheduling>({ sendNow: true });
  const [rateLimit, setRateLimit] = useState<RateLimit>({});
  const [internalNote, setInternalNote] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Fetch audience counts
  const { data: audienceCounts } = useQuery<AudienceCount>({
    queryKey: ['broadcast', 'audience-count', audience, audienceFilters],
    queryFn: () => getAudienceCount(audience, audienceFilters),
    enabled: audience.length > 0,
  });

  // Fetch products for preview
  const { data: products = [] } = useQuery<BroadcastProductOption[]>({
    queryKey: ['admin', 'broadcast', 'products', autoAttachDays],
    queryFn: () => fetchBroadcastProducts(100, undefined, autoAttachDays),
    enabled: audience.includes('BUYER') && (productIds.length > 0 || !!autoAttachDays),
  });

  const createBroadcast = useMutation({
    mutationFn: (payload: CreateBroadcastPayload) => createBroadcastRequest(payload),
    onSuccess: (result) => {
      toast.success(
        `Broadcast ${result.status === 'SENT' ? 'sent' : 'scheduled'} successfully!`
      );
      // Reset form
      setCurrentStep(1);
      setBroadcastType(null);
      setAudience([]);
      setAudienceFilters({});
      setChannels({ email: true, inApp: true });
      setSubject('');
      setBody('');
      setRoleSpecificMessages({});
      setCtaLabel('');
      setCtaLink('');
      setProductIds([]);
      setAutoAttachDays(undefined);
      setScheduling({ sendNow: true });
      setRateLimit({});
      setInternalNote('');
      setShowReviewModal(false);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || 'Failed to create broadcast';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const buildPayload = (): CreateBroadcastPayload => {
    const payload: CreateBroadcastPayload = {
      type: broadcastType!,
      audience,
      audienceFilters: Object.keys(audienceFilters).length > 0 ? audienceFilters : undefined,
      channels,
      subject: subject.trim(),
      body: body.trim(),
      roleSpecificMessages: Object.keys(roleSpecificMessages).length > 0 ? roleSpecificMessages : undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      ctaLink: ctaLink.trim() || undefined,
      productIds: productIds.length > 0 ? productIds : undefined,
      scheduling: scheduling.sendNow ? undefined : scheduling,
      rateLimit: rateLimit.usersPerMinute ? rateLimit : undefined,
      internalNote: internalNote.trim() || undefined,
    };
    return payload;
  };

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!broadcastType) return 'Please select a broadcast type';
        if (audience.length === 0) return 'Please select at least one audience';
        return null;
      case 2:
        // Targeting is optional, no validation needed
        return null;
      case 3:
        if (!channels.email && !channels.inApp) return 'Please select at least one channel';
        if (channels.email && !subject.trim()) return 'Subject is required when Email is selected';
        
        // Spam risk check
        if (subject.trim()) {
          const spamCheck = checkSpamRisk(subject);
          if (spamCheck.risk === 'high') {
            return `High spam risk detected: ${spamCheck.reasons.join('; ')}`;
          }
        }
        return null;
      case 4:
        if (!body.trim()) return 'Message body is required';
        
        // Validate CTA links per role (warnings only, don't block)
        for (const role of audience) {
          const roleMsg = roleSpecificMessages[role];
          const link = roleMsg?.ctaLink || ctaLink;
          if (link) {
            const ctaWarning = validateCtaLink(link, [role]);
            if (ctaWarning) {
              // Show warning but don't block
              toast(ctaWarning, { icon: '⚠️', duration: 4000 });
            }
          }
        }
        return null;
      case 5:
        // Review step - validation happens in modal
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      toast.error(error);
      return;
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const error = validateStep(currentStep);
    if (error) {
      toast.error(error);
      return;
    }

    // Full validation
    const payload = buildPayload();
    const validation = validateBroadcastPayload(payload);
    
    if (!validation.valid) {
      toast.error(`Validation errors: ${validation.errors.join(', ')}`);
      return;
    }

    // Show warnings but allow proceed
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast(warning, { icon: '⚠️', duration: 6000 });
      });
    }

    setShowReviewModal(true);
  };

  const handleConfirmSend = () => {
    const payload = buildPayload();
    createBroadcast.mutate(payload);
  };

  const isBuyerSelected = audience.includes('BUYER');

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#090c11]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-12">
          <AdminPageHeader
            title="Broadcast Center"
            subtitle="Send notifications and emails to buyers, sellers, or riders."
          />

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isLast = index === STEPS.length - 1;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : isCompleted
                            ? 'border-primary bg-primary text-white'
                            : 'border-white/[0.08] bg-white/[0.02] text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={`mt-2 text-xs font-medium ${
                          isActive ? 'text-white' : isCompleted ? 'text-primary' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={`h-0.5 flex-1 mx-2 -mt-5 ${
                          isCompleted ? 'bg-primary' : 'bg-white/[0.08]'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Audience & Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h2 className="mb-4 text-base font-semibold text-white">Broadcast Type</h2>
                    <BroadcastTypeSelector selected={broadcastType} onSelect={setBroadcastType} />
                  </section>

                  <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                      <Users className="h-5 w-5 text-primary" />
                      Audience
                    </h2>
                    <AudienceSelector
                      selected={audience}
                      filters={audienceFilters}
                      onSelect={setAudience}
                      onFiltersChange={setAudienceFilters}
                    />
                  </section>
                </div>
              )}

              {/* Step 2: Targeting Rules */}
              {currentStep === 2 && (
                <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h2 className="mb-4 text-base font-semibold text-white">Targeting Rules</h2>
                  <p className="mb-4 text-sm text-gray-500">
                    Advanced filters are already configured in the Audience step. Review and adjust if needed.
                  </p>
                  <AudienceSelector
                    selected={audience}
                    filters={audienceFilters}
                    onSelect={setAudience}
                    onFiltersChange={setAudienceFilters}
                  />
                </section>
              )}

              {/* Step 3: Channels */}
              {currentStep === 3 && (
                <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                    <Mail className="h-5 w-5 text-primary" />
                    Channels
                  </h2>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-5 py-3 transition-all ${
                          channels.email
                            ? 'border-primary/40 bg-primary/[0.06]'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={channels.email}
                          onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                          className="sr-only"
                        />
                        <Mail className={`h-4 w-4 ${channels.email ? 'text-primary' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${channels.email ? 'text-white' : 'text-gray-400'}`}>
                          Email
                        </span>
                      </label>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-5 py-3 transition-all ${
                          channels.inApp
                            ? 'border-primary/40 bg-primary/[0.06]'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={channels.inApp}
                          onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                          className="sr-only"
                        />
                        <Bell className={`h-4 w-4 ${channels.inApp ? 'text-primary' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${channels.inApp ? 'text-white' : 'text-gray-400'}`}>
                          In-app Notification
                        </span>
                      </label>
                    </div>

                    {channels.email && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-sm font-medium text-gray-300">
                            Subject <span className="text-primary">*</span>
                          </label>
                          {subject && (
                            <span className={`text-xs ${
                              subject.length > 50 ? 'text-amber-400' : 'text-gray-500'
                            }`}>
                              {subject.length}/50
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. New products just dropped!"
                          maxLength={100}
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        {subject && (() => {
                          const spamCheck = checkSpamRisk(subject);
                          if (spamCheck.risk !== 'low') {
                            return (
                              <div className={`mt-2 flex items-start gap-2 rounded-lg p-2 text-xs ${
                                spamCheck.risk === 'high' 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">
                                    {spamCheck.risk === 'high' ? 'High' : 'Medium'} spam risk detected
                                  </p>
                                  <ul className="mt-1 list-disc list-inside">
                                    {spamCheck.reasons.map((reason, i) => (
                                      <li key={i}>{reason}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    <SchedulingPanel
                      scheduling={scheduling}
                      rateLimit={rateLimit}
                      onSchedulingChange={setScheduling}
                      onRateLimitChange={setRateLimit}
                    />
                  </div>
                </section>
              )}

              {/* Step 4: Message Content */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h2 className="mb-4 text-base font-semibold text-white">Message Content</h2>
                    <RoleMessageEditor
                      defaultBody={body}
                      defaultCtaLabel={ctaLabel}
                      defaultCtaLink={ctaLink}
                      roleMessages={roleSpecificMessages}
                      onChange={setRoleSpecificMessages}
                      selectedAudience={audience}
                    />
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">
                        Default message body <span className="text-primary">*</span>
                      </label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your default message here. Role-specific messages override this."
                        rows={6}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                  </section>

                  {isBuyerSelected && (
                    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                        <Users className="h-5 w-5 text-primary" />
                        Attach Products
                      </h2>
                      <ProductSelector
                        selected={productIds}
                        onSelect={setProductIds}
                        autoAttachDays={autoAttachDays}
                        onAutoAttachDaysChange={setAutoAttachDays}
                      />
                    </section>
                  )}
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h2 className="mb-4 text-base font-semibold text-white">Review & Send</h2>
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">Type</span>
                        <p className="font-medium text-white mt-0.5">{broadcastType}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Recipients</span>
                        <p className="font-medium text-primary mt-0.5">
                          {audienceCounts?.total.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Subject</span>
                      <p className="text-white mt-0.5">{subject || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Channels</span>
                      <p className="text-white mt-0.5">
                        {[channels.email && 'Email', channels.inApp && 'In-App'].filter(Boolean).join(' & ')}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/[0.05] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createBroadcast.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Review & Send
                  </button>
                )}
              </div>
            </div>

            {/* Preview panel */}
            <div className="lg:col-span-1">
              <BroadcastPreview payload={buildPayload()} products={products} />
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          payload={buildPayload()}
          audienceCounts={audienceCounts}
          onConfirm={handleConfirmSend}
          onCancel={() => setShowReviewModal(false)}
          isLoading={createBroadcast.isPending}
        />
      )}
    </AdminLayout>
  );
}
