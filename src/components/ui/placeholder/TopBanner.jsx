import React, { useState } from 'react';
import { cn } from "../../../lib/utils";
import { FiSun, FiUser, FiLink } from 'react-icons/fi';
export default function TopBanner({ className, ...props }) {

  const handleThemeToggle = () => {
    // Implement theme toggle functionality here
  };

  const handleLogin = () => {
    // Implement login functionality here
    console.log("Login clicked");
  };


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
          <button onClick={handleThemeToggle} className="text-gray-700 hover:text-gray-900">
            <FiSun className="w-6 h-6" />
          </button>
          <button onClick={handleLogin} className="text-gray-700 hover:text-gray-900">
            <FiUser className="w-6 h-6" />
          </button>
        </div>
      </div>

    </div>
  );
}
