'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  cancelBroadcast,
  createBroadcastRequest,
  getAudienceCount,
  getBroadcastHistory,
} from '../lib/admin/api';
import { BroadcastType, type BroadcastAudience } from '../lib/admin/types';

export type RecipientKey = 'buyers' | 'sellers' | 'riders';
export type ChannelKey = 'email' | 'inapp' | 'whatsapp';

export interface BroadcastState {
  recipients: RecipientKey[];
  broadcastType: string;
  channels: ChannelKey[];
  subject: string;
  message: string;
  isScheduled: boolean;
  scheduledAt: Date | null;
  recipientCounts: { buyers: number; sellers: number; riders: number };
  isSubmitting: boolean;
  errors: Record<string, string>;
}

export interface BroadcastHistoryItem {
  id: string;
  createdAt: string;
  type: string;
  recipients: number;
  channels: ChannelKey[];
  status: 'SENT' | 'SCHEDULED' | 'FAILED' | 'DRAFT' | string;
}

const INITIAL_STATE: BroadcastState = {
  recipients: [],
  broadcastType: 'Product Launch',
  channels: ['email'],
  subject: '',
  message: '',
  isScheduled: false,
  scheduledAt: null,
  recipientCounts: { buyers: 0, sellers: 0, riders: 0 },
  isSubmitting: false,
  errors: {},
};

const RECIPIENT_KEYS: RecipientKey[] = ['buyers', 'sellers', 'riders'];
const CHANNEL_KEYS: ChannelKey[] = ['email', 'inapp', 'whatsapp'];

const TYPE_TO_PLACEHOLDER: Record<string, string> = {
  'Product Launch': 'Announce your new product or feature...',
  'Urgent Alert': 'Describe the urgent issue clearly...',
};

const BROADCAST_TYPE_BY_LABEL: Record<string, BroadcastType> = {
  'Product Launch': BroadcastType.PRODUCT_LAUNCH,
  'Promotion / Campaign': BroadcastType.PROMOTION,
  'System Update': BroadcastType.SYSTEM_UPDATE,
  'Operational Notice': BroadcastType.OPERATIONAL_NOTICE,
  'Urgent Alert': BroadcastType.URGENT_ALERT,
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain-text composer → safe HTML for CreateBroadcastDto.body */
function plainBroadcastMessageToHtml(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return '<p></p>';
  return trimmed
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, '<br/>');
      return `<p>${withBreaks}</p>`;
    })
    .join('');
}

function normalizeHistoryRows(input: unknown): BroadcastHistoryItem[] {
  const data = input as Record<string, unknown> | null;
  if (!data) return [];

  const rows = (data.broadcasts ||
    data.items ||
    (data.data as Record<string, unknown> | undefined)?.broadcasts ||
    (data.data as Record<string, unknown> | undefined)?.items) as unknown;

  if (!Array.isArray(rows)) return [];

  return rows.slice(0, 8).map((row) => {
    const item = row as Record<string, unknown>;
    const channelsObj = (item.channels || {}) as Record<string, unknown>;
    const channels = CHANNEL_KEYS.filter((channel) => {
      if (channel === 'inapp') {
        return Boolean(channelsObj.inApp || channelsObj.inapp);
      }
      return Boolean(channelsObj[channel]);
    });

    return {
      id: String(item.id ?? ''),
      createdAt: String(item.createdAt ?? item.sentAt ?? new Date().toISOString()),
      type: String(item.type ?? 'SYSTEM_UPDATE'),
      recipients: Number(item.recipientCount ?? 0),
      channels,
      status: String(item.status ?? 'DRAFT'),
    };
  });
}

export function useBroadcast() {
  const [state, setState] = useState<BroadcastState>(INITIAL_STATE);
  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const messagePlaceholder = useMemo(
    () => TYPE_TO_PLACEHOLDER[state.broadcastType] ?? 'Write your message here...',
    [state.broadcastType]
  );

  const recipientTotal = useMemo(
    () =>
      state.recipients.reduce(
        (sum, recipient) => sum + (state.recipientCounts[recipient] ?? 0),
        0
      ),
    [state.recipientCounts, state.recipients]
  );

  const resetForm = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  /** Clear message & subject (and schedule) after send; keep audience, channels, and type. */
  const resetComposerAfterSuccess = useCallback(() => {
    setState((prev) => ({
      ...prev,
      subject: '',
      message: '',
      isScheduled: false,
      scheduledAt: null,
      errors: {},
    }));
  }, []);

  const fetchCounts = useCallback(async () => {
    setIsLoadingCounts(true);
    try {
      const counts = await getAudienceCount(['BUYER', 'SELLER', 'RIDER']);
      setState((prev) => ({
        ...prev,
        recipientCounts: {
          buyers: counts.BUYER,
          sellers: counts.SELLER,
          riders: counts.RIDER,
        },
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        recipientCounts: { buyers: 0, sellers: 0, riders: 0 },
      }));
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getBroadcastHistory({ limit: 8 });
      setHistory(normalizeHistoryRows(data));
    } catch {
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void fetchCounts();
    void fetchHistory();
  }, [fetchCounts, fetchHistory]);

  useEffect(() => {
    if (!successBanner) return;
    const timer = window.setTimeout(() => setSuccessBanner(''), 8000);
    return () => window.clearTimeout(timer);
  }, [successBanner]);

  const setField = useCallback(<K extends keyof BroadcastState>(key: K, value: BroadcastState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleRecipient = useCallback((recipient: RecipientKey) => {
    setState((prev) => {
      const exists = prev.recipients.includes(recipient);
      const recipients = exists
        ? prev.recipients.filter((item) => item !== recipient)
        : [...prev.recipients, recipient];
      return { ...prev, recipients };
    });
  }, []);

  const toggleChannel = useCallback((channel: ChannelKey) => {
    setState((prev) => {
      const exists = prev.channels.includes(channel);
      const channels = exists
        ? prev.channels.filter((item) => item !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  }, []);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!state.recipients.length) errors.recipients = 'Select at least one recipient group';
    if (!state.channels.length) {
      errors.channels = 'Select at least one channel';
    } else if (!state.channels.includes('email') && !state.channels.includes('inapp')) {
      errors.channels =
        'Choose Email or In-App Notification to deliver this broadcast (WhatsApp is not available yet).';
    }
    if (!state.message.trim()) errors.message = 'Message body is required';
    if (state.channels.includes('email') && !state.subject.trim()) {
      errors.subject = 'Subject is required when Email is selected';
    }
    if (state.isScheduled && !state.scheduledAt) {
      errors.schedule = 'Please choose date and time';
    }
    return errors;
  }, [state]);

  const submit = useCallback(async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setState((prev) => ({ ...prev, errors }));
      return false;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, errors: {} }));
    setErrorBanner('');

    try {
      const audience: BroadcastAudience[] = [];
      if (state.recipients.includes('buyers')) audience.push('BUYER');
      if (state.recipients.includes('sellers')) audience.push('SELLER');
      if (state.recipients.includes('riders')) audience.push('RIDER');

      const hasEmail = state.channels.includes('email');
      const hasInApp = state.channels.includes('inapp');
      const type =
        BROADCAST_TYPE_BY_LABEL[state.broadcastType] ?? BroadcastType.SYSTEM_UPDATE;

      await createBroadcastRequest({
        type,
        audience,
        channels: {
          email: hasEmail,
          inApp: hasInApp,
        },
        subject: hasEmail
          ? state.subject.trim()
          : state.subject.trim() || `${state.broadcastType || 'Carryofy'} update`,
        body: plainBroadcastMessageToHtml(state.message),
        scheduling:
          state.isScheduled && state.scheduledAt
            ? {
                sendNow: false,
                scheduledFor: state.scheduledAt.toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              }
            : { sendNow: true },
      });

      setErrorBanner('');
      setSuccessBanner(
        state.isScheduled
          ? 'Your broadcast is scheduled. The subject and message were cleared—set them again if you want to schedule another.'
          : 'Your broadcast was sent. The subject line and message box were cleared so you can start a new one. Your audience and channels are unchanged.'
      );
      resetComposerAfterSuccess();
      await fetchHistory();
      return true;
    } catch (error) {
      let message = 'Something went wrong while submitting.';
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | { message?: string | string[] }
          | undefined;
        const m = data?.message;
        if (Array.isArray(m)) message = m.join(', ');
        else if (typeof m === 'string' && m.trim()) message = m;
        else if (error.message) message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      setErrorBanner(message);
      return false;
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [fetchHistory, resetComposerAfterSuccess, state, validate]);

  const insertVariable = useCallback((variable: string, textarea: HTMLTextAreaElement | null) => {
    if (!textarea) {
      setState((prev) => ({ ...prev, message: `${prev.message}${variable}` }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setState((prev) => {
      const next = `${prev.message.slice(0, start)}${variable}${prev.message.slice(end)}`;
      return { ...prev, message: next };
    });

    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + variable.length;
      textarea.setSelectionRange(nextPos, nextPos);
    });
  }, []);

  const cancelScheduledBroadcast = useCallback(async (id: string) => {
    await cancelBroadcast(id);
    await fetchHistory();
  }, [fetchHistory]);

  return {
    state,
    history,
    recipientTotal,
    messagePlaceholder,
    isLoadingCounts,
    isLoadingHistory,
    successBanner,
    setSuccessBanner,
    errorBanner,
    setErrorBanner,
    setField,
    toggleRecipient,
    toggleChannel,
    submit,
    insertVariable,
    fetchHistory,
    cancelScheduledBroadcast,
    availableRecipients: RECIPIENT_KEYS,
  };
}
