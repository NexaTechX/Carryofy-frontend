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
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Compose Message</h2>

      {showSubject ? (
        <div className="mb-3">
          <input
            type="text"
            value={subject}
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder="e.g. Important update from Carryofy"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
          className="min-h-[160px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-16 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 transition-all duration-150 ease-in hover:border-orange-200 hover:text-orange-600"
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
