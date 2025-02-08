'use client';

import React from 'react';
import SearchContent from '../SearchContent';
import Content from '../Content';

const SearchAndContent = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Fixed Search Section */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-800 bg-background">
        <SearchContent />
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-auto p-4 bg-background">
        <Content />
      </div>
    </div>
  );
};

export default SearchAndContent;
