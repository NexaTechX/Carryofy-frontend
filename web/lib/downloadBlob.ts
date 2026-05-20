/**
 * Client-side file download helpers for CSV and other blobs.
 */

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'AbortError')
  );
}

/** Remove NUL bytes — they break many Windows CSV consumers. */
export function sanitizeCsvContent(csv: string): string {
  return csv.replace(/\0/g, '');
}

/**
 * UTF-8 CSV blob with BOM (Excel on Windows recognizes encoding).
 */
export function csvUtf8Blob(csv: string): Blob {
  return new Blob(['\uFEFF', sanitizeCsvContent(csv)], {
    type: 'text/csv;charset=utf-8',
  });
}

/** Subset of the File System Access API — `Window.showSaveFilePicker` is not on all TS `dom` lib versions. */
type ShowSaveFilePickerFn = (options?: {
  suggestedName?: string;
  types?: Array<{ description: string; accept: Record<string, string[]> }>;
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

function getShowSaveFilePicker(): ShowSaveFilePickerFn | undefined {
  const w = window as Window & { showSaveFilePicker?: ShowSaveFilePickerFn };
  return typeof w.showSaveFilePicker === 'function' ? w.showSaveFilePicker : undefined;
}

function silentAnchorDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Do not revoke immediately: on Windows (cloud-synced Downloads, AV hooks),
  // early revoke can truncate the file and cause corruption errors when opening.
  window.setTimeout(() => URL.revokeObjectURL(url), 600_000);
}

/**
 * Download a blob as a file. When supported (HTTPS Chromium), opens the native
 * Save dialog so bytes are written directly — avoids fragile blob: downloads.
 *
 * @returns `false` if the user dismissed the native save dialog (no file written).
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const showSaveFilePicker = getShowSaveFilePicker();
  const hasPicker = window.isSecureContext && showSaveFilePicker != null;

  if (hasPicker && showSaveFilePicker) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'CSV',
            accept: { 'text/csv': ['.csv'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error) {
      if (isAbortError(error)) return false;
      // Fall through to anchor download (other errors / unsupported edge cases).
    }
  }

  silentAnchorDownload(blob, filename);
  return true;
}
