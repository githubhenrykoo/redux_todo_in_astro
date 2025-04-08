import React from 'react';

/**
 * Pagination controls component for catalog views
 */
const PaginationControls = ({ paginationInfo, onPageChange }) => {
  if (paginationInfo.totalPages <= 1) {
    return null;
  }
  
  return (
    <div className="pagination-controls">
      <button 
        className="btn btn-pagination" 
        disabled={paginationInfo.currentPage <= 1}
        onClick={() => onPageChange(paginationInfo.currentPage - 1)}
      >
        Previous
      </button>
      <span className="pagination-info">
        Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
        {paginationInfo.totalItems && ` (${paginationInfo.totalItems} total items)`}
      </span>
      <button 
        className="btn btn-pagination" 
        disabled={paginationInfo.currentPage >= paginationInfo.totalPages}
        onClick={() => onPageChange(paginationInfo.currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default PaginationControls;
