import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  loading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  loading
}) => {
  return (
    <form onSubmit={onSearch} className="w-full">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by content..."
          className="flex-1 min-w-0 px-3 py-1 border rounded text-sm"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm whitespace-nowrap"
          disabled={loading}
        >
          Search
        </button>
      </div>
    </form>
  );
};
