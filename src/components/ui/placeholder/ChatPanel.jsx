import React from 'react';
import { cn } from "../../../lib/utils";

export default function ChatPanel({ className, ...props }) {
  return (
    <div className={cn(
      "w-full h-full bg-muted/10 flex flex-col",
      className
    )} {...props}>
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <div className="w-32 h-5 bg-muted rounded animate-pulse"></div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-6 overflow-auto">
        {[1, 2, 3, 4].map((message) => (
          <div key={message} className="flex space-x-3">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse flex-shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="w-24 h-3 bg-muted rounded animate-pulse"></div>
              <div className="w-full h-16 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border">
        <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
      </div>
    </div>
  );
}
