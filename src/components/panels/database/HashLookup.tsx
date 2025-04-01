import React from 'react';

interface HashLookupProps {
  hashValue: string;
  setHashValue: (value: string) => void;
  onLookup: (e: React.FormEvent) => void;
  loading: boolean;
}

export const HashLookup: React.FC<HashLookupProps> = ({
  hashValue,
  setHashValue,
  onLookup,
  loading
}) => {
  return (
    <form onSubmit={onLookup} className="w-full">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={hashValue}
          onChange={(e) => setHashValue(e.target.value)}
          placeholder="Lookup by hash..."
          className="flex-1 min-w-0 px-3 py-1 border rounded text-sm"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm whitespace-nowrap"
          disabled={loading}
        >
          Lookup
        </button>
      </div>
    </form>
  );
};
