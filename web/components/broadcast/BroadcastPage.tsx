import { CheckCircle2, Loader2, X } from 'lucide-react';
import { RecipientSelector } from './RecipientSelector';
import { BroadcastTypeSelector } from './BroadcastTypeSelector';
import { ChannelSelector } from './ChannelSelector';
import { ComposeMessage } from './ComposeMessage';
import { SchedulePicker } from './SchedulePicker';
import { BroadcastPreview } from './BroadcastPreview';
import { BroadcastHistory } from './BroadcastHistory';
import { useBroadcast } from '../../hooks/useBroadcast';

export function BroadcastPage() {
  const {
    state,
    history,
    recipientTotal,
    messagePlaceholder,
    isLoadingCounts,
    isLoadingHistory,
    successBanner,
    setSuccessBanner,
    errorBanner,
    setField,
    toggleRecipient,
    toggleChannel,
    submit,
    insertVariable,
    cancelScheduledBroadcast,
  } = useBroadcast();

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-6 sm:px-6 lg:px-8">
      {successBanner ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-3 shadow-lg shadow-emerald-950/40"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-200">Success</p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-100/95">{successBanner}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner('')}
            className="shrink-0 rounded-md p-1 text-emerald-300/80 transition-colors hover:bg-emerald-500/20 hover:text-emerald-100"
            aria-label="Dismiss success message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {errorBanner ? (
        <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {errorBanner}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-10">
        <div className="space-y-4 xl:col-span-7">
          <RecipientSelector
            selected={state.recipients}
            counts={state.recipientCounts}
            isLoading={isLoadingCounts}
            onToggle={toggleRecipient}
            totalSelected={recipientTotal}
            error={state.errors.recipients}
          />
          <BroadcastTypeSelector
            value={state.broadcastType}
            onChange={(broadcastType) => setField('broadcastType', broadcastType)}
          />
          <ChannelSelector
            channels={state.channels}
            onToggle={toggleChannel}
            error={state.errors.channels}
          />
          <ComposeMessage
            subject={state.subject}
            message={state.message}
            showSubject={state.channels.includes('email')}
            placeholder={messagePlaceholder}
            onSubjectChange={(subject) => setField('subject', subject)}
            onMessageChange={(message) => setField('message', message)}
            onInsertVariable={insertVariable}
            errors={state.errors}
          />
          <SchedulePicker
            isScheduled={state.isScheduled}
            scheduledAt={state.scheduledAt}
            onToggle={(isScheduled) => setField('isScheduled', isScheduled)}
            onChangeDateTime={(scheduledAt) => setField('scheduledAt', scheduledAt)}
            error={state.errors.schedule}
          />

          <button
            type="button"
            onClick={() => void submit()}
            disabled={state.isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#F97316] px-4 py-3 text-sm font-semibold text-white transition-all duration-150 ease-in hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {state.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {state.isScheduled ? 'Schedule Broadcast' : 'Send Broadcast'}
          </button>
        </div>

        <div className="xl:col-span-3">
          <BroadcastPreview
            subject={state.subject}
            message={state.message}
            broadcastType={state.broadcastType}
          />
          <BroadcastHistory
            rows={history}
            isLoading={isLoadingHistory}
            onCancel={(id) => void cancelScheduledBroadcast(id)}
          />
        </div>
      </div>
    </div>
  );
}
