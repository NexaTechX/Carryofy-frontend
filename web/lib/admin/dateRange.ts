export type DateRangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  label: string;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDateRangeForPreset(preset: DateRangePreset, customStart?: string, customEnd?: string): DateRangeValue {
  const now = new Date();
  const today = toISO(now);
  let startDate: string;
  let endDate: string;
  let label: string;

  switch (preset) {
    case 'today':
      startDate = today;
      endDate = today;
      label = 'Today';
      break;
    case '7d': {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 6);
      startDate = toISO(d7);
      endDate = today;
      label = '7D';
      break;
    }
    case '30d': {
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 29);
      startDate = toISO(d30);
      endDate = today;
      label = '30D';
      break;
    }
    case '90d': {
      const d90 = new Date(now);
      d90.setDate(d90.getDate() - 89);
      startDate = toISO(d90);
      endDate = today;
      label = '90D';
      break;
    }
    case 'custom':
      startDate = customStart || today;
      endDate = customEnd || today;
      label = 'Custom';
      break;
    default:
      startDate = today;
      endDate = today;
      label = 'Today';
  }

  return { preset, startDate, endDate, label };
}

export function dateRangeToReportParams(range: DateRangeValue): { startDate?: string; endDate?: string } {
  if (range.preset === 'today' && range.startDate === range.endDate) {
    return { startDate: range.startDate, endDate: range.endDate };
  }
  return { startDate: range.startDate, endDate: range.endDate };
}
