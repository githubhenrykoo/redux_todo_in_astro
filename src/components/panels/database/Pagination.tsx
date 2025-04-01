import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange
}) => {
  // Sliding pagination function
  const getSlidingPageNumbers = (currentPage: number, totalPages: number, windowSize: number = 5) => {
    // Ensure window size is odd for symmetry
    const adjustedWindowSize = windowSize % 2 === 0 ? windowSize + 1 : windowSize;
    const halfWindow = Math.floor(adjustedWindowSize / 2);

    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + adjustedWindowSize - 1);

    // Adjust start page if we're near the end
    if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - adjustedWindowSize + 1);
    }

    // Create an array of page numbers to display
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return {
      pages,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalPages
    };
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex justify-center items-center gap-1 text-sm">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
        className={`px-2 py-1 rounded ${
          hasPrevious
            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Prev
      </button>

      {getSlidingPageNumbers(currentPage, totalPages, 3).pages.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          className={`px-2 py-1 rounded ${
            pageNumber === currentPage
              ? 'bg-blue-500 text-white'
              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
          }`}
        >
          {pageNumber}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className={`px-2 py-1 rounded ${
          hasNext
            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Next
      </button>
    </div>
  );
};
