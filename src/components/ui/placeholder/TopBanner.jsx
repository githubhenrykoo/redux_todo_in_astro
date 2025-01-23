import React from 'react';
import { cn } from "../../../lib/utils";

export default function TopBanner({ className, ...props }) {
  return (
    <div className={cn(
      "w-full h-full bg-background border-b flex items-center px-6",
      className
    )} {...props}>
      <div className="flex justify-between items-center w-full">
        <h1 className="text-xl font-semibold text-foreground">Top Banner</h1>
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
          <div className="w-24 h-4 rounded bg-muted animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
