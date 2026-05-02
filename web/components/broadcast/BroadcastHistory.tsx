import Link from 'next/link';
import { Ban, Eye } from 'lucide-react';
import type { BroadcastHistoryItem } from '../../hooks/useBroadcast';

type Props = {
  rows: BroadcastHistoryItem[];
  isLoading: boolean;
  onCancel: (id: string) => void;
};

const STATUS_STYLES: Record<string, string> = {
  SENT: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  SCHEDULED: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  FAILED: 'border-red-500/40 bg-red-500/10 text-red-300',
  DRAFT: 'border-gray-500/40 bg-gray-500/10 text-gray-300',
};

function formatType(input: string): string {
  return input
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function BroadcastHistory({ rows, isLoading, onCancel }: Props) {
  return (
    <section className="mt-4 rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Broadcast History</h2>
        <Link href="/admin/broadcasts/history" className="text-xs text-[#F97316] hover:underline">
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-[#1a1a1a]" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a] p-3 text-xs text-[#9ca3af]">
          No broadcasts sent yet. Your history will appear here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-[#9ca3af]">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-[#9ca3af]">
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
                <tr key={row.id} className="border-b border-[#2a2a2a]/60">
                  <td className="px-2 py-2 text-white">{new Date(row.createdAt).toLocaleDateString()}</td>
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
                      <button type="button" className="rounded p-1 text-[#9ca3af] hover:bg-[#1a1a1a] hover:text-white">
                        <Eye className="h-4 w-4" />
                      </button>
                      {row.status === 'SCHEDULED' ? (
                        <button
                          type="button"
                          onClick={() => onCancel(row.id)}
                          className="rounded p-1 text-[#9ca3af] hover:bg-red-500/10 hover:text-red-300"
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
