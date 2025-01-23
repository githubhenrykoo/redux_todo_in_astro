import React from 'react';
import { PanelResizeHandle } from 'react-resizable-panels';

export default function ResizeHandle() {
  return (
    <PanelResizeHandle className="w-2 bg-slate-200 hover:bg-slate-400 transition-colors relative group">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-slate-300 group-hover:bg-slate-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-slate-400 group-hover:bg-slate-600" />
    </PanelResizeHandle>
  );
}
