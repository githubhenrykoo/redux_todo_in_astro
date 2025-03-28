'use client';

import React from 'react';
import SearchContent from '../SearchContent';
import Content from '../Content';

const SearchAndContent = () => {
  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden bg-background">
      {/* Fixed Search Section */}
      <div className="flex-none p-3 border-b border-neutral-200 dark:border-neutral-800 bg-muted">
        <SearchContent />
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-auto p-2 bg-background">
        <Content />
      </div>
    </div>
  );
};

export default SearchAndContent;
