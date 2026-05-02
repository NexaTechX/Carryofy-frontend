import { useRef } from 'react';

type Props = {
  subject: string;
  message: string;
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
  showSubject,
  placeholder,
  onSubjectChange,
  onMessageChange,
  onInsertVariable,
  errors,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
          className="min-h-[160px] w-full rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 pr-16 text-sm text-white placeholder:text-[#9ca3af] focus:border-[#F97316] focus:outline-none"
        />
        <span className="absolute bottom-2 right-2 text-xs text-[#9ca3af]">{message.length}</span>
      </div>

      {errors?.message ? (
        <div className="mt-2 inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300">
          {errors.message}
        </div>
      ) : null}

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
