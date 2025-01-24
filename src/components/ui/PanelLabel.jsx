import React from 'react';

export default function PanelLabel({ children }) {
  return (
    <div className="absolute top-0 left-0 right-0 bg-slate-100 px-4 py-1 text-xs font-medium text-slate-600 border-b border-slate-200">
      {children}
    </div>
  );
}
