import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const startItem = (currentPage - 1) * (itemsPerPage || 0) + 1;
  const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      let start = Math.max(2, currentPage - Math.floor(showPages / 2));
      let end = Math.min(totalPages - 1, currentPage + Math.floor(showPages / 2));

      // Adjust if at beginning
      if (currentPage <= Math.ceil(showPages / 2) + 1) {
        end = showPages;
      }

      // Adjust if at end
      if (currentPage >= totalPages - Math.floor(showPages / 2)) {
        start = totalPages - showPages + 1;
      }

      // Add ellipsis after first page
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-[#1f1f1f] px-4 py-3">
      <div className="flex flex-1 items-center justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a1a] disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-400">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1a1a1a] disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          {totalItems && itemsPerPage ? (
            <p className="text-sm text-gray-400">
              Showing <span className="font-medium text-white">{startItem}</span> to{' '}
              <span className="font-medium text-white">{endItem}</span> of{' '}
              <span className="font-medium text-white">{totalItems}</span> results
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Page <span className="font-medium text-white">{currentPage}</span> of{' '}
              <span className="font-medium text-white">{totalPages}</span>
            </p>
          )}
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md border border-[#2a2a2a] bg-[#151515] px-2 py-2 text-gray-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {getPageNumbers().map((page, index) =>
              typeof page === 'number' ? (
                <button
                  key={index}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center border border-[#2a2a2a] px-4 py-2 text-sm font-medium ${
                    currentPage === page
                      ? 'z-10 bg-primary text-black'
                      : 'bg-[#151515] text-gray-300 hover:bg-[#1a1a1a]'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span
                  key={index}
                  className="relative inline-flex items-center border border-[#2a2a2a] bg-[#151515] px-4 py-2 text-sm font-medium text-gray-500"
                >
                  {page}
                </span>
              )
            )}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md border border-[#2a2a2a] bg-[#151515] px-2 py-2 text-gray-400 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

