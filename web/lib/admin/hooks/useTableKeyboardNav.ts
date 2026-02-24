import { useCallback, useEffect, useRef } from 'react';

export interface UseTableKeyboardNavOptions {
  rowCount: number;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenRow: (index: number) => void;
  enabled?: boolean;
}

/**
 * Keyboard navigation for admin tables: ArrowUp/ArrowDown to move selection,
 * Enter to open the detail drawer for the selected row.
 */
export function useTableKeyboardNav({
  rowCount,
  selectedIndex,
  onSelectIndex,
  onOpenRow,
  enabled = true,
}: UseTableKeyboardNavOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(rowCount - 1, i)),
    [rowCount]
  );

  useEffect(() => {
    if (!enabled || rowCount === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, select, textarea, [contenteditable="true"]')) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onSelectIndex(clamp(selectedIndex + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          onSelectIndex(clamp(selectedIndex - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < rowCount) {
            onOpenRow(selectedIndex);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, rowCount, selectedIndex, onSelectIndex, onOpenRow, clamp]);

  return {
    containerRef,
    getRowProps: (index: number) => ({
      'data-row-index': index,
      'data-selected': selectedIndex === index,
      tabIndex: selectedIndex === index ? 0 : -1,
      'aria-selected': selectedIndex === index,
    }),
  };
}
