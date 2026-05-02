import Link from 'next/link';
import { Ban, Eye } from 'lucide-react';
import type { BroadcastHistoryItem } from '../../hooks/useBroadcast';

type Props = {
  rows: BroadcastHistoryItem[];
  isLoading: boolean;
  onCancel: (id: string) => void;
};

const STATUS_STYLES: Record<string, string> = {
  SENT: 'border-green-200 bg-green-100 text-green-700',
  SCHEDULED: 'border-orange-200 bg-orange-100 text-orange-700',
  FAILED: 'border-red-200 bg-red-100 text-red-700',
  DRAFT: 'border-gray-200 bg-gray-100 text-gray-600',
};

function formatType(input: string): string {
  return input
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function BroadcastHistory({ rows, isLoading, onCancel }: Props) {
  return (
    <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Broadcast History</h2>
        <Link href="/admin/broadcasts/history" className="text-xs text-[#F97316] hover:underline">
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
          No broadcasts sent yet. Your history will appear here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-gray-600">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Recipients</th>
                <th className="px-2 py-2">Channels</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-orange-50/50">
                  <td className="px-2 py-2 font-medium text-gray-900">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td className="px-2 py-2">{formatType(row.type)}</td>
                  <td className="px-2 py-2">{row.recipients.toLocaleString()}</td>
                  <td className="px-2 py-2">{row.channels.join(', ') || '-'}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 ${
                        STATUS_STYLES[row.status] || STATUS_STYLES.DRAFT
                      }`}
                    >
                      {formatType(row.status)}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      <button type="button" className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      {row.status === 'SCHEDULED' ? (
                        <button
                          type="button"
                          onClick={() => onCancel(row.id)}
                          className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
