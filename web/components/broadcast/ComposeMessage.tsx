import { useMemo, useRef } from 'react';
import type { RecipientKey } from '../../hooks/useBroadcast';
import { MESSAGE_MAX_LENGTH } from '../../hooks/useBroadcast';
import { getTokenSegmentWarnings } from '../../lib/broadcast-placeholders';

type Props = {
  subject: string;
  message: string;
  selectedRecipients: RecipientKey[];
  showSubject: boolean;
  placeholder: string;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onInsertVariable: (variable: string, textarea: HTMLTextAreaElement | null) => void;
  errors?: Record<string, string>;
};

const VARIABLES = ['[First Name]', '[Business Name]', '[Order Count]'];

export function ComposeMessage({
  subject,
  message,
  selectedRecipients,
  showSubject,
  placeholder,
  onSubjectChange,
  onMessageChange,
  onInsertVariable,
  errors,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const tokenWarnings = useMemo(
    () => getTokenSegmentWarnings(message, selectedRecipients),
    [message, selectedRecipients],
  );

  const counterOverLimit = message.length > MESSAGE_MAX_LENGTH;

  return (
    <section className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">Compose Message</h2>

      {showSubject ? (
        <div className="mb-3">
          <input
            type="text"
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder="e.g. Important update from Carryofy"
            className="w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#9ca3af] focus:border-[#F97316] focus:outline-none"
          />
          {errors?.subject ? (
            <div className="mt-2 inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
              {errors.subject}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder={placeholder}
          maxLength={MESSAGE_MAX_LENGTH + 50}
          className="min-h-[160px] w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 pb-8 text-sm text-white placeholder:text-[#9ca3af] focus:border-[#F97316] focus:outline-none"
        />
        <span
          className={`pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums ${
            counterOverLimit ? 'text-red-400' : 'text-[#9ca3af]'
          }`}
        >
          {message.length}/{MESSAGE_MAX_LENGTH}
        </span>
      </div>

      {errors?.message ? (
        <div className="mt-2 inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
          {errors.message}
        </div>
      ) : null}

      {tokenWarnings.map((warning) => (
        <div
          key={warning}
          className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
          role="alert"
        >
          {warning}
        </div>
      ))}

      <div className="mt-3 flex flex-wrap gap-2">
        {VARIABLES.map((variable) => (
          <button
            key={variable}
            type="button"
            onClick={() => onInsertVariable(variable, textareaRef.current)}
            className="rounded-[20px] border border-[#2a2a2a] bg-[#111111] px-3 py-1 text-xs text-[#9ca3af] transition-all duration-150 ease-in hover:border-[#F97316] hover:text-white"
          >
            {variable}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#6b7280]">
        Personalization: each recipient gets their own first name, business name (sellers), and order or
        delivery counts when the broadcast is sent.
      </p>
    </section>
  );
}
