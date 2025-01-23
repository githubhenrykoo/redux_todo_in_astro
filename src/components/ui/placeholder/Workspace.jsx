import React from 'react';
import { cn } from "../../../lib/utils";

export default function Workspace({ className, ...props }) {
  return (
    <div className={cn(
      "w-full h-full bg-background p-6",
      className
    )} {...props}>
      <div className="space-y-8">
        {/* Content Blocks */}
        {[1, 2, 3].map((block) => (
          <div key={block} className="space-y-4">
            <div className="w-1/3 h-6 bg-muted rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-muted/50 rounded animate-pulse"></div>
              <div className="w-5/6 h-4 bg-muted/50 rounded animate-pulse"></div>
              <div className="w-4/6 h-4 bg-muted/50 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
