import React from 'react';

interface ControlBarProps {
  onReset: () => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onReset,
  pageSize,
  setPageSize,
  onPageSizeChange,
  loading
}) => {
  return (
    <div className="flex-none flex items-center justify-between p-2 border-b border-neutral-200 dark:border-neutral-800">
      <button
        onClick={onReset}
        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
        disabled={loading}
      >
        Reset
      </button>
      
      <div className="flex items-center">
        <span className="mr-2 text-sm">Items:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            const newSize = Number(e.target.value);
            setPageSize(newSize);
            onPageSizeChange(newSize);
          }}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  );
};
