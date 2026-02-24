import { useState, useCallback } from 'react';
import { Download, Columns } from 'lucide-react';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';

export interface TableColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

export interface AdminTableToolbarProps {
  /** Columns with visibility state; visibility is controlled by parent (e.g. useColumnVisibility) */
  columns: TableColumnConfig[];
  onColumnsChange: (columns: TableColumnConfig[]) => void;
  /** CSV: pass current table rows as array of record (key → display value) */
  onExportCSV?: () => void;
  /** Optional: show "Last updated" and refresh when provided */
  lastUpdatedAt?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Optional class for container */
  className?: string;
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build CSV string from columns and rows. Rows are objects keyed by column id. */
export function buildCSV(
  columns: { id: string; label: string }[],
  rows: Record<string, unknown>[]
): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
  const visibleCols = columns;
  const lines = [header];
  for (const row of rows) {
    const cells = visibleCols.map((c) => escapeCsvCell(row[c.id]));
    lines.push(cells.join(','));
  }
  return lines.join('\r\n');
}

/** Trigger download of a blob as a file */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminTableToolbar({
  columns,
  onColumnsChange,
  onExportCSV,
  lastUpdatedAt,
  onRefresh,
  isRefreshing = false,
  className = '',
}: AdminTableToolbarProps) {
  const [showColumns, setShowColumns] = useState(false);

  const toggleColumn = useCallback(
    (id: string) => {
      onColumnsChange(
        columns.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
      );
    },
    [columns, onColumnsChange]
  );

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        {onExportCSV != null && (
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColumns((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300 transition hover:border-primary hover:text-primary"
            aria-expanded={showColumns}
            aria-haspopup="true"
          >
            <Columns className="h-4 w-4" />
            Columns
          </button>
          {showColumns && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setShowColumns(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-[#1f1f1f] bg-[#111111] py-2 shadow-xl">
                {columns.map((col) => (
                  <label
                    key={col.id}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a1a]"
                  >
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumn(col.id)}
                      className="rounded border-[#2a2a2a] bg-[#151515] text-primary focus:ring-primary"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {lastUpdatedAt != null && onRefresh && (
        <DataFreshnessIndicator
          lastUpdatedAt={lastUpdatedAt}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
      )}
    </div>
  );
}

/** Hook to manage column visibility for a table. Initial visible: all true. */
export function useColumnVisibility(
  columnIds: { id: string; label: string }[]
): [TableColumnConfig[], (cols: TableColumnConfig[]) => void] {
  const [columns, setColumns] = useState<TableColumnConfig[]>(() =>
    columnIds.map((c) => ({ id: c.id, label: c.label, visible: true }))
  );
  return [columns, setColumns];
}
